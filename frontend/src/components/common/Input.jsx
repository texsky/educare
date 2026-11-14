import React, { forwardRef } from 'react'

const Input = forwardRef(function Input(
  {
    label,
    name,
    type = 'text',
    error,
    helperText,
    icon: Icon,
    className = '',
    required = false,
    ...props
  },
  ref
) {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <div className="relative rounded-md shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={type}
          className={`block w-full rounded-lg border text-sm transition-colors py-2 ${
            Icon ? 'pl-9' : 'pl-3'
          } pr-3 ${
            error
              ? 'border-danger-500 focus:border-danger-500 focus:ring-1 focus:ring-danger-500 text-danger-900 placeholder-danger-300'
              : 'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-gray-900 placeholder-gray-400'
          }`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  )
})

export default Input
