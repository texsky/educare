import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Mail, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import SearchBar from '@/components/common/SearchBar'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Avatar from '@/components/common/Avatar'
import Modal from '@/components/common/Modal'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import DetailField from '@/components/common/DetailField'
import { getTeacher, getTeachers, deleteTeacher } from '@/api/teachers.api'

export default function Teachers() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [selectedTeacherId, setSelectedTeacherId] = useState(null)
  const [subjectSearch, setSubjectSearch] = useState('')
  const [assignedClassSearch, setAssignedClassSearch] = useState('')

  const { data: response, isLoading } = useQuery({
    queryKey: ['teachers', search],
    queryFn: () => getTeachers({ search }),
  })
  const {
    data: teacherDetailsResponse,
    isLoading: isLoadingDetails,
    isError: hasDetailsError,
  } = useQuery({
    queryKey: ['teacher-details', selectedTeacherId],
    queryFn: () => getTeacher(selectedTeacherId),
    enabled: Boolean(selectedTeacherId),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] })
      toast.success('Teacher removed successfully')
      setDeleteId(null)
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to remove teacher')
    },
  })

  const teachers = response?.data?.teachers || response?.data || []
  const selectedTeacher = teacherDetailsResponse?.data
  const teacherSubjects = selectedTeacher?.subjects || []
  const teacherClasses = selectedTeacher?.classes || []
  const filteredTeacherSubjects = teacherSubjects.filter((subject) =>
    `${subject.name || ''} ${subject.code || ''}`.toLowerCase().includes(subjectSearch.trim().toLowerCase())
  )
  const filteredTeacherClasses = teacherClasses.filter((classroom) =>
    `${classroom.name || ''} ${classroom.section || ''} ${classroom.academicYear || ''}`
      .toLowerCase()
      .includes(assignedClassSearch.trim().toLowerCase())
  )

  const columns = [
    {
      title: 'Teacher',
      key: 'name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${row.firstName || ''} ${row.lastName || ''}`} size="sm" />
          <div>
            <div className="font-medium text-gray-900">
              {row.firstName} {row.lastName}
            </div>
            <div className="text-xs text-gray-400">ID: {row.employeeId || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Qualifications',
      key: 'qualifications',
      render: (qualifications) => {
        if (typeof qualifications === 'string') return qualifications || '—'
        if (!Array.isArray(qualifications)) return '—'

        return qualifications
          .map((qualification) => {
            if (typeof qualification === 'string') return qualification
            if (!qualification || typeof qualification !== 'object') return ''

            const { degree, institution, year } = qualification
            const details = [degree, institution].filter(Boolean).join(', ')
            return year ? `${details} (${year})` : details
          })
          .filter(Boolean)
          .join('; ') || '—'
      },
    },
    {
      title: 'Contact',
      key: 'email',
      render: (_, row) => (
        <div className="text-xs space-y-0.5">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Mail className="w-3.5 h-3.5 text-gray-400" /> {row.email}
          </div>
          {row.phone && (
            <div className="flex items-center gap-1.5 text-gray-500">
              <Phone className="w-3.5 h-3.5 text-gray-400" /> {row.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Assigned Subjects',
      key: 'subjects',
      render: (subjects) => {
        if (!subjects || subjects.length === 0) return <span className="text-xs text-gray-400">None</span>
        return (
          <div className="flex flex-wrap gap-1">
            {subjects.map((s, idx) => (
              <span key={idx} className="bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5 rounded-md font-medium">
                {typeof s === 'object' ? s.name : s}
              </span>
            ))}
          </div>
        )
      },
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
            onClick={() => navigate(`/admin/teachers/${row._id || row.id}/edit`)}
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
          <h1 className="text-2xl font-bold text-gray-900">Faculty & Teachers</h1>
          <p className="text-sm text-gray-500">Manage teaching staff, assignments, and subjects.</p>
        </div>
        <Link to="/admin/teachers/new">
          <Button icon={Plus}>Add Teacher</Button>
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by faculty name or employee ID..."
          className="max-w-md w-full"
        />
      </div>

      <Table
        columns={columns}
        data={teachers}
        isLoading={isLoading}
        onRowClick={(teacher) => setSelectedTeacherId(teacher._id || teacher.id)}
      />

      <Modal
        isOpen={Boolean(selectedTeacherId)}
        onClose={() => {
          setSelectedTeacherId(null)
          setSubjectSearch('')
          setAssignedClassSearch('')
        }}
        title={selectedTeacher ? `${selectedTeacher.firstName} ${selectedTeacher.lastName}` : 'Teacher Details'}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => {
            setSelectedTeacherId(null)
            setSubjectSearch('')
            setAssignedClassSearch('')
          }}>
            Close
          </Button>
        }
      >
        {isLoadingDetails ? (
          <LoadingSpinner />
        ) : hasDetailsError ? (
          <p role="alert" className="text-sm text-danger-600">Unable to load teacher details.</p>
        ) : selectedTeacher ? (
          <div className="space-y-6">
            <section>
              <h4 className="mb-3 font-semibold text-gray-900">Personal & Employment</h4>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Employee ID" value={selectedTeacher.employeeId} />
                <DetailField label="Email" value={selectedTeacher.email || selectedTeacher.userId?.email} />
                <DetailField label="Phone" value={selectedTeacher.phone} />
                <DetailField label="Designation" value={selectedTeacher.designation} />
                <DetailField label="Gender" value={selectedTeacher.gender} />
                <DetailField label="Date of Birth" value={selectedTeacher.dateOfBirth ? new Date(selectedTeacher.dateOfBirth).toLocaleDateString() : null} />
                <DetailField label="Joining Date" value={selectedTeacher.joiningDate ? new Date(selectedTeacher.joiningDate).toLocaleDateString() : null} />
                <DetailField label="Experience" value={selectedTeacher.experience != null ? `${selectedTeacher.experience} years` : null} />
                <DetailField label="Specialization" value={selectedTeacher.specialization} />
                <DetailField label="Status" value={selectedTeacher.isActive ? 'Active' : 'Inactive'} />
                <DetailField
                  label="Address"
                  value={selectedTeacher.address
                    ? [selectedTeacher.address.street, selectedTeacher.address.city, selectedTeacher.address.state, selectedTeacher.address.pincode, selectedTeacher.address.country].filter(Boolean).join(', ')
                    : null}
                />
              </dl>
            </section>
            <section>
              <h4 className="mb-3 font-semibold text-gray-900">Qualifications</h4>
              {selectedTeacher.qualifications?.length ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                  {selectedTeacher.qualifications.map((qualification, index) => (
                    <li key={`${qualification.degree}-${index}`}>
                      {[qualification.degree, qualification.institution, qualification.year].filter(Boolean).join(' · ')}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-500">No qualifications recorded.</p>}
            </section>
            <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h4 className="mb-3 font-semibold text-gray-900">
                  Assigned Subjects ({filteredTeacherSubjects.length}
                  {subjectSearch.trim() ? ` of ${teacherSubjects.length}` : ''})
                </h4>
                {teacherSubjects.length ? (
                  <div className="space-y-3">
                    <SearchBar
                      value={subjectSearch}
                      onChange={setSubjectSearch}
                      placeholder="Filter subjects..."
                    />
                    {filteredTeacherSubjects.length ? (
                      <ul className="space-y-1 text-sm text-gray-700">
                        {filteredTeacherSubjects.map((subject) => (
                          <li key={subject._id}>{subject.name}{subject.code ? ` (${subject.code})` : ''}</li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-500">No subjects match this search.</p>}
                  </div>
                ) : <p className="text-sm text-gray-500">No subjects assigned.</p>}
              </div>
              <div>
                <h4 className="mb-3 font-semibold text-gray-900">
                  Assigned Classes ({filteredTeacherClasses.length}
                  {assignedClassSearch.trim() ? ` of ${teacherClasses.length}` : ''})
                </h4>
                {teacherClasses.length ? (
                  <div className="space-y-3">
                    <SearchBar
                      value={assignedClassSearch}
                      onChange={setAssignedClassSearch}
                      placeholder="Filter classes..."
                    />
                    {filteredTeacherClasses.length ? (
                      <ul className="space-y-1 text-sm text-gray-700">
                        {filteredTeacherClasses.map((classroom) => (
                          <li key={classroom._id}>
                            {classroom.name} - Section {classroom.section}
                            {classroom.academicYear ? ` (${classroom.academicYear})` : ''}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-gray-500">No classes match this search.</p>}
                  </div>
                ) : <p className="text-sm text-gray-500">No classes assigned.</p>}
              </div>
            </section>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Remove Faculty Member"
        message="Are you sure you want to remove this faculty record?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
