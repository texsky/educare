import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import SearchBar from '@/components/common/SearchBar'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Modal from '@/components/common/Modal'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import DetailField from '@/components/common/DetailField'
import { getClass, getClasses, createClass, updateClass, deleteClass } from '@/api/classes.api'
import { getTeachers } from '@/api/teachers.api'
import { SECTIONS, ACADEMIC_YEARS } from '@/utils/constants'

export default function Classes() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [classSearch, setClassSearch] = useState('')
  const [classStudentSearch, setClassStudentSearch] = useState('')

  const [formData, setFormData] = useState({
    name: '',
    section: 'A',
    academicYear: ACADEMIC_YEARS[1] || '2024/2025',
    classTeacherId: '',
  })

  const { data: response, isLoading } = useQuery({
    queryKey: ['classes', classSearch],
    queryFn: () => getClasses({ search: classSearch, limit: 100 }),
  })
  const {
    data: classDetailsResponse,
    isLoading: isLoadingDetails,
    isError: hasDetailsError,
  } = useQuery({
    queryKey: ['class-details', selectedClassId],
    queryFn: () => getClass(selectedClassId),
    enabled: Boolean(selectedClassId),
  })

  const { data: teachersData } = useQuery({
    queryKey: ['teachers-select'],
    queryFn: () => getTeachers({ limit: 100 }),
  })

  const classes = response?.data?.classes || response?.data || []
  const selectedClass = classDetailsResponse?.data
  const classStudents = selectedClass?.studentIds || []
  const normalizedStudentSearch = classStudentSearch.trim().toLowerCase()
  const filteredClassStudents = classStudents.filter((student) =>
    [
      student.firstName,
      student.lastName,
      student.admissionNo,
      student.rollNo,
      student.userId?.email,
    ].some((value) => String(value ?? '').toLowerCase().includes(normalizedStudentSearch))
  )
  const teachers = teachersData?.data?.teachers || teachersData?.data || []
  const teacherOptions = teachers.map((t) => ({
    value: t._id || t.id,
    label: `${t.firstName} ${t.lastName} (${t.employeeId || 'Faculty'})`,
  }))

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingClass ? updateClass(editingClass._id || editingClass.id, data) : createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      toast.success(editingClass ? 'Class updated' : 'Class created')
      handleClose()
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] })
      toast.success('Class deleted')
      setDeleteId(null)
    },
  })

  const handleOpen = (c = null) => {
    setEditingClass(c)
    if (c) {
      setFormData({
        name: c.name || '',
        section: c.section || 'A',
        academicYear: c.academicYear || ACADEMIC_YEARS[1],
        classTeacherId: c.classTeacherId?._id || c.classTeacherId || '',
      })
    } else {
      setFormData({
        name: '',
        section: 'A',
        academicYear: ACADEMIC_YEARS[1] || '2024/2025',
        classTeacherId: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setEditingClass(null)
  }

  const closeClassDetails = () => {
    setSelectedClassId(null)
    setClassStudentSearch('')
  }

  const columns = [
    {
      title: 'Class Name',
      key: 'name',
      render: (name, row) => (
        <div className="font-semibold text-gray-900">
          {name} - Section {row.section}
        </div>
      ),
    },
    {
      title: 'Academic Year',
      key: 'academicYear',
    },
    {
      title: 'Class Teacher',
      key: 'classTeacherId',
      render: (t) => (t ? `${t.firstName || ''} ${t.lastName || ''}` : 'Not Assigned'),
    },
    {
      title: 'Students Enrolled',
      key: 'studentIds',
      render: (students) => (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
          <Users className="w-3.5 h-3.5 text-primary-600" />
          {students?.length || 0} Students
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
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
          <h1 className="text-2xl font-bold text-gray-900">Classes & Sections</h1>
          <p className="text-sm text-gray-500">Configure grade levels, streams, and class teachers.</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpen()}>
          Add Class
        </Button>
      </div>

      <SearchBar
        value={classSearch}
        onChange={setClassSearch}
        placeholder="Search classes by name, section, year, or room..."
        className="max-w-md"
      />

      <Table
        columns={columns}
        data={classes}
        isLoading={isLoading}
        onRowClick={(classroom) => {
          setClassStudentSearch('')
          setSelectedClassId(classroom._id || classroom.id)
        }}
      />

      <Modal
        isOpen={Boolean(selectedClassId)}
        onClose={closeClassDetails}
        title={selectedClass ? `${selectedClass.name} - Section ${selectedClass.section}` : 'Class Details'}
        size="xl"
        footer={
          <Button variant="secondary" onClick={closeClassDetails}>
            Close
          </Button>
        }
      >
        {isLoadingDetails ? (
          <LoadingSpinner />
        ) : hasDetailsError ? (
          <p role="alert" className="text-sm text-danger-600">Unable to load class details.</p>
        ) : selectedClass ? (
          <div className="space-y-6">
            <section>
              <h4 className="mb-3 font-semibold text-gray-900">Class Information</h4>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Academic Year" value={selectedClass.academicYear} />
                <DetailField label="Room" value={selectedClass.roomNo} />
                <DetailField label="Maximum Strength" value={selectedClass.maxStrength} />
                <DetailField label="Enrollment" value={`${selectedClass.studentIds?.length || 0} students`} />
                <DetailField label="Status" value={selectedClass.isActive ? 'Active' : 'Inactive'} />
                <DetailField
                  label="Class Teacher"
                  value={selectedClass.classTeacherId
                    ? `${selectedClass.classTeacherId.firstName} ${selectedClass.classTeacherId.lastName} (${selectedClass.classTeacherId.employeeId || 'Teacher'})`
                    : 'Not assigned'}
                />
                <DetailField label="Teacher Email" value={selectedClass.classTeacherId?.email} />
                <DetailField label="Teacher Phone" value={selectedClass.classTeacherId?.phone} />
                <DetailField
                  label="Subjects"
                  value={selectedClass.subjects?.map((subject) => subject.name).join(', ')}
                />
              </dl>
            </section>
            <section>
              <h4 className="mb-3 font-semibold text-gray-900">
                Students ({filteredClassStudents.length}
                {normalizedStudentSearch ? ` of ${classStudents.length}` : ''})
              </h4>
              {classStudents.length ? (
                <div className="space-y-3">
                  <SearchBar
                    value={classStudentSearch}
                    onChange={setClassStudentSearch}
                    placeholder="Search students by name, roll, admission no. or email..."
                  />
                  {filteredClassStudents.length ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Roll No.</th>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Admission No.</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {[...filteredClassStudents]
                            .sort((a, b) => (a.rollNo || 0) - (b.rollNo || 0))
                            .map((student) => (
                              <tr key={student._id}>
                                <td className="px-4 py-3">{student.rollNo || '—'}</td>
                                <td className="px-4 py-3 font-medium">{student.firstName} {student.lastName}</td>
                                <td className="px-4 py-3">{student.admissionNo || '—'}</td>
                                <td className="px-4 py-3">{student.userId?.email || '—'}</td>
                                <td className="px-4 py-3">{student.isActive ? 'Active' : 'Inactive'}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
                      No students match this search.
                    </p>
                  )}
                </div>
              ) : <p className="text-sm text-gray-500">No students are enrolled in this class.</p>}
            </section>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingClass ? 'Edit Class' : 'Create Class'}
        footer={
          <>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate({
                ...formData,
                classTeacherId: formData.classTeacherId || null,
              })}
            >
              {editingClass ? 'Save Changes' : 'Create Class'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Class / Grade Name"
            placeholder="e.g. Grade 10 or Class 12"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Section"
              options={SECTIONS.map((s) => ({ value: s, label: `Section ${s}` }))}
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              required
            />
            <Select
              label="Academic Year"
              options={ACADEMIC_YEARS.map((y) => ({ value: y, label: y }))}
              value={formData.academicYear}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              required
            />
          </div>
          <Select
            label="Assign Class Teacher"
            options={teacherOptions}
            placeholder="Select Teacher (Optional)"
            value={formData.classTeacherId}
            onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Class"
        message="Are you sure you want to delete this class section?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
