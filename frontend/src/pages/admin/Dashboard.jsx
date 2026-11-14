import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Users, GraduationCap, Building, Calendar } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import Card from '@/components/common/Card'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { getDashboardStats } from '@/api/admin.api'
import { formatDateTime } from '@/utils/formatters'

export default function AdminDashboard() {
  const { data: statsResponse, isLoading, isError, error } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: getDashboardStats,
  })

  const rawData = statsResponse?.data || {}
  const stats = {
    totalStudents: rawData.totalStudents ?? 0,
    totalTeachers: rawData.totalTeachers ?? 0,
    totalClasses: rawData.totalClasses ?? 0,
    totalExams: rawData.totalExams ?? 0,
    recentActivity: rawData.recentActivity?.length
      ? rawData.recentActivity
      : (rawData.recentAuditLogs || []).map((l, idx) => ({
          id: l._id || idx,
          action: `${l.action} on ${l.entity || 'System'}`,
          time: l.timestamp,
          user: l.userId?.name || 'Staff',
        })),
    studentPerformance: rawData.studentPerformance || [],
    classDistribution: rawData.classDistribution || [],
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />

  if (isError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Unable to load dashboard data: {error.response?.data?.message || error.message}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administrator Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome to the school overview and real-time analytics.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Total Students"
          value={stats.totalStudents || 0}
          icon={GraduationCap}
          color="primary"
        />
        <Card
          title="Total Teachers"
          value={stats.totalTeachers || 0}
          icon={Users}
          color="success"
        />
        <Card
          title="Active Classes"
          value={stats.totalClasses || 0}
          icon={Building}
          color="warning"
        />
        <Card
          title="Scheduled Exams"
          value={stats.totalExams || 0}
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Grade Distribution Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Student Grade Distribution</h3>
            <span className="text-xs text-gray-400">Current Academic Year</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.studentPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grade" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Class Enrollment</h3>
          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.classDistribution || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {(stats.classDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Recent School Activity</h3>
        <div className="divide-y divide-gray-100">
          {(stats.recentActivity || []).map((act, i) => (
            <div key={act.id || i} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800">{act.action}</p>
                  <p className="text-xs text-gray-400">Initiated by {act.user}</p>
                </div>
              </div>
              <span className="text-xs text-gray-400">{formatDateTime(act.time)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
