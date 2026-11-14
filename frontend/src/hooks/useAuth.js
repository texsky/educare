import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useAuthStore from '@/store/authStore'
import * as authApi from '@/api/auth.api'
import { ROLES } from '@/utils/constants'

export function useAuth() {
  const store = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      const { user, token, refreshToken } = data.data
      store.setAuth({ user, token, refreshToken })
      toast.success(`Welcome back, ${user.firstName || user.name || 'User'}!`)
      // Redirect by role
      const redirects = {
        [ROLES.ADMIN]:   '/admin/dashboard',
        [ROLES.TEACHER]: '/teacher/dashboard',
        [ROLES.STUDENT]: '/student/dashboard',
        [ROLES.PARENT]:  '/parent/dashboard',
      }
      navigate(redirects[user.role] || '/login', { replace: true })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Login failed. Please check your credentials.')
    },
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      store.clearAuth()
      queryClient.clear()
      navigate('/login', { replace: true })
      toast.success('Logged out successfully')
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: (email) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('Password reset link sent to your email')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to send reset link')
    },
  })

  const resetPasswordMutation = useMutation({
    mutationFn: ({ token, password }) => authApi.resetPassword(token, password),
    onSuccess: () => {
      toast.success('Password reset successful! Please login.')
      navigate('/login', { replace: true })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to change password')
    },
  })

  return {
    user:                store.user,
    token:               store.token,
    role:                store.role,
    isAuthenticated:     store.isAuthenticated,
    hasRole:             store.hasRole,
    login:               loginMutation.mutate,
    isLoggingIn:         loginMutation.isPending,
    logout:              logoutMutation.mutate,
    forgotPassword:      forgotPasswordMutation.mutate,
    isSendingReset:      forgotPasswordMutation.isPending,
    resetPassword:       resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
    changePassword:      changePasswordMutation.mutate,
    isChangingPassword:  changePasswordMutation.isPending,
  }
}
