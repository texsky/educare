import React, { useRef, useState } from 'react'
import { UploadCloud, File, X, CheckCircle } from 'lucide-react'
import { formatFileSize } from '@/utils/formatters'

export default function FileUpload({
  onFileSelect,
  accept = 'image/*,application/pdf',
  maxSizeMb = 10,
  label = 'Upload a file',
  helperText = 'PNG, JPG, PDF up to 10MB',
  previewUrl = null,
  error = null,
  className = '',
}) {
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(previewUrl)
  const inputRef = useRef(null)

  const handleFiles = (files) => {
    if (!files || files.length === 0) return
    const file = files[0]

    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`File size exceeds ${maxSizeMb}MB`)
      return
    }

    setSelectedFile(file)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    if (onFileSelect) onFileSelect(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    setSelectedFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
    if (onFileSelect) onFileSelect(null)
  }

  return (
    <div className={`w-full ${className}`}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragOver
            ? 'border-primary-500 bg-primary-50/50'
            : error
            ? 'border-danger-300 bg-danger-50/20'
            : 'border-gray-200 hover:border-primary-400 bg-gray-50/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />

        {preview ? (
          <div className="relative group flex flex-col items-center">
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 rounded-lg object-contain border border-gray-200 shadow-sm"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 p-1 bg-danger-600 text-white rounded-full hover:bg-danger-700 shadow"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="mt-2 text-xs text-gray-500 font-medium">Click or drag to change image</p>
          </div>
        ) : selectedFile ? (
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm w-full max-w-sm">
            <File className="w-8 h-8 text-primary-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1 text-gray-400 hover:text-danger-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-3 bg-white rounded-full shadow-sm border border-gray-100 text-primary-600 mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-700">
              <span className="text-primary-600 hover:underline">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-400 mt-1">{helperText}</p>
          </>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-danger-600 font-medium">{error}</p>}
    </div>
  )
}
