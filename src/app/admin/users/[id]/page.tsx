export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/* ─── Server actions ─────────────────────────────────────────── */

async function updateUserPlan(formData: FormData) {
  'use server'

  const userId   = formData.get('user_id') as string
  const plan     = formData.get('plan') as string
  const expiryRaw = (formData.get('plan_expires_at') as string)?.trim()
  if (!userId) return

  const supabase = createAdminClient()
  await supabase
    .from('users')
    .update({
      plan,
      plan_expires_at: plan === 'pro' && expiryRaw ? new Date(expiryRaw).toISOString() : null,
    })
    .eq('id', userId)

  redirect(`/admin/users/${userId}`)
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
export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Verify admin
  const serverClient = await createClient()
  const { data: { user: adminUser } } = await serverClient.auth.getUser()
  if (!adminUser) redirect('/login')

  const supabase = createAdminClient()

  const [
    { data: user },
    { data: payments },
    { count: invoiceCount },
    { count: clientCount },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, name, email, plan, plan_expires_at, entity_type, is_admin, created_at, onboarding_completed')
      .eq('id', id)
      .single(),
    supabase
      .from('payments')
      .select('id, plan_type, amount, status, note, rejection_note, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .is('deleted_at', null),
    supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', id)
      .is('deleted_at', null),
  ])

  if (!user) notFound()

  const isProActive = user.plan === 'pro' && user.plan_expires_at && new Date(user.plan_expires_at) > new Date()
  const isProExpired = user.plan === 'pro' && user.plan_expires_at && new Date(user.plan_expires_at) <= new Date()

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/admin" className="text-sm text-primary-teal hover:underline">← Semua Pengguna</Link>

      {/* User header */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-primary-dark">{user.name || '—'}</h1>
            <p className="text-sm text-medium-gray mt-0.5">{user.email}</p>
            <p className="text-xs text-light-gray mt-1">
              Bergabung {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              {user.is_admin && <span className="ml-2 text-primary-teal font-semibold">· admin</span>}
            </p>
          </div>
          <div className="text-right space-y-1">
            <div className="flex items-center gap-2 justify-end">
              <span className="text-sm font-semibold text-primary-dark">
                {isProActive ? 'Pro' : isProExpired ? 'Pro (expired)' : 'Free'}
              </span>
              {isProActive && <span className="text-xs font-bold text-white bg-primary-teal px-2 py-0.5 rounded-full">AKTIF</span>}
              {isProExpired && <span className="text-xs font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">EXPIRED</span>}
            </div>
            {user.plan_expires_at && (
              <p className="text-xs text-medium-gray">
                {isProActive ? 'Hingga' : 'Kadaluarsa'}{' '}
                {new Date(user.plan_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-very-light-gray rounded-xl px-4 py-3">
            <p className="text-xs text-light-gray">Total Invoice</p>
            <p className="text-2xl font-extrabold text-primary-dark">{invoiceCount ?? 0}</p>
          </div>
          <div className="bg-very-light-gray rounded-xl px-4 py-3">
            <p className="text-xs text-light-gray">Total Klien</p>
            <p className="text-2xl font-extrabold text-primary-dark">{clientCount ?? 0}</p>
          </div>
        </div>

        {/* Edit plan form */}
        <form action={updateUserPlan} className="border-t border-border pt-5 space-y-4">
          <p className="text-xs font-semibold text-light-gray uppercase tracking-wider">Edit Plan</p>
          <input type="hidden" name="user_id" value={user.id} />
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-primary-dark mb-1.5">Plan</label>
              <select
                name="plan"
                defaultValue={user.plan}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                           outline-none focus:border-primary-teal transition-colors bg-white"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-primary-dark mb-1.5">
                Expires at <span className="text-light-gray font-normal">(Pro only)</span>
              </label>
              <input
                type="datetime-local"
                name="plan_expires_at"
                defaultValue={user.plan_expires_at ? new Date(user.plan_expires_at).toISOString().slice(0, 16) : ''}
                className="w-full px-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                           outline-none focus:border-primary-teal transition-colors bg-white"
              />
            </div>
          </div>
          <button
            type="submit"
            className="text-sm font-bold text-white bg-primary-teal hover:bg-primary-teal/90
                       px-5 py-2.5 rounded-xl transition-all shadow-sm"
          >
            Simpan Perubahan
          </button>
        </form>
      </div>

      {/* Payment history */}
      <div>
        <h2 className="text-lg font-bold text-primary-dark mb-4">Riwayat Pembayaran</h2>
        {(payments ?? []).length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center">
            <p className="text-medium-gray text-sm">Belum ada riwayat pembayaran.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(payments ?? []).map(p => (
              <div key={p.id} className="bg-white rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge status={p.status} />
                      <span className="text-sm font-bold text-primary-dark">
                        {p.plan_type === 'annual' ? 'Pro Annual' : 'Pro Monthly'} — Rp {fmtIDR(p.amount)}
                      </span>
                    </div>
                    <p className="text-xs text-light-gray">
                      {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {p.note && <p className="text-xs text-medium-gray mt-1">Catatan: {p.note}</p>}
                    {p.rejection_note && <p className="text-xs text-error mt-1">Ditolak: {p.rejection_note}</p>}
                  </div>
                </div>
                <p className="font-mono text-xs text-light-gray mt-3 bg-very-light-gray px-3 py-1.5 rounded-lg">{p.id}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
