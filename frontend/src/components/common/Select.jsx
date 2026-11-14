import React, { forwardRef } from 'react'

const Select = forwardRef(function Select(
  {
    label,
    name,
    options = [],
    placeholder = 'Select an option',
    error,
    helperText,
    required = false,
    className = '',
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
      <select
        ref={ref}
        id={name}
        name={name}
        className={`block w-full rounded-lg border py-2 pl-3 pr-8 text-sm transition-colors bg-white ${
          error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-1 focus:ring-danger-500 text-danger-900'
            : 'border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-gray-900'
        }`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt
          const text = typeof opt === 'object' ? opt.label : opt
          return (
            <option key={val} value={val}>
              {text}
            </option>
          )
        })}
      </select>
      {error && <p className="mt-1 text-xs text-danger-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  )
})

export default Select
