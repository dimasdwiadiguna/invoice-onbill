'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'

const FEATURES = [
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#E8F4F8"/>
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
          fontSize="18" fontWeight="700" fill="#0E9CB4">%</text>
      </svg>
    ),
    title: 'Pajak Otomatis',
    desc: 'Jawab dua pertanyaan saat daftar. Sistem menentukan apakah kamu perlu PPh 21 (individu) atau PPh 23 (badan usaha). Angkanya langsung muncul di invoice — tidak perlu hitung manual.',
    tags: ['PPh 21', 'PPh 23', 'PPN 11%'],
    proTag: false,
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#E8F4F8"/>
        <rect x="11" y="12" width="18" height="3" rx="1.5" fill="#0E9CB4"/>
        <rect x="11" y="18" width="13" height="3" rx="1.5" fill="#0E9CB4" opacity=".6"/>
        <rect x="11" y="24" width="15" height="3" rx="1.5" fill="#0E9CB4" opacity=".4"/>
      </svg>
    ),
    title: 'Template Profesi',
    desc: 'Template IT freelancer sudah ada kolom nama project dan milestone. Template kreator sudah ada kolom nama campaign dan platform. Tidak perlu tebak field apa yang harus ada.',
    tags: ['IT', 'Kreator', 'Konsultan', 'UMKM'],
    proTag: false,
  },
  {
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden>
        <rect width="40" height="40" rx="12" fill="#E8F4F8"/>
        <rect x="11" y="24" width="4" height="6" rx="1" fill="#0E9CB4" opacity=".4"/>
        <rect x="18" y="18" width="4" height="12" rx="1" fill="#0E9CB4" opacity=".7"/>
        <rect x="25" y="12" width="4" height="18" rx="1" fill="#0E9CB4"/>
      </svg>
    ),
    title: 'Rekap untuk SPT',
    desc: 'Total pendapatan, total PPh yang dipotong klien, per bulan dan per tahun — semua sudah terhitung otomatis dari riwayat invoice kamu.',
    tags: ['Pro Feature'],
    proTag: true,
  },
]

export default function SolutionSection() {
  const headerReveal = useScrollReveal(0.2)
  const cardsReveal  = useScrollReveal(0.1)

  return (
    <section className="py-24 bg-very-light-gray">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div ref={headerReveal.ref} className="text-center mb-16 max-w-2xl mx-auto">
          <h2
            className="text-3xl lg:text-4xl font-extrabold text-primary-dark leading-tight"
            style={headerReveal.visible
              ? { animation: 'fadeInUp 0.55s ease both' }
              : { opacity: 0 }}
          >
            Tiga hal yang Onbill urus —{' '}
            <span className="text-primary-teal">supaya kamu tidak perlu</span>
          </h2>
        </div>

        {/* Cards */}
        <div ref={cardsReveal.ref} className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((feat, i) => (
            <div
              key={feat.title}
              className="bg-white rounded-2xl p-7 border border-border
                         hover:border-primary-teal hover:shadow-lg hover:shadow-primary-teal/8
                         transition-all duration-300 flex flex-col"
              style={cardsReveal.visible
                ? { animation: `fadeInUp 0.55s ${0.08 + i * 0.13}s ease both` }
                : { opacity: 0 }}
            >
              <div className="mb-5">{feat.icon}</div>
              <h3 className="font-bold text-primary-dark text-lg mb-3">{feat.title}</h3>
              <p className="text-sm text-medium-gray leading-relaxed mb-5 flex-1">{feat.desc}</p>

              <div className="flex flex-wrap gap-2 mt-auto">
                {feat.tags.map(tag => (
                  <span
                    key={tag}
                    className={feat.proTag && tag === 'Pro Feature'
                      ? 'text-xs font-semibold text-primary-teal bg-subtle-teal border border-primary-teal/20 px-2.5 py-1 rounded-full'
                      : 'text-xs font-medium text-medium-gray bg-very-light-gray border border-border px-2.5 py-1 rounded-full'}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
