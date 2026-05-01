'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatNPWP } from '@/lib/tax'
import { Toast } from '@/components/ui/Toast'

type FormState = {
  name: string
  address: string
  npwp: string
  npwpDisplay: string
  pic_name: string
  pic_email: string
  internal_notes: string
}

type Errors = Partial<Record<keyof FormState | 'root', string>>
type ToastState = { message: string; type: 'error' | 'success' } | null

const EMPTY: FormState = {
  name: '', address: '', npwp: '', npwpDisplay: '',
  pic_name: '', pic_email: '', internal_notes: '',
}

export default function ClientDetailPage({ idOverride }: { idOverride?: string } = {}) {
  const router = useRouter()
  const { id: paramId } = useParams<{ id: string }>()
  const id     = idOverride ?? paramId
  const isNew  = id === 'new'

  const [form,     setForm]     = useState<FormState>(EMPTY)
  const [errors,   setErrors]   = useState<Errors>({})
  const [loading,  setLoading]  = useState(!isNew)
  const [saving,   setSaving]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [toast,    setToast]    = useState<ToastState>(null)
  const [userId,   setUserId]   = useState<string | null>(null)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)

      if (!isNew) {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (error || !data) {
          router.replace('/clients')
          return
        }

        const npwpRaw = data.npwp ?? ''
        setForm({
          name:           data.name ?? '',
          address:        data.address ?? '',
          npwp:           npwpRaw,
          npwpDisplay:    formatNPWP(npwpRaw),
          pic_name:       data.pic_name ?? '',
          pic_email:      data.pic_email ?? '',
          internal_notes: data.internal_notes ?? '',
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
    if (!form.name.trim())                               e.name     = 'Nama klien wajib diisi.'
    if (form.pic_email && !/\S+@\S+\.\S+/.test(form.pic_email)) e.pic_email = 'Format email tidak valid.'
    if (form.npwp && form.npwp.length < 15)             e.npwp     = 'NPWP harus 15 digit.'
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
    }

    if (isNew) {
      const { error } = await supabase.from('clients').insert(payload)
      if (error) {
        setToast({ message: 'Gagal menyimpan. Coba lagi.', type: 'error' })
        setSaving(false)
        return
      }
      setToast({ message: 'Klien berhasil ditambahkan.', type: 'success' })
      setTimeout(() => router.push('/clients'), 1200)
    } else {
      const { error } = await supabase.from('clients').update(payload).eq('id', id)
      if (error) {
        setToast({ message: 'Gagal menyimpan. Coba lagi.', type: 'error' })
        setSaving(false)
        return
      }
      setToast({ message: 'Perubahan berhasil disimpan.', type: 'success' })
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (isNew || !userId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('clients')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      setToast({ message: 'Gagal menghapus. Coba lagi.', type: 'error' })
      setDeleting(false)
    } else {
      router.push('/clients')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-primary-teal border-t-transparent animate-spin"/>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-medium-gray">
        <Link href="/clients" className="hover:text-primary-teal transition-colors">Klien</Link>
        <span>/</span>
        <span className="text-primary-dark font-medium">{isNew ? 'Tambah Klien' : form.name}</span>
      </div>

      <h1 className="text-2xl font-extrabold text-primary-dark">
        {isNew ? 'Tambah Klien Baru' : 'Edit Klien'}
      </h1>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">

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

        {/* Divider */}
        <div className="border-t border-border pt-1"/>

        {/* PIC */}
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

        {/* Internal notes */}
        <div>
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
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4">
        {!isNew ? (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm font-semibold text-error hover:bg-error/8 px-4 py-2.5 rounded-xl
                       border border-error/20 hover:border-error/40 transition-all disabled:opacity-50"
          >
            {deleting ? 'Menghapus…' : 'Hapus Klien'}
          </button>
        ) : <div />}

        <div className="flex gap-3">
          <Link
            href="/clients"
            className="text-sm font-semibold text-medium-gray border border-border px-5 py-2.5
                       rounded-xl hover:border-primary-teal hover:text-primary-teal transition-all"
          >
            Batal
          </Link>
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

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
