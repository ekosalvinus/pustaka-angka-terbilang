export type Angka = number | string | bigint

export interface Gaya {
  /** Kapitalisasi. Tanpa opsi ini teks dikembalikan apa adanya. */
  case?: 'lower' | 'title' | 'upper'
  /** Teks pembuka, misal `'# '` untuk gaya kwitansi. */
  prefix?: string
  /** Teks penutup, misal `' #'`. */
  suffix?: string
}

export interface Parsed {
  neg: boolean
  int: bigint
  /** Digit di belakang koma, apa adanya. */
  frac: string
}

const SATUAN = ['nol', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan']
export const SKALA = ['', 'ribu', 'juta', 'miliar', 'triliun', 'kuadriliun', 'kuintiliun', 'sekstiliun', 'septiliun', 'oktiliun', 'noniliun', 'desiliun']
const GOOGOL = 10n ** 100n
const DESILIUN = 10n ** 33n

/** Ubah notasi eksponen (`1e21`, `1.5e-7`) jadi desimal biasa. */
function expand(s: string): string {
  const m = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(s)
  if (!m) return s
  const digits = m[2] + (m[3] ?? '')
  const point = 1 + Number(m[4])
  return m[1] + (point <= 0
    ? '0.' + '0'.repeat(-point) + digits
    : point >= digits.length
      ? digits + '0'.repeat(point - digits.length)
      : digits.slice(0, point) + '.' + digits.slice(point))
}

/**
 * Baca number, BigInt, atau string.
 * String: `"1500000.25"` (titik = desimal), `"1.500.000,25"` (format Indonesia, ada koma),
 * atau `"1.500.000"` (lebih dari satu titik = pemisah ribuan).
 */
export function parse(v: Angka): Parsed {
  let s: string
  if (typeof v === 'bigint') s = v.toString()
  else if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new TypeError(`Bukan angka yang valid: ${v}`)
    s = expand(String(v))
  } else if (typeof v === 'string') {
    s = v.replace(/[\s_]/g, '')
    if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.')
    else if (s.indexOf('.') !== s.lastIndexOf('.')) s = s.replace(/\./g, '')
  } else throw new TypeError(`Bukan angka yang valid: ${String(v)}`)

  const m = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(s)
  if (!m || !(m[2] || m[3])) throw new TypeError(`Bukan angka yang valid: ${String(v)}`)
  const int = BigInt(m[2] || '0')
  const frac = m[3] ?? ''
  return { neg: m[1] === '-' && (int > 0n || /[1-9]/.test(frac)), int, frac }
}

/** Bulatkan (half-up) ke `d` digit desimal. */
export function round(p: Parsed, d: number): Parsed {
  const scale = 10n ** BigInt(d)
  const scaled = p.int * scale + BigInt(p.frac.padEnd(d, '0').slice(0, d) || '0') + (p.frac[d] >= '5' ? 1n : 0n)
  return {
    neg: p.neg && scaled > 0n,
    int: scaled / scale,
    frac: d ? (scaled % scale).toString().padStart(d, '0') : '',
  }
}

function ratusan(n: number): string {
  const r = Math.floor(n / 100), p = Math.floor(n / 10) % 10, s = n % 10
  const out: string[] = []
  if (r) out.push(r === 1 ? 'seratus' : SATUAN[r] + ' ratus')
  if (p === 1) out.push(s === 0 ? 'sepuluh' : s === 1 ? 'sebelas' : SATUAN[s] + ' belas')
  else {
    if (p) out.push(SATUAN[p] + ' puluh')
    if (s) out.push(SATUAN[s])
  }
  return out.join(' ')
}

/** Terbilang bilangan bulat non-negatif, huruf kecil. */
export function bulat(n: bigint): string {
  if (n === 0n) return 'nol'
  if (n === GOOGOL) return 'satu googol'
  // Di atas 999 desiliun: gabungkan, misal 10^36 = "seribu desiliun".
  if (n >= DESILIUN * 1000n) {
    const lo = n % DESILIUN
    return bulat(n / DESILIUN) + ' desiliun' + (lo ? ' ' + bulat(lo) : '')
  }
  const s = n.toString()
  const parts: string[] = []
  for (let i = 0, end = s.length; end > 0; i++, end -= 3) {
    const g = Number(s.slice(Math.max(0, end - 3), end))
    if (g) parts.unshift(i === 1 && g === 1 ? 'seribu' : ratusan(g) + (i ? ' ' + SKALA[i] : ''))
  }
  return parts.join(' ')
}

export function gaya(s: string, o: Gaya = {}): string {
  if (o.case === 'upper') s = s.toUpperCase()
  else if (o.case === 'lower') s = s.toLowerCase()
  else if (o.case === 'title') s = s.replace(/(^|\s)(\S)/g, (_, a: string, b: string) => a + b.toUpperCase())
  return (o.prefix ?? '') + s + (o.suffix ?? '')
}
