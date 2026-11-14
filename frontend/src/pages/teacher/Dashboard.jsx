import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Building,
  UploadCloud,
  FileCheck,
  Award,
  Users,
  Clock,
  ArrowRight,
} from 'lucide-react'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { getTeacher } from '@/api/teachers.api'
import { getClasses } from '@/api/classes.api'
import { getPendingMarks } from '@/api/marks.api'
import { formatDateTime } from '@/utils/formatters'

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { data: teacherResponse, isLoading: isLoadingTeacher, isError } = useQuery({
    queryKey: ['teacher-profile', user?.profileRef],
    queryFn: () => getTeacher(user.profileRef),
    enabled: Boolean(user?.profileRef),
  })
  const { data: classesResponse, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['teacher-dashboard-classes'],
    queryFn: () => getClasses({ limit: 100 }),
  })
  const { data: pendingResponse, isLoading: isLoadingMarks } = useQuery({
    queryKey: ['teacher-dashboard-pending-marks'],
    queryFn: () => getPendingMarks({ limit: 100 }),
  })

  const teacher = teacherResponse?.data
  const allClasses = classesResponse?.data || []
  const teacherClassIds = new Set((teacher?.classes || []).map((item) => item._id || item))
  const assignedClasses = allClasses.filter((item) => teacherClassIds.has(item._id))
  const teacherSubjectIds = new Set((teacher?.subjects || []).map((item) => item._id || item))
  const pendingMarks = (pendingResponse?.data || []).filter((mark) =>
    teacherSubjectIds.has(mark.subjectId?._id || mark.subjectId)
  )

  const quickActions = [
    {
      title: 'Scan Marksheet (OCR)',
      desc: 'Upload a photo or scanned copy of a handwritten marksheet',
      link: '/teacher/marks/upload',
      icon: UploadCloud,
      color: 'bg-primary-50 text-primary-600',
    },
    {
      title: 'Manual Marks Entry',
      desc: 'Enter scores directly student-by-student',
      link: '/teacher/marks/manual',
      icon: Award,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      title: 'Review & Verify Marks',
      desc: 'Verify submitted scores before results are published',
      link: '/teacher/marks/review',
      icon: FileCheck,
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  if (isLoadingTeacher || isLoadingClasses || isLoadingMarks) {
    return <LoadingSpinner size="lg" className="h-64" />
  }

  if (isError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Unable to load your teacher dashboard.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {teacher?.firstName || user?.firstName || 'Teacher'}!
        </h1>
        <p className="text-sm text-gray-500">
          Manage your assigned classes and review submitted marks.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card
          title="Assigned Classes"
          value={assignedClasses.length}
          subtitle="Classes assigned to you"
          icon={Building}
          color="primary"
        />
        <Card
          title="Total Students"
          value={assignedClasses.reduce((total, item) => total + (item.studentIds?.length || 0), 0)}
          subtitle="Across assigned classes"
          icon={Users}
          color="purple"
        />
        <Card
          title="Pending Reviews"
          value={pendingMarks.length}
          subtitle="Marks awaiting verification"
          icon={Clock}
          color="warning"
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Tasks</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.title}
                to={action.link}
                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className={`p-3 rounded-lg w-fit ${action.color} mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{action.desc}</p>
                </div>
                <div className="mt-4 flex items-center text-xs font-semibold text-primary-600 gap-1">
                  Get Started <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Marks Awaiting Review</h3>
          <Link to="/teacher/marks/review" className="text-xs text-primary-600 hover:underline">
            View All
          </Link>
        </div>
        {pendingMarks.length ? (
          <div className="divide-y divide-gray-100">
            {pendingMarks.slice(0, 5).map((mark) => (
              <div key={mark._id} className="py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {mark.studentId?.firstName} {mark.studentId?.lastName} · {mark.subjectId?.name}
                  </p>
                  <p className="text-xs text-gray-400">{mark.examId?.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-warning-50 text-warning-700">
                    Pending Review
                  </span>
                  <p className="text-[11px] text-gray-400 mt-0.5">{formatDateTime(mark.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-sm text-gray-500">No marks are waiting for review.</p>
        )}
      </div>
    </div>
  )
}
