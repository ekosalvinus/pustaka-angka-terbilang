import { computed, defineComponent, h, mergeProps, toValue, type ComputedRef, type MaybeRefOrGetter, type PropType } from 'vue'
import { CURRENCIES, maskRibuan, terbilang, unmask, type Angka, type CurrencyCode, type TerbilangOptions } from './index.ts'

/**
 * Terbilang reaktif. Input kosong/tidak valid menghasilkan `''` (tidak melempar error saat render).
 * @example const teks = useTerbilang(nominal, { currency: 'IDR', case: 'title' })
 */
export function useTerbilang(
  value: MaybeRefOrGetter<Angka | null | undefined>,
  options: MaybeRefOrGetter<TerbilangOptions> = {},
): ComputedRef<string> {
  return computed(() => {
    const v = toValue(value)
    if (v == null || v === '') return ''
    try {
      return terbilang(v, toValue(options))
    } catch {
      return ''
    }
  })
}

// Elemen yang isinya dieksekusi/diinterpretasi browser: teks yang di-escape pun tetap berbahaya di sini.
const UNSAFE_TAGS = /^(script|style|iframe|frame|frameset|object|embed|noscript|noembed|noframes|template|textarea|title|xmp|plaintext|base|link|meta|svg|math)$/i
const isSafeTag = (t: string) => /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/i.test(t) && !UNSAFE_TAGS.test(t)

const isCurrency = (c: unknown): c is CurrencyCode =>
  typeof c === 'string' && Object.prototype.hasOwnProperty.call(CURRENCIES, c)

const gayaProps = {
  case: String as PropType<TerbilangOptions['case']>,
  prefix: String,
  suffix: String,
}

/** `<Terbilang :value="150000" currency case="title" />` */
export const Terbilang = defineComponent({
  name: 'Terbilang',
  props: {
    // null: lewati runtime type-check Vue agar bigint tidak memicu warning.
    value: { type: null as unknown as PropType<Angka | null>, default: null },
    currency: { type: [Boolean, String] as PropType<boolean | CurrencyCode>, default: false },
    cents: Boolean,
    decimal: String as PropType<TerbilangOptions['decimal']>,
    /** Nama elemen pembungkus. `script`, `style`, `iframe`, dll. ditolak dan diganti `span`. */
    tag: { type: String, default: 'span', validator: isSafeTag },
    ...gayaProps,
  },
  setup(p) {
    const text = useTerbilang(() => p.value, () => ({
      currency: p.currency, cents: p.cents, decimal: p.decimal, case: p.case, prefix: p.prefix, suffix: p.suffix,
    }))
    // Validator Vue hanya memberi warning di dev; tetap paksa di runtime (termasuk build production).
    return () => h(isSafeTag(p.tag) ? p.tag : 'span', text.value)
  },
})

/**
 * Input nominal dengan masking ribuan + terbilang live di bawahnya.
 * `v-model` berisi string digit tanpa pemisah, misal `"1500000"`.
 * Atribut lain (id, name, placeholder, class input, listener) diteruskan ke `<input>`.
 */
export const InputRupiah = defineComponent({
  name: 'InputRupiah',
  inheritAttrs: false,
  props: {
    modelValue: { type: String, default: '' },
    currency: { type: String as PropType<CurrencyCode>, default: 'IDR', validator: isCurrency },
    ...gayaProps,
  },
  emits: { 'update:modelValue': (v: string) => typeof v === 'string' },
  setup(p, { emit, attrs }) {
    const cur = () => CURRENCIES[isCurrency(p.currency) ? p.currency : 'IDR']
    const mask = (s: string) => maskRibuan(s, cur().thousand, cur().decimal)
    const text = useTerbilang(() => p.modelValue, () => ({
      currency: isCurrency(p.currency) ? p.currency : 'IDR', case: p.case, prefix: p.prefix, suffix: p.suffix,
    }))

    function onInput(e: Event) {
      const el = e.target as HTMLInputElement
      const caret = el.selectionStart ?? el.value.length
      const digitsBefore = el.value.slice(0, caret).replace(/\D/g, '').length
      const masked = mask(el.value)
      el.value = masked
      // Kembalikan kursor ke posisi digit yang sama setelah titik ribuan disisipkan.
      let pos = 0
      for (let seen = 0; pos < masked.length && seen < digitsBefore; pos++) if (/\d/.test(masked[pos])) seen++
      if (el.ownerDocument.activeElement === el) el.setSelectionRange(pos, pos)
      emit('update:modelValue', unmask(masked, cur().decimal))
    }

    return () => h('div', { class: 'terbilang-input' }, [
      h('label', { class: 'terbilang-input__field' }, [
        h('span', { class: 'terbilang-input__symbol' }, cur().symbol),
        h('input', mergeProps(attrs, {
          type: 'text',
          inputmode: 'numeric',
          autocomplete: 'off',
          value: mask(p.modelValue),
          onInput,
        })),
      ]),
      h('small', { class: 'terbilang-input__text', 'aria-live': 'polite' }, text.value),
    ])
  },
})
