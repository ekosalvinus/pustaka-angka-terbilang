# Pustaka Angka Terbilang

Ubah angka jadi kata dalam bahasa Indonesia, untuk kwitansi, akad kredit, surat perjanjian, dan form transfer.

- Terbilang biasa, mata uang (dengan sen), persen, bilangan tingkat, tanggal & waktu legal
- Format uang (IDR, USD, SGD, MYR, VND, PHP, THB) dan format ringkas (`1,5 Jt`, `1 Miliar`)
- Input `number`, `string`, dan `BigInt` (sampai desiliun, di atasnya tetap terbaca)
- TypeScript, ESM, **zero dependency**, tree-shakeable, `sideEffects: false`
- Core tidak bergantung framework: jalan di Node, browser, Deno, Bun, React, Next.js, Svelte, Astro, dll.
- Adapter Vue (`/vue`): composable `useTerbilang`, komponen `<Terbilang>` dan `<InputRupiah>`. Aman untuk SSR/Nuxt, tanpa custom directive (cocok untuk Vapor Mode)

## Instalasi

```bash
npm install pustaka-angka-terbilang
# atau
pnpm add pustaka-angka-terbilang
# atau
yarn add pustaka-angka-terbilang
```

Adapter Vue memakai `vue` yang sudah ada di proyek Anda (peer dependency opsional, Vue ≥ 3.3). Jika hanya memakai core, Vue tidak dibutuhkan.

## Mulai cepat
 
```ts
import { terbilang, formatUang } from 'pustaka-angka-terbilang'

terbilang(150000)                       // "seratus lima puluh ribu"
terbilang(150000, { currency: 'IDR' })  // "seratus lima puluh ribu rupiah"
formatUang(150000)                      // "Rp 150.000"
```

## Terbilang

```ts
import { terbilang } from 'pustaka-angka-terbilang'

terbilang(0)          // "nol"
terbilang(11)         // "sebelas"
terbilang(1001)       // "seribu satu"
terbilang(1000000)    // "satu juta"
terbilang(-5)         // "minus lima"
terbilang(10n ** 33n) // "satu desiliun"
terbilang(10n ** 36n) // "seribu desiliun"
terbilang(10n ** 100n) // "satu googol"
```

### Input yang diterima

| Input | Dibaca sebagai |
| --- | --- |
| `1500000.25` (number) | 1500000,25 |
| `1500000n` (BigInt) | 1500000 |
| `"1500000.25"` | titik = desimal |
| `"1.500.000,25"` | ada koma: titik = ribuan, koma = desimal |
| `"1.500.000"` | lebih dari satu titik = ribuan |
| `"1 500 000"`, `"1_500_000"` | spasi & garis bawah diabaikan |

> `"1.000"` (hanya satu titik, tanpa koma) dibaca **satu koma nol nol nol**. Untuk ribuan, tulis `"1000"` atau `"1.000,00"`.
>
> `number` di atas `Number.MAX_SAFE_INTEGER` (9.007.199.254.740.991) melempar `RangeError`, karena presisinya sudah hilang sebelum masuk ke fungsi (nominal bisa salah tanpa ketahuan). Kirim angka sebesar itu sebagai string atau BigInt.

Input tidak valid melempar `TypeError`. Input lebih dari 1.000 karakter/digit melempar `RangeError`.

### Opsi

| Opsi | Nilai | Keterangan |
| --- | --- | --- |
| `case` | `'lower'` \| `'title'` \| `'upper'` | Kapitalisasi. Default: huruf kecil. |
| `prefix` / `suffix` | string | Pembungkus, misal gaya kwitansi. |
| `decimal` | `'digit'` (default) \| `'group'` | `3,14` → "tiga koma satu empat" / "tiga koma empat belas" |
| `currency` | `true` \| `'IDR'` \| `'USD'` \| `'SGD'` \| `'MYR'` \| `'VND'` \| `'PHP'` \| `'THB'` | Baca sebagai uang. `true` = Rupiah. |
| `cents` | boolean | Sertakan sen (dibulatkan 2 digit). Tanpa ini nilai dibulatkan ke satuan. |

```ts
terbilang(3.14)                         // "tiga koma satu empat"
terbilang(3.14, { decimal: 'group' })   // "tiga koma empat belas"

terbilang(150000, { currency: true, case: 'title' })
// "Seratus Lima Puluh Ribu Rupiah"

terbilang(100000, { currency: 'IDR', case: 'title', prefix: '# ', suffix: ' #' })
// "# Seratus Ribu Rupiah #"

terbilang('150000,25', { currency: 'IDR', cents: true })
// "seratus lima puluh ribu rupiah dua puluh lima sen"

terbilang(250000, { currency: 'IDR', case: 'upper' })
// "DUA RATUS LIMA PULUH RIBU RUPIAH"
```

### Mata uang

| Kode | Simbol | Terbilang | Pecahan |
| --- | --- | --- | --- |
| `IDR` | Rp | rupiah | sen |
| `USD` | US$ | dolar Amerika Serikat | sen |
| `SGD` | S$ | dolar Singapura | sen |
| `MYR` | RM | ringgit | sen |
| `VND` | ₫ | dong | xu |
| `PHP` | ₱ | peso | sentimo |
| `THB` | ฿ | baht | satang |

```ts
terbilang(12.3, { currency: 'MYR', cents: true })   // "dua belas ringgit tiga puluh sen"
terbilang(50000, { currency: 'VND' })               // "lima puluh ribu dong"
terbilang(0.75, { currency: 'THB', cents: true })   // "nol baht tujuh puluh lima satang"
```

## Persentase

```ts
import { terbilangPersen } from 'pustaka-angka-terbilang'

terbilangPersen(10.5)                           // "sepuluh koma lima persen"
terbilangPersen('12,75', { decimal: 'group' })  // "dua belas koma tujuh puluh lima persen"

// Akad kredit
`suku bunga 10,5% (${terbilangPersen(10.5)}) per tahun`
```

## Bilangan tingkat

```ts
import { tingkat } from 'pustaka-angka-terbilang'

tingkat(1)    // "pertama"
tingkat(2)    // "kedua"
tingkat(11)   // "kesebelas"
tingkat(100)  // "keseratus"
tingkat(7, { case: 'title', prefix: 'Pasal ' })  // "Pasal Ketujuh"
```

Nol, negatif, dan pecahan melempar `RangeError`.

## Tanggal & waktu

```ts
import { terbilangTanggal, terbilangWaktu } from 'pustaka-angka-terbilang'

terbilangTanggal('2026-09-17', { prefix: 'Pada hari ini, ' })
// "Pada hari ini, Kamis, tanggal tujuh belas bulan September tahun dua ribu dua puluh enam"

terbilangTanggal(new Date())   // memakai zona waktu lokal runtime

terbilangWaktu('14:30')        // "pukul empat belas lewat tiga puluh menit"
terbilangWaktu('10:05:07', { suffix: ' Waktu Indonesia Barat' })
// "pukul sepuluh lewat lima menit tujuh detik Waktu Indonesia Barat"
```

> Untuk SSR, kirim tanggal sebagai string `"YYYY-MM-DD"` agar hasil di server dan browser sama walau zona waktunya berbeda.

## Format angka & uang

```ts
import { formatAngka, formatUang } from 'pustaka-angka-terbilang'

formatAngka(1234567.891)                    // "1.234.567,891"
formatAngka(1234567.891, { decimals: 2 })   // "1.234.567,89"

formatUang(150000)                          // "Rp 150.000"
formatUang(150000, { space: false })        // "Rp150.000"
formatUang(150000.5, { decimals: 2 })       // "Rp 150.000,50"
formatUang(1234.5, { currency: 'USD' })     // "US$ 1,234.50"
formatUang(1234.5, { currency: 'SGD' })     // "S$ 1,234.50"
formatUang(1234.5, { currency: 'MYR' })     // "RM 1,234.50"
formatUang(25000,  { currency: 'VND' })     // "25.000 ₫"
formatUang(1234.5, { currency: 'PHP' })     // "₱ 1,234.50"
formatUang(1234.5, { currency: 'THB' })     // "฿ 1,234.50"

// Dolar dengan pemisah gaya Indonesia
formatUang(1234.5, { currency: 'USD', thousand: '.', decimal: ',' })  // "US$ 1.234,50"
```

Format tidak memakai `Intl`, jadi hasilnya identik di server dan browser (tidak ada hydration mismatch).

## Format ringkas

```ts
import { formatRingkas } from 'pustaka-angka-terbilang'

formatRingkas(1000)            // "1 Rb"
formatRingkas(10000)           // "10 Rb"
formatRingkas(1000000)         // "1 Jt"
formatRingkas(100000000)       // "100 Jt"
formatRingkas(1000000000)      // "1 M"
formatRingkas(1000000000000)   // "1 T"
formatRingkas(1500000)         // "1,5 Jt"

formatRingkas(1000, { style: 'long' })                         // "1 Ribu"
formatRingkas(1000000, { style: 'long' })                      // "1 Juta"
formatRingkas(100000000, { style: 'long', case: 'lower' })     // "100 juta"
formatRingkas(1000000000, { style: 'long', case: 'lower' })    // "1 miliar"
formatRingkas(1000000000000, { style: 'long' })                // "1 Triliun"

formatRingkas(1234567, { decimals: 2 })  // "1,23 Jt"
'Rp ' + formatRingkas(2500000)           // "Rp 2,5 Jt"
```

Desimal dipotong, bukan dibulatkan (`1.999.999` → `1,9 Jt`), sehingga tidak pernah menampilkan nilai lebih besar dari aslinya. Gaya `short` berhenti di `T`; gaya `long` sampai `Desiliun`.

## Vue 3 / Nuxt

```ts
import { useTerbilang, Terbilang, InputRupiah } from 'pustaka-angka-terbilang/vue'
```

### `useTerbilang(value, options?)`

`value` dan `options` boleh berupa nilai biasa, `ref`, atau getter. Hasilnya `computed<string>`. Input kosong atau tidak valid menghasilkan `''` (tidak melempar saat render).

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useTerbilang } from 'pustaka-angka-terbilang/vue'

const nominal = ref(150000)
const teks = useTerbilang(nominal, { currency: 'IDR', case: 'title' })
</script>

<template>
  <input v-model.number="nominal" type="number" />
  <p>{{ teks }}</p>
</template>
```

### `<Terbilang>`

```vue
<Terbilang :value="150000" currency case="title" />
<!-- <span>Seratus Lima Puluh Ribu Rupiah</span> -->

<Terbilang :value="1250000" currency="IDR" case="title" prefix="# " suffix=" #" tag="strong" />
<!-- <strong># Satu Juta Dua Ratus Lima Puluh Ribu Rupiah #</strong> -->
```

Props: `value`, `currency`, `cents`, `decimal`, `case`, `prefix`, `suffix`, `tag` (default `span`).

### `<InputRupiah>`: input dengan masking ribuan + terbilang live

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { InputRupiah } from 'pustaka-angka-terbilang/vue'

const jumlah = ref('') // string digit, misal "1500000"
</script>

<template>
  <InputRupiah v-model="jumlah" id="jumlah" name="jumlah" placeholder="0" case="title" />
</template>
```

Hasil render:

```html
<div class="terbilang-input">
  <label class="terbilang-input__field">
    <span class="terbilang-input__symbol">Rp</span>
    <input id="jumlah" type="text" inputmode="numeric" value="1.500.000" />
  </label>
  <small class="terbilang-input__text" aria-live="polite">Satu Juta Lima Ratus Ribu Rupiah</small>
</div>
```

Atribut (id, name, placeholder, required, listener, dll.) diteruskan ke `<input>`. Posisi kursor tetap terjaga saat titik ribuan disisipkan. Komponen tidak membawa CSS; tata dengan kelas `terbilang-input*`. Prop `currency` bisa diganti, misal `currency="USD"`.

### Nuxt

Tidak perlu modul. Import langsung di komponen, atau daftarkan global lewat plugin:

```ts
// plugins/terbilang.ts
import { Terbilang, InputRupiah } from 'pustaka-angka-terbilang/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('Terbilang', Terbilang)
  nuxtApp.vueApp.component('InputRupiah', InputRupiah)
})
```

## React / Next.js

Core cukup dipanggil langsung; fungsi-fungsinya murni dan aman di Server Component.

```tsx
import { terbilang, formatUang } from 'pustaka-angka-terbilang'

export default function Kwitansi({ jumlah }: { jumlah: number }) {
  return (
    <p>
      {formatUang(jumlah)}
      <br />
      <em>{terbilang(jumlah, { currency: 'IDR', case: 'title', prefix: '# ', suffix: ' #' })}</em>
    </p>
  )
}
```

Input Rupiah dengan terbilang live:

```tsx
'use client'
import { useState } from 'react'
import { maskRibuan, unmask, terbilang } from 'pustaka-angka-terbilang'

export function InputRupiah() {
  const [nilai, setNilai] = useState('') // digit saja
  return (
    <label>
      Rp{' '}
      <input
        inputMode="numeric"
        value={maskRibuan(nilai)}
        onChange={(e) => setNilai(unmask(e.target.value))}
      />
      <small aria-live="polite">{nilai && terbilang(nilai, { currency: 'IDR', case: 'title' })}</small>
    </label>
  )
}
```

## Svelte 5

```svelte
<script lang="ts">
  import { maskRibuan, unmask, terbilang } from 'pustaka-angka-terbilang'

  let nilai = $state('')
  const teks = $derived(nilai ? terbilang(nilai, { currency: 'IDR', case: 'title' }) : '')
</script>

<input
  inputmode="numeric"
  value={maskRibuan(nilai)}
  oninput={(e) => { nilai = unmask(e.currentTarget.value); e.currentTarget.value = maskRibuan(nilai) }}
/>
<small aria-live="polite">{teks}</small>
```

## Astro

```astro
---
import { terbilang, terbilangTanggal, formatUang } from 'pustaka-angka-terbilang'
const jumlah = 2500000
---
<p>Pada hari ini, {terbilangTanggal('2026-09-17')}, telah diterima uang sebesar
  {formatUang(jumlah)} ({terbilang(jumlah, { currency: 'IDR' })}).</p>
```

## JavaScript tanpa bundler

```html
<script type="module">
  import { terbilang } from 'https://cdn.jsdelivr.net/npm/pustaka-angka-terbilang/dist/index.js'
  console.log(terbilang(2026)) // "dua ribu dua puluh enam"
</script>
```

## Contoh: kwitansi & perjanjian

```ts
import { terbilang, terbilangPersen, terbilangTanggal, tingkat, formatUang } from 'pustaka-angka-terbilang'

const pinjaman = 50_000_000
const bunga = 10.5

const teks = `
Pada hari ini, ${terbilangTanggal('2026-09-17')}, para pihak sepakat:

Pasal ${tingkat(1, { case: 'title' })}
Pihak Pertama memberikan pinjaman sebesar ${formatUang(pinjaman)}
(${terbilang(pinjaman, { currency: 'IDR' })}) dengan suku bunga
${bunga}% (${terbilangPersen(bunga)}) per tahun.

Terbilang: ${terbilang(pinjaman, { currency: 'IDR', case: 'title', prefix: '# ', suffix: ' #' })}
`
```

## API

| Fungsi | Hasil |
| --- | --- |
| `terbilang(v, opsi?)` | kata; opsi `case`, `prefix`, `suffix`, `decimal`, `currency`, `cents` |
| `terbilangPersen(v, opsi?)` | "... persen" |
| `tingkat(v, opsi?)` | "pertama", "kedua", ... |
| `terbilangTanggal(tanggal, opsi?)` | "Kamis, tanggal ... bulan ... tahun ..." |
| `terbilangWaktu(waktu, opsi?)` | "pukul ... lewat ... menit" |
| `formatAngka(v, { decimals, thousand, decimal }?)` | "1.500.000" |
| `formatUang(v, { currency, decimals, symbol, thousand, decimal, space }?)` | "Rp 1.500.000" |
| `formatRingkas(v, { style, decimals, decimal, case }?)` | "1,5 Jt" |
| `maskRibuan(teks, pemisah?)` / `unmask(teks)` | helper input |
| `parse(v)` | `{ neg, int: bigint, frac: string }` |
| `CURRENCIES` | tabel mata uang |

## Pengembangan

```bash
npm install
npm test         # butuh Node ≥ 22.6 (menjalankan TypeScript langsung)
npm run build    # hasil ke dist/
npm publish      # otomatis typecheck + test + build lebih dulu
```
 
Sebelum publish: aktifkan 2FA di akun npm (`npm profile enable-2fa auth-and-writes`) dan cek isi paket dengan `npm pack --dry-run`. Jika publish lewat GitHub Actions, gunakan `npm publish --provenance --access public`.
 
## Keamanan

- **Bukan pengganti validasi server.** Masking dan terbilang hanya tampilan. Nominal tetap harus divalidasi ulang di backend (tipe, batas minimum/maksimum, tanda negatif).
- **Hasil berupa teks biasa, tidak di-escape untuk HTML.** Di Vue/React/Svelte/Astro (interpolasi `{{ }}` / `{}`) aman. Jangan masukkan ke `v-html`, `innerHTML`, `dangerouslySetInnerHTML`, atau `set:html`, terutama bila `prefix`/`suffix` berasal dari input pengguna.
- **Batas input.** String/BigInt maksimal 1.000 karakter/digit dan `decimals` maksimal 100, supaya input raksasa dari pengguna tidak membuat server SSR hang (DoS).
- **Presisi uang.** Hindari aritmetika `number` untuk nominal (`0.1 + 0.2`); simpan dalam satuan terkecil atau string, lalu kirim ke fungsi ini sebagai string/BigInt.
- **`unmask` / `<InputRupiah>`** hanya menghasilkan bilangan bulat non-negatif. Tanda `-` dibuang, dan bagian setelah pemisah desimal terakhir dibuang (`"1.500.000,75"` → `"1500000"`). Tempelan dengan format negara lain (misal `"1,500,000.00"` di input Rupiah) bisa terbaca berbeda; terbilang live di bawah input membantu pengguna melihatnya.
- **Prop `tag` pada `<Terbilang>`** menolak elemen berbahaya (`script`, `style`, `iframe`, `svg`, dll.) dan nama tag tidak valid; semuanya diganti `span`.
- **Kode mata uang** dicek terhadap tabel milik sendiri; `'__proto__'`, `'constructor'`, dan kode tak dikenal melempar `TypeError`.

Laporkan celah keamanan lewat email ke slvns.dev@gmail.com, jangan lewat issue publik.

## Lisensi

[MIT](./LICENSE)
