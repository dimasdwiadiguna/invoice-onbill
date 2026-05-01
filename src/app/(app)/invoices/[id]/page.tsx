'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/tax'
import { StatusBadge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'

/* ─── Types ──────────────────────────────────────────────────── */
type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  unit_price: number
  subtotal: number
}

type InvoiceDetail = {
  id: string
  invoice_number: string
  template: string
  status: InvoiceStatus
  issue_date: string
  due_date: string | null
  subtotal: number
  dpp: number
  pph_amount: number
  ppn_amount: number
  net_amount: number
  tax_type: string
  tax_rate: number
  memo: string | null
  invoice_meta: Record<string, string>
  client: {
    id: string
    name: string
    address: string | null
    npwp: string | null
    pic_name: string | null
    pic_email: string | null
  }
  items: InvoiceItem[]
}

type UserProfile = {
  name: string
  isPro: boolean
}

type ToastState = { message: string; type: 'error' | 'success' } | null

/* ─── Helpers ────────────────────────────────────────────────── */
function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function isOverdue(inv: InvoiceDetail): boolean {
  if (inv.status !== 'sent' || !inv.due_date) return false
  return inv.due_date < todayISO()
}

const TEMPLATE_LABELS: Record<string, string> = {
  it_software:        'IT & Software',
  konsultasi:         'Konsultasi & Jasa Umum',
  kreator_endorse:    'Kreator – Endorsement',
  kreator_production: 'Kreator – Konten',
  kreator_afiliasi:   'Kreator – Afiliasi',
  umkm_jasa:          'UMKM Jasa',
}

const TEMPLATE_META_LABELS: Record<string, Record<string, string>> = {
  it_software:        { project_name: 'Project', tech_stack: 'Tech Stack', period: 'Periode', milestone: 'Milestone' },
  konsultasi:         { scope: 'Scope', period: 'Periode', sessions_days: 'Sesi/Hari' },
  kreator_endorse:    { campaign_name: 'Campaign', platform: 'Platform', air_period: 'Periode Tayang', content_count: 'Jumlah Konten', format: 'Format' },
  kreator_production: { content_type: 'Jenis Konten', revision_count: 'Revisi', deliverable_list: 'Deliverable', deadline: 'Deadline' },
  kreator_afiliasi:   { commission_pct: 'Komisi', aff_period: 'Periode', transaction_count: 'Transaksi', affiliate_code: 'Kode Afiliasi' },
  umkm_jasa:          { service_description: 'Layanan', location: 'Lokasi', client_pic: 'PIC Klien' },
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function InvoiceDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [inv,            setInv]            = useState<InvoiceDetail | null>(null)
  const [profile,        setProfile]        = useState<UserProfile>({ name: '', isPro: false })
  const [loading,        setLoading]        = useState(true)
  const [updating,       setUpdating]       = useState(false)
  const [deleting,       setDeleting]       = useState(false)
  const [duplicating,    setDuplicating]    = useState(false)
  const [confirm,        setConfirm]        = useState(false)
  const [toast,          setToast]          = useState<ToastState>(null)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  /* Status transition modal */
  const [transitionTarget, setTransitionTarget] = useState<InvoiceStatus | null>(null)
  const [transitionDate,   setTransitionDate]   = useState(todayISO)

  /* Email modal */
  const [showEmail,   setShowEmail]   = useState(false)
  const [emailTo,     setEmailTo]     = useState('')
  const [emailSubj,   setEmailSubj]   = useState('')
  const [emailBody,   setEmailBody]   = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)

  /* Memo edit */
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoValue,   setMemoValue]   = useState('')
  const [savingMemo,  setSavingMemo]  = useState(false)

  const dateInputRef = useRef<HTMLInputElement>(null)

  /* ── Load ── */
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const [{ data: invData }, { data: itemsData }, { data: profileData }] = await Promise.all([
        supabase
          .from('invoices')
          .select('*, clients(id, name, address, npwp, pic_name, pic_email)')
          .eq('id', id)
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .single(),
        supabase
          .from('invoice_items')
          .select('id, description, quantity, unit_price, subtotal, sort_order')
          .eq('invoice_id', id)
          .order('sort_order'),
        supabase
          .from('users')
          .select('name, plan')
          .eq('id', user.id)
          .single(),
      ])

      if (!invData) { router.replace('/invoices'); return }

      const c = Array.isArray(invData.clients) ? invData.clients[0] : invData.clients

      let status = invData.status as InvoiceStatus

      /* Auto-set overdue on read */
      if (status === 'sent' && invData.due_date && invData.due_date < todayISO()) {
        status = 'overdue'
        supabase.from('invoices').update({ status: 'overdue' }).eq('id', id).then(() => {})
      }

      const detail: InvoiceDetail = {
        id:             invData.id,
        invoice_number: invData.invoice_number,
        template:       invData.template,
        status,
        issue_date:     invData.issue_date,
        due_date:       invData.due_date ?? null,
        subtotal:       invData.subtotal ?? 0,
        dpp:            invData.dpp ?? 0,
        pph_amount:     invData.pph_amount ?? 0,
        ppn_amount:     invData.ppn_amount ?? 0,
        net_amount:     invData.net_amount ?? 0,
        tax_type:       invData.tax_type ?? 'pph21',
        tax_rate:       Number(invData.tax_rate ?? 0),
        memo:           invData.memo ?? null,
        invoice_meta:   (invData.invoice_meta as Record<string, string>) ?? {},
        client:         c as InvoiceDetail['client'],
        items:          itemsData ?? [],
      }

      setInv(detail)
      setMemoValue(detail.memo ?? '')
      setProfile({ name: profileData?.name ?? '', isPro: profileData?.plan === 'pro' })

      /* Prefill email fields */
      setEmailTo(c?.pic_email ?? '')
      setEmailSubj(`Invoice ${invData.invoice_number} dari ${profileData?.name ?? ''}`)
      setEmailBody(
        `Halo ${c?.name ?? ''},\n\nTerlampir invoice ${invData.invoice_number} untuk layanan yang telah diberikan.\n\nMohon segera lakukan pembayaran sesuai jatuh tempo.\n\nTerima kasih,\n${profileData?.name ?? ''}`
      )

      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  /* ── Status update ── */
  async function confirmTransition() {
    if (!inv || !transitionTarget) return
    setUpdating(true)
    const supabase = createClient()
    const extra: Record<string, string> = {}
    if (transitionTarget === 'sent')  extra.sent_date = transitionDate
    if (transitionTarget === 'paid')  extra.paid_date = transitionDate
    const { error } = await supabase
      .from('invoices')
      .update({ status: transitionTarget, ...extra })
      .eq('id', inv.id)
    if (error) {
      setToast({ message: 'Gagal mengubah status. Coba lagi.', type: 'error' })
    } else {
      setInv(p => p ? { ...p, status: transitionTarget! } : p)
      setToast({ message: 'Status invoice diperbarui.', type: 'success' })
      setTransitionTarget(null)
    }
    setUpdating(false)
  }

  /* ── Delete ── */
  async function handleDelete() {
    if (!inv) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('invoices')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', inv.id)
    if (error) {
      setToast({ message: 'Gagal menghapus invoice.', type: 'error' })
      setDeleting(false)
    } else {
      router.push('/invoices')
    }
  }

  /* ── Duplicate ── */
  async function handleDuplicate() {
    if (!inv) return
    setDuplicating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setDuplicating(false); return }

    const today = todayISO()
    const d = new Date(today + 'T00:00:00')
    const year = d.getFullYear(), month = d.getMonth() + 1

    /* Get next sequence */
    const { data: seqData } = await supabase
      .from('invoice_number_sequences')
      .select('last_seq')
      .eq('user_id', user.id)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()

    const { data: profileData } = await supabase
      .from('users')
      .select('invoice_prefix')
      .eq('id', user.id)
      .single()

    const seq = (seqData?.last_seq ?? 0) + 1
    const prefix = profileData?.invoice_prefix?.trim() || 'INV'
    const newNumber = `${prefix}-${year}-${String(month).padStart(2, '0')}-${String(seq).padStart(3, '0')}`

    const { data: newInv, error: ie } = await supabase
      .from('invoices')
      .insert({
        user_id:        user.id,
        client_id:      inv.client.id,
        invoice_number: newNumber,
        template:       inv.template,
        status:         'draft',
        issue_date:     today,
        due_date:       null,
        subtotal:       inv.subtotal,
        dpp:            inv.dpp,
        pph_amount:     inv.pph_amount,
        ppn_amount:     inv.ppn_amount,
        net_amount:     inv.net_amount,
        tax_type:       inv.tax_type,
        tax_rate:       inv.tax_rate,
        memo:           inv.memo,
        invoice_meta:   inv.invoice_meta,
      })
      .select('id')
      .single()

    if (ie || !newInv) {
      setToast({ message: 'Gagal menduplikat invoice.', type: 'error' })
      setDuplicating(false)
      return
    }

    /* Copy items */
    const itemRows = inv.items.map((item, idx) => ({
      invoice_id:  newInv.id,
      description: item.description,
      quantity:    item.quantity,
      unit_price:  item.unit_price,
      subtotal:    item.subtotal,
      sort_order:  idx,
    }))
    if (itemRows.length > 0) {
      await supabase.from('invoice_items').insert(itemRows)
    }

    /* Update sequence */
    await supabase
      .from('invoice_number_sequences')
      .upsert({ user_id: user.id, year, month, last_seq: seq }, { onConflict: 'user_id,year,month' })

    router.push(`/invoices/${newInv.id}`)
  }

  /* ── Download PDF ── */
  async function handleDownloadPDF() {
    if (!inv) return
    setDownloadingPDF(true)
    try {
      const res = await fetch(`/api/invoice-pdf/${inv.id}`)
      if (!res.ok) throw new Error('PDF generation failed')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${inv.invoice_number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setToast({ message: 'Gagal membuat PDF. Coba lagi.', type: 'error' })
    } finally {
      setDownloadingPDF(false)
    }
  }

  /* ── Send Email ── */
  async function handleSendEmail(e: React.FormEvent) {
    e.preventDefault()
    if (!inv) return
    setSendingEmail(true)
    try {
      const res = await fetch('/api/invoice-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: inv.id,
          to:         emailTo,
          subject:    emailSubj,
          body:       emailBody,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Gagal mengirim')
      setShowEmail(false)
      setToast({ message: 'Invoice berhasil dikirim via email.', type: 'success' })
      if (inv.status === 'draft') {
        setInv(p => p ? { ...p, status: 'sent' } : p)
      }
    } catch (err: unknown) {
      setToast({ message: err instanceof Error ? err.message : 'Gagal mengirim email.', type: 'error' })
    } finally {
      setSendingEmail(false)
    }
  }

  /* ── Save Memo ── */
  async function handleSaveMemo() {
    if (!inv) return
    setSavingMemo(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('invoices')
      .update({ memo: memoValue.trim() || null })
      .eq('id', inv.id)
    if (error) {
      setToast({ message: 'Gagal menyimpan memo.', type: 'error' })
    } else {
      setInv(p => p ? { ...p, memo: memoValue.trim() || null } : p)
      setEditingMemo(false)
      setToast({ message: 'Memo disimpan.', type: 'success' })
    }
    setSavingMemo(false)
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-primary-teal border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!inv) return null

  const isLocked   = inv.status !== 'draft'
  const metaLabels  = TEMPLATE_META_LABELS[inv.template] ?? {}
  const metaEntries = Object.entries(inv.invoice_meta).filter(([k, v]) => v && metaLabels[k])

  /* Status transitions */
  const transitionMap: Record<InvoiceStatus, { label: string; next: InvoiceStatus }[]> = {
    draft:   [{ label: 'Tandai Terkirim', next: 'sent' }],
    sent:    [{ label: 'Tandai Dibayar', next: 'paid' }],
    paid:    [],
    overdue: [{ label: 'Tandai Dibayar', next: 'paid' }],
  }
  const transitions = transitionMap[inv.status]

  return (
    <div className="p-6 lg:p-8 max-w-4xl space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-medium-gray">
        <Link href="/invoices" className="hover:text-primary-teal transition-colors">Invoice</Link>
        <span>/</span>
        <span className="text-primary-dark font-medium">{inv.invoice_number}</span>
      </div>

      {/* Header row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-primary-dark">{inv.invoice_number}</h1>
            <StatusBadge status={inv.status} />
            {isLocked && (
              <span className="inline-flex items-center gap-1 text-xs text-medium-gray bg-very-light-gray border border-border px-2.5 py-0.5 rounded-full">
                <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
                Terkunci
              </span>
            )}
          </div>
          <p className="text-sm text-medium-gray">
            {TEMPLATE_LABELS[inv.template] ?? inv.template} · {inv.client.name}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Status transitions (Pro-only guard shown inline) */}
          {transitions.map(t => (
            <button
              key={t.next}
              type="button"
              onClick={() => {
                setTransitionTarget(t.next)
                setTransitionDate(todayISO())
              }}
              disabled={updating}
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-primary-teal text-white hover:bg-primary-teal/90 transition-all disabled:opacity-50 shadow-sm">
              {t.label}
            </button>
          ))}

          {/* Download PDF */}
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloadingPDF}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-border text-medium-gray hover:border-primary-teal hover:text-primary-teal transition-all disabled:opacity-50">
            {downloadingPDF ? (
              <div className="w-3.5 h-3.5 rounded-full border-2 border-primary-teal border-t-transparent animate-spin" />
            ) : (
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            )}
            {downloadingPDF ? 'Memproses…' : 'Download PDF'}
          </button>

          {/* Send Email (Pro only) */}
          {profile.isPro ? (
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-border text-medium-gray hover:border-primary-teal hover:text-primary-teal transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
              </svg>
              Kirim Email
            </button>
          ) : (
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-amber-200 text-amber-700 hover:bg-amber-50 transition-all">
              <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
              Kirim Email (Pro)
            </Link>
          )}

          {/* Duplicate */}
          <button
            type="button"
            onClick={handleDuplicate}
            disabled={duplicating}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl border border-border text-medium-gray hover:border-primary-teal hover:text-primary-teal transition-all disabled:opacity-50">
            <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z"/>
              <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z"/>
            </svg>
            {duplicating ? 'Menduplikat…' : 'Duplikat'}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => setConfirm(true)}
            disabled={deleting}
            className="text-sm font-semibold px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error/8 hover:border-error/50 transition-all disabled:opacity-50">
            {deleting ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </div>

      {/* Locked notice */}
      {isLocked && (
        <div className="bg-very-light-gray/60 border border-border rounded-xl px-4 py-3 flex items-start gap-2.5 text-sm text-medium-gray">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-light-gray" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
          </svg>
          Invoice sudah dikirim — item dan nominal tidak dapat diubah. Hanya memo dan status yang bisa diperbarui.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* ── Left: Main invoice card ── */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-border overflow-hidden">

            {/* Header band */}
            <div className="bg-subtle-teal px-6 py-5 border-b border-border flex items-start justify-between gap-4">
              <div>
                <p className="font-extrabold text-primary-dark text-base">{profile.name}</p>
              </div>
              <div className="text-right">
                <p className="font-extrabold text-primary-dark text-xl tracking-wide">INVOICE</p>
                <p className="text-primary-teal font-semibold text-sm mt-0.5">{inv.invoice_number}</p>
              </div>
            </div>

            {/* Dates + client */}
            <div className="px-6 py-5 grid sm:grid-cols-2 gap-6 border-b border-border text-sm">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-light-gray mb-0.5">Tanggal Invoice</p>
                  <p className="font-medium text-primary-dark">{fmtDate(inv.issue_date)}</p>
                </div>
                {inv.due_date && (
                  <div>
                    <p className="text-xs text-light-gray mb-0.5">Jatuh Tempo</p>
                    <p className={`font-medium ${isOverdue(inv) ? 'text-error' : 'text-primary-dark'}`}>
                      {fmtDate(inv.due_date)}
                      {isOverdue(inv) && (
                        <span className="ml-2 text-xs bg-error/10 text-error px-2 py-0.5 rounded-full">Lewat jatuh tempo</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-light-gray mb-0.5">Ditagihkan kepada</p>
                <p className="font-semibold text-primary-dark">{inv.client.name}</p>
                {inv.client.address  && <p className="text-medium-gray leading-relaxed">{inv.client.address}</p>}
                {inv.client.npwp     && <p className="text-medium-gray font-mono text-xs">NPWP: {inv.client.npwp}</p>}
                {inv.client.pic_name && <p className="text-medium-gray text-xs">PIC: {inv.client.pic_name}</p>}
              </div>
            </div>

            {/* Line items */}
            {inv.items.length > 0 && (
              <div className="px-6 py-5 border-b border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs text-light-gray font-semibold uppercase tracking-wider">
                      <th className="text-left pb-3 w-8">No</th>
                      <th className="text-left pb-3">Deskripsi</th>
                      <th className="text-center pb-3 w-16">Qty</th>
                      <th className="text-right pb-3 w-32">Harga Satuan</th>
                      <th className="text-right pb-3 w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {inv.items.map((item, idx) => (
                      <tr key={item.id}>
                        <td className="py-3 text-xs text-light-gray">{idx + 1}</td>
                        <td className="py-3 text-primary-dark">{item.description}</td>
                        <td className="py-3 text-center text-medium-gray">{item.quantity % 1 === 0 ? item.quantity : item.quantity.toFixed(2)}</td>
                        <td className="py-3 text-right tabular-nums text-medium-gray">{formatRupiah(item.unit_price)}</td>
                        <td className="py-3 text-right font-medium tabular-nums text-primary-dark">{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tax summary */}
            <div className="px-6 py-5 space-y-2 text-sm">
              <div className="flex justify-between text-medium-gray">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatRupiah(inv.subtotal)}</span>
              </div>
              <div className="flex justify-between text-medium-gray">
                <span>DPP (Dasar Pengenaan Pajak)</span>
                <span className="tabular-nums">{formatRupiah(inv.dpp)}</span>
              </div>
              {inv.pph_amount > 0 && (
                <div className="flex justify-between text-error">
                  <span>
                    {inv.tax_type === 'pph21' ? 'PPh 21' : 'PPh 23'} dipotong pemberi kerja ({(inv.tax_rate * 100).toFixed(1)}%)
                  </span>
                  <span className="tabular-nums">-{formatRupiah(inv.pph_amount)}</span>
                </div>
              )}
              {inv.ppn_amount > 0 && (
                <div className="flex justify-between text-success">
                  <span>PPN 11%</span>
                  <span className="tabular-nums">+{formatRupiah(inv.ppn_amount)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-bold text-primary-dark">Jumlah yang Dibayarkan</span>
                <span className="text-xl font-extrabold text-primary-teal tabular-nums">{formatRupiah(inv.net_amount)}</span>
              </div>
            </div>

            {/* Memo */}
            <div className="px-6 py-4 border-t border-border bg-very-light-gray/40">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-light-gray uppercase tracking-wider">Memo</p>
                {profile.isPro && !editingMemo && (
                  <button
                    type="button"
                    onClick={() => setEditingMemo(true)}
                    className="text-xs font-semibold text-primary-teal hover:underline">
                    Edit
                  </button>
                )}
              </div>
              {editingMemo ? (
                <div className="space-y-2">
                  <textarea
                    value={memoValue}
                    onChange={e => setMemoValue(e.target.value)}
                    rows={3}
                    placeholder="Catatan khusus…"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveMemo}
                      disabled={savingMemo}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-teal text-white hover:bg-primary-teal/90 transition-all disabled:opacity-50">
                      {savingMemo ? 'Menyimpan…' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingMemo(false); setMemoValue(inv.memo ?? '') }}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-medium-gray hover:border-primary-teal transition-all">
                      Batal
                    </button>
                  </div>
                </div>
              ) : inv.memo ? (
                <p className="text-sm text-medium-gray whitespace-pre-wrap">{inv.memo}</p>
              ) : (
                <p className="text-sm text-light-gray italic">
                  {profile.isPro ? 'Belum ada memo.' : 'Memo tersedia di Pro.'}
                </p>
              )}
            </div>
          </div>

          {/* Tax note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Catatan Pajak:</strong>{' '}
              {inv.tax_type === 'pph21'
                ? 'PPh 21 dipotong oleh pemberi kerja sesuai peraturan perpajakan Indonesia. Minta bukti potong setelah pembayaran.'
                : 'PPh 23 dipotong oleh klien/pemberi kerja sesuai peraturan perpajakan Indonesia. Pastikan kamu mendapat bukti potong.'}
            </p>
          </div>
        </div>

        {/* ── Right: Sidebar info ── */}
        <div className="space-y-4">

          {/* Template meta */}
          {metaEntries.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
              <p className="text-xs font-semibold text-light-gray uppercase tracking-wider">
                {TEMPLATE_LABELS[inv.template] ?? inv.template}
              </p>
              {metaEntries.map(([k, v]) => (
                <div key={k}>
                  <p className="text-xs text-light-gray">{metaLabels[k]}</p>
                  <p className="text-sm text-primary-dark font-medium">{v}</p>
                </div>
              ))}
            </div>
          )}

          {/* Client quick view */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-light-gray uppercase tracking-wider">Klien</p>
              <Link href={`/clients/${inv.client.id}`}
                className="text-xs font-semibold text-primary-teal hover:underline">
                Edit →
              </Link>
            </div>
            <div>
              <p className="font-semibold text-primary-dark text-sm">{inv.client.name}</p>
              {inv.client.pic_email && (
                <p className="text-xs text-medium-gray mt-0.5">{inv.client.pic_email}</p>
              )}
              {inv.client.address && (
                <p className="text-xs text-medium-gray mt-0.5 leading-relaxed">{inv.client.address}</p>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <p className="text-xs font-semibold text-light-gray uppercase tracking-wider">Ringkasan</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-medium-gray">Subtotal</span>
                <span className="font-medium tabular-nums">{formatRupiah(inv.subtotal)}</span>
              </div>
              {inv.pph_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-error">{inv.tax_type === 'pph21' ? 'PPh 21' : 'PPh 23'}</span>
                  <span className="text-error tabular-nums">-{formatRupiah(inv.pph_amount)}</span>
                </div>
              )}
              {inv.ppn_amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-success">PPN 11%</span>
                  <span className="text-success tabular-nums">+{formatRupiah(inv.ppn_amount)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-bold text-primary-dark">Total</span>
                <span className="font-extrabold text-primary-teal tabular-nums">{formatRupiah(inv.net_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Status Transition Modal ── */}
      {transitionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-dark-charcoal/40" onClick={() => setTransitionTarget(null)} />
          <div className="relative bg-white rounded-2xl border border-border shadow-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="font-bold text-primary-dark">
              {transitionTarget === 'sent' ? 'Tandai sebagai Terkirim' : 'Tandai sebagai Dibayar'}
            </h3>
            <div>
              <label className="block text-sm font-medium text-primary-dark mb-1.5">
                {transitionTarget === 'sent' ? 'Tanggal Kirim' : 'Tanggal Bayar'}
              </label>
              <input
                ref={dateInputRef}
                type="date"
                value={transitionDate}
                onChange={e => setTransitionDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark outline-none focus:border-primary-teal transition-colors"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTransitionTarget(null)}
                className="flex-1 border border-border text-medium-gray font-semibold text-sm py-2.5 rounded-xl hover:border-primary-teal transition-all">
                Batal
              </button>
              <button
                type="button"
                onClick={confirmTransition}
                disabled={updating || !transitionDate}
                className="flex-1 bg-primary-teal text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-primary-teal/90 transition-all disabled:opacity-50">
                {updating ? 'Menyimpan…' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email Modal ── */}
      {showEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-dark-charcoal/40" onClick={() => setShowEmail(false)} />
          <div className="relative bg-white rounded-2xl border border-border shadow-2xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-primary-dark">Kirim Invoice via Email</h3>
              <button
                type="button"
                onClick={() => setShowEmail(false)}
                className="p-1.5 text-medium-gray hover:text-primary-dark hover:bg-very-light-gray rounded-lg transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                </svg>
              </button>
            </div>
            <form onSubmit={handleSendEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1.5">
                  Kepada <span className="text-error">*</span>
                </label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={e => setEmailTo(e.target.value)}
                  required
                  placeholder="email@klien.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1.5">
                  Subject <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={emailSubj}
                  onChange={e => setEmailSubj(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-dark mb-1.5">Pesan Personal</label>
                <textarea
                  value={emailBody}
                  onChange={e => setEmailBody(e.target.value)}
                  rows={5}
                  placeholder="Pesan yang akan dikirimkan bersama invoice…"
                  className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors resize-none"
                />
                <p className="text-xs text-light-gray mt-1">PDF invoice akan otomatis dilampirkan.</p>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowEmail(false)}
                  className="flex-1 border border-border text-medium-gray font-semibold text-sm py-2.5 rounded-xl hover:border-primary-teal transition-all">
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail || !emailTo || !emailSubj}
                  className="flex-1 bg-primary-teal text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-primary-teal/90 transition-all disabled:opacity-50">
                  {sendingEmail ? 'Mengirim…' : 'Kirim Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-dark-charcoal/40" onClick={() => setConfirm(false)} />
          <div className="relative bg-white rounded-2xl border border-border shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-primary-dark mb-2">Hapus invoice?</h3>
            <p className="text-sm text-medium-gray mb-6">
              Invoice <strong>{inv.invoice_number}</strong> akan dihapus secara permanen.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="flex-1 border border-border text-medium-gray font-semibold text-sm py-2.5 rounded-xl hover:border-primary-teal transition-all">
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-error text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-error/90 transition-all disabled:opacity-50">
                {deleting ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
