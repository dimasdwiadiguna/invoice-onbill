'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/tax'
import { StatusBadge } from '@/components/ui/Badge'
import { Toast } from '@/components/ui/Toast'
import { InvoiceBuilderModal } from '@/components/invoices/InvoiceBuilderModal'

type Invoice = {
  id: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  net_amount: number
  issue_date: string
  due_date: string | null
  client_name: string
}

type ToastState = { message: string; type: 'error' | 'success' } | null
type SortKey   = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

const STATUS_FILTERS = [
  { value: '',        label: 'Semua'    },
  { value: 'draft',   label: 'Draft'    },
  { value: 'sent',    label: 'Terkirim' },
  { value: 'paid',    label: 'Dibayar'  },
  { value: 'overdue', label: 'Overdue'  },
] as const

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'date_desc',   label: 'Terbaru' },
  { value: 'date_asc',    label: 'Terlama' },
  { value: 'amount_desc', label: 'Terbesar' },
  { value: 'amount_asc',  label: 'Terkecil' },
]

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthOptions() {
  const opts: { value: string; label: string }[] = [{ value: '', label: 'Semua Bulan' }]
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const yyyy = d.getFullYear()
    const mm   = String(d.getMonth() + 1).padStart(2, '0')
    opts.push({
      value: `${yyyy}-${mm}`,
      label: d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
    })
  }
  return opts
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices,     setInvoices]     = useState<Invoice[]>([])
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [monthFilter,  setMonthFilter]  = useState('')
  const [sortKey,      setSortKey]      = useState<SortKey>('date_desc')
  const [loading,      setLoading]      = useState(true)
  const [plan,         setPlan]         = useState('free')
  const [monthCount,   setMonthCount]   = useState(0)
  const [toast,        setToast]        = useState<ToastState>(null)
  const [showBuilder,  setShowBuilder]  = useState(false)
  const [builderTour,  setBuilderTour]  = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const now  = new Date()
    const yyyy = now.getFullYear()
    const mm   = String(now.getMonth() + 1).padStart(2, '0')

    const [{ data: profile }, { data: invData }, { count }] = await Promise.all([
      supabase.from('users').select('plan').eq('id', user.id).single(),
      supabase
        .from('invoices')
        .select('id, invoice_number, status, net_amount, issue_date, due_date, clients(name)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('created_at', `${yyyy}-${mm}-01`),
    ])

    setPlan(profile?.plan ?? 'free')
    setMonthCount(count ?? 0)

    const today = todayISO()

    setInvoices(
      (invData ?? []).map(inv => {
        const c      = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients
        let status   = inv.status as Invoice['status']
        /* Reflect overdue locally on list too */
        if (status === 'sent' && inv.due_date && inv.due_date < today) {
          status = 'overdue'
        }
        return {
          id:             inv.id,
          invoice_number: inv.invoice_number,
          status,
          net_amount:     inv.net_amount ?? 0,
          issue_date:     inv.issue_date,
          due_date:       inv.due_date ?? null,
          client_name:    (c as { name?: string } | null)?.name ?? '—',
        }
      }),
    )
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  /* Auto-open builder in tour mode when ?tour=1 is in the URL */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tour') === '1') {
      setBuilderTour(true)
      setShowBuilder(true)
    }
  }, [])

  /* Filter + sort */
  const filtered = invoices
    .filter(inv => {
      const q = search.toLowerCase()
      const matchSearch =
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.client_name.toLowerCase().includes(q)
      const matchStatus = !statusFilter || inv.status === statusFilter
      const matchMonth  = !monthFilter  || inv.issue_date.startsWith(monthFilter)
      return matchSearch && matchStatus && matchMonth
    })
    .sort((a, b) => {
      if (sortKey === 'date_desc')   return b.issue_date.localeCompare(a.issue_date)
      if (sortKey === 'date_asc')    return a.issue_date.localeCompare(b.issue_date)
      if (sortKey === 'amount_desc') return b.net_amount - a.net_amount
      if (sortKey === 'amount_asc')  return a.net_amount - b.net_amount
      return 0
    })

  const isFree    = plan === 'free'
  const atLimit   = isFree && monthCount >= 5
  const canCreate = !atLimit

  function fmtDate(iso: string) {
    return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  }

  async function handleDownloadPDF(e: React.MouseEvent, invId: string, invNumber: string) {
    e.preventDefault()
    e.stopPropagation()
    try {
      const res  = await fetch(`/api/invoice-pdf/${invId}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${invNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setToast({ message: 'Gagal membuat PDF.', type: 'error' })
    }
  }

  const months = monthOptions()

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-dark">Invoice</h1>
          <p className="text-sm text-medium-gray mt-0.5">
            {invoices.length} invoice
            {isFree && ` · ${monthCount}/5 bulan ini (Free)`}
          </p>
        </div>
        {canCreate ? (
          <button
            type="button"
            onClick={() => setShowBuilder(true)}
            className="inline-flex items-center gap-2 bg-primary-teal text-white font-semibold
                       text-sm px-5 py-2.5 rounded-xl hover:bg-primary-teal/90 transition-all shadow-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            Buat Invoice
          </button>
        ) : (
          <div className="text-right">
            <p className="text-xs text-error font-medium">Batas 5 invoice/bulan (Free) tercapai.</p>
            <Link href="/settings/billing" className="text-xs text-primary-teal font-semibold hover:underline">
              Upgrade ke Pro →
            </Link>
          </div>
        )}
      </div>

      {/* Free tier upsell banner */}
      {isFree && monthCount >= 4 && !atLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-amber-800">
            Kamu sudah membuat <strong>{monthCount}/5</strong> invoice gratis bulan ini.
          </p>
          <Link href="/settings/billing" className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-1.5 rounded-xl transition-all whitespace-nowrap">
            Upgrade Pro
          </Link>
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-gray" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
          </svg>
          <input
            type="text"
            placeholder="Cari nomor atau klien…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors bg-white"
          />
        </div>

        {/* Month filter */}
        <select
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border text-sm text-primary-dark outline-none focus:border-primary-teal transition-colors bg-white"
        >
          {months.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 bg-white border border-border rounded-xl p-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatusFilter(f.value)}
              className={[
                'text-xs font-semibold px-3 py-1.5 rounded-lg transition-all',
                statusFilter === f.value
                  ? 'bg-primary-teal text-white'
                  : 'text-medium-gray hover:text-primary-dark hover:bg-very-light-gray',
              ].join(' ')}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
          className="px-3 py-2.5 rounded-xl border border-border text-sm text-primary-dark outline-none focus:border-primary-teal transition-colors bg-white"
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 rounded-full border-2 border-primary-teal border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <svg className="w-10 h-10 text-border mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
            <p className="text-medium-gray text-sm">
              {search || statusFilter || monthFilter
                ? 'Tidak ada invoice yang cocok.'
                : 'Belum ada invoice. Buat yang pertama!'}
            </p>
            {!search && !statusFilter && !monthFilter && canCreate && (
              <button
                type="button"
                onClick={() => setShowBuilder(true)}
                className="inline-block text-sm font-semibold text-primary-teal hover:underline"
              >
                Buat Invoice →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-very-light-gray/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">Nomor</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider hidden sm:table-cell">Klien</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider hidden md:table-cell">Jumlah Bersih</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider hidden lg:table-cell">Tanggal</th>
                  <th className="px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-very-light-gray/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-primary-dark">{inv.invoice_number}</p>
                      <p className="text-xs text-light-gray sm:hidden mt-0.5">{inv.client_name}</p>
                    </td>
                    <td className="px-6 py-4 text-medium-gray hidden sm:table-cell">{inv.client_name}</td>
                    <td className="px-6 py-4 text-right font-semibold text-dark-charcoal tabular-nums hidden md:table-cell">
                      {formatRupiah(inv.net_amount)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-6 py-4 text-medium-gray hidden lg:table-cell">
                      {fmtDate(inv.issue_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/invoices/${inv.id}`}
                          className="text-xs font-semibold text-primary-teal hover:underline px-3 py-1.5 rounded-lg hover:bg-subtle-teal transition-colors">
                          Lihat
                        </Link>
                        <button
                          type="button"
                          title="Download PDF"
                          onClick={e => handleDownloadPDF(e, inv.id, inv.invoice_number)}
                          className="p-1.5 text-light-gray hover:text-primary-teal hover:bg-subtle-teal rounded-lg transition-colors">
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Count */}
      {filtered.length > 0 && (
        <p className="text-xs text-light-gray text-center">
          Menampilkan {filtered.length} dari {invoices.length} invoice
        </p>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {showBuilder && (
        <InvoiceBuilderModal
          onClose={() => { setShowBuilder(false); setBuilderTour(false) }}
          onCreated={newId => { setShowBuilder(false); setBuilderTour(false); router.push(`/invoices/${newId}`) }}
          tourMode={builderTour}
        />
      )}
    </div>
  )
}
