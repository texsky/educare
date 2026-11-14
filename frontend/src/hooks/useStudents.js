import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as studentsApi from '@/api/students.api'

const STUDENTS_KEY = 'students'

export function useStudents(params) {
  return useQuery({
    queryKey: [STUDENTS_KEY, params],
    queryFn: () => studentsApi.getStudents(params),
    select: (data) => ({ students: data.data, ...data.meta }),
  })
}

export function useStudent(id) {
  return useQuery({
    queryKey: [STUDENTS_KEY, id],
    queryFn: () => studentsApi.getStudent(id),
    select: (data) => data.data,
    enabled: !!id,
  })
}

export function useStudentsByClass(classId, params) {
  return useQuery({
    queryKey: [STUDENTS_KEY, 'class', classId, params],
    queryFn: () => studentsApi.getStudentsByClass(classId, params),
    select: (data) => data.data,
    enabled: !!classId,
  })
}

export function useCreateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: studentsApi.createStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] })
      toast.success('Student created successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create student'),
  })
}

export function useUpdateStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => studentsApi.updateStudent(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] })
      toast.success('Student updated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update student'),
  })
}

export function useDeleteStudent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: studentsApi.deleteStudent,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY] })
      toast.success('Student deleted successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete student'),
  })
}

export function useUploadStudentPhoto() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, formData }) => studentsApi.uploadStudentPhoto(id, formData),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: [STUDENTS_KEY, id] })
      toast.success('Photo uploaded successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to upload photo'),
  })
}
