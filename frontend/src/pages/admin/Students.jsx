import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import SearchBar from '@/components/common/SearchBar'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Avatar from '@/components/common/Avatar'
import Modal from '@/components/common/Modal'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import DetailField from '@/components/common/DetailField'
import { useStudents, useDeleteStudent } from '@/hooks/useStudents'
import { getStudent } from '@/api/students.api'

export default function Students() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState(null)

  const { data, isLoading } = useStudents({ search, page, limit: 10 })
  const {
    data: studentDetailsResponse,
    isLoading: isLoadingDetails,
    isError: hasDetailsError,
  } = useQuery({
    queryKey: ['student-details', selectedStudentId],
    queryFn: () => getStudent(selectedStudentId),
    enabled: Boolean(selectedStudentId),
  })
  const deleteMutation = useDeleteStudent()

  const students = data?.students || data || []
  const totalPages = data?.totalPages || 1
  const totalItems = data?.total || students.length
  const selectedStudent = studentDetailsResponse?.data

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => setDeleteId(null),
      })
    }
  }

  const columns = [
    {
      title: 'Student',
      key: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar
            src={row.photo}
            name={`${row.firstName || ''} ${row.lastName || ''}`}
            size="sm"
          />
          <div>
            <div className="font-medium text-gray-900">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-xs text-gray-400">Roll: #{row.rollNo || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Admission No',
      key: 'admissionNo',
    },
    {
      title: 'Class',
      key: 'classId',
      render: (classId, row) => row.className || (typeof classId === 'object' ? `${classId.name} ${classId.section}` : 'Grade 10-A'),
    },
    {
      title: 'Gender',
      key: 'gender',
      render: (gender) => <span className="capitalize">{gender || '—'}</span>,
    },
    {
      title: 'Parent / Contact',
      key: 'phone',
      render: (phone, row) => (
        <div>
          <div className="text-sm">{phone || row.parentId?.phone || '—'}</div>
          <div className="text-xs text-gray-400">{row.email || row.userId?.email || '—'}</div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate(`/admin/students/${row._id || row.id}/edit`)}
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteId(row._id || row.id)}
          >
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
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500">Manage student enrollment, records, and biodata.</p>
        </div>
        <Link to="/admin/students/new">
          <Button icon={Plus}>Add Student</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          placeholder="Search by student name or admission number..."
          className="max-w-md w-full"
        />
      </div>

      <Table
        columns={columns}
        data={students}
        isLoading={isLoading}
        onRowClick={(student) => setSelectedStudentId(student._id || student.id)}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          pageSize: 10,
          onPageChange: setPage,
        }}
      />

      <Modal
        isOpen={Boolean(selectedStudentId)}
        onClose={() => setSelectedStudentId(null)}
        title={selectedStudent ? `${selectedStudent.firstName} ${selectedStudent.lastName}` : 'Student Details'}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => setSelectedStudentId(null)}>
            Close
          </Button>
        }
      >
        {isLoadingDetails ? (
          <LoadingSpinner />
        ) : hasDetailsError ? (
          <p role="alert" className="text-sm text-danger-600">Unable to load student details.</p>
        ) : selectedStudent ? (
          <div className="space-y-6">
            <section>
              <h4 className="mb-3 font-semibold text-gray-900">Student Information</h4>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Admission Number" value={selectedStudent.admissionNo} />
                <DetailField label="Roll Number" value={selectedStudent.rollNo} />
                <DetailField label="Email" value={selectedStudent.userId?.email} />
                <DetailField label="Date of Birth" value={selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString() : null} />
                <DetailField label="Gender" value={selectedStudent.gender} />
                <DetailField label="Blood Group" value={selectedStudent.bloodGroup} />
                <DetailField label="Nationality" value={selectedStudent.nationality} />
                <DetailField label="Religion" value={selectedStudent.religion} />
                <DetailField label="Academic Year" value={selectedStudent.academicYear} />
                <DetailField label="Status" value={selectedStudent.isActive ? 'Active' : 'Inactive'} />
                <DetailField
                  label="Class"
                  value={selectedStudent.classId
                    ? `${selectedStudent.classId.name} - Section ${selectedStudent.classId.section} (${selectedStudent.classId.academicYear})`
                    : null}
                />
                <DetailField
                  label="Address"
                  value={selectedStudent.address
                    ? [selectedStudent.address.street, selectedStudent.address.city, selectedStudent.address.state, selectedStudent.address.pincode, selectedStudent.address.country].filter(Boolean).join(', ')
                    : null}
                />
              </dl>
            </section>
            <section>
              <h4 className="mb-3 font-semibold text-gray-900">Parent / Guardian</h4>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Name" value={selectedStudent.parentId ? `${selectedStudent.parentId.firstName} ${selectedStudent.parentId.lastName}` : null} />
                <DetailField label="Phone" value={selectedStudent.parentId?.phone} />
                <DetailField label="Email" value={selectedStudent.parentId?.userId?.email} />
              </dl>
            </section>
            <section>
              <h4 className="mb-3 font-semibold text-gray-900">Emergency Contact</h4>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Name" value={selectedStudent.emergencyContact?.name} />
                <DetailField label="Phone" value={selectedStudent.emergencyContact?.phone} />
                <DetailField label="Relationship" value={selectedStudent.emergencyContact?.relation} />
                <DetailField label="Medical Notes" value={selectedStudent.medicalNotes} />
              </dl>
            </section>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Student Record"
        message="Are you sure you want to delete this student? All associated marks and records may also be affected."
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
