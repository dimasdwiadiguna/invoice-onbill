'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Toast } from '@/components/ui/Toast'
import { formatNPWP } from '@/lib/tax'

type Tab = 'profil' | 'pajak' | 'branding' | 'billing'

type Profile = {
  id: string
  name: string
  email: string
  address: string | null
  entity_type: 'individual' | 'cv' | 'pt' | null
  has_npwp: boolean
  npwp_number: string | null
  is_pkp: boolean
  logo_url: string | null
  brand_color: string | null
  preferred_font: string | null
  custom_footer: string | null
  plan: 'free' | 'pro'
  avatar_url: string | null
}

type ToastState = { message: string; type: 'error' | 'success' } | null

const FONTS = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', sample: 'Aa' },
  { value: 'Inter',             label: 'Inter',             sample: 'Aa' },
  { value: 'DM Sans',          label: 'DM Sans',           sample: 'Aa' },
]

const ENTITY_LABELS: Record<string, string> = {
  individual: 'Individu / Freelancer',
  cv:         'CV (Persekutuan Komanditer)',
  pt:         'PT (Perseroan Terbatas)',
}

/* ─── Spinner ───────────────────────────────────────────────── */
function Spinner() {
  return (
    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
  )
}

/* ─── Section card ──────────────────────────────────────────── */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
      {children}
    </div>
  )
}

/* ─── Field wrapper ─────────────────────────────────────────── */
function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-primary-dark">{label}</label>
      {children}
      {hint && <p className="text-xs text-light-gray">{hint}</p>}
    </div>
  )
}

/* ─── Input ─────────────────────────────────────────────────── */
function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                 placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors
                 bg-white disabled:bg-very-light-gray disabled:text-light-gray"
    />
  )
}

/* ─── Toggle ─────────────────────────────────────────────────  */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none',
          checked ? 'bg-primary-teal' : 'bg-border',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </button>
      <span className="text-sm text-primary-dark">{label}</span>
    </label>
  )
}

/* ─── Save button ───────────────────────────────────────────── */
function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        className="inline-flex items-center gap-2 bg-primary-teal text-white font-semibold
                   text-sm px-6 py-2.5 rounded-xl hover:bg-primary-teal/90 transition-all
                   disabled:opacity-60"
      >
        {saving ? <Spinner /> : null}
        {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
      </button>
    </div>
  )
}

/* ─── Pro gate ──────────────────────────────────────────────── */
function ProGate() {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
      <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
      </div>
      <h3 className="font-bold text-amber-900 mb-2">Fitur Pro</h3>
      <p className="text-sm text-amber-700 mb-5 max-w-xs mx-auto">
        Kustomisasi branding invoice kamu — logo, warna, font, dan footer — tersedia di plan Pro.
      </p>
      <ul className="text-xs text-amber-700 text-left inline-block mb-6 space-y-1.5">
        {[
          'Upload logo bisnis',
          'Pilih warna brand accent',
          'Pilih font invoice (3 pilihan)',
          'Custom teks footer',
          'Template kreator konten',
          'Invoice & klien unlimited',
          'Kirim email langsung dari Onbill',
          'Laporan rekap tahunan SPT',
        ].map(b => (
          <li key={b} className="flex items-center gap-2">
            <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            {b}
          </li>
        ))}
      </ul>
      <br />
      <a
        href="mailto:hello@onbill.id?subject=Upgrade%20ke%20Pro"
        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white
                   font-bold text-sm px-6 py-3 rounded-xl transition-all"
      >
        Upgrade ke Pro
      </a>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profil')
  const [profile,   setProfile]   = useState<Profile | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [toast,     setToast]     = useState<ToastState>(null)

  // Profil
  const [name,          setName]          = useState('')
  const [address,       setAddress]       = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null)

  // Pajak
  const [entityType,  setEntityType]  = useState<'individual' | 'cv' | 'pt'>('individual')
  const [hasNpwp,     setHasNpwp]     = useState(false)
  const [npwpNumber,  setNpwpNumber]  = useState('')
  const [isPkp,       setIsPkp]       = useState(false)

  // Branding
  const [brandColor,    setBrandColor]    = useState('#0E9CB4')
  const [preferredFont, setPreferredFont] = useState('Plus Jakarta Sans')
  const [customFooter,  setCustomFooter]  = useState('')
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [logoFile,      setLogoFile]      = useState<File | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('users')
      .select('id, name, email, address, entity_type, has_npwp, npwp_number, is_pkp, logo_url, brand_color, preferred_font, custom_footer, plan, avatar_url')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data as Profile)
      setName(data.name ?? '')
      setAddress(data.address ?? '')
      setAvatarPreview(data.avatar_url ?? null)
      setEntityType((data.entity_type as 'individual' | 'cv' | 'pt') ?? 'individual')
      setHasNpwp(data.has_npwp ?? false)
      setNpwpNumber(data.npwp_number ?? '')
      setIsPkp(data.is_pkp ?? false)
      setBrandColor(data.brand_color ?? '#0E9CB4')
      setPreferredFont(data.preferred_font ?? 'Plus Jakarta Sans')
      setCustomFooter(data.custom_footer ?? '')
      setLogoPreview(data.logo_url ?? null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Upload helper ───────────────────────────────────────── */
  async function uploadFile(
    file: File,
    path: string,
  ): Promise<string | null> {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from('user-assets')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) return null
    const { data: urlData } = supabase.storage
      .from('user-assets')
      .getPublicUrl(path)
    return urlData.publicUrl
  }

  /* ── Save: profil ────────────────────────────────────────── */
  async function saveProfil() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let avatar_url = profile?.avatar_url ?? null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() ?? 'jpg'
      avatar_url = await uploadFile(avatarFile, `${user.id}/avatar.${ext}`)
    }

    const { error } = await supabase
      .from('users')
      .update({ name: name.trim(), address: address.trim() || null, avatar_url })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setToast({ message: 'Gagal menyimpan profil. Coba lagi.', type: 'error' })
    } else {
      setToast({ message: 'Profil berhasil disimpan.', type: 'success' })
      setAvatarFile(null)
      load()
    }
  }

  /* ── Save: pajak ─────────────────────────────────────────── */
  async function savePajak() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const { error } = await supabase
      .from('users')
      .update({
        entity_type: entityType,
        has_npwp:    hasNpwp,
        npwp_number: hasNpwp ? npwpNumber.replace(/\D/g, '').slice(0, 15) || null : null,
        is_pkp:      isPkp,
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setToast({ message: 'Gagal menyimpan pengaturan pajak. Coba lagi.', type: 'error' })
    } else {
      setToast({ message: 'Pengaturan pajak berhasil disimpan. Berlaku untuk invoice selanjutnya.', type: 'success' })
      load()
    }
  }

  /* ── Save: branding ──────────────────────────────────────── */
  async function saveBranding() {
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let logo_url = profile?.logo_url ?? null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop() ?? 'png'
      logo_url = await uploadFile(logoFile, `${user.id}/logo.${ext}`)
    }

    const { error } = await supabase
      .from('users')
      .update({
        logo_url,
        brand_color:    brandColor,
        preferred_font: preferredFont,
        custom_footer:  customFooter.trim() || null,
      })
      .eq('id', user.id)

    setSaving(false)
    if (error) {
      setToast({ message: 'Gagal menyimpan branding. Coba lagi.', type: 'error' })
    } else {
      setToast({ message: 'Branding berhasil disimpan.', type: 'success' })
      setLogoFile(null)
      load()
    }
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'profil',   label: 'Profil' },
    { id: 'pajak',    label: 'Pajak' },
    { id: 'branding', label: profile?.plan === 'pro' ? 'Branding' : 'Branding ✦' },
    { id: 'billing',  label: 'Billing' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary-teal border-t-transparent animate-spin"/>
      </div>
    )
  }

  const isPro = profile?.plan === 'pro'

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-primary-dark">Pengaturan</h1>
        <p className="text-sm text-medium-gray mt-0.5">Kelola profil, pajak, dan preferensi akun kamu.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-very-light-gray p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150',
              activeTab === tab.id
                ? 'bg-white text-primary-teal shadow-sm'
                : 'text-medium-gray hover:text-primary-dark',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Profil ─────────────────────────────────────── */}
      {activeTab === 'profil' && (
        <Card>
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-subtle-teal flex-shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Foto profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary-teal">
                    {(name || profile?.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-primary-dark">{profile?.email}</p>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-xs text-primary-teal font-semibold hover:underline mt-1"
              >
                Ganti foto profil
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  setAvatarFile(file)
                  setAvatarPreview(URL.createObjectURL(file))
                }}
              />
            </div>
          </div>

          <Field label="Nama Lengkap / Nama Bisnis">
            <Input value={name} onChange={setName} placeholder="Nama kamu atau nama bisnis" />
          </Field>

          <Field
            label="Alamat"
            hint="Digunakan sebagai alamat pengirim di invoice."
          >
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Jl. Contoh No. 1, Jakarta Selatan 12345"
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                         placeholder:text-light-gray outline-none focus:border-primary-teal
                         transition-colors bg-white resize-none"
            />
          </Field>

          <SaveBtn saving={saving} onClick={saveProfil} />
        </Card>
      )}

      {/* ── Tab: Pajak ──────────────────────────────────────── */}
      {activeTab === 'pajak' && (
        <Card>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-xs text-blue-700 font-medium">
              Perubahan pengaturan pajak hanya berlaku untuk invoice yang dibuat setelah perubahan ini. Invoice lama tidak terpengaruh.
            </p>
          </div>

          <Field label="Jenis Entitas" hint="Menentukan jenis PPh yang dipotong klien (PPh 21 atau PPh 23).">
            <div className="space-y-2">
              {(['individual', 'cv', 'pt'] as const).map(et => (
                <label key={et} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="entity_type"
                    value={et}
                    checked={entityType === et}
                    onChange={() => setEntityType(et)}
                    className="w-4 h-4 accent-primary-teal"
                  />
                  <span className="text-sm text-primary-dark">{ENTITY_LABELS[et]}</span>
                </label>
              ))}
            </div>
          </Field>

          <div className="border-t border-border pt-4 space-y-4">
            <Toggle
              checked={hasNpwp}
              onChange={setHasNpwp}
              label="Saya memiliki NPWP"
            />

            {hasNpwp && (
              <Field label="Nomor NPWP" hint="Format: XX.XXX.XXX.X-XXX.XXX (15 digit)">
                <Input
                  value={formatNPWP(npwpNumber)}
                  onChange={v => setNpwpNumber(v.replace(/\D/g, '').slice(0, 15))}
                  placeholder="00.000.000.0-000.000"
                />
              </Field>
            )}

            {!hasNpwp && entityType === 'individual' && (
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                Tanpa NPWP: tarif PPh 21 yang dipotong klien lebih tinggi (3% vs 2,5%).
              </p>
            )}
          </div>

          <div className="border-t border-border pt-4">
            <Toggle
              checked={isPkp}
              onChange={setIsPkp}
              label="Saya adalah Pengusaha Kena Pajak (PKP)"
            />
            {isPkp && (
              <p className="text-xs text-medium-gray mt-2">
                Sebagai PKP, PPN 11% akan ditambahkan ke invoice kamu.
              </p>
            )}
          </div>

          {/* Live preview */}
          <div className="bg-very-light-gray rounded-xl p-4 border border-border">
            <p className="text-xs font-semibold text-medium-gray mb-2 uppercase tracking-wider">
              Simulasi Tarif Pajak
            </p>
            <div className="text-xs text-medium-gray space-y-1">
              <div className="flex justify-between">
                <span>Jenis PPh</span>
                <span className="font-semibold text-primary-dark">
                  {entityType === 'individual' ? 'PPh 21' : 'PPh 23'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tarif PPh</span>
                <span className="font-semibold text-primary-dark">
                  {entityType === 'individual'
                    ? hasNpwp ? '2,5%' : '3%'
                    : '2%'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>PPN (jika klien badan/pemerintah)</span>
                <span className="font-semibold text-primary-dark">
                  {isPkp ? '11%' : 'Tidak ada'}
                </span>
              </div>
            </div>
          </div>

          <SaveBtn saving={saving} onClick={savePajak} />
        </Card>
      )}

      {/* ── Tab: Branding ────────────────────────────────────── */}
      {activeTab === 'branding' && (
        isPro ? (
          <Card>
            {/* Logo */}
            <Field label="Logo Bisnis" hint="Format JPG, PNG, atau WebP. Maks 5 MB. Ditampilkan di header invoice.">
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded-xl border-2 border-dashed border-border bg-very-light-gray
                                flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
                  ) : (
                    <svg className="w-6 h-6 text-light-gray" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                    </svg>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="text-sm font-semibold text-primary-teal border border-primary-teal/30
                               bg-subtle-teal px-4 py-2 rounded-xl hover:bg-subtle-teal/70 transition-colors"
                  >
                    {logoPreview ? 'Ganti Logo' : 'Upload Logo'}
                  </button>
                  {logoPreview && (
                    <button
                      type="button"
                      onClick={() => { setLogoPreview(null); setLogoFile(null) }}
                      className="text-xs text-error font-medium hover:underline"
                    >
                      Hapus logo
                    </button>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setLogoFile(file)
                    setLogoPreview(URL.createObjectURL(file))
                  }}
                />
              </div>
            </Field>

            {/* Brand color */}
            <Field label="Warna Aksen Brand" hint="Digunakan untuk header, aksen, dan elemen dekoratif invoice.">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={brandColor}
                  onChange={e => setBrandColor(e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5"
                />
                <Input
                  value={brandColor}
                  onChange={v => {
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) setBrandColor(v)
                  }}
                  placeholder="#0E9CB4"
                />
                <div
                  className="w-10 h-10 rounded-lg border border-border flex-shrink-0"
                  style={{ backgroundColor: brandColor }}
                />
              </div>
            </Field>

            {/* Font */}
            <Field label="Font Invoice" hint="Font yang digunakan di seluruh invoice PDF kamu.">
              <div className="grid grid-cols-3 gap-3">
                {FONTS.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setPreferredFont(f.value)}
                    className={[
                      'p-3 rounded-xl border-2 text-center transition-all',
                      preferredFont === f.value
                        ? 'border-primary-teal bg-subtle-teal'
                        : 'border-border hover:border-primary-teal/40',
                    ].join(' ')}
                  >
                    <p className="text-lg font-bold text-primary-dark" style={{ fontFamily: f.value }}>
                      {f.sample}
                    </p>
                    <p className="text-xs text-medium-gray mt-1">{f.label}</p>
                  </button>
                ))}
              </div>
            </Field>

            {/* Footer text */}
            <Field
              label="Teks Footer Kustom"
              hint="Tampil di bagian bawah setiap invoice. Maks 200 karakter."
            >
              <textarea
                value={customFooter}
                onChange={e => setCustomFooter(e.target.value.slice(0, 200))}
                placeholder="Contoh: Terima kasih atas kepercayaan Anda. Pembayaran melalui BCA 1234567890 a/n Nama Kamu."
                rows={3}
                maxLength={200}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                           placeholder:text-light-gray outline-none focus:border-primary-teal
                           transition-colors bg-white resize-none"
              />
              <p className="text-right text-xs text-light-gray">{customFooter.length}/200</p>
            </Field>

            <SaveBtn saving={saving} onClick={saveBranding} />
          </Card>
        ) : (
          <ProGate />
        )
      )}

      {/* ── Tab: Billing ─────────────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="space-y-4">
          {/* Current plan */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-light-gray uppercase tracking-wider mb-1">
                  Plan Saat Ini
                </p>
                <div className="flex items-center gap-2">
                  <span className={[
                    'text-2xl font-extrabold',
                    isPro ? 'text-primary-teal' : 'text-primary-dark',
                  ].join(' ')}>
                    {isPro ? 'Pro' : 'Free'}
                  </span>
                  {isPro && (
                    <span className="text-xs font-bold text-white bg-primary-teal px-2 py-0.5 rounded-full">
                      AKTIF
                    </span>
                  )}
                </div>
              </div>
              {isPro ? (
                <div className="w-12 h-12 bg-primary-teal/10 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-teal" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 bg-very-light-gray rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-light-gray" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </div>
          </Card>

          {!isPro ? (
            /* Upgrade CTA */
            <div className="bg-gradient-to-br from-primary-teal/5 to-primary-teal/10 border border-primary-teal/20 rounded-2xl p-6">
              <h3 className="font-bold text-primary-dark text-lg mb-1">Upgrade ke Pro</h3>
              <p className="text-sm text-medium-gray mb-5">
                Buka semua fitur dan buat bisnis kamu terlihat lebih profesional.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
                {[
                  'Invoice & klien unlimited',
                  'Kirim invoice via email',
                  'Semua template invoice',
                  'Logo & branding kustom',
                  'Pilih font & warna brand',
                  'Custom footer teks',
                  'Laporan rekap tahunan SPT',
                  'Prioritas dukungan',
                ].map(benefit => (
                  <li key={benefit} className="flex items-center gap-2 text-sm text-medium-gray">
                    <svg className="w-4 h-4 text-primary-teal flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {benefit}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:hello@onbill.id?subject=Upgrade%20ke%20Pro"
                className="inline-flex items-center gap-2 bg-primary-teal text-white font-bold
                           text-sm px-6 py-3 rounded-xl hover:bg-primary-teal/90 transition-all shadow-sm"
              >
                Upgrade ke Pro →
              </a>
              <p className="text-xs text-light-gray mt-3">
                Hubungi kami via email untuk informasi harga dan aktivasi.
              </p>
            </div>
          ) : (
            /* Pro management */
            <Card>
              <div>
                <p className="text-sm font-semibold text-primary-dark mb-0.5">Langganan Pro Aktif</p>
                <p className="text-xs text-medium-gray">
                  Kamu menikmati semua fitur Pro. Terima kasih sudah mendukung Onbill!
                </p>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-medium-gray uppercase tracking-wider mb-3">
                  Butuh bantuan?
                </p>
                <a
                  href="mailto:hello@onbill.id?subject=Manajemen%20Langganan%20Pro"
                  className="text-sm text-primary-teal font-semibold hover:underline"
                >
                  Hubungi support via email →
                </a>
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs text-light-gray mb-3">
                  Untuk membatalkan langganan, hubungi tim kami setidaknya 3 hari sebelum tanggal renewal.
                </p>
                <a
                  href="mailto:hello@onbill.id?subject=Batalkan%20Langganan%20Pro"
                  className="text-sm text-error font-semibold hover:underline"
                >
                  Batalkan langganan
                </a>
              </div>
            </Card>
          )}
        </div>
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
