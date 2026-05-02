'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'onbill_getstarted_dismissed'

type Props = {
  hasClients: boolean
  hasInvoices: boolean
}

export function GetStartedCard({ hasClients, hasInvoices }: Props) {
  const [dismissed, setDismissed] = useState(true) // true until hydrated to avoid flash
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    setDismissed(localStorage.getItem(STORAGE_KEY) === '1')
  }, [])

  const allDone = hasClients && hasInvoices

  useEffect(() => {
    if (mounted && allDone) {
      localStorage.setItem(STORAGE_KEY, '1')
      setDismissed(true)
    }
  }, [mounted, allDone])

  if (!mounted || dismissed) return null

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setDismissed(true)
  }

  const steps = [
    {
      done: true,
      label: 'Lengkapi profilmu',
      hint: 'Nama dan info pajak sudah tersimpan.',
      action: null as string | null,
      actionLabel: null as string | null,
    },
    {
      done: hasClients,
      label: 'Tambah klien pertama',
      hint: 'Simpan data klien agar bisa langsung dipilih saat buat invoice.',
      action: '/clients?tour=1',
      actionLabel: 'Tambah Klien',
    },
    {
      done: hasInvoices,
      label: 'Buat invoice pertama',
      hint: 'Coba buat invoice — pajak dihitung otomatis, tinggal isi.',
      action: '/invoices?tour=1',
      actionLabel: 'Buat Invoice',
    },
  ]

  const doneCount = steps.filter(s => s.done).length

  return (
    <div className="bg-white rounded-2xl border border-primary-teal/25 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-subtle-teal/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-teal/10 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-teal" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h2 className="font-bold text-primary-dark text-sm">Mulai dengan onbill</h2>
            <p className="text-xs text-medium-gray">{doneCount} dari 3 langkah selesai</p>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="text-xs text-light-gray hover:text-medium-gray transition-colors px-2 py-1 rounded-lg hover:bg-very-light-gray"
        >
          Tutup
        </button>
      </div>

      {/* Steps */}
      <div className="p-5 space-y-4">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            {/* Check circle */}
            <div className={[
              'w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center transition-all',
              step.done ? 'bg-primary-teal' : 'border-2 border-border',
            ].join(' ')}>
              {step.done && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="currentColor">
                  <path fillRule="evenodd" clipRule="evenodd"
                    d="M10.22 2.97a.75.75 0 011.06 1.06l-6 6a.75.75 0 01-1.06 0L1.22 6.97a.75.75 0 011.06-1.06L4.75 8.44l5.47-5.47z"/>
                </svg>
              )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold ${step.done ? 'text-medium-gray line-through' : 'text-primary-dark'}`}>
                {step.label}
              </p>
              {!step.done && (
                <p className="text-xs text-medium-gray mt-0.5 leading-relaxed">{step.hint}</p>
              )}
            </div>

            {/* CTA */}
            {!step.done && step.action && (
              <Link
                href={step.action}
                className="flex-shrink-0 text-xs font-bold text-white bg-primary-teal
                           hover:bg-primary-teal/90 px-3 py-1.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
              >
                {step.actionLabel} →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-5 pb-5">
        <div className="h-1.5 bg-very-light-gray rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-teal rounded-full transition-all duration-500"
            style={{ width: `${(doneCount / 3) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
