import React from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Download } from 'lucide-react'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import { getMemos, downloadMemo } from '@/api/memo.api'
import toast from 'react-hot-toast'
import { formatDate } from '@/utils/formatters'

export default function MyResults() {
  const { data: response, isLoading } = useQuery({
    queryKey: ['my-results'],
    queryFn: () => getMemos(),
  })

  const results = response?.data || []

  const handleDownload = async (id) => {
    try {
      toast.loading('Downloading memo PDF...')
      const blob = await downloadMemo(id)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-memo-${id}.pdf`)
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
      title: 'Examination',
      key: 'exam',
      render: (_, row) => (
        <div>
          <div className="font-semibold text-gray-900">{row.examId?.name || 'Examination'}</div>
          <div className="text-xs text-gray-400">Published: {formatDate(row.publishedAt)}</div>
        </div>
      ),
    },
    {
      title: 'Total Score',
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
        <span className="text-sm font-semibold text-primary-700">Rank #{r || '—'}</span>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/student/memo/${row._id || row.id}`}>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Academic Results</h1>
        <p className="text-sm text-gray-500">
          Official assessment marks, term grades, and downloadable performance memos.
        </p>
      </div>

      <Table columns={columns} data={results} isLoading={isLoading} />
    </div>
  )
}
