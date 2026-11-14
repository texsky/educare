import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, GraduationCap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { forgotPasswordSchema } from '@/utils/validators'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'

export default function ForgotPassword() {
  const { forgotPassword, isSendingReset } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
  })

  const onSubmit = (data) => {
    forgotPassword(data.email)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md mb-4">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Forgot Password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email to receive a password reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl border border-gray-100 sm:px-10">
          {isSubmitSuccessful ? (
            <div className="text-center">
              <div className="p-3 bg-success-50 text-success-600 rounded-full inline-flex mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Check your email</h3>
              <p className="mt-1 text-sm text-gray-600">
                If an account exists with that email, we have sent instructions to reset your password.
              </p>
              <div className="mt-6">
                <Link to="/login">
                  <Button variant="secondary" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <Input
                label="Email Address"
                type="email"
                placeholder="name@school.com"
                icon={Mail}
                {...register('email')}
                error={errors.email?.message}
                required
              />

              <Button
                type="submit"
                className="w-full"
                size="lg"
                isLoading={isSendingReset}
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
