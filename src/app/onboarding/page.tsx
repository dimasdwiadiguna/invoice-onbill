'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatNPWP } from '@/lib/tax'
import { Toast } from '@/components/ui/Toast'

type EntityType = 'individual' | 'cv' | 'pt'
type ToastState = { message: string; type: 'error' | 'success' } | null

/* ─── Step indicator ─────────────────────────────────────────── */
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={[
            'rounded-full transition-all duration-300',
            i < current
              ? 'w-6 h-2 bg-primary-teal'
              : i === current
              ? 'w-6 h-2 bg-primary-teal'
              : 'w-2 h-2 bg-border',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

/* ─── Option card ────────────────────────────────────────────── */
function OptionCard({
  selected,
  onClick,
  icon,
  title,
  hint,
}: {
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  hint: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full flex items-start gap-4 text-left px-5 py-4 rounded-2xl border-2 transition-all duration-200',
        selected
          ? 'border-primary-teal bg-subtle-teal'
          : 'border-border bg-white hover:border-primary-teal/50',
      ].join(' ')}
    >
      <span className="text-2xl mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <p className="font-semibold text-primary-dark text-sm">{title}</p>
        <p className="text-xs text-medium-gray mt-0.5 leading-relaxed">{hint}</p>
      </div>
      {selected && (
        <svg className="w-5 h-5 text-primary-teal ml-auto flex-shrink-0 mt-0.5"
          viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" clipRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
        </svg>
      )}
    </button>
  )
}

/* ─── Main page ──────────────────────────────────────────────── */
export default function OnboardingPage() {
  const router   = useRouter()
  const supabase = createClient()

  const [checking,    setChecking]    = useState(true)
  const [userId,      setUserId]      = useState<string | null>(null)
  const [step,        setStep]        = useState(1)
  const [entityType,  setEntityType]  = useState<EntityType | null>(null)
  const [hasNpwp,     setHasNpwp]     = useState<boolean | null>(null)
  const [npwpRaw,     setNpwpRaw]     = useState('')
  const [npwpDisplay, setNpwpDisplay] = useState('')
  const [npwpError,   setNpwpError]   = useState('')
  const [isPkp,       setIsPkp]       = useState<boolean | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [toast,       setToast]       = useState<ToastState>(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: profile } = await supabase
        .from('users')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) { router.replace('/dashboard'); return }

      setUserId(user.id)
      setChecking(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleNpwpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 15)
    setNpwpRaw(raw)
    setNpwpDisplay(formatNPWP(raw))
    setNpwpError(raw.length > 0 && raw.length < 15 ? 'Nomor NPWP harus 15 digit.' : '')
  }

  async function handleFinish() {
    if (!entityType || !userId) return

    if (entityType === 'individual') {
      if (hasNpwp === null) return
      if (hasNpwp && npwpRaw.length < 15) {
        setNpwpError('Nomor NPWP harus 15 digit.')
        return
      }
    } else {
      if (isPkp === null) return
    }

    setSaving(true)

    const patch: Record<string, unknown> = {
      entity_type: entityType,
      has_npwp: entityType === 'individual' ? (hasNpwp ?? false) : false,
      npwp_number: entityType === 'individual' && hasNpwp ? npwpRaw : null,
      is_pkp: entityType !== 'individual' ? (isPkp ?? false) : false,
      onboarding_completed: true,
    }

    const { error } = await supabase.from('users').update(patch).eq('id', userId)

    if (error) {
      setToast({ message: 'Gagal menyimpan. Coba lagi.', type: 'error' })
      setSaving(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  /* ── Loading / checking state ─────────────────────────────── */
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-light-cream">
        <div className="w-6 h-6 rounded-full border-2 border-primary-teal border-t-transparent animate-spin" />
      </div>
    )
  }

  const isStep1Done = entityType !== null
  const isStep2Done = entityType === 'individual'
    ? hasNpwp !== null && (!hasNpwp || npwpRaw.length === 15)
    : isPkp !== null

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-light-cream flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <a href="/" className="mb-10 flex items-center select-none">
        <span className="text-2xl font-extrabold tracking-tight text-primary-teal">On</span>
        <span className="text-2xl font-extrabold tracking-tight text-primary-dark">bill</span>
      </a>

      <div className="w-full max-w-md bg-white rounded-2xl border border-border shadow-sm px-8 py-10">
        {/* Step label */}
        <p className="text-xs font-semibold text-light-gray text-center uppercase tracking-widest mb-3">
          Langkah {step} dari 2
        </p>

        <StepDots current={step - 1} total={2} />

        {/* ── Step 1 ──────────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h1 className="text-xl font-bold text-primary-dark text-center mb-2">
              Kamu invoice sebagai apa?
            </h1>
            <p className="text-sm text-medium-gray text-center mb-8">
              Ini menentukan jenis pajak yang dipakai di invoicemu.
            </p>

            <div className="space-y-3 mb-8">
              <OptionCard
                selected={entityType === 'individual'}
                onClick={() => setEntityType('individual')}
                icon="👤"
                title="Diri sendiri (individu)"
                hint="Kamu akan dikenakan PPh 21 — pajak penghasilan orang pribadi."
              />
              <OptionCard
                selected={entityType === 'cv' || entityType === 'pt'}
                onClick={() => setEntityType('cv')}
                icon="🏢"
                title="Perusahaan (CV atau PT)"
                hint="Kamu akan dikenakan PPh 23 — pajak untuk badan usaha."
              />
            </div>

            <button
              onClick={() => isStep1Done && setStep(2)}
              disabled={!isStep1Done}
              className="w-full bg-primary-teal text-white font-semibold text-sm py-3 rounded-xl
                         hover:bg-primary-teal/90 disabled:opacity-40 transition-all"
            >
              Lanjut →
            </button>
          </>
        )}

        {/* ── Step 2: individual ──────────────────────────────── */}
        {step === 2 && entityType === 'individual' && (
          <>
            <h1 className="text-xl font-bold text-primary-dark text-center mb-2">
              Apakah kamu punya NPWP?
            </h1>
            <p className="text-sm text-medium-gray text-center mb-8">
              NPWP mempengaruhi tarif PPh 21 yang berlaku untukmu.
            </p>

            <div className="space-y-3 mb-6">
              <OptionCard
                selected={hasNpwp === true}
                onClick={() => setHasNpwp(true)}
                icon="✅"
                title="Ya, punya NPWP"
                hint="Tarif PPh 21 kamu: 2,5% dari nilai jasa."
              />
              <OptionCard
                selected={hasNpwp === false}
                onClick={() => { setHasNpwp(false); setNpwpRaw(''); setNpwpDisplay(''); setNpwpError('') }}
                icon="❌"
                title="Belum punya NPWP"
                hint="Tarif PPh 21 kamu: 3% (sedikit lebih tinggi sesuai aturan DJP)."
              />
            </div>

            {hasNpwp && (
              <div className="mb-6">
                <label htmlFor="npwp" className="block text-sm font-medium text-primary-dark mb-1.5">
                  Nomor NPWP
                </label>
                <input
                  id="npwp"
                  type="text"
                  inputMode="numeric"
                  value={npwpDisplay}
                  onChange={handleNpwpChange}
                  placeholder="00.000.000.0-000.000"
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm text-primary-dark font-mono
                              placeholder:text-light-gray placeholder:font-sans outline-none transition-colors
                              ${npwpError
                                ? 'border-error focus:border-error'
                                : 'border-border focus:border-primary-teal'}`}
                />
                {npwpError && <p className="text-xs text-error mt-1">{npwpError}</p>}
                {!npwpError && npwpRaw.length === 15 && (
                  <p className="text-xs text-success mt-1">Nomor NPWP valid ✓</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-border text-medium-gray font-semibold text-sm py-3
                           rounded-xl hover:border-primary-teal hover:text-primary-teal transition-all"
              >
                ← Kembali
              </button>
              <button
                onClick={handleFinish}
                disabled={!isStep2Done || saving}
                className="flex-1 bg-primary-teal text-white font-semibold text-sm py-3 rounded-xl
                           hover:bg-primary-teal/90 disabled:opacity-40 transition-all"
              >
                {saving ? 'Menyimpan…' : 'Selesai →'}
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: perusahaan ──────────────────────────────── */}
        {step === 2 && (entityType === 'cv' || entityType === 'pt') && (
          <>
            <h1 className="text-xl font-bold text-primary-dark text-center mb-2">
              Apakah usahamu sudah PKP?
            </h1>
            <p className="text-sm text-medium-gray text-center mb-8">
              PKP menentukan apakah PPN perlu dicantumkan di invoicemu.
            </p>

            <div className="space-y-3 mb-6">
              <OptionCard
                selected={isPkp === true}
                onClick={() => setIsPkp(true)}
                icon="✅"
                title="Sudah PKP (omzet > Rp 4,8M/tahun)"
                hint="Invoice akan otomatis menambahkan PPN 11% di atas nilai jasa."
              />
              <OptionCard
                selected={isPkp === false}
                onClick={() => setIsPkp(false)}
                icon="❌"
                title="Belum PKP"
                hint="PPN tidak perlu dicantumkan — hanya PPh 23 yang berlaku."
              />
            </div>

            {/* Tooltip info */}
            <div className="flex items-start gap-2 bg-subtle-teal rounded-xl px-4 py-3 mb-6">
              <svg className="w-4 h-4 text-primary-teal flex-shrink-0 mt-0.5" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm.75 10.5h-1.5v-5h1.5v5zm0-6.5h-1.5V3.5h1.5V5z"/>
              </svg>
              <p className="text-xs text-primary-teal leading-relaxed">
                <strong>PKP = Pengusaha Kena Pajak.</strong> Jika omzetmu masih di bawah
                Rp 4,8 miliar per tahun dan belum mendaftar sebagai PKP, pilih{' '}
                <em>Belum PKP</em>.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 border border-border text-medium-gray font-semibold text-sm py-3
                           rounded-xl hover:border-primary-teal hover:text-primary-teal transition-all"
              >
                ← Kembali
              </button>
              <button
                onClick={handleFinish}
                disabled={!isStep2Done || saving}
                className="flex-1 bg-primary-teal text-white font-semibold text-sm py-3 rounded-xl
                           hover:bg-primary-teal/90 disabled:opacity-40 transition-all"
              >
                {saving ? 'Menyimpan…' : 'Selesai →'}
              </button>
            </div>
          </>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
