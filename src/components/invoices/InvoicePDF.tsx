import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'

/* ─── Types ──────────────────────────────────────────────────── */
export type InvoicePDFItem = {
  description: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type InvoicePDFProps = {
  /* Sender */
  senderName: string
  senderAddress: string | null
  senderNpwp: string | null
  senderLogoUrl: string | null
  isPro: boolean
  /* Invoice header */
  invoiceNumber: string
  issueDate: string
  dueDate: string | null
  /* Client */
  clientName: string
  clientAddress: string | null
  clientNpwp: string | null
  /* Items */
  items: InvoicePDFItem[]
  /* Template */
  template: string
  invoiceMeta: Record<string, string>
  /* Tax */
  subtotal: number
  dpp: number
  pphAmount: number
  ppnAmount: number
  netAmount: number
  taxType: 'pph21' | 'pph23' | 'none'
  taxRate: number
  /* Extra */
  memo: string | null
  bankAccount: string | null
  customFooter: string | null
}

/* ─── Helpers ────────────────────────────────────────────────── */
function fmt(n: number): string {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n / 100))
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

const TEMPLATE_LABELS: Record<string, string> = {
  it_software:        'IT & Software',
  konsultasi:         'Konsultasi & Jasa Umum',
  kreator_endorse:    'Kreator – Endorsement',
  kreator_production: 'Kreator – Konten',
  kreator_afiliasi:   'Kreator – Afiliasi',
  umkm_jasa:          'UMKM Jasa',
}

const TEMPLATE_META_LABELS: Record<string, Record<string, string>> = {
  it_software:        { project_name: 'Project', tech_stack: 'Tech Stack', period: 'Periode', milestone: 'Milestone' },
  konsultasi:         { scope: 'Scope Pekerjaan', period: 'Periode', sessions_days: 'Sesi / Hari' },
  kreator_endorse:    { campaign_name: 'Campaign', platform: 'Platform', air_period: 'Periode Tayang', content_count: 'Jumlah Konten', format: 'Format' },
  kreator_production: { content_type: 'Jenis Konten', revision_count: 'Revisi', deliverable_list: 'Deliverable', deadline: 'Deadline' },
  kreator_afiliasi:   { commission_pct: 'Komisi (%)', aff_period: 'Periode', transaction_count: 'Jumlah Transaksi', affiliate_code: 'Kode Afiliasi' },
  umkm_jasa:          { service_description: 'Deskripsi Layanan', location: 'Lokasi', client_pic: 'PIC Klien' },
}

/* ─── Styles ─────────────────────────────────────────────────── */
const C = {
  teal:       '#0E9CB4',
  dark:       '#1F2937',
  medGray:    '#6B7280',
  lightGray:  '#9CA3AF',
  border:     '#E5E7EB',
  bgLight:    '#F9FAFB',
  bgTeal:     '#F0FAFB',
  error:      '#EF4444',
  success:    '#8BC540',
  amber:      '#92400E',
  amberBg:    '#FFFBEB',
  amberBorder:'#FDE68A',
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.dark,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    lineHeight: 1.4,
  },

  /* Header */
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1.5, borderBottomColor: C.teal },
  logo: { width: 56, height: 56, marginBottom: 6, objectFit: 'contain' },
  senderBlock: { flex: 1 },
  senderName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.dark },
  senderDetail: { fontSize: 8, color: C.medGray, marginTop: 2 },
  invoiceTitleBlock: { alignItems: 'flex-end' },
  invoiceTitle: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.teal, letterSpacing: 1.5 },
  invoiceNumber: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark, marginTop: 3 },
  invoiceDateRow: { fontSize: 8, color: C.medGray, marginTop: 2 },

  /* Info row */
  infoRow: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  infoBlock: { flex: 1 },
  infoLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.lightGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 9, color: C.dark },
  infoValueBold: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark },
  infoMono: { fontSize: 8, color: C.medGray, fontFamily: 'Courier' },

  /* Items table */
  table: { marginBottom: 0 },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.border, paddingBottom: 5, marginBottom: 4, backgroundColor: C.bgLight, paddingHorizontal: 6, paddingTop: 5 },
  thNo: { width: 22, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.lightGray, textTransform: 'uppercase' },
  thDesc: { flex: 1, fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.lightGray, textTransform: 'uppercase' },
  thQty: { width: 36, textAlign: 'center', fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.lightGray, textTransform: 'uppercase' },
  thPrice: { width: 76, textAlign: 'right', fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.lightGray, textTransform: 'uppercase' },
  thSubtotal: { width: 76, textAlign: 'right', fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.lightGray, textTransform: 'uppercase' },

  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: C.border },
  tdNo: { width: 22, fontSize: 8, color: C.medGray },
  tdDesc: { flex: 1, fontSize: 8.5, color: C.dark },
  tdQty: { width: 36, textAlign: 'center', fontSize: 8, color: C.medGray },
  tdPrice: { width: 76, textAlign: 'right', fontSize: 8, color: C.medGray },
  tdSubtotal: { width: 76, textAlign: 'right', fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.dark },

  /* Template meta */
  metaSection: { backgroundColor: C.bgTeal, borderWidth: 0.5, borderColor: C.teal + '40', borderRadius: 4, padding: 8, marginTop: 10, marginBottom: 4 },
  metaTitle: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.teal, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaItem: { width: '48%' },
  metaLabel: { fontSize: 7, color: C.lightGray, marginBottom: 1 },
  metaValue: { fontSize: 8.5, color: C.dark },

  /* Tax summary */
  taxSection: { marginTop: 10, alignItems: 'flex-end' },
  taxBox: { width: 220 },
  taxRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2.5 },
  taxLabel: { fontSize: 8.5, color: C.medGray },
  taxValue: { fontSize: 8.5, color: C.dark },
  taxDeduct: { fontSize: 8.5, color: C.error },
  taxAdd: { fontSize: 8.5, color: C.success },
  taxDivider: { borderTopWidth: 1, borderTopColor: C.border, marginVertical: 4 },
  taxTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  taxTotalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.dark },
  taxTotalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.teal },

  /* Tax note */
  taxNote: { backgroundColor: C.amberBg, borderWidth: 0.5, borderColor: C.amberBorder, borderRadius: 4, padding: 8, marginTop: 12 },
  taxNoteText: { fontSize: 7.5, color: C.amber, lineHeight: 1.5 },

  /* Memo */
  memoSection: { marginTop: 10, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 8 },
  memoLabel: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.lightGray, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  memoText: { fontSize: 8.5, color: C.medGray, lineHeight: 1.5 },

  /* Footer */
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, borderTopWidth: 0.5, borderTopColor: C.border, paddingTop: 8 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  footerBank: { fontSize: 8, color: C.medGray },
  footerCustom: { fontSize: 7.5, color: C.lightGray, textAlign: 'right', flex: 1, marginLeft: 16 },
  footerDefault: { fontSize: 7.5, color: C.lightGray },

  /* Page number */
  pageNum: { position: 'absolute', bottom: 10, right: 40, fontSize: 7, color: C.lightGray },

  divider: { borderTopWidth: 0.5, borderTopColor: C.border, marginVertical: 10 },
})

/* ─── Document ───────────────────────────────────────────────── */
export function InvoicePDF({
  senderName, senderAddress, senderNpwp, senderLogoUrl, isPro,
  invoiceNumber, issueDate, dueDate,
  clientName, clientAddress, clientNpwp,
  items, template, invoiceMeta,
  subtotal, dpp, pphAmount, ppnAmount, netAmount, taxType, taxRate,
  memo, bankAccount, customFooter,
}: InvoicePDFProps) {

  const metaLabels = TEMPLATE_META_LABELS[template] ?? {}
  const metaEntries = Object.entries(invoiceMeta)
    .filter(([k, v]) => v?.trim() && metaLabels[k])
    .map(([k, v]) => [metaLabels[k], v] as [string, string])

  const pphLabel = taxType === 'pph21'
    ? `PPh 21 dipotong pemberi kerja (${(taxRate * 100).toFixed(1)}%)`
    : `PPh 23 dipotong klien (${(taxRate * 100).toFixed(1)}%)`

  const taxNote = taxType === 'pph21'
    ? `PPh 21 akan dipotong oleh pemberi kerja sesuai peraturan perpajakan Indonesia yang berlaku. Harap meminta bukti potong PPh 21 setelah pembayaran dilakukan.`
    : `PPh 23 akan dipotong oleh pemberi kerja/klien sesuai peraturan perpajakan Indonesia yang berlaku. Harap meminta bukti potong PPh 23 setelah pembayaran dilakukan.`

  return (
    <Document title={`Invoice ${invoiceNumber}`} author={senderName}>
      <Page size="A4" style={s.page}>

        {/* ── 1. Header ── */}
        <View style={s.header}>
          <View style={s.senderBlock}>
            {isPro && senderLogoUrl && (
              <Image src={senderLogoUrl} style={s.logo} />
            )}
            <Text style={s.senderName}>{senderName}</Text>
            {senderAddress && <Text style={s.senderDetail}>{senderAddress}</Text>}
            {senderNpwp && (
              <Text style={s.senderDetail}>NPWP: {senderNpwp}</Text>
            )}
          </View>
          <View style={s.invoiceTitleBlock}>
            <Text style={s.invoiceTitle}>INVOICE</Text>
            <Text style={s.invoiceNumber}>{invoiceNumber}</Text>
            <Text style={s.invoiceDateRow}>Tanggal: {fmtDate(issueDate)}</Text>
            {dueDate && (
              <Text style={s.invoiceDateRow}>Jatuh Tempo: {fmtDate(dueDate)}</Text>
            )}
          </View>
        </View>

        {/* ── 3. Client info ── */}
        <View style={s.infoRow}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Ditagihkan Kepada</Text>
            <Text style={s.infoValueBold}>{clientName}</Text>
            {clientAddress && <Text style={s.infoValue}>{clientAddress}</Text>}
            {clientNpwp && <Text style={s.infoMono}>NPWP: {clientNpwp}</Text>}
          </View>
          <View style={[s.infoBlock, { alignItems: 'flex-end' }]}>
            <Text style={s.infoLabel}>Layanan</Text>
            <Text style={s.infoValue}>{TEMPLATE_LABELS[template] ?? template}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* ── 4. Line items ── */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={s.thNo}>No</Text>
            <Text style={s.thDesc}>Deskripsi</Text>
            <Text style={s.thQty}>Qty</Text>
            <Text style={s.thPrice}>Harga Satuan</Text>
            <Text style={s.thSubtotal}>Subtotal</Text>
          </View>
          {items.map((item, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={s.tdNo}>{i + 1}</Text>
              <Text style={s.tdDesc}>{item.description}</Text>
              <Text style={s.tdQty}>{item.quantity % 1 === 0 ? item.quantity.toString() : item.quantity.toFixed(2)}</Text>
              <Text style={s.tdPrice}>{fmt(item.unit_price)}</Text>
              <Text style={s.tdSubtotal}>{fmt(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* ── 5. Template-specific fields ── */}
        {metaEntries.length > 0 && (
          <View style={s.metaSection}>
            <Text style={s.metaTitle}>{TEMPLATE_LABELS[template] ?? template} — Detail</Text>
            <View style={s.metaGrid}>
              {metaEntries.map(([label, value]) => (
                <View key={label} style={s.metaItem}>
                  <Text style={s.metaLabel}>{label}</Text>
                  <Text style={s.metaValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── 6. Tax calculation ── */}
        <View style={s.taxSection}>
          <View style={s.taxBox}>
            <View style={s.taxRow}>
              <Text style={s.taxLabel}>Subtotal</Text>
              <Text style={s.taxValue}>{fmt(subtotal)}</Text>
            </View>
            <View style={s.taxRow}>
              <Text style={s.taxLabel}>DPP (Dasar Pengenaan Pajak)</Text>
              <Text style={s.taxValue}>{fmt(dpp)}</Text>
            </View>
            {pphAmount > 0 && (
              <View style={s.taxRow}>
                <Text style={s.taxDeduct}>{pphLabel}</Text>
                <Text style={s.taxDeduct}>-{fmt(pphAmount)}</Text>
              </View>
            )}
            {ppnAmount > 0 && (
              <View style={s.taxRow}>
                <Text style={s.taxAdd}>PPN 11%</Text>
                <Text style={s.taxAdd}>+{fmt(ppnAmount)}</Text>
              </View>
            )}
            <View style={s.taxDivider} />
            <View style={s.taxTotalRow}>
              <Text style={s.taxTotalLabel}>Jumlah yang Dibayarkan</Text>
              <Text style={s.taxTotalValue}>{fmt(netAmount)}</Text>
            </View>
          </View>
        </View>

        {/* ── 7. Tax note ── */}
        {taxType !== 'none' && pphAmount > 0 && (
          <View style={s.taxNote}>
            <Text style={s.taxNoteText}>{taxNote}</Text>
          </View>
        )}

        {/* ── 8. Memo (Pro) ── */}
        {isPro && memo && (
          <View style={s.memoSection}>
            <Text style={s.memoLabel}>Memo</Text>
            <Text style={s.memoText}>{memo}</Text>
          </View>
        )}

        {/* ── 9. Footer ── */}
        <View style={s.footer} fixed>
          <View style={s.footerRow}>
            {bankAccount ? (
              <Text style={s.footerBank}>Rekening: {bankAccount}</Text>
            ) : (
              <Text style={s.footerDefault} />
            )}
            {isPro && customFooter ? (
              <Text style={s.footerCustom}>{customFooter}</Text>
            ) : (
              <Text style={s.footerCustom}>Dibuat dengan Onbill · onbill.id</Text>
            )}
          </View>
        </View>

        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
