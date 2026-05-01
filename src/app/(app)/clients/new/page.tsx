'use client'

export const dynamic = 'force-dynamic'

import ClientDetailPage from '@/app/(app)/clients/[id]/page'

export default function NewClientPage() {
  return <ClientDetailPage idOverride="new" />
}
