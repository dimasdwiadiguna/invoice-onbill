import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import React from 'react'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { InvoicePDF } from '@/components/invoices/InvoicePDF'
import type { InvoicePDFProps } from '@/components/invoices/InvoicePDF'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { invoice_id, to, subject, body } = (await request.json()) as {
    invoice_id: string
    to: string
    subject: string
    body: string
  }

  if (!invoice_id || !to || !subject) {
    return NextResponse.json({ error: 'invoice_id, to, dan subject wajib diisi.' }, { status: 400 })
  }

  /* Check Pro plan */
  const { data: profile } = await supabase
    .from('users')
    .select('name, address, npwp_number, logo_url, plan, bank_account, custom_footer')
    .eq('id', user.id)
    .single()

  if (profile?.plan !== 'pro') {
    return NextResponse.json({ error: 'Fitur ini hanya tersedia untuk pengguna Pro.' }, { status: 403 })
  }

  /* Fetch invoice */
  const [{ data: inv }, { data: items }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, clients(name, address, npwp)')
      .eq('id', invoice_id)
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('invoice_items')
      .select('description, quantity, unit_price, subtotal, sort_order')
      .eq('invoice_id', invoice_id)
      .order('sort_order'),
  ])

  if (!inv) return NextResponse.json({ error: 'Invoice tidak ditemukan.' }, { status: 404 })

  const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients

  const props: InvoicePDFProps = {
    senderName:    profile.name ?? '',
    senderAddress: profile.address ?? null,
    senderNpwp:    profile.npwp_number ?? null,
    senderLogoUrl: profile.logo_url ?? null,
    isPro:         true,
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

  /* Send via Resend */
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Konfigurasi email belum diatur (RESEND_API_KEY).' }, { status: 503 })
  }

  const resend = new Resend(apiKey)
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'Invoice <invoice@onbill.id>'
  const filename = `${inv.invoice_number.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`

  const { error: sendError } = await resend.emails.send({
    from: fromAddress,
    to:   [to],
    subject,
    html: body
      ? body.replace(/\n/g, '<br>')
      : `<p>Mohon temukan invoice terlampir.</p>`,
    attachments: [
      {
        filename,
        content: pdfBuffer.toString('base64'),
      },
    ],
  })

  if (sendError) {
    return NextResponse.json({ error: 'Gagal mengirim email. Coba lagi.' }, { status: 502 })
  }

  /* Record sent date if still in draft/sent state */
  if (inv.status === 'draft') {
    await supabase
      .from('invoices')
      .update({ status: 'sent' })
      .eq('id', invoice_id)
  }

  return NextResponse.json({ ok: true })
}
