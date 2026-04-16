import { load } from 'cheerio'

export interface CardapioItem {
  nome: string
  ingredientes: string
  kcal: string
}

export interface CardapioData {
  data: string
  unidade: string
  almoco: CardapioItem[]
  janta: CardapioItem[]
}

export default class CardapioService {
  private static readonly COBALTO_URL =
    'https://cobalto.ufpel.edu.br/portal/cardapios/cardapioPublico'

  /** Convert YYYY-MM-DD (ISO) to DD/MM/YYYY (Cobalto format) */
  static toCobaltoDate(isoDate: string): string {
    const parts = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!parts) return isoDate
    return `${parts[3]}/${parts[2]}/${parts[1]}`
  }

  /** Fetch and parse the cardápio from Cobalto for a given unit and ISO date */
  static async fetch(unidade: string, isoDate: string): Promise<CardapioData> {
    const cobaltDate = this.toCobaltoDate(isoDate)
    const url = new URL(this.COBALTO_URL)
    url.searchParams.set('unidade', unidade)
    url.searchParams.set('data', cobaltDate)

    const res = await globalThis.fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DigitalSignage/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      throw new Error(`Cobalto returned HTTP ${res.status}`)
    }

    const html = await res.text()
    return this.parse(html, unidade, cobaltDate)
  }

  /** Parse Cobalto HTML and extract cardápio items */
  static parse(html: string, unidade: string, cobaltDate: string): CardapioData {
    const $ = load(html)
    const almoco: CardapioItem[] = []
    const janta: CardapioItem[] = []
    let currentSection = ''

    $('table tr').each((_i, tr) => {
      const cells = $(tr).find('td')
      if (cells.length === 0) return

      if (cells.length === 1) {
        const text = cells.first().text().trim().toUpperCase()
        if (text.includes('ALMO')) {
          currentSection = 'almoco'
        } else if (text.includes('JANTA') || text.includes('CEIA') || text.includes('JANTAR')) {
          currentSection = 'janta'
        }
        return
      }

      if (cells.length >= 3 && currentSection) {
        const nome = $(cells.get(0)).text().trim()
        const ingredientes = $(cells.get(1)).text().trim()
        const kcal = $(cells.get(2)).text().trim()
        if (!nome) return
        const item: CardapioItem = { nome, ingredientes, kcal }
        if (currentSection === 'almoco') {
          almoco.push(item)
        } else {
          janta.push(item)
        }
      }
    })

    return { data: cobaltDate, unidade, almoco, janta }
  }
}
