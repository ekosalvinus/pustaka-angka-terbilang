import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createSSRApp, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { InputRupiah, Terbilang, useTerbilang } from '../src/vue.ts'

test('useTerbilang reaktif terhadap ref nilai dan opsi', async () => {
  const nilai = ref<number | string | null>(1000)
  const opsi = ref({ currency: true as const, case: undefined as 'title' | undefined })
  const teks = useTerbilang(nilai, opsi)
  assert.equal(teks.value, 'seribu rupiah')
  nilai.value = 150000
  assert.equal(teks.value, 'seratus lima puluh ribu rupiah')
  opsi.value = { ...opsi.value, case: 'title' }
  assert.equal(teks.value, 'Seratus Lima Puluh Ribu Rupiah')
  nilai.value = ''
  assert.equal(teks.value, '')
  nilai.value = 'bukan angka'
  assert.equal(teks.value, '')
  nilai.value = null
  assert.equal(teks.value, '')
  await nextTick()
})

test('useTerbilang menerima getter', () => {
  const n = ref(11)
  assert.equal(useTerbilang(() => n.value * 10).value, 'seratus sepuluh')
})

test('<Terbilang> render di SSR (tanpa DOM)', async () => {
  const html = await renderToString(createSSRApp({
    render: () => [
      h(Terbilang, { value: 150000, currency: '', case: 'title', prefix: '# ', suffix: ' #' }),
      h(Terbilang, { value: 10n ** 12n, tag: 'strong' }),
    ],
  }))
  assert.match(html, /<span># Seratus Lima Puluh Ribu Rupiah #<\/span>/)
  assert.match(html, /<strong>satu triliun<\/strong>/)
})

test('<InputRupiah> render di SSR dengan nilai termasking', async () => {
  const html = await renderToString(createSSRApp({
    render: () => h(InputRupiah, { modelValue: '1500000', id: 'nominal', case: 'title' }),
  }))
  assert.match(html, /value="1\.500\.000"/)
  assert.match(html, /id="nominal"/)
  assert.match(html, />Rp</)
  assert.match(html, /Satu Juta Lima Ratus Ribu Rupiah/)
})

test('keamanan: <Terbilang> menolak tag berbahaya (XSS via tag)', async () => {
  for (const tag of ['script', 'SCRIPT', 'style', 'iframe', 'img onerror=alert(1)', 'svg', 'a"><script>']) {
    const app = createSSRApp({ render: () => h(Terbilang, { value: 1, tag, prefix: '<b>alert(1)//' }) })
    app.config.warnHandler = () => {}
    const html = await renderToString(app)
    assert.equal(html, '<span>&lt;b&gt;alert(1)//satu</span>', tag)
  }
})

test('keamanan: <InputRupiah> dengan currency tidak dikenal tidak crash', async () => {
  const app = createSSRApp({ render: () => h(InputRupiah, { modelValue: '1000', currency: '__proto__' }) })
  app.config.warnHandler = () => {}
  const html = await renderToString(app)
  assert.match(html, />Rp</)
  assert.match(html, /seribu rupiah/)
})

test('useTerbilang: input raksasa jadi string kosong, bukan hang', () => {
  assert.equal(useTerbilang('9'.repeat(100_000)).value, '')
})
