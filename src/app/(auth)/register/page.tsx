'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'

type ToastState = { message: string; type: 'error' | 'success' } | null

export default function RegisterPage() {
  const router = useRouter()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [toast,    setToast]    = useState<ToastState>(null)
  const [errors,   setErrors]   = useState<{ name?: string; email?: string; password?: string }>({})

  function validate() {
    const e: typeof errors = {}
    if (!name.trim())                      e.name     = 'Nama wajib diisi.'
    if (!email)                            e.email    = 'Email wajib diisi.'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email    = 'Format email tidak valid.'
    if (!password)                         e.password = 'Password wajib diisi.'
    else if (password.length < 8)          e.password = 'Password minimal 8 karakter.'
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setErrors({})
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name.trim() } },
    })

    if (error) {
      const msg = error.message.toLowerCase().includes('already registered')
        ? 'Email ini sudah terdaftar. Coba masuk.'
        : 'Gagal mendaftar. Coba lagi.'
      setToast({ message: msg, type: 'error' })
      setLoading(false)
      return
    }

    // If email confirmation is disabled, session is available immediately.
    if (data.session) {
      router.push('/onboarding')
      router.refresh()
      return
    }

    // Email confirmation required — show message and stay on page.
    setToast({
      message: 'Cek emailmu untuk konfirmasi, lalu masuk.',
      type: 'success',
    })
    setLoading(false)
  }

  return (
    <>
      <h1 className="text-xl font-bold text-primary-dark mb-1">Buat akun Onbill</h1>
      <p className="text-sm text-medium-gray mb-8">
        Sudah punya akun?{' '}
        <a href="/login" className="text-primary-teal font-semibold hover:underline">
          Masuk di sini
        </a>
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-primary-dark mb-1.5">
            Nama lengkap
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Budi Santoso"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm text-primary-dark placeholder:text-light-gray
                        outline-none transition-colors
                        ${errors.name
                          ? 'border-error focus:border-error'
                          : 'border-border focus:border-primary-teal'}`}
          />
          {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary-dark mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="kamu@email.com"
            className={`w-full px-4 py-2.5 rounded-xl border text-sm text-primary-dark placeholder:text-light-gray
                        outline-none transition-colors
                        ${errors.email
                          ? 'border-error focus:border-error'
                          : 'border-border focus:border-primary-teal'}`}
          />
          {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-primary-dark mb-1.5">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPwd ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className={`w-full px-4 py-2.5 pr-11 rounded-xl border text-sm text-primary-dark placeholder:text-light-gray
                          outline-none transition-colors
                          ${errors.password
                            ? 'border-error focus:border-error'
                            : 'border-border focus:border-primary-teal'}`}
            />
            <button
              type="button"
              onClick={() => setShowPwd(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-light-gray hover:text-medium-gray"
              aria-label={showPwd ? 'Sembunyikan password' : 'Tampilkan password'}
            >
              {showPwd
                ? <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13.875 9.875a4 4 0 11-7.75 0 4 4 0 017.75 0z"/><path fillRule="evenodd" d="M10 3C5.5 3 1.73 5.89.18 10c1.55 4.11 5.32 7 9.82 7s8.27-2.89 9.82-7C18.27 5.89 14.5 3 10 3zm-4 7a4 4 0 118 0 4 4 0 01-8 0z" clipRule="evenodd"/></svg>
                : <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.515a4 4 0 00-5.478-5.48z" clipRule="evenodd"/><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z"/></svg>
              }
            </button>
          </div>
          {errors.password && <p className="text-xs text-error mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-teal text-white font-semibold text-sm py-3 rounded-xl
                     hover:bg-primary-teal/90 disabled:opacity-60 transition-all"
        >
          {loading ? 'Memproses…' : 'Daftar Gratis'}
        </button>

        <p className="text-xs text-light-gray text-center">
          Dengan mendaftar, kamu menyetujui{' '}
          <a href="/syarat" className="underline hover:text-medium-gray">Syarat & Ketentuan</a>{' '}
          dan{' '}
          <a href="/privasi" className="underline hover:text-medium-gray">Kebijakan Privasi</a>{' '}
          Onbill.
        </p>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
