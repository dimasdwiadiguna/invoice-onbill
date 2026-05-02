import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, email, is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-light-cream">
      {/* Admin header */}
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-extrabold text-primary-dark text-sm flex items-center gap-2">
              <span className="text-xs font-bold text-white bg-primary-teal px-2 py-0.5 rounded-full">ADMIN</span>
              onbill
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link
                href="/admin"
                className="text-sm font-semibold text-medium-gray hover:text-primary-dark transition-colors"
              >
                Pengguna
              </Link>
              <Link
                href="/admin/payments"
                className="text-sm font-semibold text-medium-gray hover:text-primary-dark transition-colors"
              >
                Pembayaran
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-light-gray hidden sm:block">{profile.email}</span>
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-primary-teal hover:underline"
            >
              ← App
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
