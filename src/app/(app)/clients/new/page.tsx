import { redirect } from 'next/navigation'

// Client creation is now handled by the modal on /clients
export default function NewClientPage() {
  redirect('/clients')
}
