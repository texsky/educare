import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Save, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/common/Button'
import Select from '@/components/common/Select'
import { getClasses } from '@/api/classes.api'
import { getSubjects } from '@/api/subjects.api'
import { getExams } from '@/api/exams.api'
import { getStudentsByClass } from '@/api/students.api'
import { manualEntryMarks } from '@/api/marks.api'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function ManualMarks() {
  const queryClient = useQueryClient()
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedExam, setSelectedExam] = useState('')
  const [marksState, setMarksState] = useState({})

  const { data: classesData } = useQuery({ queryKey: ['classes-list'], queryFn: getClasses })
  const { data: subjectsData } = useQuery({ queryKey: ['subjects-list'], queryFn: getSubjects })
  const { data: examsData } = useQuery({ queryKey: ['exams-list'], queryFn: getExams })

  const classList = classesData?.data?.classes || classesData?.data || []
  const subjectList = subjectsData?.data?.subjects || subjectsData?.data || []
  const examList = examsData?.data?.exams || examsData?.data || []

  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students-class', selectedClass],
    queryFn: () => getStudentsByClass(selectedClass),
    enabled: !!selectedClass,
  })

  const students = studentsData?.data || []
  const subjectsForClass = subjectList.filter((subject) =>
    (subject.classId?._id || subject.classId) === selectedClass
  )
  const examsForClass = examList.filter((exam) =>
    (exam.classId?._id || exam.classId) === selectedClass
  )

  const handleScoreInput = (studentId, value) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        marksObtained: value === '' ? '' : Number(value),
      },
    }))
  }

  const handleAbsentToggle = (studentId) => {
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        isAbsent: !prev[studentId]?.isAbsent,
      },
    }))
  }

  const saveMutation = useMutation({
    mutationFn: (data) => manualEntryMarks(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marks'] })
      toast.success('Marks saved successfully!')
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save marks')
    },
  })

  const handleSave = () => {
    if (!selectedClass || !selectedSubject || !selectedExam) {
      toast.error('Please specify Class, Subject, and Exam first')
      return
    }

    const entries = students.map((std) => {
      const entry = marksState[std._id || std.id] || {}
      return {
        studentId: std._id || std.id,
        examId: selectedExam,
        subjectId: selectedSubject,
        marksObtained: entry.marksObtained ?? 0,
        isAbsent: Boolean(entry.isAbsent),
      }
    })

    saveMutation.mutate({
      entries,
    })
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manual Marks Entry</h1>
          <p className="text-sm text-gray-500">Record scores for individual students by class and subject.</p>
        </div>
        <Button
          icon={Save}
          onClick={handleSave}
          disabled={!selectedClass || !selectedSubject || !selectedExam}
          isLoading={saveMutation.isPending}
        >
          Save All Marks
        </Button>
      </div>

      {/* Selectors */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Class / Section"
            options={classList.map((c) => ({
              value: c._id || c.id,
              label: `${c.name} - ${c.section}`,
            }))}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            required
          />
          <Select
            label="Subject"
            options={subjectsForClass.map((s) => ({
              value: s._id || s.id,
              label: s.name,
            }))}
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            required
          />
          <Select
            label="Exam Term"
            options={examsForClass.map((ex) => ({
              value: ex._id || ex.id,
              label: ex.name,
            }))}
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoadingStudents ? (
          <div className="py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-500 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 text-left">Roll No</th>
                <th className="px-6 py-3.5 text-left">Admission No</th>
                <th className="px-6 py-3.5 text-left">Student Name</th>
                <th className="px-6 py-3.5 text-left">Marks (Max 100)</th>
                <th className="px-6 py-3.5 text-center">Absent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {students.map((std) => {
                const sid = std._id || std.id
                const entry = marksState[sid] || {}
                const isAbsent = entry.isAbsent
                return (
                  <tr key={sid} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3.5 font-mono text-gray-600 font-medium">#{std.rollNo}</td>
                    <td className="px-6 py-3.5 text-gray-500">{std.admissionNo}</td>
                    <td className="px-6 py-3.5 font-semibold text-gray-900">
                      {std.firstName} {std.lastName}
                    </td>
                    <td className="px-6 py-3.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isAbsent}
                        value={entry.marksObtained ?? ''}
                        onChange={(e) => handleScoreInput(sid, e.target.value)}
                        placeholder="0"
                        className={`w-28 px-3 py-1.5 border rounded-lg text-sm font-semibold transition-colors ${
                          isAbsent
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            : 'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500'
                        }`}
                      />
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(isAbsent)}
                        onChange={() => handleAbsentToggle(sid)}
                        className="rounded text-danger-600 focus:ring-danger-500 w-4 h-4 cursor-pointer"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
