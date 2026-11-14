import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, Building, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Button from '@/components/common/Button'
import FileUpload from '@/components/common/FileUpload'
import { settingsSchema } from '@/utils/validators'
import { getSettings, updateSettings, uploadSchoolLogo } from '@/api/admin.api'
import { ACADEMIC_YEARS } from '@/utils/constants'

export default function Settings() {
  const queryClient = useQueryClient()
  const [logoFile, setLogoFile] = useState(null)

  const { data: response, isLoading } = useQuery({
    queryKey: ['school-settings'],
    queryFn: getSettings,
  })

  const settings = response?.data || {
    schoolName: 'EduCare Academy of Excellence',
    schoolEmail: 'contact@educare.edu',
    schoolPhone: '+1 555-0199',
    schoolAddress: '124 Academic Way, Tech Valley',
    academicYear: '2024/2025',
    logo: null,
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(settingsSchema),
    defaultValues: {
      schoolName: '',
      schoolEmail: '',
      schoolPhone: '',
      schoolAddress: '',
      academicYear: ACADEMIC_YEARS[1] || '2024/2025',
    },
  })

  useEffect(() => {
    if (settings) {
      reset({
        schoolName: settings.schoolName || '',
        schoolEmail: settings.schoolEmail || '',
        schoolPhone: settings.schoolPhone || '',
        schoolAddress: settings.schoolAddress || '',
        academicYear: settings.academicYear || ACADEMIC_YEARS[1],
      })
    }
  }, [settings, reset])

  const saveMutation = useMutation({
    mutationFn: async (values) => {
      const res = await updateSettings(values)
      if (logoFile) {
        const formData = new FormData()
        formData.append('logo', logoFile)
        await uploadSchoolLogo(formData)
      }
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-settings'] })
      toast.success('School settings updated successfully')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update settings')
    },
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">School Configuration</h1>
        <p className="text-sm text-gray-500">Customize school branding, memo templates, and academic defaults.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-6">
          {/* Logo upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">School Official Crest / Logo</label>
            <FileUpload
              previewUrl={settings?.logo}
              onFileSelect={setLogoFile}
              accept="image/*"
              maxSizeMb={2}
              helperText="Displays on generated student report memos. PNG/JPG up to 2MB"
            />
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Institution Profile</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Institution Name"
                icon={Building}
                {...register('schoolName')}
                error={errors.schoolName?.message}
                required
              />
              <Select
                label="Active Academic Year"
                options={ACADEMIC_YEARS.map((y) => ({ value: y, label: y }))}
                {...register('academicYear')}
                error={errors.academicYear?.message}
                required
              />
              <Input
                label="Official Contact Email"
                icon={Mail}
                type="email"
                {...register('schoolEmail')}
                error={errors.schoolEmail?.message}
              />
              <Input
                label="Official Contact Phone"
                icon={Phone}
                {...register('schoolPhone')}
                error={errors.schoolPhone?.message}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Campus Address"
                  icon={MapPin}
                  {...register('schoolAddress')}
                  error={errors.schoolAddress?.message}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Grading System Standard</h3>
            <p className="text-xs text-gray-500 mb-4">
              Configured default 7-point scale with automated memo grade rank calculation.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 text-center text-xs">
              <div className="p-2.5 bg-green-50 rounded-lg border border-green-200">
                <div className="font-bold text-green-800 text-sm">A+</div>
                <div className="text-green-600">90-100%</div>
              </div>
              <div className="p-2.5 bg-green-50 rounded-lg border border-green-200">
                <div className="font-bold text-green-800 text-sm">A</div>
                <div className="text-green-600">80-89%</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-bold text-blue-800 text-sm">B+</div>
                <div className="text-blue-600">70-79%</div>
              </div>
              <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                <div className="font-bold text-blue-800 text-sm">B</div>
                <div className="text-blue-600">60-69%</div>
              </div>
              <div className="p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="font-bold text-yellow-800 text-sm">C</div>
                <div className="text-yellow-600">50-59%</div>
              </div>
              <div className="p-2.5 bg-orange-50 rounded-lg border border-orange-200">
                <div className="font-bold text-orange-800 text-sm">D</div>
                <div className="text-orange-600">40-49%</div>
              </div>
              <div className="p-2.5 bg-red-50 rounded-lg border border-red-200">
                <div className="font-bold text-red-800 text-sm">F</div>
                <div className="text-red-600">0-39%</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-6 border-t border-gray-100">
            <Button
              type="submit"
              icon={Save}
              isLoading={saveMutation.isPending}
            >
              Save Configuration
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
