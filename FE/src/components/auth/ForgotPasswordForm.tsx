'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForgotPassword } from '@/hooks/usePasswordReset'

const schema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập email, tên đăng nhập hoặc SĐT'),
})
type FormData = z.infer<typeof schema>

export function ForgotPasswordForm() {
  const forgot = useForgotPassword()
  const [maskedEmail, setMaskedEmail] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '' },
  })

  const onSubmit = (data: FormData) => {
    forgot.mutate(
      { identifier: data.identifier },
      { onSuccess: (masked) => setMaskedEmail(masked) },
    )
  }

  // OTP sent — tell the user exactly where, and route them to enter it.
  if (maskedEmail) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Mã OTP (6 số) đã được gửi tới email{' '}
          <span className="font-semibold">{maskedEmail}</span>. Mã có hiệu lực trong 10 phút.
        </div>
        <Link
          href="/reset-password"
          className="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Nhập mã OTP để đặt lại mật khẩu
        </Link>
        <Link href="/login" className="block text-center text-sm text-blue-600 hover:underline">
          Quay lại đăng nhập
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="fp-identifier" className="block text-sm font-medium text-gray-900 mb-2">
          Email / Tên đăng nhập / SĐT
        </Label>
        <Input
          id="fp-identifier"
          type="text"
          placeholder="vd: manager@parking.vn"
          disabled={forgot.isPending}
          {...register('identifier')}
        />
        {errors.identifier && (
          <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Mã OTP sẽ được gửi tới email đã đăng ký của tài khoản.
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={forgot.isPending}>
        {forgot.isPending ? 'Đang gửi...' : 'Gửi mã OTP'}
      </Button>

      <Link href="/login" className="block text-center text-sm text-blue-600 hover:underline">
        Quay lại đăng nhập
      </Link>
    </form>
  )
}
