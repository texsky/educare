import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Modal from '@/components/common/Modal'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import { getSubjects, createSubject, updateSubject, deleteSubject } from '@/api/subjects.api'
import { getClasses } from '@/api/classes.api'

export default function Subjects() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    classId: '',
    maxMarks: 100,
    passingMarks: 40,
  })

  const { data: response, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => getSubjects(),
  })

  const { data: classesData } = useQuery({
    queryKey: ['classes-for-subjects'],
    queryFn: () => getClasses(),
  })

  const subjects = response?.data?.subjects || response?.data || []
  const classes = classesData?.data?.classes || classesData?.data || []
  const classOptions = classes.map((c) => ({
    value: c._id || c.id,
    label: `${c.name} - ${c.section}`,
  }))

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingSubject ? updateSubject(editingSubject._id || editingSubject.id, data) : createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      toast.success(editingSubject ? 'Subject updated' : 'Subject created')
      handleClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] })
      toast.success('Subject deleted')
      setDeleteId(null)
    },
  })

  const handleOpen = (s = null) => {
    setEditingSubject(s)
    if (s) {
      setFormData({
        name: s.name || '',
        code: s.code || '',
        classId: s.classId?._id || s.classId || '',
        maxMarks: s.maxMarks || 100,
        passingMarks: s.passingMarks || 40,
      })
    } else {
      setFormData({
        name: '',
        code: '',
        classId: classOptions[0]?.value || '',
        maxMarks: 100,
        passingMarks: 40,
      })
    }
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingSubject(null)
  }

  const columns = [
    {
      title: 'Subject Name',
      key: 'name',
      render: (name, row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">{name}</div>
            <div className="text-xs text-gray-400">Code: {row.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Class',
      key: 'classId',
      render: (classId, row) =>
        row.className || (typeof classId === 'object' ? `${classId.name} ${classId.section}` : 'All Grades'),
    },
    {
      title: 'Grading Specs',
      key: 'maxMarks',
      render: (max, row) => (
        <span className="text-xs text-gray-600">
          Max: <span className="font-semibold text-gray-900">{max}</span> / Pass:{' '}
          <span className="font-semibold text-gray-900">{row.passingMarks}</span>
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
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
          <h1 className="text-2xl font-bold text-gray-900">Curriculum Subjects</h1>
          <p className="text-sm text-gray-500">Configure subjects, marks thresholds, and codes.</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpen()}>
          Add Subject
        </Button>
      </div>

      <Table columns={columns} data={subjects} isLoading={isLoading} />

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}
        footer={
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(formData)}
            >
              {editingSubject ? 'Save Changes' : 'Save Subject'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Subject Name"
              placeholder="e.g. Science"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="Subject Code"
              placeholder="e.g. SCI-101"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>
          <Select
            label="Assigned Class"
            options={classOptions.length > 0 ? classOptions : [{ value: 'c1', label: 'Grade 10-A' }]}
            value={formData.classId}
            onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Maximum Marks"
              type="number"
              value={formData.maxMarks}
              onChange={(e) => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
              required
            />
            <Input
              label="Passing Marks"
              type="number"
              value={formData.passingMarks}
              onChange={(e) => setFormData({ ...formData, passingMarks: Number(e.target.value) })}
              required
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Subject"
        message="Are you sure you want to delete this subject curriculum entry?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
