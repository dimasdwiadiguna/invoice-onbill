'use client'

import { useRef, useState } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'

const FAQS = [
  {
    q: 'Apakah Onbill legal dan aman digunakan?',
    a: 'Ya. Onbill menghasilkan invoice yang sesuai dengan format yang diterima oleh finance department perusahaan dan diverifikasi oleh akuntan profesional. Bukan pengganti konsultasi pajak, tapi sudah mengikuti aturan DJP yang berlaku.',
  },
  {
    q: 'Apa bedanya PPh 21 dan PPh 23?',
    a: 'Tidak perlu pilih — Onbill yang memilih. Invoice sebagai pribadi → PPh 21. Invoice sebagai CV/PT → PPh 23. Cukup jawab satu pertanyaan saat daftar.',
  },
  {
    q: 'Saya tidak punya NPWP. Masih bisa?',
    a: 'Bisa. Tanpa NPWP, tarif PPh sedikit lebih tinggi sesuai aturan DJP. Onbill menghitung ini otomatis.',
  },
  {
    q: 'Cocok untuk usaha dengan badan usaha (CV/PT)?',
    a: 'Cocok, selama belum PKP (omzet di bawah Rp 4,8 miliar/tahun) dan tidak butuh efaktur resmi DJP.',
  },
  {
    q: 'Bagaimana cara kerja kalkulasi PPN?',
    a: 'PPN 11% hanya berlaku jika kamu sudah terdaftar sebagai PKP. Jika belum, PPN tidak perlu dicantumkan. Onbill menentukan ini dari jawaban saat kamu daftar.',
  },
  {
    q: 'Bisakah pakai logo saya sendiri?',
    a: 'Bisa — fitur custom logo & branding tersedia di plan Pro.',
  },
  {
    q: 'Data saya aman?',
    a: 'Disimpan dengan enkripsi, tidak pernah dijual atau dibagikan ke pihak ketiga. Infrastruktur Supabase dengan standar keamanan enterprise.',
  },
  {
    q: 'Ada kontrak jangka panjang?',
    a: 'Tidak ada. Plan Pro bisa dibatalkan kapan saja, langsung dari dashboard kamu.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const answerRefs = useRef<(HTMLDivElement | null)[]>([])
  const headerReveal = useScrollReveal(0.2)
  const listReveal   = useScrollReveal(0.08)

  function toggle(i: number) {
    setOpenIndex(prev => (prev === i ? null : i))
  }

  return (
    <section id="faq" className="py-24 bg-very-light-gray">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div ref={headerReveal.ref} className="text-center mb-12">
          <h2
            className="text-3xl lg:text-4xl font-extrabold text-primary-dark"
            style={headerReveal.visible
              ? { animation: 'fadeInUp 0.55s ease both' }
              : { opacity: 0 }}
          >
            Pertanyaan yang sering ditanyakan
          </h2>
        </div>

        {/* Accordion */}
        <div
          ref={listReveal.ref}
          className="bg-white rounded-2xl border border-border overflow-hidden divide-y divide-border"
          style={listReveal.visible
            ? { animation: 'fadeInUp 0.55s 0.1s ease both' }
            : { opacity: 0 }}
        >
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            return (
              <div key={faq.q}>
                <button
                  onClick={() => toggle(i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left
                             hover:bg-very-light-gray/50 transition-colors duration-150"
                >
                  <span className="font-semibold text-primary-dark text-sm lg:text-base leading-snug">
                    {faq.q}
                  </span>
                  <svg
                    className={[
                      'w-5 h-5 text-light-gray flex-shrink-0 transition-transform duration-300',
                      isOpen ? 'rotate-180' : '',
                    ].join(' ')}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path fillRule="evenodd" clipRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                  </svg>
                </button>

                <div
                  style={{
                    maxHeight: isOpen
                      ? `${answerRefs.current[i]?.scrollHeight ?? 400}px`
                      : '0px',
                    overflow: 'hidden',
                    transition: 'max-height 0.35s ease',
                  }}
                >
                  <div
                    ref={el => { answerRefs.current[i] = el }}
                    className="px-6 pb-5 pt-1"
                  >
                    <p className="text-sm text-medium-gray leading-relaxed">{faq.a}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
