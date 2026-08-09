import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, UserRole } from '@/types/model'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { setAuthToken, setUnauthorizedHandler } from '@/lib/session'

/** BE `LoginResponse` (AuthController) — the only fields login/register return. */
interface LoginResponse {
  token: string
  username: string
  roleName: string
}

/** BE roles come uppercase (ADMIN/MANAGER/STAFF/DRIVER); map to the FE union. */
function mapRole(roleName: string): UserRole {
  switch ((roleName ?? '').trim().toUpperCase()) {
    case 'ADMIN':
      return 'Admin'
    case 'MANAGER':
      return 'Manager'
    case 'STAFF':
      return 'Staff'
    default:
      return 'Driver'
  }
}

function errMessage(error: unknown, fallback: string): string {
  return (error as { message?: string })?.message || fallback
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  /** False until the persisted session finishes rehydrating from localStorage.
   *  Guards route redirects so a full page reload doesn't bounce to /login before
   *  the stored token is restored into the API layer. */
  _hasHydrated: boolean
  _setHasHydrated: (v: boolean) => void
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
      _setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const res = await api.post<LoginResponse>('/auth/login', { username, password })
          // Store the JWT before any follow-up call so apiFetch can attach it.
          setAuthToken(res.token)
          const role = mapRole(res.roleName)
          let loggedUser: User = {
            id: res.username,
            email: '',
            fullName: res.username,
            role,
            status: 'Active',
          }

          if (role === 'Driver') {
            // BE login không trả fullName/email/phone — GET /driver/profile để bổ sung.
            try {
              const profile = await api.get<{
                fullName: string
                email: string
                phoneNumber: string
                status: string
              }>('/driver/profile')
              loggedUser = {
                ...loggedUser,
                fullName: profile.fullName || loggedUser.fullName,
                email: profile.email || '',
                phone: profile.phoneNumber || undefined,
                status: (profile.status as User['status']) ?? 'Active',
              }
            } catch {
              // Hồ sơ không tải được thì vẫn cho đăng nhập với dữ liệu tối thiểu từ /auth/login.
            }
          }

          set({ user: loggedUser, token: res.token, isAuthenticated: true, isLoading: false })
          toast.success('Đăng nhập thành công')
        } catch (error) {
          setAuthToken(null)
          set({ isLoading: false })
          toast.error(errMessage(error, 'Đăng nhập thất bại'))
          throw error
        }
      },

      logout: () => {
        // Best-effort server-side invalidation; clear local state regardless.
        void api.post('/auth/logout').catch(() => {})
        setAuthToken(null)
        set({ user: null, token: null, isAuthenticated: false })
        toast.success('Đăng xuất thành công')
      },

      setUser: (user: User) => {
        set({ user, isAuthenticated: true })
      },
    }),
    {
      name: 'auth-storage',
      // Bump when the persisted shape changes so stale entries self-invalidate.
      // v0 persisted a standalone `isAuthenticated:true` with no token behind it —
      // dropping to only {user, token} kills those phantom sessions on next load.
      version: 1,
      partialize: (state) => ({ user: state.user, token: state.token }),
      // v0 persisted a standalone `isAuthenticated:true` with no token. Drop that
      // legacy state to a clean logged-out shape instead of warning + discarding.
      migrate: (persisted, version) => {
        if (version === 0 || !persisted) {
          return { user: null, token: null }
        }
        return persisted as { user: User | null; token: string | null }
      },
      // Rehydrate the session bridge and derive auth from an actual token.
      // _setHasHydrated fires a reactive update (so guards re-render) AFTER the token
      // has been pushed into the API layer — never redirect before this runs.
      onRehydrateStorage: () => (state) => {
        if (!state) return
        setAuthToken(state.token ?? null)
        state.isAuthenticated = !!state.token
        state._setHasHydrated(true)
      },
    }
  )
)

// Any 401 from the API layer → drop the session and bounce to login. Guarded so it
// never fires during SSR or loops while already on the login page.
setUnauthorizedHandler(() => {
  const alreadyLoggedOut = !useAuthStore.getState().isAuthenticated
  setAuthToken(null)
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false })
  if (
    typeof window !== 'undefined' &&
    !window.location.pathname.startsWith('/login')
  ) {
    if (!alreadyLoggedOut) toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
    window.location.href = '/login'
  }
})
