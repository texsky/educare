import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Menu, User, LogOut, KeyRound } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import Avatar from './Avatar'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const profileRoutes = {
    admin: '/admin/settings',
    teacher: '/teacher/dashboard',
    student: '/student/profile',
    parent: '/parent/profile',
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="text-gray-500 hover:text-gray-700 md:hidden p-1.5 rounded-lg hover:bg-gray-100 focus:outline-none"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold text-gray-800">EduCare Solutions</h2>
          <p className="text-xs text-gray-400 capitalize">{user?.role} Portal</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User profile dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <Avatar name={`${user?.firstName || ''} ${user?.lastName || ''}`} size="sm" />
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-700 leading-tight">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
            </div>
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-20 border border-gray-100 animate-fade-in">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-400">Signed in as</p>
                  <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
                </div>

                <Link
                  to={profileRoutes[user?.role] || '#'}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4 text-gray-400" />
                  My Profile
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
