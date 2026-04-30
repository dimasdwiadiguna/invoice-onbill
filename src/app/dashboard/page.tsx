export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  return (
    <main className="min-h-screen bg-light-cream flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6">
          <span className="text-2xl font-extrabold text-primary-teal">On</span>
          <span className="text-2xl font-extrabold text-primary-dark">bill</span>
        </div>
        <h1 className="text-2xl font-bold text-primary-dark mb-2">
          Halo, {profile.name}! 👋
        </h1>
        <p className="text-medium-gray">Dashboard sedang dalam pengembangan.</p>
      </div>
    </main>
  )
}
