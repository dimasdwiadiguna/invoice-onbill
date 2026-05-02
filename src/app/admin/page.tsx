export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'

function PlanBadge({ plan, expiresAt }: { plan: string; expiresAt: string | null }) {
  const expired = plan === 'pro' && expiresAt && new Date(expiresAt) < new Date()
  if (plan === 'pro' && !expired) {
    return <span className="text-xs font-bold text-white bg-primary-teal px-2 py-0.5 rounded-full">Pro</span>
  }
  if (expired) {
    return <span className="text-xs font-bold text-error bg-error/10 px-2 py-0.5 rounded-full">Expired</span>
  }
  return <span className="text-xs font-bold text-medium-gray bg-very-light-gray px-2 py-0.5 rounded-full">Free</span>
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams

  const supabase = createAdminClient()

  let query = supabase
    .from('users')
    .select('id, name, email, plan, plan_expires_at, created_at, is_admin')
    .order('created_at', { ascending: false })
    .limit(100)

  if (q.trim()) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)
  }

  const { data: users } = await query

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-dark">Pengguna</h1>
          <p className="text-sm text-medium-gray mt-0.5">{users?.length ?? 0} pengguna ditemukan</p>
        </div>
      </div>

      {/* Search */}
      <form method="get" className="relative max-w-sm">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-light-gray" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
        </svg>
        <input
          name="q"
          type="text"
          defaultValue={q}
          placeholder="Cari nama atau email…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border text-sm text-primary-dark
                     placeholder:text-light-gray outline-none focus:border-primary-teal transition-colors bg-white"
        />
      </form>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-very-light-gray/50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">Pengguna</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider hidden md:table-cell">Expires</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-light-gray uppercase tracking-wider hidden sm:table-cell">Bergabung</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(users ?? []).map(u => (
                <tr key={u.id} className="hover:bg-very-light-gray/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-primary-dark">{u.name || '—'}</p>
                    <p className="text-xs text-light-gray mt-0.5">{u.email}</p>
                    {u.is_admin && (
                      <span className="text-[10px] font-bold text-primary-teal bg-primary-teal/10 px-1.5 py-0.5 rounded-full">admin</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <PlanBadge plan={u.plan} expiresAt={u.plan_expires_at} />
                  </td>
                  <td className="px-6 py-4 text-medium-gray hidden md:table-cell">
                    {u.plan_expires_at
                      ? new Date(u.plan_expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-medium-gray hidden sm:table-cell">
                    {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-xs font-semibold text-primary-teal hover:underline"
                    >
                      Detail →
                    </Link>
                  </td>
                </tr>
              ))}
              {(users ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-medium-gray text-sm">
                    Tidak ada pengguna ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
