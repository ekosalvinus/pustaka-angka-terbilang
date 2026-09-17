import { bulat, gaya, type Gaya } from './core.ts'

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

/**
 * `Date` dibaca dengan zona waktu lokal runtime.
 * Untuk SSR lebih aman pakai string `"YYYY-MM-DD"` agar server & browser sama.
 */
export type Tanggal = Date | string

const kata = (n: number) => bulat(BigInt(n))

/**
 * @example
 * terbilangTanggal('2026-09-17', { prefix: 'Pada hari ini, ' })
 * // "Pada hari ini, Kamis, tanggal tujuh belas bulan September tahun dua ribu dua puluh enam"
 */
export function terbilangTanggal(t: Tanggal, o: Gaya = {}): string {
  let y: number, m: number, d: number
  if (t instanceof Date) [y, m, d] = [t.getFullYear(), t.getMonth() + 1, t.getDate()]
  else {
    const r = /^(\d{4})-(\d{2})-(\d{2})/.exec(t)
    if (!r) throw new TypeError(`Format tanggal harus YYYY-MM-DD: ${t}`)
    ;[y, m, d] = [Number(r[1]), Number(r[2]), Number(r[3])]
  }
  const date = new Date(Date.UTC(y, m - 1, d))
  if (Number.isNaN(date.getTime()) || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    throw new RangeError(`Tanggal tidak valid: ${String(t)}`)
  }
  return gaya(`${HARI[date.getUTCDay()]}, tanggal ${kata(d)} bulan ${BULAN[m - 1]} tahun ${kata(y)}`, o)
}

/**
 * @example terbilangWaktu('14:30') // "pukul empat belas lewat tiga puluh menit"
 */
export function terbilangWaktu(t: Tanggal, o: Gaya = {}): string {
  let h: number, mi: number, s: number
  if (t instanceof Date) [h, mi, s] = [t.getHours(), t.getMinutes(), t.getSeconds()]
  else {
    const r = /^(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?$/.exec(t.trim())
    if (!r) throw new TypeError(`Format waktu harus HH:mm atau HH:mm:ss: ${t}`)
    ;[h, mi, s] = [Number(r[1]), Number(r[2]), Number(r[3] ?? 0)]
  }
  if (h > 23 || mi > 59 || s > 59) throw new RangeError(`Waktu tidak valid: ${String(t)}`)
  let out = 'pukul ' + kata(h)
  if (mi || s) out += ' lewat'
  if (mi) out += ` ${kata(mi)} menit`
  if (s) out += ` ${kata(s)} detik`
  return gaya(out, o)
}
