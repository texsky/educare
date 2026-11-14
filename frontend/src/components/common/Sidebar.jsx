import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCheck,
  Building,
  BookOpen,
  Calendar,
  FileCheck,
  FileText,
  Bell,
  Settings,
  History,
  UploadCloud,
  Edit3,
  X,
  Award,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { ROLES } from '@/utils/constants'

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const role = user?.role

  const adminNav = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', path: '/admin/students', icon: GraduationCap },
    { label: 'Teachers', path: '/admin/teachers', icon: Users },
    { label: 'Parents', path: '/admin/parents', icon: UserCheck },
    { label: 'Classes', path: '/admin/classes', icon: Building },
    { label: 'Subjects', path: '/admin/subjects', icon: BookOpen },
    { label: 'Exams', path: '/admin/exams', icon: Calendar },
    { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: History },
    { label: 'Settings', path: '/admin/settings', icon: Settings },
  ]

  const teacherNav = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'My Classes', path: '/teacher/classes', icon: Building },
    { label: 'Upload Marks', path: '/teacher/marks/upload', icon: UploadCloud },
    { label: 'Manual Entry', path: '/teacher/marks/manual', icon: Edit3 },
    { label: 'Review Marks', path: '/teacher/marks/review', icon: FileCheck },
    { label: 'Memos', path: '/teacher/memos', icon: FileText },
  ]

  const studentNav = [
    { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Results', path: '/student/results', icon: Award },
    { label: 'My Profile', path: '/student/profile', icon: UserCheck },
  ]

  const parentNav = [
    { label: 'Dashboard', path: '/parent/dashboard', icon: LayoutDashboard },
    { label: 'Children Results', path: '/parent/results', icon: Award },
    { label: 'My Profile', path: '/parent/profile', icon: UserCheck },
  ]

  const navMap = {
    [ROLES.ADMIN]: adminNav,
    [ROLES.TEACHER]: teacherNav,
    [ROLES.STUDENT]: studentNav,
    [ROLES.PARENT]: parentNav,
  }

  const currentNav = navMap[role] || []

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-slate-100 transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white font-bold text-lg shadow-sm">
              E
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">EduCare</span>
              <span className="block text-[10px] uppercase font-semibold text-primary-400 tracking-wider">
                Solutions
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {currentNav.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">EduCare v1.0</p>
          <p className="mt-0.5">School Management System</p>
        </div>
      </aside>
    </>
  )
}
