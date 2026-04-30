'use client'

import { useEffect, useState } from 'react'

const NAV_LINKS = [
  { label: 'Fitur', href: '#fitur' },
  { label: 'Harga', href: '#harga' },
  { label: 'FAQ',   href: '#faq'   },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-border shadow-sm'
          : 'bg-transparent',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <a href="/" className="flex items-center select-none">
          <img src="/logo-full.png" alt="Onbill" className="h-8 w-auto" />
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm font-medium text-medium-gray hover:text-primary-dark transition-colors duration-200"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/masuk"
            className="text-sm font-semibold text-primary-dark border border-border rounded-xl px-4 py-2 hover:border-primary-teal hover:text-primary-teal transition-all duration-200"
          >
            Masuk
          </a>
          <a
            href="/daftar"
            className="text-sm font-semibold text-white bg-primary-teal rounded-xl px-4 py-2 hover:bg-primary-teal/90 transition-all duration-200 shadow-sm"
          >
            Daftar Gratis
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 text-medium-gray hover:text-primary-dark transition-colors"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-border px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-medium-gray hover:text-primary-dark transition-colors"
            >
              {label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-border">
            <a href="/masuk" className="text-sm font-semibold text-center text-primary-dark border border-border rounded-xl px-4 py-2.5">
              Masuk
            </a>
            <a href="/daftar" className="text-sm font-semibold text-center text-white bg-primary-teal rounded-xl px-4 py-2.5">
              Daftar Gratis
            </a>
          </div>
        </div>
      )}
    </header>
  )
}
