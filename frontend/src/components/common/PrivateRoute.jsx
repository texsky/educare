import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Layout from './Layout'
import { ROLES } from '@/utils/constants'

export default function PrivateRoute({ allowedRoles = [] }) {
  const { user, isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const roleRedirects = {
      [ROLES.ADMIN]: '/admin/dashboard',
      [ROLES.TEACHER]: '/teacher/dashboard',
      [ROLES.STUDENT]: '/student/dashboard',
      [ROLES.PARENT]: '/parent/dashboard',
    }
    return <Navigate to={roleRedirects[user.role] || '/login'} replace />
  }

  return <Layout />
}
