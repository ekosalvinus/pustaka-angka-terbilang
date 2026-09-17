import { checkDecimals, gaya, MAX_LENGTH, parse, round, SKALA, type Angka, type Gaya } from './core.ts'
import { getCurrency, type Currency, type CurrencyCode } from './currency.ts'

export interface FormatAngkaOptions {
  /** Jumlah digit desimal (dibulatkan). Default: apa adanya. */
  decimals?: number
  /** Default `'.'` */
  thousand?: string
  /** Default `','` */
  decimal?: string
}

/** @example formatAngka(1500000.5) // "1.500.000,5" */
export function formatAngka(v: Angka, o: FormatAngkaOptions = {}): string {
  const { decimals, thousand = '.', decimal = ',' } = o
  let p = parse(v)
  if (decimals !== undefined) p = round(p, decimals)
  return (p.neg ? '-' : '') + p.int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thousand) + (p.frac ? decimal + p.frac : '')
}

export interface FormatUangOptions extends Partial<Currency> {
  /** Default `'IDR'` */
  currency?: CurrencyCode
  /** Spasi antara simbol dan angka. Default `true`. */
  space?: boolean
}

/** @example formatUang(150000) // "Rp 150.000", formatUang(9.5, { currency: 'USD' }) // "US$ 9.50" */
export function formatUang(v: Angka, o: FormatUangOptions = {}): string {
  const { currency = 'IDR', space = true, ...rest } = o
  const c: Currency = { ...getCurrency(currency), ...rest }
  const num = formatAngka(v, c)
  const neg = num.startsWith('-') ? '-' : ''
  const sp = space ? ' ' : ''
  return neg + (c.after ? num.slice(neg.length) + sp + c.symbol : c.symbol + sp + num.slice(neg.length))
}

const PENDEK = ['', 'Rb', 'Jt', 'M', 'T']
const PANJANG = SKALA.map((s) => s.charAt(0).toUpperCase() + s.slice(1))

export interface FormatRingkasOptions extends Gaya {
  /** `'short'` (default): "1 Rb", "1 Jt", "1 M", "1 T". `'long'`: "1 Ribu", "1 Juta", ... */
  style?: 'short' | 'long'
  /** Maksimal digit desimal (dipotong, bukan dibulatkan). Default `1`. */
  decimals?: number
  /** Default `','` */
  decimal?: string
}

/** @example formatRingkas(1500000) // "1,5 Jt", formatRingkas(1e9, { style: 'long' }) // "1 Miliar" */
export function formatRingkas(v: Angka, o: FormatRingkasOptions = {}): string {
  const { style = 'short', decimal = ',' } = o
  const decimals = checkDecimals(o.decimals ?? 1)
  const p = parse(v)
  const names = style === 'long' ? PANJANG : PENDEK
  const d = p.int.toString()
  const i = Math.min(Math.floor((d.length - 1) / 3), names.length - 1)
  const sign = p.neg && p.int > 0n ? '-' : ''
  if (!i) return gaya(sign + d, o)
  const cut = d.length - 3 * i
  const frac = d.slice(cut, cut + decimals).replace(/0+$/, '')
  return gaya(sign + formatAngka(d.slice(0, cut)) + (frac ? decimal + frac : '') + ' ' + names[i], o)
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Ambil digit bilangan bulat saja, tanpa nol di depan. Untuk input nominal (selalu non-negatif, tanda `-` dibuang).
 * Bagian setelah pemisah desimal terakhir dibuang dulu, supaya tempelan `"1.500.000,75"`
 * tidak berubah jadi `150000075`. Panjang dibatasi `MAX_LENGTH`.
 * @example unmask("Rp 1.500.000,00") // "1500000"
 */
export function unmask(s: string, decimal = ','): string {
  return String(s).slice(0, MAX_LENGTH)
    .replace(new RegExp(escapeRe(decimal) + '\\d*\\s*$'), '')
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '')
}

/** Masking ribuan untuk input. @example maskRibuan("1500000") // "1.500.000" */
export function maskRibuan(s: string, thousand = '.', decimal = thousand === '.' ? ',' : '.'): string {
  return unmask(s, decimal).replace(/\B(?=(\d{3})+(?!\d))/g, thousand)
}
