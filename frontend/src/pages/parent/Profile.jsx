import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Mail, Phone, MapPin, Lock, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import Avatar from '@/components/common/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { changePasswordSchema } from '@/utils/validators'
import { changePassword } from '@/api/auth.api'
import { getMyParent } from '@/api/parents.api'

export default function ParentProfile() {
  const { user } = useAuth()
  const { data: profileResponse } = useQuery({
    queryKey: ['my-parent'],
    queryFn: getMyParent,
  })
  const parent = profileResponse?.data
  const children = parent?.studentIds || []
  const address = [
    parent?.address?.street,
    parent?.address?.city,
    parent?.address?.state,
    parent?.address?.pincode,
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
        <h1 className="text-2xl font-bold text-gray-900">Guardian Profile & Settings</h1>
        <p className="text-sm text-gray-500">Manage guardian credentials and account security.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <Avatar
          name={`${user?.firstName || 'Parent'} ${user?.lastName || ''}`}
          size="xl"
          className="w-24 h-24 text-2xl shadow-sm"
        />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-gray-900">
            {user?.firstName} {user?.lastName}
          </h2>
          <p className="text-sm text-gray-500 font-mono mt-0.5">
            Relationship: {parent?.relation || 'Guardian'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{parent?.userId?.email || user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <span>{parent?.phone || 'Phone not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span>
                Linked Wards: {children.map((child) => `${child.firstName} ${child.lastName}`).join(', ') || 'None'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{address || 'Address not provided'}</span>
            </div>
          </div>
        </div>
      </div>

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
          <Button type="submit" loading={passwordMutation.isPending} className="mt-2">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  )
}
