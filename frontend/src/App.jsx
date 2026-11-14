import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from '@/components/common/PrivateRoute'

// Auth pages
import Login from '@/pages/auth/Login'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import ResetPassword from '@/pages/auth/ResetPassword'

// Admin pages
import AdminDashboard from '@/pages/admin/Dashboard'
import Students from '@/pages/admin/Students'
import StudentForm from '@/pages/admin/StudentForm'
import Teachers from '@/pages/admin/Teachers'
import TeacherForm from '@/pages/admin/TeacherForm'
import Parents from '@/pages/admin/Parents'
import Classes from '@/pages/admin/Classes'
import Subjects from '@/pages/admin/Subjects'
import Exams from '@/pages/admin/Exams'
import AuditLogs from '@/pages/admin/AuditLogs'
import Settings from '@/pages/admin/Settings'
import AdminNotifications from '@/pages/admin/Notifications'

// Teacher pages
import TeacherDashboard from '@/pages/teacher/Dashboard'
import MyClasses from '@/pages/teacher/MyClasses'
import UploadMarks from '@/pages/teacher/UploadMarks'
import ManualMarks from '@/pages/teacher/ManualMarks'
import ReviewMarks from '@/pages/teacher/ReviewMarks'
import ViewMemos from '@/pages/teacher/ViewMemos'

// Student pages
import StudentDashboard from '@/pages/student/Dashboard'
import MyResults from '@/pages/student/MyResults'
import StudentViewMemo from '@/pages/student/ViewMemo'
import StudentProfile from '@/pages/student/Profile'

// Parent pages
import ParentDashboard from '@/pages/parent/Dashboard'
import ChildResults from '@/pages/parent/ChildResults'
import ParentViewMemo from '@/pages/parent/ViewMemo'
import ParentProfile from '@/pages/parent/Profile'

import { ROLES } from '@/utils/constants'

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Admin routes */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students" element={<Students />} />
        <Route path="/admin/students/new" element={<StudentForm />} />
        <Route path="/admin/students/:id/edit" element={<StudentForm />} />
        <Route path="/admin/teachers" element={<Teachers />} />
        <Route path="/admin/teachers/new" element={<TeacherForm />} />
        <Route path="/admin/teachers/:id/edit" element={<TeacherForm />} />
        <Route path="/admin/parents" element={<Parents />} />
        <Route path="/admin/classes" element={<Classes />} />
        <Route path="/admin/subjects" element={<Subjects />} />
        <Route path="/admin/exams" element={<Exams />} />
        <Route path="/admin/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/notifications" element={<AdminNotifications />} />
      </Route>

      {/* Teacher routes */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.TEACHER]} />}>
        <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/classes" element={<MyClasses />} />
        <Route path="/teacher/marks/upload" element={<UploadMarks />} />
        <Route path="/teacher/marks/manual" element={<ManualMarks />} />
        <Route path="/teacher/marks/review" element={<ReviewMarks />} />
        <Route path="/teacher/memos" element={<ViewMemos />} />
      </Route>

      {/* Student routes */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/results" element={<MyResults />} />
        <Route path="/student/memo/:memoId" element={<StudentViewMemo />} />
        <Route path="/student/profile" element={<StudentProfile />} />
      </Route>

      {/* Parent routes */}
      <Route element={<PrivateRoute allowedRoles={[ROLES.PARENT]} />}>
        <Route path="/parent" element={<Navigate to="/parent/dashboard" replace />} />
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route path="/parent/results" element={<ChildResults />} />
        <Route path="/parent/memo/:memoId" element={<ParentViewMemo />} />
        <Route path="/parent/profile" element={<ParentProfile />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
