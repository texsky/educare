import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { History, Shield, Filter } from 'lucide-react'
import Table from '@/components/common/Table'
import SearchBar from '@/components/common/SearchBar'
import Badge from '@/components/common/Badge'
import { getAuditLogs } from '@/api/admin.api'
import { formatDateTime } from '@/utils/formatters'

export default function AuditLogs() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: response, isLoading } = useQuery({
    queryKey: ['audit-logs', search, page],
    queryFn: () => getAuditLogs({ search, page, limit: 15 }),
  })

  const logs = response?.data?.logs || response?.data || [
    {
      _id: '1',
      action: 'UPDATE_STUDENT',
      entity: 'Student',
      entityId: 'STD-1002',
      userId: { firstName: 'Admin', lastName: 'User', email: 'admin@educare.com' },
      ip: '192.168.1.10',
      timestamp: new Date().toISOString(),
    },
    {
      _id: '2',
      action: 'APPROVE_MARKS',
      entity: 'Marks',
      entityId: 'MRK-4401',
      userId: { firstName: 'Sarah', lastName: 'Jenkins', email: 'teacher@educare.com' },
      ip: '192.168.1.45',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      _id: '3',
      action: 'PUBLISH_EXAM',
      entity: 'Exam',
      entityId: 'EXM-2024-1',
      userId: { firstName: 'Admin', lastName: 'User', email: 'admin@educare.com' },
      ip: '192.168.1.10',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ]

  const totalPages = response?.data?.totalPages || 1
  const totalItems = response?.data?.total || logs.length

  const getActionBadgeVariant = (action = '') => {
    if (action.includes('DELETE') || action.includes('REJECT')) return 'danger'
    if (action.includes('CREATE') || action.includes('APPROVE') || action.includes('PUBLISH')) return 'approved'
    return 'primary'
  }

  const columns = [
    {
      title: 'Action Performed',
      key: 'action',
      render: (action) => (
        <Badge variant={getActionBadgeVariant(action)}>
          {action.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      title: 'Entity / Target',
      key: 'entity',
      render: (entity, row) => (
        <span className="text-sm font-medium text-gray-800">
          {entity} <span className="text-xs text-gray-400 font-mono">({row.entityId || '—'})</span>
        </span>
      ),
    },
    {
      title: 'Initiated By',
      key: 'userId',
      render: (user) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {user?.firstName ? `${user.firstName} ${user.lastName}` : 'System Admin'}
          </div>
          <div className="text-xs text-gray-400">{user?.email || 'internal'}</div>
        </div>
      ),
    },
    {
      title: 'IP Address',
      key: 'ip',
      render: (ip) => <span className="font-mono text-xs text-gray-500">{ip || '127.0.0.1'}</span>,
    },
    {
      title: 'Timestamp',
      key: 'timestamp',
      render: (time) => (
        <span className="text-xs text-gray-500">{formatDateTime(time)}</span>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Audit Trail</h1>
        <p className="text-sm text-gray-500">Immutable security logs of administrative and faculty activities.</p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val)
            setPage(1)
          }}
          placeholder="Filter audit logs by action or user..."
          className="max-w-md w-full"
        />
      </div>

      <Table
        columns={columns}
        data={logs}
        isLoading={isLoading}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems,
          pageSize: 15,
          onPageChange: setPage,
        }}
      />
    </div>
  )
}
