import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Download, Send, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import Select from '@/components/common/Select'
import { getMemos, generateMemo, downloadMemo, publishMemo } from '@/api/memo.api'
import { getClasses } from '@/api/classes.api'
import { getExams } from '@/api/exams.api'
import { formatDate } from '@/utils/formatters'

export default function ViewMemos() {
  const queryClient = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedExam, setSelectedExam] = useState('')

  const { data: classesData } = useQuery({ queryKey: ['classes-list'], queryFn: getClasses })
  const { data: examsData } = useQuery({ queryKey: ['exams-list'], queryFn: getExams })

  const classList = classesData?.data?.classes || classesData?.data || []
  const examList = examsData?.data?.exams || examsData?.data || []

  const { data: memosData, isLoading } = useQuery({
    queryKey: ['memos-list', selectedClass, selectedExam],
    queryFn: () => getMemos({ classId: selectedClass, examId: selectedExam }),
  })

  const memos = memosData?.data || []

  const handleDownload = async (memoId) => {
    try {
      toast.loading('Downloading memo PDF...')
      const blob = await downloadMemo(memoId)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `student-memo-${memoId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.dismiss()
      toast.success('Downloaded memo PDF')
    } catch (err) {
      toast.dismiss()
      toast.error('Failed to download memo PDF')
    }
  }

  const publishMutation = useMutation({
    mutationFn: (id) => publishMemo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['memos-list'] })
      toast.success('Memo published to student & parent portal')
    },
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
          <div className="text-xs text-gray-400">Roll: #{row.studentId?.rollNo}</div>
        </div>
      ),
    },
    {
      title: 'Exam',
      key: 'exam',
      render: (_, row) => row.examId?.name || 'Mid-Term Exam',
    },
    {
      title: 'Total Marks',
      key: 'totalMarksObtained',
      render: (m) => <span className="font-semibold text-gray-900">{m}</span>,
    },
    {
      title: 'Percentage / Grade',
      key: 'percentage',
      render: (pct, row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-900">{pct}%</span>
          <Badge variant="primary">{row.grade}</Badge>
        </div>
      ),
    },
    {
      title: 'Class Rank',
      key: 'rank',
      render: (r) => <span className="font-semibold text-primary-700">Rank #{r || '—'}</span>,
    },
    {
      title: 'Status',
      key: 'isPublished',
      render: (isPub) => (
        <Badge variant={isPub ? 'published' : 'pending'}>
          {isPub ? 'Published' : 'Draft'}
        </Badge>
      ),
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
            onClick={() => handleDownload(row._id || row.id)}
            title="Download PDF"
          >
            <Download className="w-4 h-4 text-gray-700" />
          </Button>
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
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Progress Memos</h1>
          <p className="text-sm text-gray-500">
            Generate, review, and download official student report cards.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Filter by Class"
            options={classList.map((c) => ({
              value: c._id || c.id,
              label: `${c.name} - ${c.section}`,
            }))}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            placeholder="All Classes"
          />
          <Select
            label="Filter by Exam"
            options={examList.map((ex) => ({
              value: ex._id || ex.id,
              label: ex.name,
            }))}
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            placeholder="All Exams"
          />
        </div>
      </div>

      <Table columns={columns} data={memos} isLoading={isLoading} />
    </div>
  )
}
