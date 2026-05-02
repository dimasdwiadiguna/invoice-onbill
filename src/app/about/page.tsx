import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tentang Onbill – Invoice Freelancer Indonesia',
  description:
    'Onbill dibangun untuk membantu freelancer dan pelaku bisnis Indonesia membuat invoice profesional dengan pajak otomatis.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-light-cream">
      {/* Navbar */}
      <header className="bg-white border-b border-border sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/">
            <Logo variant="full" height={28} />
          </Link>
          <nav className="hidden sm:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-medium-gray hover:text-primary-dark transition-colors">
              Beranda
            </Link>
            <Link href="/login" className="text-sm font-semibold text-primary-teal hover:underline">
              Masuk
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-primary-teal px-4 py-2 rounded-xl
                         hover:bg-primary-teal/90 transition-all"
            >
              Coba Gratis
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <span className="inline-block text-xs font-bold text-primary-teal bg-subtle-teal px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
            Tentang Kami
          </span>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-primary-dark leading-tight mb-4">
            Invoice yang Benar,<br />
            <span className="text-primary-teal">Pajak yang Tepat.</span>
          </h1>
          <p className="text-lg text-medium-gray max-w-2xl mx-auto leading-relaxed">
            Onbill lahir dari satu masalah nyata: freelancer dan pelaku UMKM Indonesia kesulitan
            membuat invoice yang sesuai aturan perpajakan. Kami membangun solusinya.
          </p>
        </section>

        {/* Story */}
        <section className="bg-white border-y border-border">
          <div className="max-w-3xl mx-auto px-6 py-14 space-y-6 text-medium-gray leading-relaxed">
            <h2 className="text-2xl font-extrabold text-primary-dark">Cerita di Balik Onbill</h2>
            <p>
              Banyak freelancer Indonesia yang tidak tahu bedanya PPh 21 dan PPh 23, kapan PPN perlu
              dicantumkan, atau bagaimana format invoice yang benar agar tidak bermasalah saat audit
              atau lapor SPT. Kesalahan kecil di invoice bisa berujung pada denda pajak yang tidak perlu.
            </p>
            <p>
              Onbill hadir sebagai solusi — platform invoice yang bukan hanya membuat invoice terlihat
              profesional, tapi juga <strong className="text-primary-dark">menghitung pajak secara otomatis</strong> sesuai
              regulasi Indonesia: PPh 21 untuk individu, PPh 23 untuk badan usaha, dan PPN 11% untuk
              Pengusaha Kena Pajak (PKP).
            </p>
            <p>
              Kami bekerja sama dengan akuntan publik bersertifikat untuk memastikan kalkulasi pajak
              di Onbill akurat dan sesuai dengan peraturan perpajakan yang berlaku.
            </p>
          </div>
        </section>

        {/* Accountant validator */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-extrabold text-primary-dark mb-2">
              Divalidasi oleh Akuntan Publik
            </h2>
            <p className="text-medium-gray text-sm max-w-lg mx-auto">
              Kalkulasi pajak Onbill diverifikasi oleh akuntan publik bersertifikat untuk memastikan
              keakuratan dan kepatuhan terhadap regulasi perpajakan Indonesia.
            </p>
          </div>

          {/* Accountant card */}
          <div className="max-w-sm mx-auto bg-white rounded-3xl border border-border p-8 text-center shadow-sm">
            {/* Photo placeholder */}
            <div className="w-24 h-24 mx-auto rounded-full bg-subtle-teal border-4 border-white shadow-md
                            flex items-center justify-center mb-4 overflow-hidden">
              <svg className="w-12 h-12 text-primary-teal/40" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>

            <p className="text-xs font-bold text-primary-teal uppercase tracking-wider mb-2">
              Akuntan Validator
            </p>
            <h3 className="text-xl font-extrabold text-primary-dark mb-1">[Nama Akuntan]</h3>
            <p className="text-sm text-medium-gray mb-1">Akuntan Publik Bersertifikat</p>
            <p className="text-xs text-light-gray mb-5">No. Izin: [Nomor Izin Akuntan Publik]</p>

            {/* Divider */}
            <div className="border-t border-border pt-5">
              <svg className="w-6 h-6 text-primary-teal/30 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
              <blockquote className="text-sm text-medium-gray italic leading-relaxed">
                "Invoice yang benar bukan sekadar dokumen tagihan — ini adalah fondasi dari kepatuhan
                pajak yang baik. Dengan format yang tepat dan perhitungan yang akurat, freelancer
                bisa terhindar dari masalah perpajakan yang tidak perlu."
              </blockquote>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white border-y border-border">
          <div className="max-w-5xl mx-auto px-6 py-14">
            <h2 className="text-2xl font-extrabold text-primary-dark text-center mb-10">
              Prinsip Kami
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  ),
                  title: 'Akurat',
                  desc: 'Kalkulasi pajak diverifikasi akuntan publik. Tidak ada asumsi, tidak ada estimasi.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
                    </svg>
                  ),
                  title: 'Mudah',
                  desc: 'Buat invoice profesional dalam 3 menit. Tanpa perlu hafal aturan pajak.',
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                    </svg>
                  ),
                  title: 'Aman',
                  desc: 'Data kamu terenkripsi dan terisolasi. Tidak dibagikan ke pihak ketiga.',
                },
              ].map(v => (
                <div key={v.title} className="text-center p-6 rounded-2xl bg-very-light-gray">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center
                                  text-primary-teal mx-auto mb-4 shadow-sm">
                    {v.icon}
                  </div>
                  <h3 className="font-bold text-primary-dark mb-2">{v.title}</h3>
                  <p className="text-sm text-medium-gray leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-extrabold text-primary-dark mb-3">Ada Pertanyaan?</h2>
          <p className="text-medium-gray text-sm mb-6 max-w-md mx-auto">
            Tim kami siap membantu kamu. Kirimkan pertanyaan atau masukan kamu melalui email.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="mailto:hello@onbill.id"
              className="inline-flex items-center gap-2 border border-border text-medium-gray font-semibold
                         text-sm px-6 py-3 rounded-xl hover:border-primary-teal hover:text-primary-teal transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              hello@onbill.id
            </a>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary-teal text-white font-bold
                         text-sm px-6 py-3 rounded-xl hover:bg-primary-teal/90 transition-all shadow-sm"
            >
              Mulai Gratis →
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo variant="full" height={24} />
          <p className="text-xs text-light-gray text-center">
            © {new Date().getFullYear()} Onbill. Dibuat dengan ❤️ untuk freelancer Indonesia.
          </p>
          <div className="flex items-center gap-4 text-xs text-light-gray">
            <Link href="/" className="hover:text-primary-teal transition-colors">Beranda</Link>
            <Link href="/about" className="hover:text-primary-teal transition-colors">Tentang</Link>
            <a href="mailto:hello@onbill.id" className="hover:text-primary-teal transition-colors">Kontak</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
