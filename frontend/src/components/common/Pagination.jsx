import React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Button from './Button'

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  totalItems,
  pageSize = 10,
}) {
  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize)

  return (
    <div className="flex items-center justify-between border-t border-gray-100 bg-white px-4 py-3 sm:px-6">
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing <span className="font-medium">{startItem}</span> to{' '}
            <span className="font-medium">{endItem}</span>
            {totalItems && (
              <>
                {' '}
                of <span className="font-medium">{totalItems}</span> results
              </>
            )}
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm gap-1" aria-label="Pagination">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <span className="flex items-center px-3 py-1 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  )
}
