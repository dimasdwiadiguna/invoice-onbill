'use client'

import { useEffect } from 'react'

type Props = {
  message: string
  type?: 'error' | 'success' | 'info'
  onClose: () => void
}

const BG: Record<NonNullable<Props['type']>, string> = {
  error:   'bg-error',
  success: 'bg-success',
  info:    'bg-primary-teal',
}

export function Toast({ message, type = 'error', onClose }: Props) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      role="alert"
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3
                  px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium
                  ${BG[type]}`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        aria-label="Tutup notifikasi"
        className="opacity-70 hover:opacity-100 text-base leading-none"
      >
        ✕
      </button>
    </div>
  )
}
