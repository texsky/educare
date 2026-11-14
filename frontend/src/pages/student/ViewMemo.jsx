import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/common/Button'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { getMemo, downloadMemo } from '@/api/memo.api'

export default function StudentViewMemo() {
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
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/student/results"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Results
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

      {/* Official Memo Report Card View */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-8 sm:p-12 print:border-none print:shadow-none">
        {/* School Crest / Title */}
        <div className="text-center pb-6 border-b-2 border-primary-600">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 uppercase tracking-tight">
            {import.meta.env.VITE_SCHOOL_NAME || 'EduCare Solutions'}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {import.meta.env.VITE_SCHOOL_ADDRESS || 'School Progress Report'}
          </p>
          <div className="mt-3 inline-block bg-primary-50 text-primary-800 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-primary-200">
            Official Progress Memo & Grade Report
          </div>
        </div>

        {/* Exam & Student Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-gray-200 text-xs">
          <div>
            <p className="text-gray-400 font-medium">Student Name</p>
            <p className="font-bold text-gray-900 text-sm mt-0.5">
              {memo.studentId?.firstName} {memo.studentId?.lastName}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">Admission No</p>
            <p className="font-bold text-gray-900 text-sm mt-0.5">
              {memo.studentId?.admissionNo || 'ADM-001'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">Class & Roll</p>
            <p className="font-bold text-gray-900 text-sm mt-0.5">
              {memo.studentId?.classId?.name || '—'} - {memo.studentId?.classId?.section || memo.studentId?.section || '—'} (Roll #{memo.studentId?.rollNo || '—'})
            </p>
          </div>
          <div>
            <p className="text-gray-400 font-medium">Examination</p>
            <p className="font-bold text-gray-900 text-sm mt-0.5">
              {memo.examId?.name} · {memo.examId?.academicYear}
            </p>
          </div>
        </div>

        {/* Marks Table */}
        <div className="py-6">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase font-bold text-gray-500 tracking-wider">
                <th className="py-3 px-2">Subject</th>
                <th className="py-3 px-2 text-center">Max Marks</th>
                <th className="py-3 px-2 text-center">Passing Marks</th>
                <th className="py-3 px-2 text-center">Marks Obtained</th>
                <th className="py-3 px-2 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {memo.subjectWise?.map((m, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="py-3 px-2 font-medium text-gray-900">{m.subjectName}</td>
                  <td className="py-3 px-2 text-center text-gray-600">{m.maxMarks}</td>
                  <td className="py-3 px-2 text-center text-gray-600">{m.passingMarks}</td>
                  <td className="py-3 px-2 text-center font-bold text-gray-900">{m.marksObtained}</td>
                  <td className="py-3 px-2 text-center">
                    <span className="font-bold text-primary-600">{m.grade}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Performance Summary Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Total Score</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">
              {memo.totalMarksObtained} / {memo.totalMaxMarks}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Percentage</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">
              {memo.percentage}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Overall Grade</p>
            <p className="text-xl font-extrabold text-primary-600 mt-0.5">
              {memo.grade}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Class Rank</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
              #{memo.rank}
            </p>
          </div>
        </div>

        {/* Remarks & Signatures */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs">
            <span className="font-bold text-gray-700 uppercase tracking-wider">Teacher Remarks: </span>
            <span className="italic text-gray-600">
              {memo.result === 'pass' ? 'Successful completion of this assessment.' : 'Review the subject results with your teacher.'}
            </span>
          </div>

          <div className="mt-12 flex justify-between items-end text-xs text-gray-500 px-4">
            <div className="text-center">
              <div className="w-36 border-b border-gray-400 mb-1" />
              <p>Class Teacher</p>
            </div>
            <div className="text-center">
              <div className="w-36 border-b border-gray-400 mb-1" />
              <p>Principal / Headmaster</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
