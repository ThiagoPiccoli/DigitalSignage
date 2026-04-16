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
  private static readonly LISTA_URL =
    'https://cobalto.ufpel.edu.br/portal/cardapios/cardapioPublico/listaCardapios'

  /** Convert YYYY-MM-DD (ISO) to DD/MM/YYYY (Cobalto format) */
  static toCobaltoDate(isoDate: string): string {
    const parts = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!parts) return isoDate
    return `${parts[3]}/${parts[2]}/${parts[1]}`
  }

  /** Fetch and parse the cardápio from Cobalto for a given unit and ISO date */
  static async fetch(unidade: string, isoDate: string): Promise<CardapioData> {
    const cobaltDate = this.toCobaltoDate(isoDate)

    // Use a plain string URL to avoid URL-encoding the slashes in the date
    const url = `${this.LISTA_URL}?txtData=${cobaltDate}&txtRestaurante=${encodeURIComponent(unidade)}&rows=100&page=1`

    const res = await globalThis.fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DigitalSignage/1.0)',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      throw new Error(`Cobalto returned HTTP ${res.status}`)
    }

    const json = (await res.json()) as {
      rows: Array<{
        id: number
        nome: string
        descricao: string
        calorias: number
        porcao: string
        refeicao: string
      }>
    }

    if (!json.rows || !Array.isArray(json.rows)) {
      throw new Error('Resposta inesperada do Cobalto')
    }

    const almoco: CardapioItem[] = []
    const janta: CardapioItem[] = []

    for (const row of json.rows) {
      const item: CardapioItem = {
        nome: row.nome ?? '',
        ingredientes: row.descricao ?? '',
        kcal: row.calorias !== null && row.calorias !== undefined ? String(row.calorias) : '',
      }
      const refeicao = (row.refeicao ?? '').toUpperCase()
      if (refeicao.includes('ALMO')) {
        almoco.push(item)
      } else if (refeicao.includes('JANT') || refeicao.includes('CEIA')) {
        janta.push(item)
      }
    }

    return { data: cobaltDate, unidade, almoco, janta }
  }
}
