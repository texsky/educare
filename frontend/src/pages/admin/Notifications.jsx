import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Mail, MessageSquare, Bell, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Table from '@/components/common/Table'
import Button from '@/components/common/Button'
import Input from '@/components/common/Input'
import Select from '@/components/common/Select'
import Badge from '@/components/common/Badge'
import { getNotifications, sendNotification } from '@/api/notifications.api'
import { formatDateTime } from '@/utils/formatters'

export default function AdminNotifications() {
  const queryClient = useQueryClient()
  const [formData, setFormData] = useState({
    type: 'email',
    audience: 'all',
    subject: '',
    message: '',
  })

  const { data: response, isLoading } = useQuery({
    queryKey: ['notifications-history'],
    queryFn: () => getNotifications({ limit: 20 }),
  })

  const notifications = response?.data || []

  const sendMutation = useMutation({
    mutationFn: (data) => sendNotification(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-history'] })
      toast.success('Notification broadcast dispatched!')
      setFormData({
        type: 'email',
        audience: 'all',
        subject: '',
        message: '',
      })
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to dispatch broadcast')
    },
  })

  const columns = [
    {
      title: 'Channel',
      key: 'type',
      render: (type) => (
        <div className="flex items-center gap-2">
          {type === 'sms' ? (
            <MessageSquare className="w-4 h-4 text-primary-500" />
          ) : (
            <Mail className="w-4 h-4 text-emerald-500" />
          )}
          <span className="capitalize font-medium text-gray-800">{type}</span>
        </div>
      ),
    },
    {
      title: 'Subject / Title',
      key: 'subject',
      render: (subject, row) => (
        <div>
          <div className="font-semibold text-gray-900">{subject}</div>
          <div className="text-xs text-gray-500 truncate max-w-xs">{row.message}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (status) => (
        <Badge variant={status === 'sent' ? 'approved' : 'pending'}>
          {status}
        </Badge>
      ),
    },
    {
      title: 'Dispatched At',
      key: 'sentAt',
      render: (time) => (
        <span className="text-xs text-gray-500">{formatDateTime(time)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Broadcast Notifications</h1>
        <p className="text-sm text-gray-500">Dispatch direct email and SMS updates to parents, teachers, and students.</p>
      </div>

      {/* Broadcast Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-primary-600" /> Dispatch New Broadcast
        </h3>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            sendMutation.mutate(formData)
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Notification Channel"
              options={[
                { value: 'email', label: 'Email Broadcast' },
                { value: 'sms', label: 'Twilio SMS Notification' },
              ]}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
            />
            <Select
              label="Audience Group"
              options={[
                { value: 'all', label: 'Entire School Community (All)' },
                { value: 'parents', label: 'All Registered Parents' },
                { value: 'teachers', label: 'Teaching Faculty Only' },
                { value: 'students', label: 'Enrolled Students' },
              ]}
              value={formData.audience}
              onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
              required
            />
          </div>

          <Input
            label="Subject Header"
            placeholder="e.g. Annual Sports Day Schedule"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message Content <span className="text-danger-500">*</span>
            </label>
            <textarea
              rows={4}
              className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-gray-900 placeholder-gray-400"
              placeholder="Write message to be sent via email or SMS..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              icon={Send}
              isLoading={sendMutation.isPending}
            >
              Send Broadcast
            </Button>
          </div>
        </form>
      </div>

      {/* Broadcast History */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Dispatches</h3>
        <Table columns={columns} data={notifications} isLoading={isLoading} />
      </div>
    </div>
  )
}
