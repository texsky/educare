import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useParams, Link } from 'react-router-dom'
import { Lock, GraduationCap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { resetPasswordSchema } from '@/utils/validators'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'

export default function ResetPassword() {
  const { token } = useParams()
  const { resetPassword, isResettingPassword } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  })

  const onSubmit = (data) => {
    resetPassword({ token, password: data.password })
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md mb-4">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Set New Password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter and confirm your new password below
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl border border-gray-100 sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              {...register('password')}
              error={errors.password?.message}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              icon={Lock}
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              required
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              isLoading={isResettingPassword}
            >
              Reset Password
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
