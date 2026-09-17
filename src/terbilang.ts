import { bulat, gaya, parse, round, type Angka, type Gaya } from './core.ts'
import { getCurrency, type CurrencyCode } from './currency.ts'

export interface TerbilangOptions extends Gaya {
  /**
   * Cara membaca angka di belakang koma.
   * - `'digit'` (default): 3,14 → "tiga koma satu empat"
   * - `'group'`: 3,14 → "tiga koma empat belas"
   */
  decimal?: 'digit' | 'group'
  /** Baca sebagai mata uang. `true` = Rupiah. */
  currency?: CurrencyCode | boolean
  /** Sertakan sen (2 digit desimal, dibulatkan). Tanpa ini nilai dibulatkan ke satuan. */
  cents?: boolean
}

function kata(v: Angka, o: TerbilangOptions): string {
  let p = parse(v)
  let out: string
  if (o.currency) {
    const c = getCurrency(o.currency === true ? 'IDR' : o.currency)
    p = round(p, o.cents ? 2 : 0)
    out = bulat(p.int) + ' ' + c.name
    if (o.cents && p.frac !== '00') out += ' ' + bulat(BigInt(p.frac)) + ' ' + c.minor
  } else {
    out = bulat(p.int)
    if (p.frac) {
      out += ' koma ' + (o.decimal === 'group'
        ? p.frac.replace(/^(0*)(.*)$/, (_, z: string, rest: string) =>
          [...z].map(() => 'nol').concat(rest ? [bulat(BigInt(rest))] : []).join(' '))
        : [...p.frac].map((d) => bulat(BigInt(d))).join(' '))
    }
  }
  return (p.neg ? 'minus ' : '') + out
}

/**
 * Ubah angka jadi kata dalam bahasa Indonesia.
 * @example terbilang(150000, { currency: 'IDR', case: 'title' }) // "Seratus Lima Puluh Ribu Rupiah"
 */
export function terbilang(v: Angka, o: TerbilangOptions = {}): string {
  return gaya(kata(v, o), o)
}

/** @example terbilangPersen(10.5) // "sepuluh koma lima persen" */
export function terbilangPersen(v: Angka, o: Omit<TerbilangOptions, 'currency' | 'cents'> = {}): string {
  return gaya(kata(v, { decimal: o.decimal }) + ' persen', o)
}

/** Bilangan tingkat. @example tingkat(1) // "pertama", tingkat(11) // "kesebelas" */
export function tingkat(v: Angka, o: Gaya = {}): string {
  const p = parse(v)
  if (p.neg || p.int < 1n || /[1-9]/.test(p.frac)) throw new RangeError(`Bilangan tingkat harus bulat positif: ${String(v)}`)
  return gaya(p.int === 1n ? 'pertama' : 'ke' + bulat(p.int), o)
}
