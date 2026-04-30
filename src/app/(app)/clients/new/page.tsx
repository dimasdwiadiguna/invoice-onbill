import ClientDetailPage from '@/app/(app)/clients/[id]/page'

// Re-use the [id] page with id="new" via parallel route
// Next.js static route /clients/new takes priority over /clients/[id]
export { default } from '@/app/(app)/clients/[id]/page'
