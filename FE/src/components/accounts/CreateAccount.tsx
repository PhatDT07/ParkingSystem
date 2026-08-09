'use client'

import { useMemo, useState } from 'react'
import { Eye, EyeOff, UserPlus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateUser } from '@/hooks/useAdmin'
import { useAuthStore } from '@/store/auth'

const BASE_ROLES = ['Manager', 'Staff'] as const
const ADMIN_ROLES = ['Admin', 'Manager', 'Staff'] as const

function buildSchema(isAdmin: boolean) {
  return z.object({
    username: z.string().min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự'),
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
    roleName: z.enum(isAdmin ? ADMIN_ROLES : BASE_ROLES, { message: 'Chọn vai trò' }),
    email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
    phoneNumber: z
      .string()
      .regex(/^[0-9+\-\s]{9,15}$/, 'Số điện thoại không hợp lệ')
      .optional()
      .or(z.literal('')),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  })
}

type FormData = z.infer<ReturnType<typeof buildSchema>>

const inputCls =
  'w-full bg-white border border-gray-300 rounded-lg py-2 px-3 text-sm text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none'

interface CreateAccountProps {
  /** Goi sau khi tao thanh cong (vd de dong dialog) — ngoai viec form tu reset. */
  onCreated?: () => void
}

/** Màn tạo tài khoản nội bộ (Manager/Staff) — dùng chung cho Manager & Admin. */
export function CreateAccount({ onCreated }: CreateAccountProps = {}) {
  const [showPassword, setShowPassword] = useState(false)
  const createUser = useCreateUser()
  const isAdmin = useAuthStore((s) => s.user?.role === 'Admin')
  const schema = useMemo(() => buildSchema(isAdmin), [isAdmin])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', fullName: '', roleName: 'Staff', email: '', phoneNumber: '', password: '' },
  })

  const onSubmit = (data: FormData) => {
    createUser.mutate(
      {
        username: data.username,
        password: data.password,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || undefined,
        email: data.email || undefined,
        roleName: data.roleName,
      },
      {
        onSuccess: () => {
          reset()
          onCreated?.()
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Tạo tài khoản</h2>
        <p className="text-sm text-gray-600">
          {isAdmin
            ? 'Tạo tài khoản Nhân viên (Staff), Quản lý (Manager) hoặc Quản trị viên (Admin) mới.'
            : 'Tạo tài khoản nhân viên (Staff) hoặc quản lý (Manager) mới.'}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-2xl space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="acc-username" className="mb-1 block text-sm font-medium text-gray-900">
              Tên đăng nhập <span className="text-red-500">*</span>
            </Label>
            <Input id="acc-username" placeholder="vd: staff_lan" {...register('username')} />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <Label htmlFor="acc-role" className="mb-1 block text-sm font-medium text-gray-900">
              Vai trò <span className="text-red-500">*</span>
            </Label>
            <select id="acc-role" className={inputCls} {...register('roleName')}>
              <option value="Staff">Nhân viên (Staff)</option>
              <option value="Manager">Quản lý (Manager)</option>
              {isAdmin && <option value="Admin">Quản trị viên (Admin)</option>}
            </select>
            {errors.roleName && <p className="mt-1 text-xs text-red-600">{errors.roleName.message}</p>}
          </div>

          <div>
            <Label htmlFor="acc-fullname" className="mb-1 block text-sm font-medium text-gray-900">
              Họ và tên <span className="text-red-500">*</span>
            </Label>
            <Input id="acc-fullname" placeholder="Nguyễn Văn A" {...register('fullName')} />
            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
          </div>

          <div>
            <Label htmlFor="acc-email" className="mb-1 block text-sm font-medium text-gray-900">
              Email <span className="font-normal text-gray-400">(tuỳ chọn)</span>
            </Label>
            <Input id="acc-email" type="email" placeholder="example@email.com" {...register('email')} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <Label htmlFor="acc-phone" className="mb-1 block text-sm font-medium text-gray-900">
              Số điện thoại <span className="font-normal text-gray-400">(tuỳ chọn)</span>
            </Label>
            <Input id="acc-phone" type="tel" placeholder="0912 345 678" {...register('phoneNumber')} />
            {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>}
          </div>

          <div>
            <Label htmlFor="acc-password" className="mb-1 block text-sm font-medium text-gray-900">
              Mật khẩu <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="acc-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-10"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" className="gap-2" disabled={createUser.isPending}>
            <UserPlus className="h-4 w-4" />
            {createUser.isPending ? 'Đang tạo...' : 'Tạo tài khoản'}
          </Button>
        </div>
      </form>
    </div>
  )
}
