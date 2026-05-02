'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/tax'

/* ─── Types ─────────────────────────────────────────────────── */
type Invoice = {
  id: string
  issue_date: string
  subtotal: number
  pph_amount: number
  ppn_amount: number
  net_amount: number
  status: string
  clients: { name: string } | null
}

type MonthData = {
  month: number
  label: string
  bruto: number
  count: number
}

type ClientSummary = {
  name: string
  invoice_count: number
  total_nilai: number
}

/* ─── Upsell ─────────────────────────────────────────────────  */
function ProUpsell() {
  return (
    <div className="max-w-lg mx-auto text-center py-16 px-6">
      <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <svg className="w-8 h-8 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11 4a1 1 0 10-2 0v4a1 1 0 102 0V7zm-3 1a1 1 0 10-2 0v3a1 1 0 102 0V8zM8 9a1 1 0 00-2 0v2a1 1 0 102 0V9z" clipRule="evenodd"/>
        </svg>
      </div>
      <h2 className="text-xl font-extrabold text-primary-dark mb-2">
        Laporan Rekap SPT — Fitur Pro
      </h2>
      <p className="text-sm text-medium-gray mb-6">
        Dapatkan rekap keuangan tahunan otomatis: pendapatan bruto per bulan, total PPh yang dipotong,
        total PPN yang dipungut, dan ringkasan per klien — siap untuk laporan SPT Tahunan.
      </p>
      <ul className="text-sm text-left text-medium-gray inline-block mb-8 space-y-2">
        {[
          'Grafik pendapatan bruto per bulan',
          'Rekap PPh 21/23 yang dipotong klien',
          'Rekap PPN yang dipungut (jika PKP)',
          'Ringkasan per klien: jumlah invoice & total nilai',
          'Export CSV untuk spreadsheet',
          'Export PDF untuk arsip SPT',
        ].map(f => (
          <li key={f} className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            {f}
          </li>
        ))}
      </ul>
      <br />
      <Link
        href="/settings?tab=billing"
        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white
                   font-bold text-sm px-6 py-3 rounded-xl transition-all"
      >
        Upgrade ke Pro →
      </Link>
    </div>
  )
}

/* ─── Bar chart ─────────────────────────────────────────────── */
function BarChart({ data, maxValue }: { data: MonthData[]; maxValue: number }) {
  const MONTH_SHORT = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-1.5 h-40">
        {data.map(m => {
          const pct = maxValue > 0 ? (m.bruto / maxValue) * 100 : 0
          return (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              {m.bruto > 0 && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-primary-dark text-white text-xs
                                rounded-lg px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100
                                transition-opacity pointer-events-none z-10">
                  {formatRupiah(m.bruto)}
                </div>
              )}
              <div className="w-full flex items-end" style={{ height: '100%' }}>
                <div
                  className={[
                    'w-full rounded-t-lg transition-all duration-300',
                    m.bruto > 0 ? 'bg-primary-teal' : 'bg-border',
                  ].join(' ')}
                  style={{ height: `${Math.max(pct, m.bruto > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {/* Month labels */}
      <div className="flex gap-1.5">
        {data.map(m => (
          <div key={m.month} className="flex-1 text-center text-[10px] text-light-gray font-medium">
            {MONTH_SHORT[m.month - 1]}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─── Stat card ─────────────────────────────────────────────── */
function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <p className="text-xs font-semibold text-light-gray uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-extrabold text-primary-dark">{value}</p>
      {sub && <p className="text-xs text-medium-gray mt-0.5">{sub}</p>}
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const [plan,       setPlan]       = useState<string | null>(null)
  const [isPkp,      setIsPkp]      = useState(false)
  const [year,       setYear]       = useState(currentYear)
  const [invoices,   setInvoices]   = useState<Invoice[]>([])
  const [loading,    setLoading]    = useState(true)
  const [exporting,  setExporting]  = useState(false)

  const availableYears = Array.from(
    { length: Math.max(1, currentYear - 2023 + 1) },
    (_, i) => currentYear - i,
  )

  const loadData = useCallback(async (selectedYear: number) => {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profileData }, { data: invData }] = await Promise.all([
      supabase
        .from('users')
        .select('plan, is_pkp')
        .eq('id', user.id)
        .single(),
      supabase
        .from('invoices')
        .select('id, issue_date, subtotal, pph_amount, ppn_amount, net_amount, status, clients(name)')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .gte('issue_date', `${selectedYear}-01-01`)
        .lte('issue_date', `${selectedYear}-12-31`)
        .order('issue_date'),
    ])

    setPlan(profileData?.plan ?? 'free')
    setIsPkp(profileData?.is_pkp ?? false)
    setInvoices((invData ?? []) as unknown as Invoice[])
    setLoading(false)
  }, [])

  useEffect(() => { loadData(year) }, [loadData, year])

  if (plan === null && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary-teal border-t-transparent animate-spin"/>
      </div>
    )
  }

  if (plan === 'free') return <ProUpsell />

  /* ── Compute aggregates ─────────────────────────────────── */
  const notDeleted = invoices

  const totalBruto    = notDeleted.reduce((s, i) => s + (i.subtotal ?? 0), 0)
  const totalPph      = notDeleted.reduce((s, i) => s + (i.pph_amount ?? 0), 0)
  const totalPpn      = notDeleted.reduce((s, i) => s + (i.ppn_amount ?? 0), 0)
  const totalInvoice  = notDeleted.length

  /* Monthly bruto */
  const monthData: MonthData[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    label: new Date(year, i, 1).toLocaleDateString('id-ID', { month: 'long' }),
    bruto: 0,
    count: 0,
  }))
  notDeleted.forEach(inv => {
    const m = new Date(inv.issue_date).getMonth()
    monthData[m].bruto += inv.subtotal ?? 0
    monthData[m].count += 1
  })
  const maxMonthly = Math.max(...monthData.map(m => m.bruto), 1)

  /* Per-client */
  const clientMap = new Map<string, ClientSummary>()
  notDeleted.forEach(inv => {
    const clientRaw = inv.clients
    const name = (Array.isArray(clientRaw) ? clientRaw[0] : clientRaw)?.name ?? 'Klien tidak dikenal'
    const existing = clientMap.get(name)
    if (existing) {
      existing.invoice_count += 1
      existing.total_nilai   += inv.net_amount ?? 0
    } else {
      clientMap.set(name, { name, invoice_count: 1, total_nilai: inv.net_amount ?? 0 })
    }
  })
  const clientSummaries = Array.from(clientMap.values())
    .sort((a, b) => b.total_nilai - a.total_nilai)

  /* ── Export CSV ─────────────────────────────────────────── */
  function exportCsv() {
    setExporting(true)

    const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                       'Juli','Agustus','September','Oktober','November','Desember']

    const rows: string[][] = []

    rows.push([`Laporan Keuangan Onbill — Tahun ${year}`])
    rows.push([])

    rows.push(['Ringkasan Tahunan'])
    rows.push(['Total Invoice', String(totalInvoice)])
    rows.push(['Total Pendapatan Bruto', String(Math.round(totalBruto / 100))])
    rows.push(['Total PPh Dipotong', String(Math.round(totalPph / 100))])
    if (isPkp) rows.push(['Total PPN Dipungut', String(Math.round(totalPpn / 100))])
    rows.push([])

    rows.push(['Pendapatan Bruto Per Bulan'])
    rows.push(['Bulan', 'Jumlah Invoice', 'Total Bruto (Rp)'])
    monthData.forEach(m => {
      rows.push([MONTHS_ID[m.month - 1], String(m.count), String(Math.round(m.bruto / 100))])
    })
    rows.push([])

    rows.push(['Rekap Per Klien'])
    rows.push(['Nama Klien', 'Jumlah Invoice', 'Total Nilai (Rp)'])
    clientSummaries.forEach(c => {
      rows.push([c.name, String(c.invoice_count), String(Math.round(c.total_nilai / 100))])
    })

    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `onbill-laporan-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  /* ── Export PDF via print ───────────────────────────────── */
  function exportPdf() {
    window.print()
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-6 print:p-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-dark">Laporan Keuangan</h1>
          <p className="text-sm text-medium-gray mt-0.5">Rekap tahunan untuk keperluan SPT Pajak.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap print:hidden">
          {/* Year selector */}
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                       bg-white outline-none focus:border-primary-teal transition-colors font-semibold"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={exportCsv}
            disabled={exporting || loading}
            className="inline-flex items-center gap-2 border border-border text-medium-gray font-semibold
                       text-sm px-4 py-2.5 rounded-xl hover:border-primary-teal hover:text-primary-teal
                       transition-all disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export CSV
          </button>

          <button
            type="button"
            onClick={exportPdf}
            disabled={loading}
            className="inline-flex items-center gap-2 bg-primary-teal text-white font-semibold
                       text-sm px-4 py-2.5 rounded-xl hover:bg-primary-teal/90 transition-all
                       disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      {/* Print header (only visible in print) */}
      <div className="hidden print:block mb-4">
        <h2 className="text-xl font-bold">Laporan Keuangan Onbill — Tahun {year}</h2>
        <p className="text-sm text-gray-500">Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 border-primary-teal border-t-transparent animate-spin"/>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Invoice"
              value={String(totalInvoice)}
              sub={`Tahun ${year}`}
            />
            <StatCard
              label="Pendapatan Bruto"
              value={formatRupiah(totalBruto)}
              sub="Sebelum pajak"
            />
            <StatCard
              label="Total PPh Dipotong"
              value={formatRupiah(totalPph)}
              sub="Dipotong oleh klien"
            />
            {isPkp && (
              <StatCard
                label="Total PPN Dipungut"
                value={formatRupiah(totalPpn)}
                sub="11% dari DPP"
              />
            )}
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-bold text-primary-dark mb-1">Pendapatan Bruto Per Bulan</h2>
            <p className="text-xs text-medium-gray mb-5">
              Nilai bruto (sebelum pajak) dari semua invoice yang diterbitkan di {year}.
            </p>
            {totalInvoice === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-medium-gray">Belum ada invoice di tahun {year}.</p>
              </div>
            ) : (
              <BarChart data={monthData} maxValue={maxMonthly} />
            )}
          </div>

          {/* Tax summary */}
          {(totalPph > 0 || totalPpn > 0) && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-bold text-primary-dark mb-4">Ringkasan Pajak {year}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <div>
                    <p className="text-sm font-semibold text-primary-dark">PPh yang Dipotong Klien</p>
                    <p className="text-xs text-medium-gray mt-0.5">
                      PPh 21/23 — dikreditkan saat lapor SPT Tahunan
                    </p>
                  </div>
                  <p className="font-bold text-primary-dark tabular-nums">{formatRupiah(totalPph)}</p>
                </div>
                {isPkp && totalPpn > 0 && (
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-semibold text-primary-dark">PPN yang Dipungut</p>
                      <p className="text-xs text-medium-gray mt-0.5">
                        PPN 11% — disetorkan ke kas negara via SPT Masa PPN
                      </p>
                    </div>
                    <p className="font-bold text-primary-dark tabular-nums">{formatRupiah(totalPpn)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Per-client table */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-bold text-primary-dark">Rekap Per Klien — {year}</h2>
            </div>
            {clientSummaries.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-medium-gray">Belum ada invoice di tahun {year}.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-very-light-gray/50">
                      <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">Nama Klien</th>
                      <th className="text-center px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">Jumlah Invoice</th>
                      <th className="text-right px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">Total Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clientSummaries.map((c, i) => (
                      <tr key={i} className="hover:bg-very-light-gray/40 transition-colors">
                        <td className="px-6 py-4 font-semibold text-primary-dark">{c.name}</td>
                        <td className="px-6 py-4 text-center text-medium-gray">{c.invoice_count}</td>
                        <td className="px-6 py-4 text-right font-semibold text-dark-charcoal tabular-nums">
                          {formatRupiah(c.total_nilai)}
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-very-light-gray/50 font-bold">
                      <td className="px-6 py-3 text-primary-dark text-sm">Total</td>
                      <td className="px-6 py-3 text-center text-primary-dark text-sm">{totalInvoice}</td>
                      <td className="px-6 py-3 text-right text-primary-teal text-sm tabular-nums">
                        {formatRupiah(clientSummaries.reduce((s, c) => s + c.total_nilai, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SPT note */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <p className="text-xs font-semibold text-blue-700 mb-1">Catatan untuk SPT Tahunan</p>
            <p className="text-xs text-blue-600 leading-relaxed">
              Data ini merupakan rekap otomatis dari invoice yang kamu buat di Onbill.
              PPh yang tercantum di sini adalah PPh yang <strong>dipotong oleh klien</strong> dan
              dapat dikreditkan sebagai bukti pemotongan (Bukti Potong) saat lapor SPT Tahunan.
              Selalu konsultasikan dengan konsultan pajak atau akuntan untuk kepatuhan perpajakan yang tepat.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
