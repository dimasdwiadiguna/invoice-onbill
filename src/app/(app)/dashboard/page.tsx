import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRupiah } from '@/lib/tax'
import { GetStartedCard } from '@/components/dashboard/GetStartedCard'

export const dynamic = 'force-dynamic'

/* ─── Summary card ──────────────────────────────────────────── */
function SummaryCard({
  label,
  amount,
  color,
}: {
  label: string
  amount: number
  color: 'green' | 'yellow' | 'red'
}) {
  const styles = {
    green:  { wrap: 'bg-success/8 border-success/20',  text: 'text-success',  icon: 'text-success/60' },
    yellow: { wrap: 'bg-yellow-50 border-yellow-200',   text: 'text-yellow-700', icon: 'text-yellow-400' },
    red:    { wrap: 'bg-error/8  border-error/20',      text: 'text-error',    icon: 'text-error/60' },
  }[color]

  return (
    <div className={`rounded-2xl border p-5 ${styles.wrap}`}>
      <p className="text-sm font-medium text-medium-gray mb-1">{label}</p>
      <p className={`text-2xl font-extrabold ${styles.text}`}>
        {formatRupiah(amount)}
      </p>
    </div>
  )
}

/* ─── Empty state ───────────────────────────────────────────── */
function EmptyInvoices() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-subtle-teal rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-primary-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
        </svg>
      </div>
      <h3 className="font-bold text-primary-dark mb-2">Belum ada invoice</h3>
      <p className="text-sm text-medium-gray mb-6 max-w-xs mx-auto">
        Buat invoice pertamamu sekarang — pajak akan dihitung otomatis.
      </p>
      <Link
        href="/invoices/new"
        className="inline-flex items-center gap-2 bg-primary-teal text-white font-semibold
                   text-sm px-5 py-2.5 rounded-xl hover:bg-primary-teal/90 transition-all"
      >
        Buat Invoice Pertama →
      </Link>
    </div>
  )
}

/* ─── Upsell banner ─────────────────────────────────────────── */
function UpsellBanner({ used }: { used: number }) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-amber-800">
          Kamu sudah pakai {used} dari 3 invoice gratis.
        </p>
        <p className="text-xs text-amber-700 mt-0.5">
          Upgrade ke Pro untuk invoice unlimited dan fitur lengkap.
        </p>
      </div>
      <Link
        href="/settings/billing"
        className="flex-shrink-0 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600
                   px-4 py-2 rounded-xl transition-all whitespace-nowrap"
      >
        Upgrade Pro
      </Link>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────────────── */
export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, plan')
    .eq('id', user.id)
    .single()

  // Current month start
  const now   = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]

  // Monthly invoice summary
  const { data: monthInvoices } = await supabase
    .from('invoices')
    .select('status, net_amount')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('issue_date', start)

  const sum = (status: string) =>
    (monthInvoices ?? [])
      .filter(i => i.status === status)
      .reduce((s, i) => s + (i.net_amount ?? 0), 0)

  const totalPaid    = sum('paid')
  const totalUnpaid  = sum('sent')
  const totalOverdue = sum('overdue')

  // Recent invoices (join client name)
  const { data: recentInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, net_amount, status, issue_date, clients(name)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  // Total invoice count (for upsell check + checklist)
  const { count: invoiceCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  // Client count (for checklist)
  const { count: clientCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('deleted_at', null)

  const isFree      = profile?.plan === 'free'
  const showUpsell  = isFree && (invoiceCount ?? 0) >= 2
  const hasInvoices = (recentInvoices?.length ?? 0) > 0

  const monthLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-primary-dark">
          Selamat datang, {profile?.name?.split(' ')[0] ?? 'kamu'}! 👋
        </h1>
        <p className="text-sm text-medium-gray mt-1">Ringkasan aktivitas kamu bulan {monthLabel}.</p>
      </div>

      {/* Get started checklist — only shown to new users, dismissed via localStorage */}
      <GetStartedCard
        hasClients={(clientCount ?? 0) > 0}
        hasInvoices={(invoiceCount ?? 0) > 0}
      />

      {/* Upsell banner */}
      {showUpsell && <UpsellBanner used={invoiceCount ?? 0} />}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="Sudah Dibayar"  amount={totalPaid}    color="green"  />
        <SummaryCard label="Belum Dibayar"  amount={totalUnpaid}  color="yellow" />
        <SummaryCard label="Overdue"        amount={totalOverdue} color="red"    />
      </div>

      {/* Recent invoices */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-primary-dark">Invoice Terbaru</h2>
          <Link href="/invoices" className="text-sm text-primary-teal font-semibold hover:underline">
            Lihat semua →
          </Link>
        </div>

        {!hasInvoices ? (
          <EmptyInvoices />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-very-light-gray/50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">
                    Nomor
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">
                    Klien
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">
                    Jumlah
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">
                    Tanggal
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentInvoices?.map(inv => {
                  const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients
                  return (
                    <tr key={inv.id} className="hover:bg-very-light-gray/40 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary-dark">
                        <Link href={`/invoices/${inv.id}`} className="hover:text-primary-teal">
                          {inv.invoice_number}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-medium-gray">
                        {(client as { name?: string } | null)?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-dark-charcoal tabular-nums">
                        {formatRupiah(inv.net_amount ?? 0)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inv.status as 'draft' | 'sent' | 'paid' | 'overdue'} />
                      </td>
                      <td className="px-6 py-4 text-medium-gray">
                        {new Date(inv.issue_date).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
