import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Link } from 'react-router-dom'
import { Mail, Lock, GraduationCap } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { loginSchema } from '@/utils/validators'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'

export default function Login() {
  const { login, isLoggingIn } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = (data) => {
    login(data)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md mb-4">
          <GraduationCap className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">EduCare Solutions</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-card rounded-2xl border border-gray-100 sm:px-10">
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

            <div>
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={Lock}
                {...register('password')}
                error={errors.password?.message}
                required
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoggingIn}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Credentials helper */}
          {/* <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-500">
            <p className="font-semibold text-gray-700 mb-1">Demo Credentials:</p>
            <p><span className="font-medium text-gray-600">Admin:</span> admin@educare.com / Admin@123</p>
          </div> */}
        </div>
      </div>
    </div>
  )
}
