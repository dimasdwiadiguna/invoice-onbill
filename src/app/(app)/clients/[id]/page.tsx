import { redirect } from 'next/navigation'

// Client editing is now handled by the modal on /clients
export default function ClientDetailPage() {
  redirect('/clients')
}
