import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Calendar, AlertCircle, ArrowRight } from 'lucide-react'
import Button from '@/components/common/Button'
import Avatar from '@/components/common/Avatar'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { getMyParent } from '@/api/parents.api'
import { getMemos } from '@/api/memo.api'
import { getNotifications } from '@/api/notifications.api'
import { formatDate } from '@/utils/formatters'

export default function ParentDashboard() {
  const { user } = useAuth()
  const { data: parentResponse, isLoading: isLoadingParent, isError } = useQuery({
    queryKey: ['my-parent'],
    queryFn: getMyParent,
  })
  const { data: notificationsResponse } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: () => getNotifications({ limit: 5, type: 'in-app' }),
  })

  const children = parentResponse?.data?.studentIds || []
  const memoQueries = useQueries({
    queries: children.map((child) => ({
      queryKey: ['parent-child-memos', child._id],
      queryFn: () => getMemos({ studentId: child._id, limit: 1 }),
      enabled: Boolean(child._id),
    })),
  })
  const notices = notificationsResponse?.data || []

  if (isLoadingParent) return <LoadingSpinner size="lg" className="h-64" />

  if (isError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Unable to load your linked students.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.firstName || 'Parent'}!
        </h1>
        <p className="text-sm text-gray-500">
          Your linked students' published results and school updates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {children.map((child, index) => {
          const memo = memoQueries[index]?.data?.data?.[0]
          const className = child.classId
            ? `${child.classId.name} - Section ${child.classId.section}`
            : `Section ${child.section}`

          return (
            <div
              key={child._id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar name={`${child.firstName} ${child.lastName}`} size="lg" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {child.firstName} {child.lastName}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {className} · {child.admissionNo}
                    </p>
                  </div>
                </div>
                {memo ? (
                  <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-3 gap-2 text-center my-4">
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold">Latest Score</p>
                      <p className="text-lg font-bold text-gray-900">{memo.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold">Grade</p>
                      <p className="text-lg font-bold text-primary-600">{memo.grade}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase font-semibold">Class Rank</p>
                      <p className="text-lg font-bold text-emerald-600">#{memo.rank || '—'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="my-4 rounded-lg bg-gray-50 p-4 text-sm text-gray-500">
                    No published results yet.
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-400 font-medium">
                  {memo?.examId?.name || 'Results'}
                </span>
                {memo && (
                  <Link to={`/parent/memo/${memo._id}`}>
                    <Button size="sm">
                      View Memo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )
        })}
        {!children.length && (
          <div className="col-span-full rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
            No students are linked to your parent account yet.
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-600" /> School Updates
        </h3>
        {notices.length ? (
          <div className="space-y-3">
            {notices.map((notice) => (
              <div key={notice._id} className="p-4 rounded-lg bg-blue-50/50 border border-blue-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-primary-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{notice.subject}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{notice.message}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{formatDate(notice.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent school updates.</p>
        )}
      </div>
    </div>
  )
}
