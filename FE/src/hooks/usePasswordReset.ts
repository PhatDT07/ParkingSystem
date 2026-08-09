import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, type AppError } from '@/lib/api'

// Self-service password recovery via OTP for the INTERNAL console (Staff/Manager/Admin).
// Uses the STAFF channel (/auth/staff/*), separate from the customer channel (/auth/*) that
// the driver app uses — so the public customer app can never reset an internal account and
// vice versa. The BE rejects a mismatched role on each channel. Flow:
//   1) POST /auth/staff/forgot-password { identifier } → BE emails a 6-digit OTP, returns the
//      masked email (data) so the UI can say "sent to n***@gmail.com".
//   2) POST /auth/staff/reset-password { otp, newPassword } → sets the new password.

/** POST /auth/staff/forgot-password — request an OTP. Returns the masked email it was sent to. */
export function useForgotPassword() {
  return useMutation<string, AppError, { identifier: string }>({
    mutationFn: ({ identifier }) =>
      api.post<string>('/auth/staff/forgot-password', { identifier }),
    onError: (e) => toast.error(e.message),
  })
}

/** POST /auth/staff/reset-password — set a new password with a valid OTP. */
export function useResetPassword() {
  return useMutation<void, AppError, { otp: string; newPassword: string }>({
    mutationFn: ({ otp, newPassword }) =>
      api.post<void>('/auth/staff/reset-password', { otp, newPassword }),
    onError: (e) => toast.error(e.message),
  })
}
