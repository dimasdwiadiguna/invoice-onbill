'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

const WORDS = ['ngonten', 'ngoding', 'ngedesain', 'ngerjain usaha']

type Phase = 'visible' | 'exiting' | 'entering'

const PHASE_STYLE: Record<Phase, React.CSSProperties> = {
  visible:  { opacity: 1, transform: 'translateY(0px)'  },
  exiting:  { opacity: 0, transform: 'translateY(-6px)' },
  entering: { opacity: 0, transform: 'translateY(6px)'  },
}

const SOCIAL_PROOF = [
  '✓ Gratis untuk 5 invoice pertama',
  '✓ Tanpa kartu kredit',
  '✓ Sesuai regulasi keuangan',
]

export default function HeroSection() {
  const [wordIndex, setWordIndex] = useState(0)
  const [phase, setPhase]         = useState<Phase>('visible')
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setPhase('exiting')

      setTimeout(() => {
        setWordIndex(i => (i + 1) % WORDS.length)
        setPhase('entering')

        rafRef.current = requestAnimationFrame(() =>
          requestAnimationFrame(() => setPhase('visible'))
        )
      }, 320)
    }, 2800)

    return () => {
      clearInterval(interval)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <section className="relative pt-16 bg-light-cream overflow-hidden flex items-center">
      <div className="max-w-6xl mx-auto px-6 xl:py-12 py-12 w-full grid md:grid-cols-2 gap-12 lg:gap-16 items-center">

        {/* ── Left: Copy ─────────────────────────────────────── */}
        <div className="space-y-7">

          {/* Headline */}
          <h1
            className="text-5xl lg:text-[4rem] xl:text-[4.25rem] leading-none font-extrabold text-primary-dark leading-[1.15] tracking-tight"
            style={{ animation: 'fadeInUp 0.55s ease both' }}
          >
            Kamu fokus{' '}
            <span
              className="text-primary-teal inline-block"
              style={{
                ...PHASE_STYLE[phase],
                transition: 'opacity 0.28s ease, transform 0.28s ease',
                minWidth: '2ch',
              }}
            >
              {WORDS[wordIndex]}
            </span>
            ,{' '}
            <br className="hidden lg:block" />
            kami urus invoicenya.
          </h1>

          {/* Subheadline */}
          <p
            className="text-base lg:text-lg text-medium-gray leading-relaxed max-w-lg"
            style={{ animation: 'fadeInUp 0.55s 0.12s ease both' }}
          >
            Invoice profesional dalam 3 menit untuk freelancer, kreator, dan usaha kecil
            Indonesia yang kerja sendiri. PPh&nbsp;21, PPh&nbsp;23, dan PPN akan dihitung otomatis.
          </p>

          {/* Social proof */}
          <ul
            className="flex flex-wrap gap-x-5 gap-y-2"
            style={{ animation: 'fadeInUp 0.55s 0.24s ease both' }}
          >
            {SOCIAL_PROOF.map(item => (
              <li key={item} className="text-sm font-semibold text-success">
                {item}
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div
            className="flex flex-wrap gap-3"
            style={{ animation: 'fadeInUp 0.55s 0.36s ease both' }}
          >
            <a
              href="/register"
              className="inline-flex items-center gap-1.5 bg-primary-teal text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary-teal/90 transition-all duration-200 shadow-lg shadow-primary-teal/25"
            >
              Buat Invoice Gratis <span aria-hidden>→</span>
            </a>
            <a
              href="#cara-kerja"
              className="inline-flex items-center gap-1.5 border border-border text-primary-dark font-semibold text-sm px-6 py-3 rounded-xl hover:border-primary-teal hover:text-primary-teal transition-all duration-200"
            >
              Lihat Cara Kerjanya
            </a>
          </div>
        </div>

        {/* ── Right: Invoice mockup ───────────────────────────── */}
        <div
          className="relative flex items-center justify-center lg:justify-end"
          style={{ animation: 'fadeInUp 0.6s 0.18s ease both' }}
        >
          {/* Background typography */}
          <div
            aria-hidden
            className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none overflow-hidden"
          >
            <span className="text-[7rem] font-extrabold text-primary-teal/[0.04] whitespace-nowrap leading-none">
              PPh 21
            </span>
            <span className="text-[5rem] font-extrabold text-primary-teal/[0.04] whitespace-nowrap leading-none">
              2,5%
            </span>
          </div>

          {/* Invoice card */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-border p-6 w-full max-w-[360px]">

            {/* Card header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold tracking-widest text-light-gray uppercase mb-0.5">
                  Invoice
                </p>
                <p className="text-sm font-bold text-dark-charcoal">INV-2025-042</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-light-gray mb-0.5">Jatuh Tempo</p>
                <p className="text-sm font-semibold text-primary-dark">15 Mei 2025</p>
              </div>
            </div>

            {/* From / To */}
            <div className="grid grid-cols-2 gap-3 pb-4 mb-4 border-b border-border">
              <div>
                <p className="text-[10px] text-light-gray mb-1">Dari</p>
                <p className="text-sm font-semibold text-dark-charcoal">Rina Kusuma</p>
                <p className="text-xs text-light-gray">Freelancer Konten</p>
              </div>
              <div>
                <p className="text-[10px] text-light-gray mb-1">Kepada</p>
                <p className="text-sm font-semibold text-dark-charcoal">PT Maju Bersama</p>
                <p className="text-xs text-light-gray">Jakarta Selatan</p>
              </div>
            </div>

            {/* Line items */}
            <div className="mb-4 space-y-1.5">
              <div className="flex justify-between text-[10px] text-light-gray pb-1 border-b border-very-light-gray">
                <span>Layanan</span>
                <span>Jumlah (Rp)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Pembuatan Konten Sosmed</span>
                <span className="font-medium text-dark-charcoal tabular-nums">5.000.000</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Video Editing (5 video)</span>
                <span className="font-medium text-dark-charcoal tabular-nums">2.500.000</span>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-border pt-3 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-medium-gray">Subtotal</span>
                <span className="font-medium text-dark-charcoal tabular-nums">7.500.000</span>
              </div>

              {/* PPh 21 — highlighted row */}
              <div className="flex justify-between items-center text-sm bg-subtle-teal rounded-lg px-2.5 py-1.5">
                <span className="font-semibold text-primary-teal flex items-center gap-1">
                  <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="currentColor">
                    <path d="M6 1a5 5 0 100 10A5 5 0 006 1zm.5 7.5h-1v-3h1v3zm0-4h-1v-1h1v1z"/>
                  </svg>
                  PPh 21 (2,5%)
                </span>
                <span className="font-semibold text-primary-teal tabular-nums">−187.500</span>
              </div>

              <div className="flex justify-between font-bold text-sm pt-1 border-t border-border">
                <span className="text-dark-charcoal">Total Dibayarkan</span>
                <span className="text-dark-charcoal tabular-nums">Rp 7.312.500</span>
              </div>
            </div>

            {/* Status */}
            <div className="mt-4 flex justify-end">
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success bg-success/10 border border-success/20 px-3 py-1 rounded-full">
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M10.293 2.293a1 1 0 011.414 1.414l-6 6a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L5 7.586l5.293-5.293z"/>
                </svg>
                Siap Kirim
              </span>
            </div>
          </div>

          {/* Floating badge 1 */}
          <div className="hidden sm:block absolute -bottom-3 -left-20 sm:-left-10 md:-left-30 lg:-left-10 animate-float-1 pointer-events-none">
<Image src="/people.png" alt="Onbill" width="300" height="300" priority />
          </div>
          <div className="absolute -top-3 -right-2 lg:-right-5 animate-float-1 pointer-events-none">
            <div className="bg-white border border-success/40 rounded-xl px-3 py-2 shadow-lg">
              <p className="text-xs font-semibold text-success whitespace-nowrap">✓ PPh 21 sudah dihitung</p>
            </div>
          </div>


          {/* Floating badge 2 */}
          <div className="absolute -bottom-3 -left-2 lg:-left-5 animate-float-2 pointer-events-none">
            <div className="bg-white border border-primary-teal/40 rounded-xl px-3 py-2 shadow-lg">
              <p className="text-xs font-semibold text-primary-teal whitespace-nowrap">✓ Siap kirim ke finance dept</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
