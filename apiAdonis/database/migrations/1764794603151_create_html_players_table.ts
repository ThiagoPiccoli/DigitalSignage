import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'html_players'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('file_type').notNullable()
      table.text('html_url').notNullable()
      table.string('title').notNullable()
      table.text('body_html').defaultTo('')
      table.string('bg_color').defaultTo('#000000')
      table.string('text_color').defaultTo('#ffffff')
      table.string('font_family').defaultTo('system-ui, sans-serif')
      table.integer('font_size_px').defaultTo(48)
      table.string('text_align').defaultTo('center')
      table.integer('padding_px').defaultTo(24)
      table.integer('max_width_px').defaultTo(1200)
      table.integer('last_modified').unsigned().references('id').inTable('users').notNullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table
        .json('schedule')
        .nullable()
        .defaultTo(
          JSON.stringify({
            days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
            start: '00:00',
            end: '23:59',
            tz: 'America/Sao_Paulo',
          })
        )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
