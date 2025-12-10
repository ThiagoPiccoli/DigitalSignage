import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import User from './user.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class HtmlPlayer extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fileType: string

  @column()
  declare htmlUrl: string

  @column()
  declare title: string

  @column()
  declare bodyHtml: string

  @column()
  declare bgColor: string

  @column()
  declare textColor: string

  @column()
  declare fontFamily: string

  @column()
  declare fontSizePx: number

  @column()
  declare textAlign: string

  @column()
  declare paddingPx: number

  @column()
  declare maxWidthPx: number

  @column()
  declare lastModified: number

  @belongsTo(() => User, { foreignKey: 'lastModified' })
  declare lastModifiedUser: BelongsTo<typeof User>

  @column({
    prepare: (value: any) => JSON.stringify(value),
    consume: (value: string) => JSON.parse(value),
  })
  declare schedule?: {
    days: string[]
    start: string
    end: string
    tz: string
  }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
