import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/dashboard/AppShell'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('name, plan, plan_expires_at, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile?.onboarding_completed) redirect('/onboarding')

  // Auto-downgrade expired Pro — only writes once when expiry passes
  let effectivePlan = profile.plan ?? 'free'
  if (
    effectivePlan === 'pro' &&
    profile.plan_expires_at &&
    new Date(profile.plan_expires_at) < new Date()
  ) {
    await supabase
      .from('users')
      .update({ plan: 'free', plan_expires_at: null })
      .eq('id', user.id)
    effectivePlan = 'free'
  }

  return (
    <AppShell userName={profile.name || user.email || 'Pengguna'} userPlan={effectivePlan}>
      {children}
    </AppShell>
  )
}
