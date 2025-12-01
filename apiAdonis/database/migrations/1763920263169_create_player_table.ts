import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'players'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('file_type').notNullable()
      table.string('title').notNullable()
      table.text('image_url').notNullable()
      table.string('fit_mode').defaultTo('fit')
      table.string('bg_color').defaultTo('#ffffff')
      table.integer('last_modified').unsigned().references('id').inTable('users').notNullable()
      table.integer('duration_ms').defaultTo(10000)
      table.json('schedule').defaultTo(
        JSON.stringify({
          days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
          start: '00:00',
          end: '23:59',
          tz: 'America/Sao_Paulo',
        })
      )

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
