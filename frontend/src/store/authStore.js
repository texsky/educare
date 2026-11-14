import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { TOKEN_KEY, USER_KEY, REFRESH_KEY } from '@/utils/constants'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:         null,
      token:        null,
      refreshToken: null,
      role:         null,
      isAuthenticated: false,

      setAuth: ({ user, token, refreshToken }) => {
        localStorage.setItem(TOKEN_KEY, token)
        if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
        set({
          user,
          token,
          refreshToken: refreshToken || get().refreshToken,
          role: user?.role,
          isAuthenticated: true,
        })
      },

      updateUser: (user) => set({ user, role: user?.role }),

      clearAuth: () => {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(USER_KEY)
        set({ user: null, token: null, refreshToken: null, role: null, isAuthenticated: false })
      },

      hasRole: (roles) => {
        const { role } = get()
        if (!role) return false
        return Array.isArray(roles) ? roles.includes(role) : role === roles
      },
    }),
    {
      name: 'educare-auth',
      partialize: (state) => ({
        user:            state.user,
        token:           state.token,
        refreshToken:    state.refreshToken,
        role:            state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
