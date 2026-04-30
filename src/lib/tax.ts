export type UserProfile = {
  entity_type: 'individual' | 'cv' | 'pt'
  has_npwp: boolean
  is_pkp: boolean
}

export type TaxResult = {
  dpp: number
  tax_type: 'pph21' | 'pph23' | 'none'
  /** Decimal fraction, e.g. 0.025 for 2.5% */
  tax_rate: number
  pph_amount: number
  ppn_amount: number
  net_amount: number
}

/**
 * All monetary values are in DB units (Rupiah × 100).
 *
 * PPh 21 — individu: 2.5% (NPWP) or 3% (non-NPWP)
 * PPh 23 — badan usaha: 2%
 * PPN    — only if is_pkp: 11%
 */
export function calculateTax(subtotal: number, profile: UserProfile): TaxResult {
  const dpp = subtotal

  let tax_type: 'pph21' | 'pph23'
  let tax_rate: number

  if (profile.entity_type === 'individual') {
    tax_type = 'pph21'
    tax_rate = profile.has_npwp ? 0.025 : 0.03
  } else {
    tax_type = 'pph23'
    tax_rate = 0.02
  }

  const pph_amount = Math.round(dpp * tax_rate)
  const ppn_amount = profile.is_pkp ? Math.round(dpp * 0.11) : 0
  const net_amount = dpp - pph_amount + ppn_amount

  return { dpp, tax_type, tax_rate, pph_amount, ppn_amount, net_amount }
}

/**
 * Formats a DB-unit value (Rupiah × 100) to display string.
 * formatRupiah(750000000) → "Rp 7.500.000"
 */
export function formatRupiah(amountInDbUnits: number): string {
  return (
    'Rp ' +
    new Intl.NumberFormat('id-ID').format(Math.round(amountInDbUnits / 100))
  )
}

/** Formats a raw NPWP digit string into XX.XXX.XXX.X-XXX.XXX display form. */
export function formatNPWP(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 15)
  if (d.length <= 2)  return d
  if (d.length <= 5)  return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 9)  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}.${d.slice(8)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}.${d.slice(8,9)}-${d.slice(9)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}.${d.slice(8,9)}-${d.slice(9,12)}.${d.slice(12)}`
}
