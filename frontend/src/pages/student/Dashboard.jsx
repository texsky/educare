import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Award, BookOpen, Calendar, ArrowRight, TrendingUp } from 'lucide-react'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import { getStudent } from '@/api/students.api'
import { getMemos } from '@/api/memo.api'
import { getExams } from '@/api/exams.api'
import { formatDate } from '@/utils/formatters'

export default function StudentDashboard() {
  const { user } = useAuth()
  const { data: studentResponse } = useQuery({
    queryKey: ['student-profile', user?.profileRef],
    queryFn: () => getStudent(user.profileRef),
    enabled: Boolean(user?.profileRef),
  })
  const { data: memoResponse, isLoading: isLoadingMemos, isError } = useQuery({
    queryKey: ['my-results'],
    queryFn: () => getMemos({ limit: 10 }),
  })

  const student = studentResponse?.data
  const memos = memoResponse?.data || []
  const latestMemo = memos[0]
  const classId = student?.classId?._id || student?.classId

  const { data: examResponse, isLoading: isLoadingExams } = useQuery({
    queryKey: ['student-upcoming-exams', classId],
    queryFn: () => getExams({ classId, status: 'upcoming', limit: 5 }),
    enabled: Boolean(classId),
  })
  const upcomingExams = examResponse?.data || []

  if (isLoadingMemos) return <LoadingSpinner size="lg" className="h-64" />

  if (isError) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Unable to load your academic data.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hello, {user?.firstName || 'Student'}!
        </h1>
        <p className="text-sm text-gray-500">
          Your published results and upcoming examinations.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card
          title="Latest Grade"
          value={latestMemo?.grade || '—'}
          subtitle={latestMemo?.examId?.name || 'No published results'}
          icon={Award}
          color="success"
        />
        <Card
          title="Latest Exam Score"
          value={latestMemo ? `${latestMemo.percentage}%` : '—'}
          subtitle={latestMemo ? `${latestMemo.totalMarksObtained} / ${latestMemo.totalMaxMarks}` : 'No published results'}
          icon={TrendingUp}
          color="primary"
        />
        <Card
          title="Class Standing"
          value={latestMemo?.rank ? `Rank #${latestMemo.rank}` : '—'}
          subtitle={student?.classId ? `${student.classId.name} - ${student.classId.section}` : 'Class not assigned'}
          icon={BookOpen}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-900">Published Report Memos</h3>
          <Link to="/student/results" className="text-xs text-primary-600 hover:underline">
            View All Results
          </Link>
        </div>
        {memos.length ? (
          <div className="divide-y divide-gray-100">
            {memos.slice(0, 3).map((memo) => (
              <div key={memo._id} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900">{memo.examId?.name}</h4>
                  <p className="text-xs text-gray-400">
                    {formatDate(memo.publishedAt || memo.generatedAt)} · Class rank #{memo.rank || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-base font-bold text-gray-900">{memo.percentage}%</div>
                    <Badge variant="approved">{memo.grade}</Badge>
                  </div>
                  <Link to={`/student/memo/${memo._id}`}>
                    <Button size="sm" variant="outline">
                      View Memo <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-sm text-gray-500">No published results yet.</p>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary-600" /> Upcoming Assessments
        </h3>
        {isLoadingExams ? (
          <LoadingSpinner size="md" className="py-6" />
        ) : upcomingExams.length ? (
          <div className="space-y-3">
            {upcomingExams.map((exam) => (
              <div key={exam._id} className="p-4 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{exam.name}</p>
                  <p className="text-xs text-gray-400">Starts {formatDate(exam.startDate)}</p>
                </div>
                <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                  {exam.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-sm text-gray-500">No upcoming assessments.</p>
        )}
      </div>
    </div>
  )
}
