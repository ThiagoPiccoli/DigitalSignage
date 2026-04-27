import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'html_players'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('qr_url').nullable().defaultTo(null)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('qr_url')
    })
  }
}
