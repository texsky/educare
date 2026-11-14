import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as examsApi from '@/api/exams.api'

const EXAMS_KEY = 'exams'

export function useExams(params) {
  return useQuery({
    queryKey: [EXAMS_KEY, params],
    queryFn: () => examsApi.getExams(params),
    select: (d) => d.data,
  })
}

export function useExam(id) {
  return useQuery({
    queryKey: [EXAMS_KEY, id],
    queryFn: () => examsApi.getExam(id),
    select: (d) => d.data,
    enabled: !!id,
  })
}

export function useCreateExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: examsApi.createExam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EXAMS_KEY] })
      toast.success('Exam created successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create exam'),
  })
}

export function useUpdateExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => examsApi.updateExam(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EXAMS_KEY] })
      toast.success('Exam updated successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update exam'),
  })
}

export function useDeleteExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: examsApi.deleteExam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EXAMS_KEY] })
      toast.success('Exam deleted successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete exam'),
  })
}

export function usePublishExam() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: examsApi.publishExam,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [EXAMS_KEY] })
      toast.success('Exam published successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to publish exam'),
  })
}
