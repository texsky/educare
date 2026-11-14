import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/common/Button'
import Badge from '@/components/common/Badge'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { getMemo, downloadMemo } from '@/api/memo.api'

export default function ParentViewMemo() {
  const { memoId } = useParams()

  const { data: response, isLoading, isError, error } = useQuery({
    queryKey: ['memo', memoId],
    queryFn: () => getMemo(memoId),
  })

  const memo = response?.data

  const handleDownload = async () => {
    if (!memo?.pdfPath) return
    try {
      toast.loading('Downloading memo PDF...')
      const blob = await downloadMemo(memoId)
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Memo_${memo.studentId?.admissionNo || memoId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.dismiss()
      toast.success('Downloaded memo PDF')
    } catch (e) {
      toast.dismiss()
      toast.error('Failed to download memo PDF')
    }
  }

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />
  if (isError || !memo) {
    return (
      <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error?.response?.data?.message || 'Memo not found.'}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/parent/results"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Child Results
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
            Print
          </Button>
          <Button icon={Download} onClick={handleDownload} disabled={!memo.pdfPath}>
            Download PDF
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 sm:p-12 print:border-none print:shadow-none">
        <div className="text-center pb-6 border-b-2 border-primary-600">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-tight">
            {import.meta.env.VITE_SCHOOL_NAME || 'EduCare Solutions'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {import.meta.env.VITE_SCHOOL_ADDRESS || 'School Progress Report'}
          </p>
          <div className="mt-3 inline-block bg-primary-50 text-primary-700 px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
            Official Marks Memo & Progress Report
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-gray-200 text-xs">
          <div>
            <span className="text-gray-400 block uppercase font-medium">Student Name</span>
            <span className="font-semibold text-gray-800 text-sm">
              {memo.studentId?.firstName} {memo.studentId?.lastName}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-medium">Admission No</span>
            <span className="font-mono font-medium text-gray-800 text-sm">
              {memo.studentId?.admissionNo}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-medium">Examination</span>
            <span className="font-semibold text-gray-800 text-sm">
              {memo.examId?.name || 'Term Exam'}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-medium">Academic Year</span>
            <span className="font-medium text-gray-800 text-sm">            {memo.examId?.academicYear || memo.academicYear}</span>
          </div>
        </div>

        <div className="mt-6 overflow-hidden border border-gray-200 rounded-xl">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-600 uppercase">
              <tr>
                <th className="py-3 px-4 text-left">Subject</th>
                <th className="py-3 px-4 text-center">Max Marks</th>
                <th className="py-3 px-4 text-center">Pass Marks</th>
                <th className="py-3 px-4 text-center">Marks Obtained</th>
                <th className="py-3 px-4 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {memo.subjectWise?.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{item.subjectName}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{item.maxMarks}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{item.passingMarks}</td>
                  <td className="py-3 px-4 text-center font-bold text-gray-900">{item.marksObtained}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant={item.marksObtained >= item.passingMarks ? 'success' : 'danger'}>
                      {item.grade}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl text-center">
          <div>
            <span className="text-xs text-gray-500 uppercase">Total Score</span>
            <p className="text-lg font-bold text-gray-900">
              {memo.totalMarksObtained} / {memo.totalMaxMarks}
            </p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Percentage</span>
            <p className="text-lg font-bold text-primary-600">{memo.percentage}%</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Final Grade</span>
            <p className="text-lg font-bold text-green-600">{memo.grade}</p>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase">Class Rank</span>
            <p className="text-lg font-bold text-amber-600">#{memo.rank}</p>
          </div>
        </div>

        {memo.remarks && (
          <div className="mt-6 p-4 border border-blue-100 bg-blue-50/50 rounded-xl">
            <span className="text-xs font-semibold uppercase text-blue-800 block mb-1">
              Teacher's Remarks
            </span>
            <p className="text-sm text-gray-700 italic">"{memo.remarks}"</p>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-gray-200 flex justify-between items-end text-xs text-gray-500">
          <div className="text-center">
            <div className="w-36 border-b border-gray-400 mb-1"></div>
            <span>Class Teacher</span>
          </div>
          <div className="text-center">
            <div className="w-36 border-b border-gray-400 mb-1"></div>
            <span>Principal's Signature</span>
          </div>
        </div>
      </div>
    </div>
  )
}
