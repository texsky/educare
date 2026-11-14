import React from 'react'

export default function DetailField({ label, value }) {
  const displayValue = value === null || value === undefined || value === '' ? '—' : value

  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-gray-900">{displayValue}</dd>
    </div>
  )
}
