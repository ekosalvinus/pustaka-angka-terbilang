import { computed, defineComponent, h, toValue, type ComputedRef, type MaybeRefOrGetter, type PropType } from 'vue'
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
    tag: { type: String, default: 'span' },
    ...gayaProps,
  },
  setup(p) {
    const text = useTerbilang(() => p.value, () => ({
      currency: p.currency, cents: p.cents, decimal: p.decimal, case: p.case, prefix: p.prefix, suffix: p.suffix,
    }))
    return () => h(p.tag, text.value)
  },
})

/**
 * Input nominal dengan masking ribuan + terbilang live di bawahnya.
 * `v-model` berisi string digit tanpa pemisah, misal `"1500000"`.
 * Atribut lain (id, name, placeholder, class input) diteruskan ke `<input>`.
 */
export const InputRupiah = defineComponent({
  name: 'InputRupiah',
  inheritAttrs: false,
  props: {
    modelValue: { type: String, default: '' },
    currency: { type: String as PropType<CurrencyCode>, default: 'IDR' },
    ...gayaProps,
  },
  emits: { 'update:modelValue': (v: string) => typeof v === 'string' },
  setup(p, { emit, attrs }) {
    const thousand = () => CURRENCIES[p.currency].thousand
    const text = useTerbilang(() => p.modelValue, () => ({
      currency: p.currency, case: p.case, prefix: p.prefix, suffix: p.suffix,
    }))

    function onInput(e: Event) {
      const el = e.target as HTMLInputElement
      const caret = el.selectionStart ?? el.value.length
      const digitsBefore = unmask(el.value.slice(0, caret)).length
      const masked = maskRibuan(el.value, thousand())
      el.value = masked
      // Kembalikan kursor ke posisi digit yang sama setelah titik ribuan disisipkan.
      let pos = 0
      for (let seen = 0; pos < masked.length && seen < digitsBefore; pos++) if (/\d/.test(masked[pos])) seen++
      if (el.ownerDocument.activeElement === el) el.setSelectionRange(pos, pos)
      emit('update:modelValue', unmask(masked))
    }

    return () => h('div', { class: 'terbilang-input' }, [
      h('label', { class: 'terbilang-input__field' }, [
        h('span', { class: 'terbilang-input__symbol' }, CURRENCIES[p.currency].symbol),
        h('input', {
          ...attrs,
          type: 'text',
          inputmode: 'numeric',
          autocomplete: 'off',
          value: maskRibuan(p.modelValue, thousand()),
          onInput,
        }),
      ]),
      h('small', { class: 'terbilang-input__text', 'aria-live': 'polite' }, text.value),
    ])
  },
})
