'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'

function ShieldIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden>
      <rect width="48" height="48" rx="14" fill="#E8F4F8"/>
      <path d="M24 10l11 4v9c0 6.627-4.925 12.823-11 14-6.075-1.177-11-7.373-11-14v-9l11-4z"
        fill="#0E9CB4" fillOpacity=".2" stroke="#0E9CB4" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M20 24l2.5 2.5 5.5-5.5" stroke="#0E9CB4" strokeWidth="1.75"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden>
      <rect width="48" height="48" rx="14" fill="#E8F4F8"/>
      <path d="M14 24s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"
        fill="#0E9CB4" fillOpacity=".15" stroke="#0E9CB4" strokeWidth="1.5"/>
      <circle cx="24" cy="24" r="3" fill="#0E9CB4"/>
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" aria-hidden>
      <rect width="48" height="48" rx="14" fill="#E8F4F8"/>
      <path d="M16 24a8 8 0 018-8 8 8 0 017.42 5" stroke="#0E9CB4" strokeWidth="1.5"
        strokeLinecap="round"/>
      <path d="M31.42 21h4v-4" stroke="#0E9CB4" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M32 24a8 8 0 01-8 8 8 8 0 01-7.42-5" stroke="#0E9CB4" strokeWidth="1.5"
        strokeLinecap="round"/>
      <path d="M16.58 27H12.58v4" stroke="#0E9CB4" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const TRUST_ITEMS = [
  {
    icon: <ShieldIcon />,
    title: 'Diverifikasi Akuntan Profesional',
    desc: 'Seluruh format invoice dan skema kalkulasi PPh 21, PPh 23, dan PPN diverifikasi oleh akuntan profesional berlisensi.',
    extra: (
      <div className="flex items-center gap-3 mt-5 pt-5 border-t border-border">
        <div className="w-10 h-10 rounded-full bg-very-light-gray border border-border flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-light-gray" aria-hidden>
            <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z"/>
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-dark-charcoal">[Nama Akuntan]</p>
          <p className="text-xs text-light-gray">Akuntan Profesional Berlisensi · Jakarta</p>
        </div>
      </div>
    ),
  },
  {
    icon: <EyeIcon />,
    title: 'Kalkulasi yang Transparan',
    desc: 'Setiap angka pajak ditampilkan dengan penjelasan — DPP, tarif yang dipakai, dan dari mana angkanya berasal. Tidak ada angka yang muncul begitu saja.',
    extra: null,
  },
  {
    icon: <RefreshIcon />,
    title: 'Diperbarui Sesuai Regulasi DJP',
    desc: 'Seluruh perhitungan akan selalu disesuaikan dengan regulasi terbaru Direktorat Jenderal Pajak. Kamu tidak perlu memantau perubahan aturan sendiri.',
    extra: null,
  },
]

export default function TrustSection() {
  const headerReveal = useScrollReveal(0.2)
  const cardsReveal  = useScrollReveal(0.1)

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div ref={headerReveal.ref} className="text-center mb-16">
          <h2
            className="text-3xl lg:text-4xl font-extrabold text-primary-dark"
            style={headerReveal.visible
              ? { animation: 'fadeInUp 0.55s ease both' }
              : { opacity: 0 }}
          >
            Terverifikasi dan Transparan
          </h2>
        </div>

        {/* Cards */}
        <div ref={cardsReveal.ref} className="grid md:grid-cols-3 gap-6">
          {TRUST_ITEMS.map((item, i) => (
            <div
              key={item.title}
              className="bg-white border border-border rounded-2xl p-7
                         hover:border-primary-teal hover:shadow-lg hover:shadow-primary-teal/8
                         transition-all duration-300 flex flex-col"
              style={cardsReveal.visible
                ? { animation: `fadeInUp 0.55s ${0.08 + i * 0.13}s ease both` }
                : { opacity: 0 }}
            >
              <div className="mb-5">{item.icon}</div>
              <h3 className="font-bold text-primary-dark text-base mb-3">{item.title}</h3>
              <p className="text-sm text-medium-gray leading-relaxed flex-1">{item.desc}</p>
              {item.extra}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
