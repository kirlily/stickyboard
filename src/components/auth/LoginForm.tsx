// 로그인 폼 컴포넌트 — 이메일/패스워드 Supabase Auth
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'

export function LoginForm() {
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(data: LoginInput) {
    const { error } = await supabase.auth.signInWithPassword(data)
    if (error) {
      toast.error(error.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">YujaJam</h1>
        <p className="text-muted-foreground mt-1 text-sm">로그인하여 보드를 시작하세요.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" placeholder="name@example.com" {...register('email')} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input id="password" type="password" {...register('password')} />
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? '로그인 중...' : '로그인'}
        </Button>
      </form>

      <p className="text-muted-foreground mt-4 text-center text-sm">
        계정이 없으신가요?{' '}
        <Link href="/register" className="text-primary hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
