import React from 'react'
import { getInitials } from '@/utils/formatters'

export default function Avatar({
  src,
  name = 'User',
  size = 'md',
  className = '',
}) {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  }

  const [imageError, setImageError] = React.useState(false)

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImageError(true)}
        className={`rounded-full object-cover border border-gray-200 ${sizes[size] || sizes.md} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full bg-primary-600 text-white flex items-center justify-center font-medium shadow-sm ${
        sizes[size] || sizes.md
      } ${className}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  )
}
