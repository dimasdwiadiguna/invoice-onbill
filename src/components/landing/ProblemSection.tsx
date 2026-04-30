'use client'

import { useEffect, useRef, useState } from 'react'

const PAIN_POINTS = [
  {
    icon: '🔢',
    title: '"PPh-nya berapa persen ya?"',
    body: 'Tanya di grup, dapat jawaban berbeda-beda. Akhirnya asal isi yang kelihatan benar.',
  },
  {
    icon: '⏱️',
    title: '30–90 menit per invoice',
    body: 'Buka template lama, hapus data klien, hitung pajak manual, adjust layout berantakan — setiap bulan, dari awal lagi.',
  },
  {
    icon: '📂',
    title: 'SPT Maret: panik cari data',
    body: 'Invoice tersebar di folder, WhatsApp, dan ingatan. Berapa total penghasilan tahun ini? Tidak ada yang tahu pasti.',
  },
]

export default function ProblemSection() {
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef  = useRef<HTMLDivElement>(null)
  const [headerVisible, setHeaderVisible] = useState(false)
  const [cardsVisible,  setCardsVisible]  = useState(false)

  useEffect(() => {
    const observe = (
      el: HTMLElement | null,
      setter: (v: boolean) => void,
      threshold = 0.2,
    ) => {
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) { setter(true); obs.disconnect() } },
        { threshold },
      )
      obs.observe(el)
      return () => obs.disconnect()
    }

    const c1 = observe(headerRef.current, setHeaderVisible)
    const c2 = observe(cardsRef.current,  setCardsVisible, 0.1)
    return () => { c1?.(); c2?.() }
  }, [])

  return (
    <section id="fitur" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        {/* ── Header ─────────────────────────────────────────── */}
        <div ref={headerRef} className="text-center mb-16 max-w-2xl mx-auto">
          <h2
            className="text-3xl lg:text-4xl font-extrabold text-primary-dark leading-tight mb-5"
            style={
              headerVisible
                ? { animation: 'fadeInUp 0.55s ease both' }
                : { opacity: 0 }
            }
          >
            Pernah dapat balasan{' '}
            <span className="text-primary-teal">"Bisa tambahkan PPh&nbsp;21-nya"?</span>
          </h2>
          <p
            className="text-base lg:text-lg text-medium-gray leading-relaxed"
            style={
              headerVisible
                ? { animation: 'fadeInUp 0.55s 0.13s ease both' }
                : { opacity: 0 }
            }
          >
            Finance department klien korporat butuh format pajak yang tepat.
            Tapi tidak ada yang pernah mengajari kita cara invoice yang benar.{' '}
            <strong className="text-primary-dark font-semibold">
              Onbill mengurus semua itu
            </strong>{' '}
            — supaya kamu fokus pada pekerjaan yang sebenarnya.
          </p>
        </div>

        {/* ── Pain point cards ────────────────────────────────── */}
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-6">
          {PAIN_POINTS.map((point, i) => (
            <div
              key={point.title}
              className="group bg-white border border-border rounded-2xl p-7 cursor-default
                         hover:border-primary-teal hover:shadow-lg hover:shadow-primary-teal/8
                         transition-all duration-300"
              style={
                cardsVisible
                  ? { animation: `fadeInUp 0.55s ${0.1 + i * 0.13}s ease both` }
                  : { opacity: 0 }
              }
            >
              <div className="text-3xl mb-4 select-none">{point.icon}</div>
              <h3 className="font-bold text-primary-dark text-base leading-snug mb-3">
                {point.title}
              </h3>
              <p className="text-sm text-medium-gray leading-relaxed">
                {point.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
