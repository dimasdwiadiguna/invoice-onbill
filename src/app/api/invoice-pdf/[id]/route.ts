import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/components/invoices/InvoicePDF'
import type { InvoicePDFProps } from '@/components/invoices/InvoicePDF'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  /* Fetch all data in parallel */
  const [{ data: inv }, { data: items }, { data: profile }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, clients(name, address, npwp)')
      .eq('id', id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('invoice_items')
      .select('description, quantity, unit_price, subtotal, sort_order')
      .eq('invoice_id', id)
      .order('sort_order'),
    supabase
      .from('users')
      .select('name, address, npwp_number, logo_url, plan, bank_account, custom_footer')
      .eq('id', user.id)
      .single(),
  ])

  if (!inv || !profile) return new NextResponse('Not found', { status: 404 })

  const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients

  const props: InvoicePDFProps = {
    senderName:    profile.name ?? '',
    senderAddress: profile.address ?? null,
    senderNpwp:    profile.npwp_number ?? null,
    senderLogoUrl: profile.logo_url ?? null,
    isPro:         profile.plan === 'pro',
    invoiceNumber: inv.invoice_number,
    issueDate:     inv.issue_date,
    dueDate:       inv.due_date ?? null,
    clientName:    client?.name ?? '',
    clientAddress: client?.address ?? null,
    clientNpwp:    client?.npwp ?? null,
    items:         (items ?? []).map(i => ({
      description: i.description,
      quantity:    Number(i.quantity),
      unit_price:  i.unit_price,
      subtotal:    i.subtotal,
    })),
    template:      inv.template,
    invoiceMeta:   (inv.invoice_meta as Record<string, string>) ?? {},
    subtotal:      inv.subtotal ?? 0,
    dpp:           inv.dpp ?? 0,
    pphAmount:     inv.pph_amount ?? 0,
    ppnAmount:     inv.ppn_amount ?? 0,
    netAmount:     inv.net_amount ?? 0,
    taxType:       inv.tax_type as 'pph21' | 'pph23' | 'none',
    taxRate:       Number(inv.tax_rate ?? 0),
    memo:          inv.memo ?? null,
    bankAccount:   profile.bank_account ?? null,
    customFooter:  profile.custom_footer ?? null,
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfBuffer = await renderToBuffer(React.createElement(InvoicePDF, props) as any)

  /* Store to Supabase Storage as a background side-effect (best-effort) */
  const storagePath = `${user.id}/${id}.pdf`
  supabase.storage
    .from('invoice-pdfs')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })
    .catch(() => { /* storage not configured – ignore */ })

  const filename = `${inv.invoice_number.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
