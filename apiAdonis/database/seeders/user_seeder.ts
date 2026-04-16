import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    await User.updateOrCreate(
      { email: 'admin@digitalsignage.local' },
      {
        username: 'admin',
        email: 'admin@digitalsignage.local',
        password: 'admin123',
        isAdmin: true,
      }
    )
    console.log('Seeded admin user: admin@digitalsignage.local / admin123')
  }
}
