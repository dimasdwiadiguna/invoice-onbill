'use client'

import { useScrollReveal } from '@/hooks/useScrollReveal'

export default function FinalCTASection() {
  const reveal = useScrollReveal(0.2)

  return (
    <section className="relative bg-primary-dark py-28 overflow-hidden">
      {/* Decorative glow orbs */}
      <div aria-hidden className="absolute -top-32 -right-32 w-[28rem] h-[28rem] rounded-full bg-primary-teal/10 blur-3xl pointer-events-none" />
      <div aria-hidden className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary-teal/8 blur-3xl pointer-events-none" />

      <div
        ref={reveal.ref}
        className="relative max-w-3xl mx-auto px-6 text-center"
      >
        <h2
          className="text-3xl lg:text-5xl font-extrabold text-white leading-tight mb-5"
          style={reveal.visible
            ? { animation: 'fadeInUp 0.55s ease both' }
            : { opacity: 0 }}
        >
          Buat invoice pertamamu{' '}
          <span className="text-primary-teal">3 menit</span>{' '}
          dari sekarang.
        </h2>

        <p
          className="text-base lg:text-lg text-light-gray mb-10"
          style={reveal.visible
            ? { animation: 'fadeInUp 0.55s 0.12s ease both' }
            : { opacity: 0 }}
        >
          Gratis untuk 5 invoice pertama. Tidak perlu kartu kredit.
        </p>

        <div
          style={reveal.visible
            ? { animation: 'fadeInUp 0.55s 0.22s ease both' }
            : { opacity: 0 }}
        >
          <a
            href="/daftar"
            className="inline-flex items-center gap-2 bg-primary-teal text-white font-semibold
                       text-base px-8 py-4 rounded-xl shadow-xl shadow-primary-teal/30
                       hover:bg-primary-teal/90 transition-all duration-200"
          >
            Buat Invoice Gratis Sekarang <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </section>
  )
}
