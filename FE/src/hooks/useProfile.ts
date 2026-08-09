import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'

/** BE ProfileDTO (DriverController) — GET/PUT /driver/profile. */
export interface DriverProfile {
  username: string
  fullName: string
  email: string
  phoneNumber: string
  roleName: string
  status: string
}

export interface ProfileUpdateInput {
  fullName: string
  phoneNumber?: string
  email?: string
}

/** Hồ sơ tài xế hiện tại — GET /driver/profile. */
export function useProfile() {
  return useQuery({
    queryKey: ['driver', 'profile'],
    queryFn: () => api.get<DriverProfile>('/driver/profile'),
  })
}

/** Cập nhật hồ sơ tài xế — PUT /driver/profile. */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: ProfileUpdateInput) => api.put<DriverProfile>('/driver/profile', data),
    onSuccess: (profile) => {
      queryClient.setQueryData(['driver', 'profile'], profile)
      queryClient.invalidateQueries({ queryKey: ['driver', 'profile'] })
      toast.success('Đã lưu hồ sơ')
    },
    onError: (error: AppError) => toast.error(error.message),
  })
}
