-- =============================================
-- StickyBoard Initial Schema
-- =============================================

-- 보드
create table if not exists boards (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  snapshot    jsonb,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 보드 역할 타입
create type board_role as enum ('owner', 'editor', 'viewer');

-- 보드 멤버 & 권한
create table if not exists board_members (
  board_id  uuid not null references boards(id) on delete cascade,
  user_id   uuid not null references auth.users(id) on delete cascade,
  role      board_role not null default 'editor',
  joined_at timestamptz not null default now(),
  primary key (board_id, user_id)
);

-- 초대 링크
create table if not exists board_invites (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references boards(id) on delete cascade,
  token      text unique not null default gen_random_uuid()::text,
  role       board_role not null default 'editor',
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- 댓글/스레드
create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references boards(id) on delete cascade,
  shape_id   text,
  parent_id  uuid references comments(id) on delete cascade,
  content    text not null,
  author_id  uuid references auth.users(id) on delete set null,
  resolved   boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 이모지 반응
create table if not exists reactions (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references boards(id) on delete cascade,
  shape_id   text not null,
  emoji      text not null,
  user_id    uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (board_id, shape_id, user_id, emoji)
);

-- updated_at 자동 갱신 함수
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger boards_updated_at
  before update on boards
  for each row execute function update_updated_at();

create trigger comments_updated_at
  before update on comments
  for each row execute function update_updated_at();

-- =============================================
-- RLS 활성화
-- =============================================
alter table boards enable row level security;
alter table board_members enable row level security;
alter table board_invites enable row level security;
alter table comments enable row level security;
alter table reactions enable row level security;

-- =============================================
-- RLS 정책
-- =============================================

-- boards: 멤버만 조회
create policy "boards_select" on boards
  for select using (
    exists (
      select 1 from board_members
      where board_id = boards.id and user_id = auth.uid()
    )
  );

-- boards: 인증 유저만 생성
create policy "boards_insert" on boards
  for insert with check (auth.uid() is not null);

-- boards: owner만 수정
create policy "boards_update" on boards
  for update using (
    exists (
      select 1 from board_members
      where board_id = boards.id and user_id = auth.uid() and role = 'owner'
    )
  );

-- boards: owner만 삭제
create policy "boards_delete" on boards
  for delete using (
    exists (
      select 1 from board_members
      where board_id = boards.id and user_id = auth.uid() and role = 'owner'
    )
  );

-- board_members: 멤버 자신이 조회
create policy "board_members_select" on board_members
  for select using (
    exists (
      select 1 from board_members bm
      where bm.board_id = board_members.board_id and bm.user_id = auth.uid()
    )
  );

-- board_members: 자기 자신 참여 허용 (초대 토큰으로 join)
create policy "board_members_insert" on board_members
  for insert with check (user_id = auth.uid());

-- board_members: owner만 권한 변경
create policy "board_members_update" on board_members
  for update using (
    exists (
      select 1 from board_members bm
      where bm.board_id = board_members.board_id and bm.user_id = auth.uid() and bm.role = 'owner'
    )
  );

-- board_members: owner 또는 본인 탈퇴
create policy "board_members_delete" on board_members
  for delete using (
    user_id = auth.uid() or
    exists (
      select 1 from board_members bm
      where bm.board_id = board_members.board_id and bm.user_id = auth.uid() and bm.role = 'owner'
    )
  );

-- comments: 멤버만 조회
create policy "comments_select" on comments
  for select using (
    exists (
      select 1 from board_members
      where board_id = comments.board_id and user_id = auth.uid()
    )
  );

-- comments: editor 이상만 작성
create policy "comments_insert" on comments
  for insert with check (
    exists (
      select 1 from board_members
      where board_id = comments.board_id and user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

-- comments: 본인만 수정
create policy "comments_update" on comments
  for update using (author_id = auth.uid());

-- comments: 본인 또는 owner 삭제
create policy "comments_delete" on comments
  for delete using (
    author_id = auth.uid() or
    exists (
      select 1 from board_members
      where board_id = comments.board_id and user_id = auth.uid() and role = 'owner'
    )
  );

-- reactions: 멤버만 조회
create policy "reactions_select" on reactions
  for select using (
    exists (
      select 1 from board_members
      where board_id = reactions.board_id and user_id = auth.uid()
    )
  );

-- reactions: editor 이상만 추가
create policy "reactions_insert" on reactions
  for insert with check (
    exists (
      select 1 from board_members
      where board_id = reactions.board_id and user_id = auth.uid() and role in ('owner', 'editor')
    )
  );

-- reactions: 본인만 삭제
create policy "reactions_delete" on reactions
  for delete using (user_id = auth.uid());

-- board_invites: 보드 멤버만 조회
create policy "board_invites_select" on board_invites
  for select using (
    exists (
      select 1 from board_members
      where board_id = board_invites.board_id and user_id = auth.uid()
    )
  );

-- board_invites: owner만 생성
create policy "board_invites_insert" on board_invites
  for insert with check (
    exists (
      select 1 from board_members
      where board_id = board_invites.board_id and user_id = auth.uid() and role = 'owner'
    )
  );

-- board_invites: owner만 삭제
create policy "board_invites_delete" on board_invites
  for delete using (
    exists (
      select 1 from board_members
      where board_id = board_invites.board_id and user_id = auth.uid() and role = 'owner'
    )
  );

-- =============================================
-- Storage 버킷
-- =============================================
insert into storage.buckets (id, name, public)
values ('board-images', 'board-images', true)
on conflict (id) do nothing;

create policy "board_images_select" on storage.objects
  for select using (bucket_id = 'board-images');

create policy "board_images_insert" on storage.objects
  for insert with check (
    bucket_id = 'board-images' and auth.uid() is not null
  );

create policy "board_images_delete" on storage.objects
  for delete using (
    bucket_id = 'board-images' and owner = auth.uid()
  );
