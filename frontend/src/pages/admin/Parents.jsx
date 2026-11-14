import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2, Mail, Phone, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import SearchBar from '@/components/common/SearchBar'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import Modal from '@/components/common/Modal'
import Input from '@/components/common/Input'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import DetailField from '@/components/common/DetailField'
import { getParent, getParents, createParent, updateParent, deleteParent } from '@/api/parents.api'

export default function Parents() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingParent, setEditingParent] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [selectedParentId, setSelectedParentId] = useState(null)
  const [linkedStudentSearch, setLinkedStudentSearch] = useState('')

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    occupation: '',
  })

  const { data: response, isLoading } = useQuery({
    queryKey: ['parents', search, page],
    queryFn: () => getParents({ search, page, limit: 20 }),
  })
  const {
    data: parentDetailsResponse,
    isLoading: isLoadingDetails,
    isError: hasDetailsError,
  } = useQuery({
    queryKey: ['parent-details', selectedParentId],
    queryFn: () => getParent(selectedParentId),
    enabled: Boolean(selectedParentId),
  })

  const parents = response?.data?.parents || response?.data || []
  const totalPages = response?.meta?.totalPages || 1
  const totalItems = response?.meta?.total ?? parents.length
  const selectedParent = parentDetailsResponse?.data
  const linkedStudents = selectedParent?.studentIds || []
  const filteredLinkedStudents = linkedStudents.filter((student) =>
    [
      student.firstName,
      student.lastName,
      student.admissionNo,
      student.classId?.name,
      student.classId?.section,
    ].some((value) => String(value ?? '').toLowerCase().includes(linkedStudentSearch.trim().toLowerCase()))
  )

  const saveMutation = useMutation({
    mutationFn: (data) =>
      editingParent ? updateParent(editingParent._id || editingParent.id, data) : createParent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      toast.success(editingParent ? 'Parent updated' : 'Parent added')
      handleCloseModal()
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Operation failed')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteParent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parents'] })
      toast.success('Parent removed')
      setDeleteId(null)
    },
  })

  const handleOpenModal = (p = null) => {
    setEditingParent(p)
    if (p) {
      setFormData({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email || '',
        phone: p.phone || '',
        occupation: p.occupation || '',
      })
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        occupation: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingParent(null)
  }

  const columns = [
    {
      title: 'Parent Name',
      key: 'name',
      render: (_, row) => (
        <div className="font-medium text-gray-900">
          {row.firstName} {row.lastName}
        </div>
      ),
    },
    {
      title: 'Contact Details',
      key: 'contact',
      render: (_, row) => (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-gray-700">
            <Mail className="w-3.5 h-3.5 text-gray-400" /> {row.email || row.userId?.email || '—'}
          </div>
          <div className="flex items-center gap-1.5 text-gray-500">
            <Phone className="w-3.5 h-3.5 text-gray-400" /> {row.phone}
          </div>
        </div>
      ),
    },
    {
      title: 'Occupation',
      key: 'occupation',
      render: (occ) => occ || '—',
    },
    {
      title: 'Associated Children',
      key: 'studentIds',
      render: (students) => (
        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded-full">
          <Users className="w-3 h-3 text-gray-500" />
          {students?.length ?? 0} Student(s)
        </span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          <Button size="sm" variant="ghost" onClick={() => handleOpenModal(row)}>
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
          <h1 className="text-2xl font-bold text-gray-900">Parents & Guardians</h1>
          <p className="text-sm text-gray-500">Manage parent accounts and family associations.</p>
        </div>
        <Button icon={Plus} onClick={() => handleOpenModal()}>
          Add Parent
        </Button>
      </div>

      <SearchBar
        value={search}
        onChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        placeholder="Search parents by name or email..."
        className="max-w-md w-full"
      />

      <Table
        columns={columns}
        data={parents}
        isLoading={isLoading}
        onRowClick={(parent) => {
          setLinkedStudentSearch('')
          setSelectedParentId(parent._id || parent.id)
        }}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          pageSize: 20,
          onPageChange: setPage,
        }}
      />

      <Modal
        isOpen={Boolean(selectedParentId)}
        onClose={() => {
          setSelectedParentId(null)
          setLinkedStudentSearch('')
        }}
        title={selectedParent ? `${selectedParent.firstName} ${selectedParent.lastName}` : 'Parent Details'}
        size="lg"
        footer={
          <Button variant="secondary" onClick={() => {
            setSelectedParentId(null)
            setLinkedStudentSearch('')
          }}>
            Close
          </Button>
        }
      >
        {isLoadingDetails ? (
          <LoadingSpinner />
        ) : hasDetailsError ? (
          <p role="alert" className="text-sm text-danger-600">Unable to load parent details.</p>
        ) : selectedParent ? (
          <div className="space-y-6">
            <section>
              <h4 className="mb-3 font-semibold text-gray-900">Parent / Guardian Information</h4>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField label="Email" value={selectedParent.userId?.email} />
                <DetailField label="Phone" value={selectedParent.phone} />
                <DetailField label="Alternate Phone" value={selectedParent.alternatePhone} />
                <DetailField label="Relationship" value={selectedParent.relation} />
                <DetailField label="Gender" value={selectedParent.gender} />
                <DetailField label="Occupation" value={selectedParent.occupation} />
                <DetailField label="Status" value={selectedParent.isActive ? 'Active' : 'Inactive'} />
                <DetailField
                  label="Address"
                  value={selectedParent.address
                    ? [selectedParent.address.street, selectedParent.address.city, selectedParent.address.state, selectedParent.address.pincode, selectedParent.address.country].filter(Boolean).join(', ')
                    : null}
                />
              </dl>
            </section>
            <section>
              <h4 className="mb-3 font-semibold text-gray-900">
                Linked Students ({filteredLinkedStudents.length}
                {linkedStudentSearch.trim() ? ` of ${linkedStudents.length}` : ''})
              </h4>
              {linkedStudents.length ? (
                <div className="space-y-3">
                  <SearchBar
                    value={linkedStudentSearch}
                    onChange={setLinkedStudentSearch}
                    placeholder="Search linked students by name, admission no. or class..."
                  />
                  {filteredLinkedStudents.length ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Student</th>
                            <th className="px-4 py-3">Admission No.</th>
                            <th className="px-4 py-3">Class</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {filteredLinkedStudents.map((student) => (
                            <tr key={student._id}>
                              <td className="px-4 py-3">{student.firstName} {student.lastName}</td>
                              <td className="px-4 py-3">{student.admissionNo || '—'}</td>
                              <td className="px-4 py-3">
                                {student.classId ? `${student.classId.name} - ${student.classId.section}` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-sm text-gray-500">No students match this search.</p>}
                </div>
              ) : <p className="text-sm text-gray-500">No students linked to this account.</p>}
            </section>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingParent ? 'Edit Parent' : 'Add New Parent'}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(formData)}
            >
              {editingParent ? 'Save Changes' : 'Create Account'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            required
          />
          <Input
            label="Occupation"
            value={formData.occupation}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Parent Account"
        message="Are you sure you want to delete this parent account?"
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
