import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import * as marksApi from '@/api/marks.api'

const MARKS_KEY = 'marks'

export function useMarksByExam(examId, params) {
  return useQuery({
    queryKey: [MARKS_KEY, 'exam', examId, params],
    queryFn: () => marksApi.getMarksByExam(examId, params),
    select: (d) => d.data,
    enabled: !!examId,
  })
}

export function useMarksByStudent(studentId, params) {
  return useQuery({
    queryKey: [MARKS_KEY, 'student', studentId, params],
    queryFn: () => marksApi.getMarksByStudent(studentId, params),
    select: (d) => d.data,
    enabled: !!studentId,
  })
}

export function usePendingMarks(params) {
  return useQuery({
    queryKey: [MARKS_KEY, 'pending', params],
    queryFn: () => marksApi.getPendingMarks(params),
    select: (d) => d.data,
  })
}

export function useUploadMarksImage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ formData, onProgress }) => marksApi.uploadMarksImage(formData, onProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MARKS_KEY] })
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  })
}

export function useManualEntryMarks() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: marksApi.manualEntryMarks,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MARKS_KEY] })
      toast.success('Marks saved successfully')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save marks'),
  })
}

export function useReviewMark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action, remarks }) => marksApi.reviewMark(id, action, remarks),
    onSuccess: (_, { action }) => {
      qc.invalidateQueries({ queryKey: [MARKS_KEY] })
      toast.success(`Marks ${action === 'approve' ? 'approved' : 'rejected'} successfully`)
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Review failed'),
  })
}

export function useUpdateMark() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => marksApi.updateMark(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [MARKS_KEY] })
      toast.success('Mark updated')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  })
}
