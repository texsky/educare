import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Building, Users, BookOpen, Award, ArrowRight } from 'lucide-react'
import Card from '@/components/common/Card'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { getClasses } from '@/api/classes.api'
import { getTeacher } from '@/api/teachers.api'
import { useAuth } from '@/hooks/useAuth'

export default function MyClasses() {
  const { user } = useAuth()
  const { data: teacherResponse, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ['teacher-profile', user?.profileRef],
    queryFn: () => getTeacher(user.profileRef),
    enabled: Boolean(user?.profileRef),
  })
  const { data: response, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['my-classes'],
    queryFn: () => getClasses({ limit: 100 }),
  })

  const teacherClassIds = new Set(
    (teacherResponse?.data?.classes || []).map((item) => item._id || item)
  )
  const classes = (response?.data || []).filter((item) => teacherClassIds.has(item._id))

  if (isLoadingTeacher || isLoadingClasses) return <LoadingSpinner size="lg" className="h-64" />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Assigned Classes</h1>
        <p className="text-sm text-gray-500">View roster of students and quickly enter marks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div
            key={cls._id || cls.id}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700">
                  {cls.academicYear || '2024/2025'}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {cls.studentIds?.length ?? 0} Students
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                {cls.name} - Section {cls.section}
              </h3>

              <div className="mt-4 space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjects</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(cls.subjects || []).map((sub, i) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium"
                    >
                      {typeof sub === 'object' ? sub.name : sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2">
              <Link to="/teacher/marks/manual" className="flex-1">
                <Button size="sm" variant="outline" className="w-full">
                  Enter Marks
                </Button>
              </Link>
              <Link to="/teacher/marks/upload" className="flex-1">
                <Button size="sm" className="w-full">
                  Scan Sheet
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
