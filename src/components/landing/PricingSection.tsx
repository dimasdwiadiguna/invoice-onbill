'use client'

import { useState } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

function CheckIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="8" fill="#8BC540" fillOpacity=".15"/>
      <path d="M5 8l2 2 4-4" stroke="#8BC540" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const FREE_FEATURES = [
  '3 invoice (total)',
  '2 template profesi',
  'PPh 21 dasar',
  '3 database klien',
  'Download PDF',
]

const PRO_FEATURES = [
  'Invoice & klien unlimited',
  'Semua template profesi',
  'PPh 21 + PPh 23 + PPN lengkap',
  'Kirim invoice via email',
  'Status tracking (terkirim/dibaca)',
  'Rekap tahunan untuk SPT',
  'Custom logo & branding',
]

export default function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const headerReveal = useScrollReveal(0.2)
  const cardsReveal  = useScrollReveal(0.1)

  const proPrice  = billing === 'monthly' ? 'Rp 39.000' : 'Rp 390.000'
  const proPeriod = billing === 'monthly' ? '/bulan' : '/tahun'

  return (
    <section id="harga" className="py-24 bg-light-cream">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div ref={headerReveal.ref} className="text-center mb-10">
          <h2
            className="text-3xl lg:text-4xl font-extrabold text-primary-dark mb-4"
            style={headerReveal.visible
              ? { animation: 'fadeInUp 0.55s ease both' }
              : { opacity: 0 }}
          >
            Coba gratis dulu
          </h2>
          <p
            className="text-base lg:text-lg text-medium-gray"
            style={headerReveal.visible
              ? { animation: 'fadeInUp 0.55s 0.12s ease both' }
              : { opacity: 0 }}
          >
            Upgrade kalau sudah perlu lebih — mulai dari{' '}
            <span className="font-semibold text-primary-dark">Rp&nbsp;39.000/bulan</span>
          </p>
        </div>

        {/* Billing toggle */}
        <div
          className="flex justify-center mb-12"
          style={headerReveal.visible ? { animation: 'fadeInUp 0.55s 0.2s ease both' } : { opacity: 0 }}
        >
          <div className="inline-flex items-center bg-white border border-border rounded-xl p-1 gap-1">
            <button
              onClick={() => setBilling('monthly')}
              className={[
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                billing === 'monthly'
                  ? 'bg-primary-teal text-white shadow-sm'
                  : 'text-medium-gray hover:text-primary-dark',
              ].join(' ')}
            >
              Bulanan
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={[
                'px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2',
                billing === 'annual'
                  ? 'bg-primary-teal text-white shadow-sm'
                  : 'text-medium-gray hover:text-primary-dark',
              ].join(' ')}
            >
              Tahunan
              <span className={[
                'text-xs font-bold px-1.5 py-0.5 rounded-full',
                billing === 'annual'
                  ? 'bg-white/20 text-white'
                  : 'bg-success/15 text-success',
              ].join(' ')}>
                2 bulan gratis
              </span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div
          ref={cardsReveal.ref}
          className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >

          {/* Free */}
          <div
            className="bg-white border border-border rounded-2xl p-8
                       hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            style={cardsReveal.visible
              ? { animation: 'fadeInUp 0.55s 0.08s ease both' }
              : { opacity: 0 }}
          >
            <p className="text-sm font-semibold text-medium-gray uppercase tracking-wider mb-4">
              Free
            </p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-primary-dark">Rp&nbsp;0</span>
              <span className="text-medium-gray text-sm ml-1">/selamanya</span>
            </div>

            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-medium-gray">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="/register"
              className="block w-full text-center font-semibold text-sm text-primary-teal
                         border-2 border-primary-teal rounded-xl px-6 py-3
                         hover:bg-primary-teal hover:text-white transition-all duration-200"
            >
              Mulai Gratis
            </a>
          </div>

          {/* Pro */}
          <div
            className="relative bg-white border-2 border-primary-teal rounded-2xl p-8
                       hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-teal/15
                       transition-all duration-300"
            style={cardsReveal.visible
              ? { animation: 'fadeInUp 0.55s 0.2s ease both' }
              : { opacity: 0 }}
          >
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary-teal text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap shadow-md">
                Paling Populer
              </span>
            </div>

            <p className="text-sm font-semibold text-primary-teal uppercase tracking-wider mb-4">
              Pro
            </p>
            <div className="mb-1">
              <span className="text-4xl font-extrabold text-primary-teal">{proPrice}</span>
              <span className="text-medium-gray text-sm ml-1">{proPeriod}</span>
            </div>
            {billing === 'annual' && (
              <p className="text-xs text-success font-semibold mb-5">Hemat Rp&nbsp;78.000 vs bulanan</p>
            )}
            {billing === 'monthly' && <div className="mb-5" />}

            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-medium-gray">
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="/register"
              className="block w-full text-center font-semibold text-sm text-white
                         bg-primary-teal rounded-xl px-6 py-3
                         hover:bg-primary-teal/90 transition-all duration-200
                         shadow-lg shadow-primary-teal/25"
            >
              Mulai Gratis, Upgrade Nanti
            </a>
            <p className="text-center text-xs text-light-gray mt-3">
              Bayar via transfer bank · diaktifkan manual
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
