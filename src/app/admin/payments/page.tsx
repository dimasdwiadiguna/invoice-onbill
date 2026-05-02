export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/* ─── Server actions ─────────────────────────────────────────── */

async function approvePayment(formData: FormData) {
  'use server'

  const paymentId = formData.get('payment_id') as string
  const adminUserId = formData.get('admin_user_id') as string
  if (!paymentId || !adminUserId) return

  const supabase = createAdminClient()

  // Load payment details
  const { data: payment } = await supabase
    .from('payments')
    .select('user_id, plan_type, status')
    .eq('id', paymentId)
    .single()

  if (!payment || payment.status !== 'pending') return

  // Load current user plan for stacking expiry
  const { data: user } = await supabase
    .from('users')
    .select('plan, plan_expires_at')
    .eq('id', payment.user_id)
    .single()

  // Calculate new expiry — stack from existing expiry if still active
  const base =
    user?.plan === 'pro' &&
    user.plan_expires_at &&
    new Date(user.plan_expires_at) > new Date()
      ? new Date(user.plan_expires_at)
      : new Date()

  const newExpiry = new Date(base)
  if (payment.plan_type === 'annual') {
    newExpiry.setFullYear(newExpiry.getFullYear() + 1)
  } else {
    newExpiry.setMonth(newExpiry.getMonth() + 1)
  }

  await Promise.all([
    supabase
      .from('payments')
      .update({ status: 'approved', approved_by: adminUserId, approved_at: new Date().toISOString() })
      .eq('id', paymentId),
    supabase
      .from('users')
      .update({ plan: 'pro', plan_expires_at: newExpiry.toISOString() })
      .eq('id', payment.user_id),
  ])

  redirect('/admin/payments')
}

async function rejectPayment(formData: FormData) {
  'use server'

  const paymentId   = formData.get('payment_id') as string
  const adminUserId = formData.get('admin_user_id') as string
  const reason      = (formData.get('reason') as string)?.trim() || null
  if (!paymentId || !adminUserId) return

  const supabase = createAdminClient()

  await supabase
    .from('payments')
    .update({ status: 'rejected', approved_by: adminUserId, rejection_note: reason })
    .eq('id', paymentId)

  redirect('/admin/payments')
}

/* ─── Helpers ────────────────────────────────────────────────── */
function fmtIDR(n: number) {
  return new Intl.NumberFormat('id-ID').format(n)
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') return <span className="text-xs font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Disetujui</span>
  if (status === 'rejected') return <span className="text-xs font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">Ditolak</span>
  return <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Menunggu</span>
}

/* ─── Page ───────────────────────────────────────────────────── */
export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status = '' } = await searchParams

  // Get current admin user ID for server actions
  const serverClient = await createClient()
  const { data: { user: adminUser } } = await serverClient.auth.getUser()
  const adminUserId = adminUser?.id ?? ''

  const supabase = createAdminClient()

  let query = supabase
    .from('payments')
    .select('id, plan_type, amount, status, note, rejection_note, created_at, user_id, users(name, email)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (status) query = query.eq('status', status)

  const { data: payments } = await query

  const STATUS_FILTERS = [
    { value: '',         label: 'Semua'    },
    { value: 'pending',  label: 'Menunggu' },
    { value: 'approved', label: 'Disetujui'},
    { value: 'rejected', label: 'Ditolak'  },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-primary-dark">Pembayaran</h1>
        <p className="text-sm text-medium-gray mt-0.5">
          {payments?.filter(p => p.status === 'pending').length ?? 0} menunggu persetujuan
        </p>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <Link
            key={f.value}
            href={f.value ? `/admin/payments?status=${f.value}` : '/admin/payments'}
            className={[
              'text-sm font-semibold px-4 py-2 rounded-xl border transition-all',
              status === f.value
                ? 'bg-primary-teal text-white border-primary-teal'
                : 'bg-white text-medium-gray border-border hover:border-primary-teal',
            ].join(' ')}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Payments table */}
      <div className="space-y-3">
        {(payments ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-12 text-center">
            <p className="text-medium-gray text-sm">Tidak ada pembayaran ditemukan.</p>
          </div>
        ) : (
          (payments ?? []).map(p => {
            const userInfo = Array.isArray(p.users) ? p.users[0] : p.users
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-border p-5 space-y-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={p.status} />
                      <span className="text-sm font-bold text-primary-dark">
                        {p.plan_type === 'annual' ? 'Pro Annual' : 'Pro Monthly'} — Rp {fmtIDR(p.amount)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-primary-dark">
                      {(userInfo as { name?: string; email?: string } | null)?.name || '—'}
                    </p>
                    <p className="text-xs text-light-gray">
                      {(userInfo as { name?: string; email?: string } | null)?.email}
                      {' · '}
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {p.note && (
                      <p className="text-xs text-medium-gray mt-1">Catatan: {p.note}</p>
                    )}
                    {p.rejection_note && (
                      <p className="text-xs text-error mt-1">Alasan tolak: {p.rejection_note}</p>
                    )}
                  </div>
                  <Link
                    href={`/admin/users/${p.user_id}`}
                    className="text-xs font-semibold text-primary-teal hover:underline flex-shrink-0"
                  >
                    Lihat user →
                  </Link>
                </div>

                {/* Payment ID */}
                <p className="font-mono text-xs text-light-gray bg-very-light-gray px-3 py-1.5 rounded-lg">
                  {p.id}
                </p>

                {/* Actions — only for pending */}
                {p.status === 'pending' && (
                  <div className="flex items-end gap-3 flex-wrap border-t border-border pt-4">
                    {/* Approve */}
                    <form action={approvePayment} className="flex-shrink-0">
                      <input type="hidden" name="payment_id"   value={p.id} />
                      <input type="hidden" name="admin_user_id" value={adminUserId} />
                      <button
                        type="submit"
                        className="text-sm font-bold text-white bg-success hover:bg-success/90
                                   px-5 py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        Setujui & Aktifkan Pro
                      </button>
                    </form>

                    {/* Reject */}
                    <form action={rejectPayment} className="flex-1 flex items-end gap-2 min-w-[260px]">
                      <input type="hidden" name="payment_id"   value={p.id} />
                      <input type="hidden" name="admin_user_id" value={adminUserId} />
                      <input
                        type="text"
                        name="reason"
                        placeholder="Alasan penolakan (opsional)"
                        className="flex-1 px-3 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                                   placeholder:text-light-gray outline-none focus:border-error transition-colors"
                      />
                      <button
                        type="submit"
                        className="flex-shrink-0 text-sm font-bold text-error border border-error/30
                                   hover:bg-error/5 px-4 py-2.5 rounded-xl transition-all"
                      >
                        Tolak
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
