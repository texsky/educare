import React from 'react'

export default function Card({
  title,
  subtitle,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
  children,
  className = '',
  action,
}) {
  const colorBgMap = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow ${className}`}>
      {(title || Icon || action) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`p-2.5 rounded-lg ${colorBgMap[color] || colorBgMap.primary}`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-medium text-gray-500">{title}</h3>}
              {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {value !== undefined && (
        <div className="mt-1">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {trend !== undefined && (
            <div className="flex items-center gap-1.5 mt-2 text-xs">
              <span
                className={`font-semibold ${
                  trend >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}
              >
                {trend >= 0 ? `+${trend}%` : `${trend}%`}
              </span>
              {trendLabel && <span className="text-gray-400">{trendLabel}</span>}
            </div>
          )}
        </div>
      )}

      {children && <div className={value !== undefined ? 'mt-4' : ''}>{children}</div>}
    </div>
  )
}
