import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Mail, MapPin, Lock, Award } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import Avatar from '@/components/common/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { changePasswordSchema } from '@/utils/validators'
import { changePassword } from '@/api/auth.api'
import { getStudent } from '@/api/students.api'

export default function StudentProfile() {
  const { user } = useAuth()
  const { data: profileResponse } = useQuery({
    queryKey: ['student-profile', user?.profileRef],
    queryFn: () => getStudent(user.profileRef),
    enabled: Boolean(user?.profileRef),
  })
  const student = profileResponse?.data
  const address = [
    student?.address?.street,
    student?.address?.city,
    student?.address?.state,
    student?.address?.pincode,
  ].filter(Boolean).join(', ')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
  })

  const passwordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password updated successfully')
      reset()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Password update failed'),
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Student Profile & Settings</h1>
        <p className="text-sm text-gray-500">View your student credentials and manage your account security.</p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar
          name={`${user?.firstName || 'Student'} ${user?.lastName || ''}`}
          size="xl"
          className="w-24 h-24 text-2xl shadow-sm"
        />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-900">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-sm text-gray-500 font-mono mt-0.5">
            Admission No: {student?.admissionNo || '—'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{student?.userId?.email || user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-400" />
              <span>
                Class: {student?.classId?.name || '—'} - {student?.classId?.section || student?.section || '—'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{address || 'Address not provided'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary-600" /> Security: Change Password
        </h3>

        <form onSubmit={handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4 max-w-lg">
          <Input
            label="Current Password"
            type="password"
            icon={Lock}
            {...register('currentPassword')}
            error={errors.currentPassword?.message}
            required
          />
          <Input
            label="New Password"
            type="password"
            icon={Lock}
            {...register('newPassword')}
            error={errors.newPassword?.message}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            icon={Lock}
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            required
          />

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={passwordMutation.isPending}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
