// 회원가입 폼 컴포넌트 — Supabase Auth 이메일/패스워드 가입
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
import { registerSchema, type RegisterInput } from '@/lib/validations/auth'

export function RegisterForm() {
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) })

  async function onSubmit(data: RegisterInput) {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('가입 완료. 이메일을 확인하세요.')
    router.push('/login')
  }

  return (
    <div className="w-full max-w-sm rounded-xl border bg-white p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">YujaJam</h1>
        <p className="text-muted-foreground mt-1 text-sm">새 계정을 만드세요.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" type="email" placeholder="name@example.com" {...register('email')} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">비밀번호</Label>
          <Input id="password" type="password" placeholder="6자 이상" {...register('password')} />
          {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirmPassword">비밀번호 확인</Label>
          <Input id="confirmPassword" type="password" {...register('confirmPassword')} />
          {errors.confirmPassword && (
            <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? '가입 중...' : '회원가입'}
        </Button>
      </form>

      <p className="text-muted-foreground mt-4 text-center text-sm">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
