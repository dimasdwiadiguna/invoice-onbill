'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { calculateTax, formatRupiah, type UserProfile } from '@/lib/tax'
import { Toast } from '@/components/ui/Toast'

/* ─── Types ──────────────────────────────────────────────────── */
type TemplateId =
  | 'it_software' | 'konsultasi'
  | 'kreator_endorse' | 'kreator_production' | 'kreator_afiliasi'
  | 'umkm_jasa'

type LineItem = { id: string; description: string; quantity: string; unit_price: string }
type TemplateFields = Record<string, string>
type ClientEntry = { id: string | null; name: string; address: string; npwp: string; pic_name: string; pic_email: string }
type ToastState = { message: string; type: 'error' | 'success' } | null
type DBClient = { id: string; name: string; address: string | null; npwp: string | null; pic_name: string | null; pic_email: string | null }

/* ─── Constants ──────────────────────────────────────────────── */
const TEMPLATES: { id: TemplateId; label: string; desc: string; pro: boolean }[] = [
  { id: 'it_software',        label: 'IT & Software',           desc: 'Development, maintenance, SaaS',         pro: false },
  { id: 'konsultasi',         label: 'Konsultasi & Jasa Umum',  desc: 'Hourly/daily consulting, jasa profesional', pro: false },
  { id: 'kreator_endorse',    label: 'Kreator – Endorsement',   desc: 'Review, sponsored post, brand deal',      pro: true  },
  { id: 'kreator_production', label: 'Kreator – Konten',        desc: 'Produksi video, foto, artikel',           pro: true  },
  { id: 'kreator_afiliasi',   label: 'Kreator – Afiliasi',      desc: 'Komisi penjualan, affiliate marketing',   pro: true  },
  { id: 'umkm_jasa',          label: 'UMKM Jasa',               desc: 'Bengkel, salon, catering, dll.',          pro: true  },
]

const TEMPLATE_FIELDS: Record<TemplateId, { key: string; label: string; placeholder: string }[]> = {
  it_software: [
    { key: 'project_name', label: 'Nama Project',           placeholder: 'CMS Revamp Phase 2'       },
    { key: 'tech_stack',   label: 'Tech Stack',             placeholder: 'Next.js, PostgreSQL, AWS' },
    { key: 'period',       label: 'Periode Pengerjaan',     placeholder: '1 – 30 April 2026'        },
    { key: 'milestone',    label: 'Milestone / Deliverable', placeholder: 'Sprint 3 selesai'         },
  ],
  konsultasi: [
    { key: 'scope',        label: 'Scope Pekerjaan', placeholder: 'Audit strategi marketing Q2 2026' },
    { key: 'period',       label: 'Periode',         placeholder: 'April 2026'                       },
    { key: 'sessions_days',label: 'Sesi / Hari',     placeholder: '4 sesi @ 2 jam'                   },
  ],
  kreator_endorse: [
    { key: 'campaign_name',  label: 'Nama Campaign',   placeholder: 'Ramadan Sale 2026'     },
    { key: 'platform',       label: 'Platform',         placeholder: 'Instagram, TikTok'     },
    { key: 'air_period',     label: 'Periode Tayang',   placeholder: '1 – 14 April 2026'    },
    { key: 'content_count',  label: 'Jumlah Konten',    placeholder: '3 Reels + 1 Story'    },
    { key: 'format',         label: 'Format Konten',    placeholder: '60s Reel, 15s Story'  },
  ],
  kreator_production: [
    { key: 'content_type',     label: 'Jenis Konten',  placeholder: 'Video YouTube 15 menit'    },
    { key: 'revision_count',   label: 'Revisi',        placeholder: '2x revisi termasuk'        },
    { key: 'deliverable_list', label: 'Deliverable',   placeholder: 'File MP4 4K + thumbnail'   },
    { key: 'deadline',         label: 'Deadline',      placeholder: '30 April 2026'             },
  ],
  kreator_afiliasi: [
    { key: 'commission_pct',   label: 'Komisi (%)',         placeholder: '10'          },
    { key: 'aff_period',       label: 'Periode',            placeholder: 'Maret 2026'  },
    { key: 'transaction_count',label: 'Jumlah Transaksi',   placeholder: '47 transaksi'},
    { key: 'affiliate_code',   label: 'Kode Afiliasi',      placeholder: 'CREATOR2026' },
  ],
  umkm_jasa: [
    { key: 'service_description', label: 'Deskripsi Layanan', placeholder: 'Servis AC + penggantian freon'   },
    { key: 'location',            label: 'Lokasi',             placeholder: 'Jl. Sudirman No. 10'            },
    { key: 'client_pic',          label: 'Nama PIC Klien',     placeholder: 'Bpk. Hendra'                    },
  ],
}

/* ─── Helpers ────────────────────────────────────────────────── */
function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: '1', unit_price: '' }
}

function parseRupiah(str: string): number {
  const digits = str.replace(/[^\d]/g, '')
  return digits ? parseInt(digits, 10) * 100 : 0
}

function itemSubtotal(item: LineItem): number {
  return Math.round((parseFloat(item.quantity) || 0) * parseRupiah(item.unit_price))
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function todayISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function addDays(iso: string, days: number) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/* ─── Sub-components ─────────────────────────────────────────── */
function StepBubble({ n, current }: { n: number; current: number }) {
  const done = n < current
  const active = n === current
  return (
    <div className={[
      'w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all',
      done   ? 'bg-primary-teal text-white' :
      active ? 'bg-primary-teal text-white ring-4 ring-subtle-teal' :
               'bg-very-light-gray text-light-gray',
    ].join(' ')}>
      {done ? '✓' : n}
    </div>
  )
}

function TaxRow({ label, value, cls = '' }: { label: string; value: string; cls?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-medium-gray">{label}</span>
      <span className={`text-sm font-semibold tabular-nums ${cls || 'text-primary-dark'}`}>{value}</span>
    </div>
  )
}

/* ─── Invoice Preview ────────────────────────────────────────── */
function InvoicePreview({
  num, issueDate, dueDate, userName, client, items, subtotal, taxResult,
}: {
  num: string; issueDate: string; dueDate: string; userName: string
  client: ClientEntry; items: LineItem[]; subtotal: number
  taxResult: ReturnType<typeof calculateTax>
}) {
  const visible = items.filter(i => i.description.trim())
  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden text-xs leading-relaxed">
      {/* Header band */}
      <div className="bg-subtle-teal px-5 py-4 border-b border-border flex items-start justify-between gap-4">
        <p className="font-extrabold text-primary-dark text-sm">{userName || 'Nama Anda'}</p>
        <div className="text-right">
          <p className="font-extrabold text-primary-dark text-base tracking-wide">INVOICE</p>
          <p className="text-primary-teal font-semibold mt-0.5">{num || '—'}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="px-5 py-4 grid grid-cols-2 gap-4 border-b border-border">
        <div className="space-y-1">
          <p className="text-light-gray">Tanggal</p>
          <p className="font-medium text-primary-dark">{fmtDate(issueDate)}</p>
          {dueDate && <>
            <p className="text-light-gray mt-2">Jatuh Tempo</p>
            <p className="font-medium text-primary-dark">{fmtDate(dueDate)}</p>
          </>}
        </div>
        <div className="space-y-1">
          <p className="text-light-gray">Ditagihkan kepada</p>
          <p className="font-semibold text-primary-dark">{client.name || '—'}</p>
          {client.address && <p className="text-medium-gray leading-relaxed">{client.address}</p>}
          {client.npwp    && <p className="font-mono text-medium-gray">NPWP: {client.npwp}</p>}
        </div>
      </div>

      {/* Items */}
      {visible.length > 0 && (
        <div className="px-5 py-4 border-b border-border">
          <table className="w-full">
            <thead>
              <tr className="text-light-gray border-b border-border/50">
                <th className="text-left pb-2 font-medium">Deskripsi</th>
                <th className="text-center pb-2 font-medium w-8">Qty</th>
                <th className="text-right pb-2 font-medium">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(item => (
                <tr key={item.id} className="border-b border-border/20 last:border-0">
                  <td className="py-1.5 text-primary-dark">{item.description}</td>
                  <td className="py-1.5 text-center text-medium-gray">{item.quantity}</td>
                  <td className="py-1.5 text-right font-medium tabular-nums text-primary-dark">
                    {itemSubtotal(item) > 0 ? formatRupiah(itemSubtotal(item)) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tax summary */}
      <div className="px-5 py-4 space-y-1.5">
        <div className="flex justify-between text-medium-gray">
          <span>Subtotal</span>
          <span className="tabular-nums">{formatRupiah(subtotal)}</span>
        </div>
        {taxResult.pph_amount > 0 && (
          <div className="flex justify-between text-error">
            <span>{taxResult.tax_type === 'pph21' ? 'PPh 21' : 'PPh 23'} ({(taxResult.tax_rate * 100).toFixed(1)}%)</span>
            <span className="tabular-nums">-{formatRupiah(taxResult.pph_amount)}</span>
          </div>
        )}
        {taxResult.ppn_amount > 0 && (
          <div className="flex justify-between text-success">
            <span>PPN (11%)</span>
            <span className="tabular-nums">+{formatRupiah(taxResult.ppn_amount)}</span>
          </div>
        )}
        <div className="border-t border-border pt-2.5 flex items-center justify-between">
          <span className="font-bold text-primary-dark text-xs">Total Diterima</span>
          <span className="font-extrabold text-primary-teal text-sm tabular-nums">{formatRupiah(taxResult.net_amount)}</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function NewInvoicePage() {
  const router = useRouter()

  /* Loading / limit states */
  const [loading,      setLoading]      = useState(true)
  const [limitReached, setLimitReached] = useState(false)

  /* User data */
  const [userId,      setUserId]      = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile & { plan: string; name: string; invoice_prefix: string | null }>({
    entity_type: 'individual', has_npwp: false, is_pkp: false, plan: 'free', name: '', invoice_prefix: null,
  })
  const [dbClients, setDbClients] = useState<DBClient[]>([])

  /* Step & mobile view */
  const [step,       setStep]       = useState(1)
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form')

  /* Step 1 */
  const [template, setTemplate] = useState<TemplateId | null>(null)

  /* Step 2 */
  const [clientSearch,      setClientSearch]      = useState('')
  const [showDropdown,      setShowDropdown]      = useState(false)
  const [clientEntry,       setClientEntry]       = useState<ClientEntry>({
    id: null, name: '', address: '', npwp: '', pic_name: '', pic_email: '',
  })

  /* Step 3 */
  const [items,          setItems]          = useState<LineItem[]>([newItem()])
  const [templateFields, setTemplateFields] = useState<TemplateFields>({})
  const [memo,           setMemo]           = useState('')

  /* Step 5 */
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate,     setIssueDate]     = useState(todayISO)
  const [dueDate,       setDueDate]       = useState(() => addDays(todayISO(), 30))
  const [nextSeq,       setNextSeq]       = useState(1)

  const [saving, setSaving] = useState(false)
  const [toast,  setToast]  = useState<ToastState>(null)

  /* ── Init ───────────────────────────────────────────────────── */
  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)

      const [{ data: profile }, { data: clientsData }] = await Promise.all([
        supabase.from('users')
          .select('name, plan, entity_type, has_npwp, is_pkp, invoice_prefix')
          .eq('id', user.id).single(),
        supabase.from('clients')
          .select('id, name, address, npwp, pic_name, pic_email')
          .eq('user_id', user.id).is('deleted_at', null).order('name'),
      ])

      const plan = profile?.plan ?? 'free'
      setUserProfile({
        entity_type:    profile?.entity_type    ?? 'individual',
        has_npwp:       profile?.has_npwp       ?? false,
        is_pkp:         profile?.is_pkp         ?? false,
        plan,
        name:           profile?.name           ?? '',
        invoice_prefix: profile?.invoice_prefix ?? null,
      })
      setDbClients(clientsData ?? [])

      /* Free tier monthly limit check */
      if (plan === 'free') {
        const now  = new Date()
        const yyyy = now.getFullYear()
        const mm   = String(now.getMonth() + 1).padStart(2, '0')
        const { count } = await supabase
          .from('invoices')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('deleted_at', null)
          .gte('created_at', `${yyyy}-${mm}-01`)
        if ((count ?? 0) >= 5) { setLimitReached(true) }
      }

      setLoading(false)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /* ── Derived ─────────────────────────────────────────────────── */
  const isPro    = userProfile.plan === 'pro'
  const subtotal = items.reduce((s, i) => s + itemSubtotal(i), 0)
  const taxResult = calculateTax(subtotal > 0 ? subtotal : 0, userProfile)

  const filteredClients = dbClients.filter(c =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()),
  )

  /* ── Client helpers ──────────────────────────────────────────── */
  function selectClient(c: DBClient) {
    setClientEntry({ id: c.id, name: c.name, address: c.address ?? '', npwp: c.npwp ?? '', pic_name: c.pic_name ?? '', pic_email: c.pic_email ?? '' })
    setClientSearch(c.name)
    setShowDropdown(false)
  }

  function setClientField<K extends keyof ClientEntry>(k: K, v: ClientEntry[K]) {
    setClientEntry(prev => ({ ...prev, [k]: v, ...(k === 'name' ? { id: null } : {}) }))
  }

  /* ── Item helpers ────────────────────────────────────────────── */
  function updateItem(id: string, field: keyof LineItem, value: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  function formatUnitPrice(raw: string) {
    const digits = raw.replace(/[^\d]/g, '')
    return digits ? new Intl.NumberFormat('id-ID').format(parseInt(digits)) : ''
  }

  /* ── Step 5 sequence ─────────────────────────────────────────── */
  async function loadSequence() {
    if (!userId) return
    const supabase = createClient()
    const d = new Date(issueDate + 'T00:00:00')
    const year  = d.getFullYear()
    const month = d.getMonth() + 1

    const { data } = await supabase
      .from('invoice_number_sequences')
      .select('last_seq')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)
      .maybeSingle()

    const seq    = (data?.last_seq ?? 0) + 1
    const prefix = userProfile.invoice_prefix?.trim() || 'INV'
    const mm     = String(month).padStart(2, '0')
    setNextSeq(seq)
    setInvoiceNumber(`${prefix}-${year}-${mm}-${String(seq).padStart(3, '0')}`)
  }

  /* ── Navigation ──────────────────────────────────────────────── */
  function goNext() {
    if (step === 4) loadSequence()
    setStep(s => s + 1)
  }

  /* ── Can-proceed guards ──────────────────────────────────────── */
  const canStep1 = template !== null
  const canStep2 = clientEntry.name.trim().length > 0
  const canStep3 = items.some(i => i.description.trim() && parseRupiah(i.unit_price) > 0)

  /* ── Save ────────────────────────────────────────────────────── */
  async function handleSave(status: 'draft' | 'sent') {
    if (!userId || !template) return
    setSaving(true)
    const supabase = createClient()

    let clientId = clientEntry.id
    if (!clientId) {
      const { data: nc, error: ce } = await supabase
        .from('clients')
        .insert({ user_id: userId, name: clientEntry.name, address: clientEntry.address || null, npwp: clientEntry.npwp || null, pic_name: clientEntry.pic_name || null, pic_email: clientEntry.pic_email || null })
        .select('id').single()
      if (ce || !nc) { setToast({ message: 'Gagal menyimpan data klien.', type: 'error' }); setSaving(false); return }
      clientId = nc.id
    }

    const { data: inv, error: ie } = await supabase
      .from('invoices')
      .insert({
        user_id: userId, client_id: clientId,
        invoice_number: invoiceNumber, template, status,
        issue_date: issueDate, due_date: dueDate || null,
        subtotal, dpp: taxResult.dpp,
        pph_amount: taxResult.pph_amount, ppn_amount: taxResult.ppn_amount,
        net_amount: taxResult.net_amount, tax_type: taxResult.tax_type,
        tax_rate: taxResult.tax_rate,
        memo: (isPro && memo.trim()) ? memo.trim() : null,
        invoice_meta: templateFields,
      })
      .select('id').single()

    if (ie || !inv) { setToast({ message: 'Gagal menyimpan invoice. Coba lagi.', type: 'error' }); setSaving(false); return }

    const itemRows = items
      .filter(i => i.description.trim())
      .map((i, idx) => ({ invoice_id: inv.id, description: i.description, quantity: parseFloat(i.quantity) || 1, unit_price: parseRupiah(i.unit_price), subtotal: itemSubtotal(i), sort_order: idx }))

    if (itemRows.length > 0) {
      const { error: ite } = await supabase.from('invoice_items').insert(itemRows)
      if (ite) { setToast({ message: 'Invoice tersimpan, tapi item gagal.', type: 'error' }); setSaving(false); return }
    }

    const d = new Date(issueDate + 'T00:00:00')
    await supabase.from('invoice_number_sequences')
      .upsert({ user_id: userId, year: d.getFullYear(), month: d.getMonth() + 1, last_seq: nextSeq }, { onConflict: 'user_id,year,month' })

    router.push(`/invoices/${inv.id}`)
  }

  /* ── Loading screen ──────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 rounded-full border-2 border-primary-teal border-t-transparent animate-spin" />
      </div>
    )
  }

  /* ── Limit reached ───────────────────────────────────────────── */
  if (limitReached) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-64 text-center gap-5">
        <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center text-3xl">🔒</div>
        <div>
          <h2 className="text-xl font-bold text-primary-dark">Batas Invoice Bulanan Tercapai</h2>
          <p className="text-sm text-medium-gray mt-2 max-w-sm mx-auto">Paket Free hanya memungkinkan 5 invoice per bulan. Upgrade ke Pro untuk invoice tak terbatas.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/invoices" className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-border text-medium-gray hover:border-primary-teal hover:text-primary-teal transition-all">
            Lihat Invoice
          </Link>
          <Link href="/settings/billing" className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-primary-teal text-white hover:bg-primary-teal/90 transition-all shadow-sm">
            Upgrade ke Pro →
          </Link>
        </div>
      </div>
    )
  }

  /* ── Main layout ─────────────────────────────────────────────── */
  return (
    <div className="h-full flex flex-col">

      {/* ── Top bar ── */}
      <div className="flex-shrink-0 bg-white border-b border-border px-4 lg:px-8 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/invoices" className="p-1.5 text-medium-gray hover:text-primary-dark transition-colors rounded-lg hover:bg-very-light-gray">
            <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"/>
            </svg>
          </Link>
          <h1 className="text-base font-bold text-primary-dark">Invoice Baru</h1>
        </div>

        {/* Step bubbles — desktop */}
        <div className="hidden sm:flex items-center gap-2">
          {[1,2,3,4,5].map(n => <StepBubble key={n} n={n} current={step} />)}
        </div>

        {/* Mobile preview toggle */}
        <button
          onClick={() => setMobileView(v => v === 'form' ? 'preview' : 'form')}
          className="lg:hidden text-xs font-semibold text-primary-teal bg-subtle-teal px-3 py-1.5 rounded-lg"
        >
          {mobileView === 'form' ? 'Preview' : '← Form'}
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] h-full">

          {/* ── Form panel ── */}
          <div className={`overflow-y-auto p-6 lg:p-8 ${mobileView === 'preview' ? 'hidden lg:block' : ''}`}>

            {/* STEP 1 – Template */}
            {step === 1 && (
              <div className="max-w-lg space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-primary-dark">Pilih Template</h2>
                  <p className="text-sm text-medium-gray mt-1">Template menentukan field tambahan yang relevan untuk jenis pekerjaan kamu.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TEMPLATES.map(t => {
                    const locked = t.pro && !isPro
                    const active = template === t.id
                    return (
                      <button key={t.id} type="button" disabled={locked}
                        onClick={() => !locked && setTemplate(t.id)}
                        className={[
                          'relative text-left p-4 rounded-2xl border-2 transition-all duration-150',
                          locked ? 'opacity-50 cursor-not-allowed border-border bg-very-light-gray' :
                          active ? 'border-primary-teal bg-subtle-teal' :
                                   'border-border bg-white hover:border-primary-teal/50 cursor-pointer',
                        ].join(' ')}
                      >
                        <span className={`absolute top-2.5 right-2.5 text-xs font-bold px-2 py-0.5 rounded-full ${t.pro ? (isPro ? 'bg-primary-teal/15 text-primary-teal' : 'bg-amber-100 text-amber-700') : 'hidden'}`}>
                          {isPro ? 'Pro' : '🔒 Pro'}
                        </span>
                        <p className="font-semibold text-sm text-primary-dark pr-12">{t.label}</p>
                        <p className="text-xs text-medium-gray mt-1">{t.desc}</p>
                      </button>
                    )
                  })}
                </div>
                {!isPro && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    Template Pro membutuhkan paket Pro.{' '}
                    <Link href="/settings/billing" className="font-semibold hover:underline">Upgrade sekarang →</Link>
                  </p>
                )}
              </div>
            )}

            {/* STEP 2 – Client */}
            {step === 2 && (
              <div className="max-w-lg space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-primary-dark">Data Klien</h2>
                  <p className="text-sm text-medium-gray mt-1">Pilih dari daftar atau masukkan data klien baru.</p>
                </div>

                {/* Autocomplete search */}
                <div className="relative">
                  <label className="block text-sm font-medium text-primary-dark mb-1.5">Cari klien tersimpan</label>
                  <input type="text" value={clientSearch} placeholder="Ketik nama klien…"
                    onChange={e => { setClientSearch(e.target.value); setShowDropdown(true); if (!e.target.value) setClientField('id', null) }}
                    onFocus={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors"
                  />
                  {showDropdown && filteredClients.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                      {filteredClients.map(c => (
                        <button key={c.id} type="button" onMouseDown={() => selectClient(c)}
                          className="w-full text-left px-4 py-3 hover:bg-very-light-gray text-sm text-primary-dark border-b border-border/40 last:border-0 transition-colors">
                          <p className="font-medium">{c.name}</p>
                          {c.pic_name && <p className="text-xs text-light-gray">{c.pic_name}</p>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <p className="text-xs font-semibold text-medium-gray uppercase tracking-wider">Detail Klien</p>

                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-1.5">Nama perusahaan / individu <span className="text-error">*</span></label>
                    <input type="text" value={clientEntry.name}
                      onChange={e => setClientField('name', e.target.value)}
                      placeholder="PT Maju Bersama"
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-1.5">Alamat</label>
                    <textarea value={clientEntry.address} onChange={e => setClientField('address', e.target.value)}
                      placeholder="Jl. Sudirman No. 1, Jakarta" rows={2}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors resize-none" />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-dark mb-1.5">Nama PIC</label>
                      <input type="text" value={clientEntry.pic_name} onChange={e => setClientField('pic_name', e.target.value)}
                        placeholder="Contact person"
                        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-dark mb-1.5">Email PIC</label>
                      <input type="email" value={clientEntry.pic_email} onChange={e => setClientField('pic_email', e.target.value)}
                        placeholder="finance@company.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-1.5">NPWP Klien <span className="text-light-gray font-normal">(opsional)</span></label>
                    <input type="text" value={clientEntry.npwp} onChange={e => setClientField('npwp', e.target.value)}
                      placeholder="00.000.000.0-000.000"
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-mono text-primary-dark placeholder:font-sans placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors" />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 – Items */}
            {step === 3 && template && (
              <div className="max-w-2xl space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-primary-dark">Item Jasa</h2>
                  <p className="text-sm text-medium-gray mt-1">Tambahkan layanan yang akan ditagihkan.</p>
                </div>

                {/* Line items table */}
                <div className="bg-white rounded-2xl border border-border overflow-hidden">
                  <div className="hidden sm:grid grid-cols-[1fr_72px_148px_96px_36px] gap-2 px-4 py-2.5 bg-very-light-gray/60 border-b border-border text-xs font-semibold text-light-gray uppercase tracking-wider">
                    <span>Deskripsi</span>
                    <span className="text-center">Qty</span>
                    <span className="text-right">Harga Satuan</span>
                    <span className="text-right">Subtotal</span>
                    <span/>
                  </div>
                  <div className="divide-y divide-border">
                    {items.map((item, idx) => (
                      <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_72px_148px_96px_36px] gap-2 p-3 items-center">
                        <input type="text" value={item.description}
                          onChange={e => updateItem(item.id, 'description', e.target.value)}
                          placeholder={`Item ${idx + 1}`}
                          className="px-3 py-2 rounded-lg border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors" />
                        <input type="number" value={item.quantity} min="0.01" step="0.5"
                          onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                          className="px-3 py-2 rounded-lg border border-border text-sm text-primary-dark text-center outline-none focus:border-primary-teal transition-colors" />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-medium-gray pointer-events-none">Rp</span>
                          <input type="text" inputMode="numeric" value={item.unit_price} placeholder="0"
                            onChange={e => updateItem(item.id, 'unit_price', formatUnitPrice(e.target.value))}
                            className="w-full pl-8 pr-3 py-2 rounded-lg border border-border text-sm text-primary-dark text-right placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors" />
                        </div>
                        <p className="text-sm font-semibold text-right tabular-nums pr-1 text-primary-dark">
                          {itemSubtotal(item) > 0 ? formatRupiah(itemSubtotal(item)) : <span className="text-light-gray">—</span>}
                        </p>
                        <button type="button" onClick={() => setItems(p => p.filter(i => i.id !== item.id))}
                          disabled={items.length === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-light-gray hover:text-error hover:bg-error/5 transition-colors disabled:opacity-0">
                          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                    <button type="button" onClick={() => setItems(p => [...p, newItem()])}
                      className="flex items-center gap-1.5 text-sm font-semibold text-primary-teal px-3 py-1.5 rounded-lg hover:bg-subtle-teal transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                      </svg>
                      Tambah Baris
                    </button>
                    {subtotal > 0 && (
                      <p className="text-sm font-bold text-primary-dark tabular-nums">Subtotal: {formatRupiah(subtotal)}</p>
                    )}
                  </div>
                </div>

                {/* Template-specific fields */}
                {TEMPLATE_FIELDS[template].length > 0 && (
                  <div className="bg-subtle-teal/40 rounded-2xl border border-primary-teal/20 p-5 space-y-4">
                    <p className="text-xs font-semibold text-primary-teal uppercase tracking-wider">
                      Info Tambahan — {TEMPLATES.find(t => t.id === template)?.label}
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {TEMPLATE_FIELDS[template].map(f => (
                        <div key={f.key}>
                          <label className="block text-sm font-medium text-primary-dark mb-1.5">{f.label}</label>
                          <input type="text" value={templateFields[f.key] ?? ''} placeholder={f.placeholder}
                            onChange={e => setTemplateFields(p => ({ ...p, [f.key]: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-white text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Memo */}
                <div>
                  <label className="block text-sm font-medium text-primary-dark mb-1.5">
                    Memo / Catatan
                    {!isPro && <span className="ml-2 text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">Pro</span>}
                  </label>
                  <textarea value={memo} onChange={e => setMemo(e.target.value)} disabled={!isPro} rows={3}
                    placeholder={isPro ? 'Catatan khusus yang muncul di invoice…' : 'Upgrade ke Pro untuk memo kustom'}
                    className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors resize-none disabled:bg-very-light-gray disabled:text-light-gray disabled:cursor-not-allowed" />
                </div>
              </div>
            )}

            {/* STEP 4 – Tax preview */}
            {step === 4 && (
              <div className="max-w-lg space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-primary-dark">Pratinjau Pajak</h2>
                  <p className="text-sm text-medium-gray mt-1">Kalkulasi otomatis berdasarkan profil pajak kamu.</p>
                </div>

                <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
                  <TaxRow label="Subtotal" value={formatRupiah(subtotal)} />
                  <TaxRow label="DPP (Dasar Pengenaan Pajak)" value={formatRupiah(taxResult.dpp)} />
                  <div className="border-t border-border/50 pt-3">
                    <TaxRow
                      label={`${taxResult.tax_type === 'pph21' ? 'PPh 21' : 'PPh 23'} dipotong klien (${(taxResult.tax_rate * 100).toFixed(1)}%)`}
                      value={`-${formatRupiah(taxResult.pph_amount)}`}
                      cls="text-error"
                    />
                  </div>
                  {taxResult.ppn_amount > 0 && (
                    <TaxRow label="PPN (11%)" value={`+${formatRupiah(taxResult.ppn_amount)}`} cls="text-success" />
                  )}
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary-dark">Yang kamu terima</span>
                      <span className="text-2xl font-extrabold text-primary-teal tabular-nums">{formatRupiah(taxResult.net_amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <p className="text-xs text-amber-800">
                    <strong>ℹ️ Catatan:</strong>{' '}
                    {taxResult.tax_type === 'pph21'
                      ? 'PPh 21 akan dipotong langsung oleh pemberi kerja dan disetorkan ke negara atas nama kamu.'
                      : 'PPh 23 akan dipotong oleh klien saat pembayaran. Kamu akan mendapatkan bukti potong.'}
                  </p>
                </div>

                {userProfile.entity_type === 'individual' && !userProfile.has_npwp && (
                  <div className="bg-error/5 border border-error/20 rounded-xl px-4 py-3">
                    <p className="text-xs text-error">
                      <strong>Tanpa NPWP:</strong> PPh 21 kamu 3% (lebih tinggi dari 2.5% untuk pemilik NPWP). Daftarkan NPWP untuk menghemat pajak.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5 – Finalize */}
            {step === 5 && (
              <div className="max-w-lg space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-primary-dark">Finalisasi</h2>
                  <p className="text-sm text-medium-gray mt-1">Tentukan nomor, tanggal, dan jatuh tempo invoice.</p>
                </div>

                <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-primary-dark mb-1.5">
                      Nomor Invoice
                      {!isPro && <span className="ml-2 text-xs text-light-gray font-normal">(prefix kustom tersedia di Pro)</span>}
                    </label>
                    <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)}
                      disabled={!isPro}
                      className="w-full px-4 py-2.5 rounded-xl border border-border text-sm font-mono text-primary-dark outline-none focus:border-primary-teal transition-colors disabled:bg-very-light-gray" />
                    {isPro && <p className="text-xs text-medium-gray mt-1">Kamu bisa mengubah format nomor invoice.</p>}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-primary-dark mb-1.5">Tanggal Invoice <span className="text-error">*</span></label>
                      <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark outline-none focus:border-primary-teal transition-colors" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-dark mb-1.5">Jatuh Tempo</label>
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark outline-none focus:border-primary-teal transition-colors" />
                    </div>
                  </div>

                  <div className="bg-subtle-teal rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-medium-gray">Total yang kamu terima</span>
                      <span className="text-xl font-extrabold text-primary-teal tabular-nums">{formatRupiah(taxResult.net_amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => handleSave('draft')} disabled={saving || !invoiceNumber || !issueDate}
                    className="flex-1 py-3 px-6 rounded-xl border-2 border-border text-sm font-semibold text-medium-gray hover:border-primary-teal hover:text-primary-teal transition-all disabled:opacity-50">
                    {saving ? 'Menyimpan…' : 'Simpan sebagai Draft'}
                  </button>
                  <button type="button" onClick={() => handleSave('sent')} disabled={saving || !invoiceNumber || !issueDate}
                    className="flex-1 py-3 px-6 rounded-xl bg-primary-teal text-white text-sm font-semibold hover:bg-primary-teal/90 transition-all shadow-sm disabled:opacity-50">
                    {saving ? 'Menyimpan…' : 'Finalisasi Invoice →'}
                  </button>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className={`flex items-center ${step === 5 ? 'justify-start' : 'justify-between'} mt-8 max-w-2xl`}>
              <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 1}
                className="text-sm font-semibold text-medium-gray px-5 py-2.5 rounded-xl border border-border hover:border-primary-teal hover:text-primary-teal transition-all disabled:opacity-0 disabled:pointer-events-none">
                ← Kembali
              </button>
              {step < 5 && (
                <button type="button" onClick={goNext}
                  disabled={(step === 1 && !canStep1) || (step === 2 && !canStep2) || (step === 3 && !canStep3)}
                  className="text-sm font-semibold text-white bg-primary-teal px-6 py-2.5 rounded-xl hover:bg-primary-teal/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  Lanjut →
                </button>
              )}
            </div>
          </div>

          {/* ── Preview panel ── */}
          <div className={`lg:border-l border-border bg-very-light-gray/60 overflow-y-auto p-5 ${mobileView === 'form' ? 'hidden lg:block' : ''}`}>
            <p className="text-xs font-semibold text-light-gray uppercase tracking-wider mb-4">Preview Invoice</p>
            <InvoicePreview
              num={step >= 5 ? invoiceNumber : '—'}
              issueDate={issueDate}
              dueDate={dueDate}
              userName={userProfile.name}
              client={clientEntry}
              items={items}
              subtotal={subtotal}
              taxResult={taxResult}
            />
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
