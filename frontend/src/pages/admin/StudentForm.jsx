import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Button from '@/components/common/Button'
import FileUpload from '@/components/common/FileUpload'
import { studentSchema } from '@/utils/validators'
import {
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useUploadStudentPhoto,
} from '@/hooks/useStudents'
import { getClasses } from '@/api/classes.api'
import { useQuery } from '@tanstack/react-query'
import { GENDER_OPTIONS, BLOOD_GROUP_OPTIONS } from '@/utils/constants'
import { formatDateInput } from '@/utils/formatters'

export default function StudentForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [photoFile, setPhotoFile] = useState(null)

  const { data: student, isLoading: isFetchingStudent } = useStudent(id)
  const createMutation = useCreateStudent()
  const updateMutation = useUpdateStudent()
  const uploadPhotoMutation = useUploadStudentPhoto()

  const { data: classesData } = useQuery({
    queryKey: ['classes-list'],
    queryFn: () => getClasses({ limit: 100 }),
  })
  const classList = classesData?.data?.classes || classesData?.data || []
  const classOptions = classList.map((c) => ({
    value: c._id || c.id,
    label: `${c.name} - ${c.section}`,
  }))

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(studentSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'male',
      email: '',
      phone: '',
      admissionNo: '',
      classId: '',
      rollNo: '',
      bloodGroup: '',
      address: '',
    },
  })

  useEffect(() => {
    if (student) {
      reset({
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        dateOfBirth: formatDateInput(student.dateOfBirth),
        gender: student.gender || 'male',
        email: student.email || '',
        phone: student.phone || '',
        admissionNo: student.admissionNo || '',
        classId: student.classId?._id || student.classId || '',
        rollNo: student.rollNo || '',
        bloodGroup: student.bloodGroup || '',
        address: student.address || '',
      })
    }
  }, [student, reset])

  const onSubmit = async (values) => {
    if (isEdit) {
      await updateMutation.mutateAsync({ id, data: values })
      if (photoFile) {
        const formData = new FormData()
        formData.append('photo', photoFile)
        await uploadPhotoMutation.mutateAsync({ id, formData })
      }
      navigate('/admin/students')
    } else {
      const created = await createMutation.mutateAsync(values)
      const newId = created?.data?._id || created?.data?.id
      if (photoFile && newId) {
        const formData = new FormData()
        formData.append('photo', photoFile)
        await uploadPhotoMutation.mutateAsync({ id: newId, formData })
      }
      navigate('/admin/students')
    }
  }

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadPhotoMutation.isPending

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/admin/students"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Student Details' : 'Enroll New Student'}
          </h1>
          <p className="text-sm text-gray-500">
            Fill in student bio-data, academic assignments, and personal contact info.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photo upload section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Student Photo</label>
            <FileUpload
              previewUrl={student?.photo}
              onFileSelect={setPhotoFile}
              accept="image/*"
              maxSizeMb={5}
              helperText="PNG, JPG, or WEBP up to 5MB"
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>
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
              <Input
                label="Date of Birth"
                type="date"
                {...register('dateOfBirth')}
                error={errors.dateOfBirth?.message}
                required
              />
              <Select
                label="Gender"
                options={GENDER_OPTIONS}
                {...register('gender')}
                error={errors.gender?.message}
                required
              />
              <Select
                label="Blood Group"
                options={BLOOD_GROUP_OPTIONS}
                {...register('bloodGroup')}
                error={errors.bloodGroup?.message}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Academic Details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Admission Number"
                {...register('admissionNo')}
                error={errors.admissionNo?.message}
                required
              />
              <Select
                label="Class & Section"
                options={classOptions.length > 0 ? classOptions : [{ value: 'default', label: 'Grade 10-A' }]}
                {...register('classId')}
                error={errors.classId?.message}
                required
              />
              <Input
                label="Roll Number"
                type="number"
                {...register('rollNo')}
                error={errors.rollNo?.message}
                required
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Email Address"
                type="email"
                {...register('email')}
                error={errors.email?.message}
              />
              <Input
                label="Phone Number"
                {...register('phone')}
                error={errors.phone?.message}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Residential Address"
                  {...register('address')}
                  error={errors.address?.message}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/admin/students')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              icon={Save}
              isLoading={isSaving}
            >
              {isEdit ? 'Save Changes' : 'Enroll Student'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
