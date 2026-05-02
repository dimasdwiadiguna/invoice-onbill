'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatNPWP, type ClientEntityType } from '@/lib/tax'
import { Toast } from '@/components/ui/Toast'

type FormState = {
  name: string
  address: string
  npwp: string
  npwpDisplay: string
  pic_name: string
  pic_email: string
  internal_notes: string
  entity_type: ClientEntityType
}

type Errors = Partial<Record<keyof FormState | 'root', string>>
type ToastState = { message: string; type: 'error' | 'success' } | null

const EMPTY: FormState = {
  name: '', address: '', npwp: '', npwpDisplay: '',
  pic_name: '', pic_email: '', internal_notes: '',
  entity_type: 'badan_usaha',
}

const ENTITY_OPTIONS: { value: ClientEntityType; label: string; desc: string }[] = [
  { value: 'badan_usaha', label: 'Badan Usaha',  desc: 'PT, CV, Firma, Koperasi, dll.' },
  { value: 'pemerintah',  label: 'Pemerintah',   desc: 'Instansi / lembaga pemerintah' },
  { value: 'perorangan',  label: 'Perorangan',   desc: 'Individu / UMKM tanpa badan hukum' },
]

/* ─── Tour step definitions ──────────────────────────────────── */
const TOUR_STEPS = [
  {
    title: 'Siapa klienmu?',
    body: 'Tipe entitas menentukan jenis pajak yang berlaku. Badan usaha (PT/CV) dikenakan PPh 23, sedangkan perorangan tidak memotong PPh.',
    section: 'entity',
  },
  {
    title: 'Data utama klien',
    body: 'Nama dan alamat ini akan muncul di invoice. Masukkan nama resmi perusahaan atau individu sesuai dokumen legalnya.',
    section: 'main',
  },
  {
    title: 'Siapa yang dihubungi?',
    body: 'PIC (Person in Charge) adalah orang yang menerima invoice. Email PIC akan dipakai untuk mengirim invoice langsung ke mereka.',
    section: 'pic',
  },
  {
    title: 'Catatan internal',
    body: 'Catatan ini hanya bisa kamu lihat — tidak muncul di invoice. Cocok untuk menyimpan terms pembayaran atau instruksi khusus.',
    section: 'notes',
  },
] as const

type TourSection = typeof TOUR_STEPS[number]['section']

/* ─── Tour banner ────────────────────────────────────────────── */
function TourBanner({
  step,
  total,
  title,
  body,
  onNext,
  onSkip,
}: {
  step: number
  total: number
  title: string
  body: string
  onNext: () => void
  onSkip: () => void
}) {
  return (
    <div className="mx-6 mt-5 mb-1 bg-subtle-teal border border-primary-teal/25 rounded-2xl px-5 py-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary-teal bg-primary-teal/10 px-2 py-0.5 rounded-full">
            Panduan {step}/{total}
          </span>
          <p className="text-sm font-bold text-primary-dark">{title}</p>
        </div>
        <button
          onClick={onSkip}
          className="text-xs text-medium-gray hover:text-primary-dark transition-colors flex-shrink-0"
        >
          Lewati
        </button>
      </div>
      <p className="text-xs text-medium-gray leading-relaxed mb-3">{body}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${i < step ? 'w-4 bg-primary-teal' : 'w-1.5 bg-border'}`}
            />
          ))}
        </div>
        <button
          onClick={onNext}
          className="text-xs font-bold text-white bg-primary-teal hover:bg-primary-teal/90
                     px-3 py-1.5 rounded-lg transition-all"
        >
          {step < total ? 'Lanjut →' : 'Selesai ✓'}
        </button>
      </div>
    </div>
  )
}

/* ─── Highlight wrapper ──────────────────────────────────────── */
function TourSection({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  return (
    <div className={[
      'rounded-xl transition-all duration-300',
      active ? 'ring-2 ring-primary-teal/50 ring-offset-2 bg-subtle-teal/20' : '',
    ].join(' ')}>
      {children}
    </div>
  )
}

type Props = {
  clientId: string | null  // null = new client, string = edit existing
  onClose: () => void
  onSaved: (id: string) => void
  tourMode?: boolean
}

export function ClientFormModal({ clientId, onClose, onSaved, tourMode = false }: Props) {
  const isNew = clientId === null

  const [form,     setForm]     = useState<FormState>(EMPTY)
  const [errors,   setErrors]   = useState<Errors>({})
  const [loading,  setLoading]  = useState(!isNew)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [toast,    setToast]    = useState<ToastState>(null)
  const [userId,   setUserId]   = useState<string | null>(null)

  /* Tour state: 0 = tour complete/dismissed, 1..4 = active step */
  const [tourStep, setTourStep] = useState(tourMode ? 1 : 0)
  const activeTourSection: TourSection | null = tourStep > 0
    ? TOUR_STEPS[tourStep - 1].section
    : null

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      if (!isNew && clientId) {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .eq('user_id', user.id)
          .single()

        if (error || !data) { onClose(); return }

        const npwpRaw = data.npwp ?? ''
        setForm({
          name:           data.name ?? '',
          address:        data.address ?? '',
          npwp:           npwpRaw,
          npwpDisplay:    formatNPWP(npwpRaw),
          pic_name:       data.pic_name ?? '',
          pic_email:      data.pic_email ?? '',
          internal_notes: data.internal_notes ?? '',
          entity_type:    (data.entity_type as ClientEntityType) ?? 'badan_usaha',
        })
      }
      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  function handleNpwpChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 15)
    setForm(prev => ({ ...prev, npwp: raw, npwpDisplay: formatNPWP(raw) }))
    setErrors(prev => ({ ...prev, npwp: raw.length > 0 && raw.length < 15 ? 'NPWP harus 15 digit.' : undefined }))
  }

  function validate(): boolean {
    const e: Errors = {}
    if (!form.name.trim())                                         e.name      = 'Nama klien wajib diisi.'
    if (form.pic_email && !/\S+@\S+\.\S+/.test(form.pic_email))  e.pic_email = 'Format email tidak valid.'
    if (form.npwp && form.npwp.length < 15)                       e.npwp      = 'NPWP harus 15 digit.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSave() {
    if (!validate() || !userId) return
    setSaving(true)

    const supabase = createClient()
    const payload = {
      user_id:        userId,
      name:           form.name.trim(),
      address:        form.address.trim() || null,
      npwp:           form.npwp || null,
      pic_name:       form.pic_name.trim() || null,
      pic_email:      form.pic_email.trim() || null,
      internal_notes: form.internal_notes.trim() || null,
      entity_type:    form.entity_type,
    }

    if (isNew) {
      const { data, error } = await supabase.from('clients').insert(payload).select('id').single()
      if (error || !data) {
        setToast({ message: 'Gagal menyimpan. Coba lagi.', type: 'error' })
        setSaving(false)
        return
      }
      onSaved(data.id)
    } else {
      const { error } = await supabase.from('clients').update(payload).eq('id', clientId!)
      if (error) {
        setToast({ message: 'Gagal menyimpan. Coba lagi.', type: 'error' })
        setSaving(false)
        return
      }
      onSaved(clientId!)
    }
  }

  async function handleDelete() {
    if (isNew || !userId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', clientId!)
      .eq('user_id', userId)

    if (error) {
      setToast({ message: 'Gagal menghapus. Coba lagi.', type: 'error' })
      setDeleting(false)
      setConfirmDelete(false)
    } else {
      onSaved('deleted')
    }
  }

  const title = isNew ? 'Tambah Klien Baru' : 'Edit Klien'

  return (
    <div className="fixed inset-0 z-50">
      {/* Desktop backdrop */}
      <div
        className="hidden sm:block absolute inset-0 bg-dark-charcoal/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={[
        'relative z-10 flex flex-col bg-white overflow-hidden',
        'w-full h-[100dvh]',
        'sm:absolute sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
        'sm:w-[calc(100vw-2rem)] sm:max-w-xl sm:max-h-[88vh] sm:h-auto sm:rounded-2xl sm:shadow-2xl',
      ].join(' ')}>

        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-primary-dark">{title}</h2>
            {tourMode && tourStep > 0 && (
              <span className="text-xs bg-primary-teal/10 text-primary-teal font-semibold px-2 py-0.5 rounded-full">
                Panduan aktif
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-light-gray hover:text-primary-dark hover:bg-very-light-gray transition-colors"
            aria-label="Tutup"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 rounded-full border-2 border-primary-teal border-t-transparent animate-spin"/>
            </div>
          ) : (
            <>
              {/* Tour banner — shown above the form when tour is active */}
              {tourStep > 0 && (
                <TourBanner
                  step={tourStep}
                  total={TOUR_STEPS.length}
                  title={TOUR_STEPS[tourStep - 1].title}
                  body={TOUR_STEPS[tourStep - 1].body}
                  onNext={() => setTourStep(s => s < TOUR_STEPS.length ? s + 1 : 0)}
                  onSkip={() => setTourStep(0)}
                />
              )}

              <div className="p-6 space-y-5">

                {/* Entity type */}
                <TourSection active={activeTourSection === 'entity'}>
                  <div className={activeTourSection === 'entity' ? 'p-3' : ''}>
                    <label className="block text-sm font-medium text-primary-dark mb-2">
                      Tipe entitas klien <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {ENTITY_OPTIONS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => set('entity_type', opt.value)}
                          className={[
                            'text-left px-4 py-3 rounded-xl border-2 transition-all',
                            form.entity_type === opt.value
                              ? 'border-primary-teal bg-subtle-teal'
                              : 'border-border bg-white hover:border-primary-teal/50',
                          ].join(' ')}
                        >
                          <p className="text-sm font-semibold text-primary-dark">{opt.label}</p>
                          <p className="text-xs text-medium-gray mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </TourSection>

                <div className="border-t border-border"/>

                {/* Name + Address + NPWP */}
                <TourSection active={activeTourSection === 'main'}>
                  <div className={`space-y-4 ${activeTourSection === 'main' ? 'p-3' : ''}`}>
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-primary-dark mb-1.5">
                        Nama perusahaan / individu <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => set('name', e.target.value)}
                        placeholder="PT Maju Bersama / Budi Santoso"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-primary-dark
                                    placeholder:text-light-gray outline-none transition-colors
                                    ${errors.name ? 'border-error' : 'border-border focus:border-primary-teal'}`}
                      />
                      {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-medium text-primary-dark mb-1.5">Alamat lengkap</label>
                      <textarea
                        value={form.address}
                        onChange={e => set('address', e.target.value)}
                        placeholder="Jl. Sudirman No. 1, Jakarta Pusat"
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                                   placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors resize-none"
                      />
                    </div>

                    {/* NPWP */}
                    <div>
                      <label className="block text-sm font-medium text-primary-dark mb-1.5">
                        NPWP <span className="text-light-gray font-normal">(opsional)</span>
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.npwpDisplay}
                        onChange={handleNpwpChange}
                        placeholder="00.000.000.0-000.000"
                        className={`w-full px-4 py-2.5 rounded-xl border text-sm text-primary-dark font-mono
                                    placeholder:text-light-gray placeholder:font-sans outline-none transition-colors
                                    ${errors.npwp ? 'border-error' : 'border-border focus:border-primary-teal'}`}
                      />
                      {errors.npwp && <p className="text-xs text-error mt-1">{errors.npwp}</p>}
                      {!errors.npwp && form.npwp.length === 15 && (
                        <p className="text-xs text-success mt-1">NPWP valid ✓</p>
                      )}
                    </div>
                  </div>
                </TourSection>

                <div className="border-t border-border"/>

                {/* PIC */}
                <TourSection active={activeTourSection === 'pic'}>
                  <div className={activeTourSection === 'pic' ? 'p-3' : ''}>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-primary-dark mb-1.5">Nama PIC</label>
                        <input
                          type="text"
                          value={form.pic_name}
                          onChange={e => set('pic_name', e.target.value)}
                          placeholder="Nama contact person"
                          className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                                     placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-primary-dark mb-1.5">Email PIC</label>
                        <input
                          type="email"
                          value={form.pic_email}
                          onChange={e => set('pic_email', e.target.value)}
                          placeholder="finance@perusahaan.com"
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm text-primary-dark
                                      placeholder:text-light-gray outline-none transition-colors
                                      ${errors.pic_email ? 'border-error' : 'border-border focus:border-primary-teal'}`}
                        />
                        {errors.pic_email && <p className="text-xs text-error mt-1">{errors.pic_email}</p>}
                      </div>
                    </div>
                  </div>
                </TourSection>

                {/* Internal notes */}
                <TourSection active={activeTourSection === 'notes'}>
                  <div className={activeTourSection === 'notes' ? 'p-3' : ''}>
                    <label className="block text-sm font-medium text-primary-dark mb-1.5">
                      Catatan internal <span className="text-light-gray font-normal">(tidak tampil di invoice)</span>
                    </label>
                    <textarea
                      value={form.internal_notes}
                      onChange={e => set('internal_notes', e.target.value)}
                      placeholder="Misal: NET 30, invoice dikirim ke finance dept…"
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                                 placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors resize-none"
                    />
                  </div>
                </TourSection>

              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t border-border bg-white">
            {/* Delete (edit mode only) */}
            {!isNew ? (
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="text-sm font-semibold text-error hover:bg-error/8 px-4 py-2.5 rounded-xl
                           border border-error/20 hover:border-error/40 transition-all disabled:opacity-50"
              >
                {deleting ? 'Menghapus…' : 'Hapus Klien'}
              </button>
            ) : <div />}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="text-sm font-semibold text-medium-gray border border-border px-5 py-2.5
                           rounded-xl hover:border-primary-teal hover:text-primary-teal transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="text-sm font-semibold text-white bg-primary-teal px-5 py-2.5 rounded-xl
                           hover:bg-primary-teal/90 disabled:opacity-60 transition-all shadow-sm"
              >
                {saving ? 'Menyimpan…' : isNew ? 'Simpan Klien' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm delete overlay */}
      {confirmDelete && (
        <div className="absolute inset-0 z-20 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-dark-charcoal/40" onClick={() => setConfirmDelete(false)}/>
          <div className="relative bg-white rounded-2xl border border-border shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-primary-dark mb-2">Hapus klien?</h3>
            <p className="text-sm text-medium-gray mb-6">
              <strong>{form.name}</strong> akan dihapus. Invoice yang sudah dibuat tetap tersimpan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-border text-medium-gray font-semibold text-sm py-2.5 rounded-xl hover:border-primary-teal transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-error text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-error/90 disabled:opacity-60 transition-all"
              >
                {deleting ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)}/>}
    </div>
  )
}
