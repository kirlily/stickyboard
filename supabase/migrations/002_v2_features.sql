-- =============================================
-- StickyBoard V2 Schema
-- =============================================

-- 버전 히스토리
create table if not exists board_snapshots (
  id          uuid primary key default gen_random_uuid(),
  board_id    uuid not null references boards(id) on delete cascade,
  snapshot    jsonb not null,
  label       text,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists board_snapshots_board_id_idx on board_snapshots(board_id, created_at desc);

-- 보드 썸네일
alter table boards add column if not exists thumbnail_url text;

-- RLS: board_snapshots
alter table board_snapshots enable row level security;

-- 보드 멤버만 스냅샷 조회 가능
create policy "board_snapshots_select" on board_snapshots
  for select using (
    exists (
      select 1 from board_members
      where board_id = board_snapshots.board_id
        and user_id = auth.uid()
    )
  );

-- 보드 멤버(owner/editor)만 스냅샷 생성 가능
create policy "board_snapshots_insert" on board_snapshots
  for insert with check (
    exists (
      select 1 from board_members
      where board_id = board_snapshots.board_id
        and user_id = auth.uid()
        and role in ('owner', 'editor')
    )
  );
