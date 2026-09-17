export interface Currency {
  symbol: string
  /** Nama satuan utama untuk terbilang. */
  name: string
  /** Nama satuan pecahan (sen). */
  minor: string
  /** Jumlah digit desimal saat diformat. */
  decimals: number
  thousand: string
  decimal: string
  /** `true` jika simbol ditulis di belakang angka. */
  after?: boolean
}

export const CURRENCIES = {
  IDR: { symbol: 'Rp', name: 'rupiah', minor: 'sen', decimals: 0, thousand: '.', decimal: ',' },
  USD: { symbol: 'US$', name: 'dolar Amerika Serikat', minor: 'sen', decimals: 2, thousand: ',', decimal: '.' },
  SGD: { symbol: 'S$', name: 'dolar Singapura', minor: 'sen', decimals: 2, thousand: ',', decimal: '.' },
  MYR: { symbol: 'RM', name: 'ringgit', minor: 'sen', decimals: 2, thousand: ',', decimal: '.' },
  VND: { symbol: '₫', name: 'dong', minor: 'xu', decimals: 0, thousand: '.', decimal: ',', after: true },
  PHP: { symbol: '₱', name: 'peso', minor: 'sentimo', decimals: 2, thousand: ',', decimal: '.' },
  THB: { symbol: '฿', name: 'baht', minor: 'satang', decimals: 2, thousand: ',', decimal: '.' },
} satisfies Record<string, Currency>

export type CurrencyCode = keyof typeof CURRENCIES
