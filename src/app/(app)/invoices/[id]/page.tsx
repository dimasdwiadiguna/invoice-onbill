'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
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
  client: { id: string; name: string; address: string | null; npwp: string | null; pic_name: string | null; pic_email: string | null }
  items: InvoiceItem[]
  user_name: string
}

type ToastState = { message: string; type: 'error' | 'success' } | null

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
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

const STATUS_TRANSITIONS: Record<InvoiceStatus, { label: string; next: InvoiceStatus }[]> = {
  draft:   [{ label: 'Tandai Terkirim', next: 'sent' }],
  sent:    [{ label: 'Tandai Dibayar', next: 'paid' }, { label: 'Tandai Overdue', next: 'overdue' }],
  paid:    [],
  overdue: [{ label: 'Tandai Dibayar', next: 'paid' }],
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function InvoiceDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [inv,      setInv]      = useState<InvoiceDetail | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirm,  setConfirm]  = useState(false)
  const [toast,    setToast]    = useState<ToastState>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const [{ data: invData }, { data: itemsData }, { data: profile }] = await Promise.all([
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
          .select('name')
          .eq('id', user.id)
          .single(),
      ])

      if (!invData) { router.replace('/invoices'); return }

      const c = Array.isArray(invData.clients) ? invData.clients[0] : invData.clients
      setInv({
        id:             invData.id,
        invoice_number: invData.invoice_number,
        template:       invData.template,
        status:         invData.status as InvoiceStatus,
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
        user_name:      profile?.name ?? '',
      })
      setLoading(false)
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function updateStatus(next: InvoiceStatus) {
    if (!inv) return
    setUpdating(true)
    const supabase = createClient()
    const extra = next === 'paid' ? { paid_date: new Date().toISOString().split('T')[0] } : {}
    const { error } = await supabase
      .from('invoices')
      .update({ status: next, ...extra })
      .eq('id', inv.id)
    if (error) {
      setToast({ message: 'Gagal mengubah status. Coba lagi.', type: 'error' })
    } else {
      setInv(p => p ? { ...p, status: next } : p)
      setToast({ message: 'Status invoice diperbarui.', type: 'success' })
    }
    setUpdating(false)
  }

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

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-primary-teal border-t-transparent animate-spin" />
      </div>
    )
  }
  if (!inv) return null

  const transitions = STATUS_TRANSITIONS[inv.status]
  const metaLabels  = TEMPLATE_META_LABELS[inv.template] ?? {}
  const metaEntries = Object.entries(inv.invoice_meta).filter(([k, v]) => v && metaLabels[k])

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
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-primary-dark">{inv.invoice_number}</h1>
            <StatusBadge status={inv.status} />
          </div>
          <p className="text-sm text-medium-gray">
            {TEMPLATE_LABELS[inv.template] ?? inv.template} · {inv.client.name}
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {transitions.map(t => (
            <button key={t.next} type="button" onClick={() => updateStatus(t.next)} disabled={updating}
              className="text-sm font-semibold px-4 py-2 rounded-xl bg-primary-teal text-white hover:bg-primary-teal/90 transition-all disabled:opacity-50 shadow-sm">
              {updating ? '…' : t.label}
            </button>
          ))}
          <button type="button" onClick={() => setConfirm(true)} disabled={deleting}
            className="text-sm font-semibold px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error/8 hover:border-error/50 transition-all disabled:opacity-50">
            {deleting ? 'Menghapus…' : 'Hapus'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">

        {/* ── Left: Main invoice card ── */}
        <div className="space-y-5">
          {/* Invoice body */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {/* Header band */}
            <div className="bg-subtle-teal px-6 py-5 border-b border-border flex items-start justify-between gap-4">
              <div>
                <p className="font-extrabold text-primary-dark text-base">{inv.user_name}</p>
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
                    <p className="font-medium text-primary-dark">{fmtDate(inv.due_date)}</p>
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
                      <th className="text-left pb-3">Deskripsi</th>
                      <th className="text-center pb-3 w-16">Qty</th>
                      <th className="text-right pb-3 w-32">Harga Satuan</th>
                      <th className="text-right pb-3 w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {inv.items.map(item => (
                      <tr key={item.id}>
                        <td className="py-3 text-primary-dark">{item.description}</td>
                        <td className="py-3 text-center text-medium-gray">{item.quantity}</td>
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
              {inv.pph_amount > 0 && (
                <div className="flex justify-between text-error">
                  <span>{inv.tax_type === 'pph21' ? 'PPh 21' : 'PPh 23'} ({(inv.tax_rate * 100).toFixed(1)}%)</span>
                  <span className="tabular-nums">-{formatRupiah(inv.pph_amount)}</span>
                </div>
              )}
              {inv.ppn_amount > 0 && (
                <div className="flex justify-between text-success">
                  <span>PPN (11%)</span>
                  <span className="tabular-nums">+{formatRupiah(inv.ppn_amount)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="font-bold text-primary-dark">Total Diterima</span>
                <span className="text-xl font-extrabold text-primary-teal tabular-nums">{formatRupiah(inv.net_amount)}</span>
              </div>
            </div>

            {/* Memo */}
            {inv.memo && (
              <div className="px-6 py-4 border-t border-border bg-very-light-gray/40">
                <p className="text-xs text-light-gray mb-1">Memo</p>
                <p className="text-sm text-medium-gray whitespace-pre-wrap">{inv.memo}</p>
              </div>
            )}
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
            </div>
          </div>

          {/* Tax note */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Catatan Pajak:</strong>{' '}
              {inv.tax_type === 'pph21'
                ? 'PPh 21 dipotong pemberi kerja. Minta bukti potong setelah pembayaran.'
                : 'PPh 23 dipotong klien saat transfer. Pastikan kamu mendapat bukti potong.'}
            </p>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-dark-charcoal/40" onClick={() => setConfirm(false)} />
          <div className="relative bg-white rounded-2xl border border-border shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-primary-dark mb-2">Hapus invoice?</h3>
            <p className="text-sm text-medium-gray mb-6">
              Invoice <strong>{inv.invoice_number}</strong> akan dihapus secara permanen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirm(false)}
                className="flex-1 border border-border text-medium-gray font-semibold text-sm py-2.5 rounded-xl hover:border-primary-teal transition-all">
                Batal
              </button>
              <button onClick={handleDelete} disabled={deleting}
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
