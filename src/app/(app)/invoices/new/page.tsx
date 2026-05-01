import { redirect } from 'next/navigation'

// Invoice creation is now handled by the modal on /invoices
export default function NewInvoicePage() {
  redirect('/invoices')
}
