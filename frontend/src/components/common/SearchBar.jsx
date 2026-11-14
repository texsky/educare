import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

export default function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  debounceMs = 300,
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState(value)

  useEffect(() => {
    setSearchTerm(value)
  }, [value])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange && searchTerm !== value) {
        onChange(searchTerm)
      }
    }, debounceMs)

    return () => clearTimeout(handler)
  }, [searchTerm, debounceMs, onChange, value])

  const handleClear = () => {
    setSearchTerm('')
    if (onChange) onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Search className="h-4 w-4" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-9 pr-9 py-2 border border-gray-200 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all shadow-sm"
      />
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
