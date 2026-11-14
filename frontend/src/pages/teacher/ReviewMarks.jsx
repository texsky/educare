import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, FileCheck, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Modal from '@/components/common/Modal'
import { getPendingMarks, reviewMark } from '@/api/marks.api'
import { formatDateTime } from '@/utils/formatters'

export default function ReviewMarks() {
  const queryClient = useQueryClient()
  const [rejectModalId, setRejectModalId] = useState(null)
  const [remarks, setRemarks] = useState('')

  const { data: response, isLoading } = useQuery({
    queryKey: ['pending-marks'],
    queryFn: () => getPendingMarks(),
  })

  const pendingList = response?.data || []

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, remarks }) => reviewMark(id, action, remarks),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['pending-marks'] })
      toast.success(`Marks ${action === 'approve' ? 'approved' : 'rejected'}`)
      setRejectModalId(null)
      setRemarks('')
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Review failed'),
  })

  const columns = [
    {
      title: 'Student',
      key: 'student',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-gray-900">
            {row.studentId?.firstName} {row.studentId?.lastName}
          </div>
          <div className="text-xs text-gray-400">Roll #{row.studentId?.rollNo || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Exam',
      key: 'exam',
      render: (_, row) => row.examId?.name || 'Mid-Term Exam',
    },
    {
      title: 'Subject',
      key: 'subject',
      render: (_, row) => row.subjectId?.name || 'Mathematics',
    },
    {
      title: 'Score',
      key: 'marksObtained',
      render: (m) => (
        <span className="font-bold text-gray-900 text-base">{m} / 100</span>
      ),
    },
    {
      title: 'Review Status',
      key: 'reviewStatus',
      render: (st) => <Badge variant="pending">{st || 'Pending'}</Badge>,
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-success-600 hover:bg-success-50"
            onClick={() =>
              reviewMutation.mutate({
                id: row._id || row.id,
                action: 'approve',
              })
            }
          >
            <Check className="w-4 h-4 mr-1" /> Approve
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-danger-600 hover:bg-danger-50"
            onClick={() => setRejectModalId(row._id || row.id)}
          >
            <X className="w-4 h-4 mr-1" /> Reject
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Review Pending Marks</h1>
        <p className="text-sm text-gray-500">
          Verify and approve handwritten OCR scans and manually submitted grade records.
        </p>
      </div>

      <Table columns={columns} data={pendingList} isLoading={isLoading} />

      {/* Reject Remarks Modal */}
      <Modal
        isOpen={!!rejectModalId}
        onClose={() => setRejectModalId(null)}
        title="Reject Mark Entry"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRejectModalId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                reviewMutation.mutate({
                  id: rejectModalId,
                  action: 'reject',
                  remarks,
                })
              }
              isLoading={reviewMutation.isPending}
            >
              Confirm Rejection
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Please enter a reason for rejecting this grade (e.g. illegible digit or score mismatch).
          </p>
          <textarea
            rows={3}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-danger-500 focus:border-danger-500"
            placeholder="Remarks for faculty / student..."
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
