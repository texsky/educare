import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '@/components/common/Input'
import Button from '@/components/common/Button'
import { teacherSchema } from '@/utils/validators'
import { getTeacher, createTeacher, updateTeacher } from '@/api/teachers.api'
import { getSubjects } from '@/api/subjects.api'

export default function TeacherForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: teacherData } = useQuery({
    queryKey: ['teacher', id],
    queryFn: () => getTeacher(id),
    enabled: isEdit,
  })

  const { data: subjectsData } = useQuery({
    queryKey: ['subjects-list'],
    queryFn: () => getSubjects({ limit: 100 }),
  })
  const subjects = subjectsData?.data?.subjects || subjectsData?.data || [
    { _id: 'sub1', name: 'Mathematics' },
    { _id: 'sub2', name: 'Physics' },
    { _id: 'sub3', name: 'Chemistry' },
    { _id: 'sub4', name: 'English Literature' },
  ]

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(teacherSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      employeeId: '',
      qualifications: '',
      subjectIds: [],
    },
  })

  useEffect(() => {
    if (teacherData?.data) {
      const t = teacherData.data
      reset({
        firstName: t.firstName || '',
        lastName: t.lastName || '',
        email: t.email || '',
        phone: t.phone || '',
        employeeId: t.employeeId || '',
        qualifications: t.qualifications || '',
        subjectIds: (t.subjectIds || []).map((s) => (typeof s === 'object' ? s._id : s)),
      })
    }
  }, [teacherData, reset])

  const mutation = useMutation({
    mutationFn: (values) =>
      isEdit ? updateTeacher(id, values) : createTeacher(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      toast.success(isEdit ? 'Teacher details updated' : 'Teacher enrolled successfully')
      navigate('/admin/teachers')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Operation failed')
    },
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/teachers"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Teacher Details' : 'Add New Faculty Member'}
          </h1>
          <p className="text-sm text-gray-500">Provide staff credentials and teaching specializations.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="First Name"
              {...register('firstName')}
              error={errors.firstName?.message}
              required
            />
            <Input
              label="Last Name"
              {...register('lastName')}
              error={errors.lastName?.message}
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              required
            />
            <Input
              label="Phone Number"
              {...register('phone')}
              error={errors.phone?.message}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Employee ID"
              {...register('employeeId')}
              error={errors.employeeId?.message}
              required
            />
            <Input
              label="Academic Qualifications"
              placeholder="e.g. M.Sc. Mathematics, B.Ed"
              {...register('qualifications')}
              error={errors.qualifications?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Subjects <span className="text-danger-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {subjects.map((sub) => (
                <label key={sub._id || sub.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    value={sub._id || sub.id}
                    {...register('subjectIds')}
                    className="rounded text-primary-600 focus:ring-primary-500 border-gray-300"
                  />
                  <span>{sub.name}</span>
                </label>
              ))}
            </div>
            {errors.subjectIds && (
              <p className="mt-1 text-xs text-danger-600">{errors.subjectIds.message}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/teachers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={Save}
              isLoading={mutation.isPending}
            >
              {isEdit ? 'Save Changes' : 'Save Faculty'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
