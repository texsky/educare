import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Calendar, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Modal from '@/components/common/Modal'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Badge from '@/components/common/Badge'
import { getExams, createExam, updateExam, deleteExam, publishExam } from '@/api/exams.api'
import { getClasses } from '@/api/classes.api'
import { EXAM_TYPES, ACADEMIC_YEARS } from '@/utils/constants'
import { formatDate, formatDateInput } from '@/utils/formatters'

export default function Exams() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExam, setEditingExam] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'midterm',
    classId: '',
    startDate: '',
    endDate: '',
    academicYear: ACADEMIC_YEARS[1] || '2024/2025',
  })

  const { data: response, isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: () => getExams(),
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes-for-exams'],
    queryFn: () => getClasses(),
  })

  const exams = response?.data?.exams || response?.data || []
  const classes = classesData?.data?.classes || classesData?.data || []
  const classOptions = classes.map((c) => ({
    value: c._id || c.id,
    label: `${c.name} - ${c.section}`,
  }))

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingExam ? updateExam(editingExam._id || editingExam.id, data) : createExam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success(editingExam ? 'Exam updated' : 'Exam scheduled')
      handleClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Exam removed')
      setDeleteId(null)
    },
  })

  const publishMutation = useMutation({
    mutationFn: (id) => publishExam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] })
      toast.success('Exam results published to students and parents!')
    },
  })

  const handleOpen = (e = null) => {
    setEditingExam(e)
    if (e) {
      setFormData({
        name: e.name || '',
        type: e.type || 'midterm',
        classId: e.classId?._id || e.classId || '',
        startDate: formatDateInput(e.startDate),
        endDate: formatDateInput(e.endDate),
        academicYear: e.academicYear || ACADEMIC_YEARS[1],
      })
    } else {
      setFormData({
        name: '',
        type: 'midterm',
        classId: classOptions[0]?.value || '',
        startDate: '',
        endDate: '',
        academicYear: ACADEMIC_YEARS[1] || '2024/2025',
      })
    }
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingExam(null)
  }

  const columns = [
    {
      title: 'Exam Title',
      key: 'name',
      render: (name, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{name}</div>
            <div className="text-xs text-gray-400 capitalize">{row.type} Assessment</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Class',
      key: 'classId',
      render: (classId, row) =>
        row.className || (typeof classId === 'object' ? `${classId.name} ${classId.section}` : 'Grade 10-A'),
    },
    {
      title: 'Duration',
      key: 'startDate',
      render: (_, row) => (
        <span className="text-xs text-gray-600">
          {formatDate(row.startDate)} → {formatDate(row.endDate)}
        </span>
      ),
    },
    {
      title: 'Status',
      key: 'isPublished',
      render: (isPublished) => (
        <Badge variant={isPublished ? 'published' : 'pending'}>
          {isPublished ? 'Published' : 'Draft / Active'}
        </Badge>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          {!row.isPublished && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => publishMutation.mutate(row._id || row.id)}
              isLoading={publishMutation.isPending}
            >
              <Send className="w-3.5 h-3.5 mr-1" /> Publish
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => handleOpen(row)}>
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDeleteId(row._id || row.id)}>
            <Trash2 className="w-4 h-4 text-danger-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Examinations</h1>
          <p className="text-sm text-gray-500">Schedule assessments, terms, and publish report memos.</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpen()}>
          Schedule Exam
        </Button>
      </div>

      <Table columns={columns} data={exams} isLoading={isLoading} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingExam ? 'Edit Exam' : 'Schedule New Exam'}
        footer={
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(formData)}
            >
              {editingExam ? 'Save Changes' : 'Schedule Exam'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Exam Name"
            placeholder="e.g. Mid-Term Examination 2024"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Exam Type"
              options={EXAM_TYPES}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            />
            <Select
              label="Assigned Class"
              options={classOptions.length > 0 ? classOptions : [{ value: 'c1', label: 'Grade 10-A' }]}
              value={formData.classId}
              onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          <Select
            label="Academic Year"
            options={ACADEMIC_YEARS.map((y) => ({ value: y, label: y }))}
            value={formData.academicYear}
            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            required
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Remove Exam"
        message="Are you sure you want to remove this examination?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
