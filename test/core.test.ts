import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  terbilang, terbilangPersen, tingkat, formatAngka, formatUang, formatRingkas,
  maskRibuan, unmask, terbilangTanggal, terbilangWaktu, CURRENCIES, type Angka,
} from '../src/index.ts'

const table = <T extends unknown[]>(name: string, rows: [...T, string][], fn: (...a: T) => string) =>
  test(name, () => {
    for (const row of rows) {
      const args = row.slice(0, -1) as T
      assert.equal(fn(...args), row.at(-1), `${name}(${args.map((a) => typeof a === 'bigint' ? a + 'n' : JSON.stringify(a)).join(', ')})`)
    }
  })

const E = (n: number) => 10n ** BigInt(n)
const N999 = 'sembilan ratus sembilan puluh sembilan'
const semua999 = (names: string[]) => names.map((n) => N999 + ' ' + n).join(' ') + ' ' + N999

table<[Angka]>('terbilang bilangan bulat', [
  [0, 'nol'],
  [1, 'satu'],
  [9, 'sembilan'],
  [10, 'sepuluh'],
  [11, 'sebelas'],
  [12, 'dua belas'],
  [19, 'sembilan belas'],
  [20, 'dua puluh'],
  [21, 'dua puluh satu'],
  [99, 'sembilan puluh sembilan'],
  [100, 'seratus'],
  [101, 'seratus satu'],
  [110, 'seratus sepuluh'],
  [111, 'seratus sebelas'],
  [200, 'dua ratus'],
  [999, 'sembilan ratus sembilan puluh sembilan'],
  [1000, 'seribu'],
  [1001, 'seribu satu'],
  [1100, 'seribu seratus'],
  [2000, 'dua ribu'],
  [10000, 'sepuluh ribu'],
  [11000, 'sebelas ribu'],
  [100000, 'seratus ribu'],
  [101000, 'seratus satu ribu'],
  [150000, 'seratus lima puluh ribu'],
  [999999, 'sembilan ratus sembilan puluh sembilan ribu sembilan ratus sembilan puluh sembilan'],
  [1000000, 'satu juta'],
  [1001000, 'satu juta seribu'],
  [1000001, 'satu juta satu'],
  [2026, 'dua ribu dua puluh enam'],
  [-5, 'minus lima'],
  [-0, 'nol'],
  ['-0', 'nol'],
  [E(9), 'satu miliar'],
  [E(12), 'satu triliun'],
  [E(15), 'satu kuadriliun'],
  [E(18), 'satu kuintiliun'],
  [E(21), 'satu sekstiliun'],
  [E(24), 'satu septiliun'],
  [E(27), 'satu oktiliun'],
  [E(30), 'satu noniliun'],
  [E(33), 'satu desiliun'],
  [E(33) - 1n, semua999(['noniliun', 'oktiliun', 'septiliun', 'sekstiliun', 'kuintiliun', 'kuadriliun', 'triliun', 'miliar', 'juta', 'ribu'])],
  [E(36) - E(33), 'sembilan ratus sembilan puluh sembilan desiliun'],
  [E(36), 'seribu desiliun'],
  [E(36) + 1n, 'seribu desiliun satu'],
  [E(100), 'satu googol'],
  ['1e21'.replace('1e21', '1' + '0'.repeat(21)), 'satu sekstiliun'],
  [Number.MAX_SAFE_INTEGER, 'sembilan kuadriliun tujuh triliun seratus sembilan puluh sembilan miliar dua ratus lima puluh empat juta tujuh ratus empat puluh ribu sembilan ratus sembilan puluh satu'],
], (v) => terbilang(v))

test('batas skala: 999 x skala + 1 naik ke skala berikutnya', () => {
  const names = ['ribu', 'juta', 'miliar', 'triliun', 'kuadriliun', 'kuintiliun', 'sekstiliun', 'septiliun', 'oktiliun', 'noniliun', 'desiliun']
  names.forEach((name, i) => {
    const unit = E(3 * (i + 1))
    assert.equal(terbilang(unit), i === 0 ? 'seribu' : 'satu ' + name)
    assert.equal(terbilang(unit - 1n).includes(name), false)
    assert.match(terbilang(unit * 999n), new RegExp(`^sembilan ratus sembilan puluh sembilan ${name}$`))
  })
})

table<[Angka]>('input string', [
  ['150000', 'seratus lima puluh ribu'],
  ['1.500.000', 'satu juta lima ratus ribu'],
  ['1.500.000,25', 'satu juta lima ratus ribu koma dua lima'],
  ['1500000.25', 'satu juta lima ratus ribu koma dua lima'],
  [' 1 000 ', 'seribu'],
  ['1_000', 'seribu'],
  ['.5', 'nol koma lima'],
  ['99999999999999999999999', 'sembilan puluh sembilan sekstiliun ' + semua999(['kuintiliun', 'kuadriliun', 'triliun', 'miliar', 'juta', 'ribu'])],
], (v) => terbilang(v))

table<[Angka, 'digit' | 'group' | undefined]>('desimal', [
  [3.14, undefined, 'tiga koma satu empat'],
  [3.14, 'digit', 'tiga koma satu empat'],
  [3.14, 'group', 'tiga koma empat belas'],
  ['0.05', 'digit', 'nol koma nol lima'],
  ['0.05', 'group', 'nol koma nol lima'],
  ['2.00', 'group', 'dua koma nol nol'],
  ['2.10', 'digit', 'dua koma satu nol'],
  [-1.5, undefined, 'minus satu koma lima'],
  [1.5e-7, undefined, 'nol koma nol nol nol nol nol nol satu lima'],
], (v, decimal) => terbilang(v, { decimal }))

test('input tidak valid melempar TypeError', () => {
  for (const v of ['', 'abc', '1,2,3', '--1', NaN, Infinity, '1e5'] as Angka[]) assert.throws(() => terbilang(v), TypeError, String(v))
})

table<[Angka, Parameters<typeof terbilang>[1]]>('mata uang', [
  [150000, { currency: true }, 'seratus lima puluh ribu rupiah'],
  [150000, { currency: 'IDR', case: 'title', prefix: '# ', suffix: ' #' }, '# Seratus Lima Puluh Ribu Rupiah #'],
  [100000, { currency: 'IDR', case: 'upper' }, 'SERATUS RIBU RUPIAH'],
  [150000.25, { currency: 'IDR', cents: true }, 'seratus lima puluh ribu rupiah dua puluh lima sen'],
  [150000.25, { currency: 'IDR' }, 'seratus lima puluh ribu rupiah'],
  [150000.5, { currency: 'IDR' }, 'seratus lima puluh ribu satu rupiah'],
  ['10.005', { currency: 'USD', cents: true }, 'sepuluh dolar Amerika Serikat satu sen'],
  ['9.999', { currency: 'USD', cents: true }, 'sepuluh dolar Amerika Serikat'],
  [12, { currency: 'SGD' }, 'dua belas dolar Singapura'],
  [12.3, { currency: 'MYR', cents: true }, 'dua belas ringgit tiga puluh sen'],
  [50000, { currency: 'VND' }, 'lima puluh ribu dong'],
  [1.01, { currency: 'PHP', cents: true }, 'satu peso satu sentimo'],
  [0.75, { currency: 'THB', cents: true }, 'nol baht tujuh puluh lima satang'],
  [-2000, { currency: 'IDR' }, 'minus dua ribu rupiah'],
  [-0.001, { currency: 'IDR', cents: true }, 'nol rupiah'],
], (v, o) => terbilang(v, o))

table<[Angka, Parameters<typeof terbilangPersen>[1]]>('persen', [
  [10.5, {}, 'sepuluh koma lima persen'],
  [100, { case: 'title' }, 'Seratus Persen'],
  ['12,75', { decimal: 'group' }, 'dua belas koma tujuh puluh lima persen'],
], (v, o) => terbilangPersen(v, o))

table<[Angka]>('tingkat', [
  [1, 'pertama'],
  [2, 'kedua'],
  [10, 'kesepuluh'],
  [11, 'kesebelas'],
  [21, 'kedua puluh satu'],
  [100, 'keseratus'],
  [1000, 'keseribu'],
  ['3', 'ketiga'],
  [5n, 'kelima'],
], (v) => tingkat(v))

test('tingkat menolak nol, negatif, pecahan', () => {
  for (const v of [0, -1, 1.5]) assert.throws(() => tingkat(v), RangeError)
  assert.equal(tingkat(7, { case: 'title', prefix: 'Pasal ' }), 'Pasal Ketujuh')
})

table<[Angka, Parameters<typeof formatAngka>[1]]>('formatAngka', [
  [0, {}, '0'],
  [1000, {}, '1.000'],
  [1234567.891, {}, '1.234.567,891'],
  [1234567.891, { decimals: 2 }, '1.234.567,89'],
  [0.005, { decimals: 2 }, '0,01'],
  [-1000, { thousand: ',', decimal: '.' }, '-1,000'],
  [10n ** 21n, {}, '1.000.000.000.000.000.000.000'],
], (v, o) => formatAngka(v, o))

table<[Angka, Parameters<typeof formatUang>[1]]>('formatUang', [
  [150000, {}, 'Rp 150.000'],
  [150000, { space: false }, 'Rp150.000'],
  [150000.6, {}, 'Rp 150.001'],
  [150000.5, { decimals: 2 }, 'Rp 150.000,50'],
  [-2500, {}, '-Rp 2.500'],
  [1234.5, { currency: 'USD' }, 'US$ 1,234.50'],
  [1234.5, { currency: 'SGD' }, 'S$ 1,234.50'],
  [1234.5, { currency: 'MYR' }, 'RM 1,234.50'],
  [25000, { currency: 'VND' }, '25.000 ₫'],
  [1234.5, { currency: 'PHP' }, '₱ 1,234.50'],
  [1234.5, { currency: 'THB' }, '฿ 1,234.50'],
  [1234.5, { currency: 'USD', thousand: '.', decimal: ',' }, 'US$ 1.234,50'],
], (v, o) => formatUang(v, o))

table<[Angka, Parameters<typeof formatRingkas>[1]]>('formatRingkas', [
  [999, {}, '999'],
  [1000, {}, '1 Rb'],
  [10000, {}, '10 Rb'],
  [1000, { style: 'long' }, '1 Ribu'],
  [10000, { style: 'long' }, '10 Ribu'],
  [1000000, { style: 'long', case: 'lower' }, '1 juta'],
  [100000000, { style: 'long', case: 'lower' }, '100 juta'],
  [1000000, {}, '1 Jt'],
  [100000000, {}, '100 Jt'],
  [1000000000, { style: 'long', case: 'lower' }, '1 miliar'],
  [1000000000, {}, '1 M'],
  [1000000000000, { style: 'long' }, '1 Triliun'],
  [1000000000000, {}, '1 T'],
  [1500000, {}, '1,5 Jt'],
  [1999999, {}, '1,9 Jt'],
  [1234567, { decimals: 2 }, '1,23 Jt'],
  [1050000, {}, '1 Jt'],
  [1050000, { decimals: 2 }, '1,05 Jt'],
  [-2500, {}, '-2,5 Rb'],
  [10n ** 15n, {}, '1.000 T'],
  [10n ** 15n, { style: 'long' }, '1 Kuadriliun'],
  [10n ** 33n, { style: 'long' }, '1 Desiliun'],
], (v, o) => formatRingkas(v, o))

test('masking input', () => {
  assert.equal(maskRibuan(''), '')
  assert.equal(maskRibuan('0'), '0')
  assert.equal(maskRibuan('0012'), '12')
  assert.equal(maskRibuan('1500000'), '1.500.000')
  assert.equal(maskRibuan('1.50a0.000'), '1.500.000')
  assert.equal(maskRibuan('1500000', ','), '1,500,000')
  assert.equal(unmask('Rp 1.500.000'), '1500000')
  // Backspace di tengah masking tidak boleh memangkas nominal.
  assert.equal(maskRibuan('1.500.00'), '150.000')
})

table<[string | Date, Parameters<typeof terbilangTanggal>[1]]>('terbilangTanggal', [
  ['2026-09-17', { prefix: 'Pada hari ini, ' }, 'Pada hari ini, Kamis, tanggal tujuh belas bulan September tahun dua ribu dua puluh enam'],
  ['2024-02-29', {}, 'Kamis, tanggal dua puluh sembilan bulan Februari tahun dua ribu dua puluh empat'],
  ['2000-01-01', { case: 'upper' }, 'SABTU, TANGGAL SATU BULAN JANUARI TAHUN DUA RIBU'],
  [new Date(2026, 7, 17), {}, 'Senin, tanggal tujuh belas bulan Agustus tahun dua ribu dua puluh enam'],
], (t, o) => terbilangTanggal(t, o))

test('tanggal tidak valid', () => {
  assert.throws(() => terbilangTanggal('2026-02-30'), RangeError)
  assert.throws(() => terbilangTanggal('17/09/2026'), TypeError)
})

table<[string]>('terbilangWaktu', [
  ['14:30', 'pukul empat belas lewat tiga puluh menit'],
  ['09.00', 'pukul sembilan'],
  ['00:00', 'pukul nol'],
  ['10:05:07', 'pukul sepuluh lewat lima menit tujuh detik'],
  ['10:00:30', 'pukul sepuluh lewat tiga puluh detik'],
], (t) => terbilangWaktu(t))

test('waktu tidak valid', () => {
  assert.throws(() => terbilangWaktu('24:00'), RangeError)
  assert.throws(() => terbilangWaktu('jam 5'), TypeError)
})

test('keamanan: input raksasa ditolak cepat (anti-DoS)', () => {
  const start = performance.now()
  assert.throws(() => terbilang('9'.repeat(1001)), RangeError)
  assert.throws(() => terbilang('9'.repeat(10_000_000)), RangeError)
  assert.throws(() => terbilang(10n ** 2000n), RangeError)
  assert.throws(() => formatAngka('9'.repeat(5000)), RangeError)
  assert.ok(terbilang('9'.repeat(1000)).length > 0)
  assert.equal(maskRibuan('9'.repeat(1_000_000)).replace(/\./g, '').length, 1000)
  assert.ok(performance.now() - start < 1000, 'terlalu lambat')
})

test('keamanan: decimals divalidasi', () => {
  for (const decimals of [-1, 1.5, NaN, 101, 1e7]) {
    assert.throws(() => formatAngka(1, { decimals }), RangeError, String(decimals))
    assert.throws(() => formatRingkas(1000, { decimals }), RangeError, String(decimals))
  }
})

test('keamanan: kode mata uang hanya dari tabel (tanpa lookup prototype)', () => {
  for (const currency of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'idr', 'XXX']) {
    assert.throws(() => terbilang(1000, { currency: currency as 'IDR' }), TypeError, currency)
    assert.throws(() => formatUang(1000, { currency: currency as 'IDR' }), TypeError, currency)
  }
  assert.equal(Object.isFrozen(CURRENCIES), false) // tabel dikopi saat dipakai, bukan dimutasi
  const before = JSON.stringify(CURRENCIES)
  formatUang(1, { symbol: 'X', ...JSON.parse('{"__proto__": {"polluted": true}}') })
  assert.equal(JSON.stringify(CURRENCIES), before)
  assert.equal(({} as Record<string, unknown>).polluted, undefined)
})

test('keamanan: number di luar presisi aman ditolak, bukan salah diam-diam', () => {
  assert.throws(() => terbilang(9007199254740993), RangeError)
  assert.throws(() => terbilang(1e21), RangeError)
  assert.throws(() => terbilang(-1e300), RangeError)
  assert.equal(terbilang('9007199254740993'), 'sembilan kuadriliun tujuh triliun seratus sembilan puluh sembilan miliar dua ratus lima puluh empat juta tujuh ratus empat puluh ribu sembilan ratus sembilan puluh tiga')
})

test('keamanan: tipe input asing ditolak dengan error jelas', () => {
  for (const v of [null, undefined, true, {}, [], new String('5'), Symbol('x')]) {
    assert.throws(() => terbilang(v as unknown as Angka), TypeError)
  }
  for (const t of [1430, null, {}, new Date('x')]) {
    assert.throws(() => terbilangWaktu(t as unknown as string))
    assert.throws(() => terbilangTanggal(t as unknown as string))
  }
})

test('tempel nominal berformat: desimal dibuang, bukan digabung', () => {
  assert.equal(unmask('Rp 1.500.000,75'), '1500000')
  assert.equal(unmask('1.500,5'), '1500')
  assert.equal(unmask('-500'), '500')
  assert.equal(maskRibuan('1,500,000.00', ','), '1,500,000')
})

test('tahun 0-99 tidak dipetakan ke 1900-an', () => {
  assert.equal(terbilangTanggal('0050-01-01'), 'Sabtu, tanggal satu bulan Januari tahun lima puluh')
  assert.throws(() => terbilangTanggal('2026-09-17<script>'), TypeError)
})
