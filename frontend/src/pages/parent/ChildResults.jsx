import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Select from '@/components/common/Select'
import { getMemos, downloadMemo } from '@/api/memo.api'
import { getMyParent } from '@/api/parents.api'
import { formatDate } from '@/utils/formatters'

export default function ChildResults() {
  const [selectedChild, setSelectedChild] = useState('')
  const { data: parentResponse, isLoading: isLoadingParent, isError: parentError } = useQuery({
    queryKey: ['my-parent'],
    queryFn: getMyParent,
  })
  const children = parentResponse?.data?.studentIds || []
  const selectedChildId = selectedChild || children[0]?._id || ''
  const childrenOptions = children.map((child) => ({
    value: child._id,
    label: `${child.firstName} ${child.lastName} (${child.classId?.name || 'Class'}-${child.section})`,
  }))

  const { data: response, isLoading } = useQuery({
    queryKey: ['child-results', selectedChildId],
    queryFn: () => getMemos({ studentId: selectedChildId }),
    enabled: Boolean(selectedChildId),
  })

  const results = response?.data || []

  const handleDownload = async (id) => {
    try {
      toast.loading('Downloading memo PDF...')
      const blob = await downloadMemo(id)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Child_Memo_${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.dismiss()
      toast.success('Downloaded memo')
    } catch (e) {
      toast.dismiss()
      toast.error('Failed to download memo PDF')
    }
  }

  const columns = [
    {
      title: 'Exam Term',
      key: 'exam',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.examId?.name || 'Examination'}</div>
          <div className="text-xs text-gray-400">Published: {formatDate(row.publishedAt)}</div>
        </div>
      ),
    },
    {
      title: 'Total Marks',
      key: 'totalMarksObtained',
      render: (m) => <span className="font-semibold text-gray-900">{m}</span>,
    },
    {
      title: 'Percentage',
      key: 'percentage',
      render: (p) => <span className="font-bold text-gray-900">{p}%</span>,
    },
    {
      title: 'Grade',
      key: 'grade',
      render: (g) => <Badge variant="approved">{g}</Badge>,
    },
    {
      title: 'Class Rank',
      key: 'rank',
      render: (r) => (
        <span className="text-sm font-semibold text-emerald-700">Rank #{r || '—'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/parent/memo/${row._id || row.id}`}>
            <Button size="sm" variant="ghost">
              <Eye className="w-4 h-4 mr-1 text-gray-600" /> View
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDownload(row._id || row.id)}
            disabled={!row.pdfPath}
            title={row.pdfPath ? 'Download memo PDF' : 'PDF not available'}
          >
            <Download className="w-4 h-4 text-gray-600" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Children Examination Results</h1>
          <p className="text-sm text-gray-500">Track and review grade memos across all terms.</p>
        </div>

        <div className="w-64">
          <Select
            options={childrenOptions}
            value={selectedChildId}
            onChange={(e) => setSelectedChild(e.target.value)}
            placeholder={null}
          />
        </div>
      </div>

      {parentError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load your linked students.
        </div>
      ) : (
        <Table columns={columns} data={results} isLoading={isLoadingParent || isLoading} />
      )}
    </div>
  )
}
