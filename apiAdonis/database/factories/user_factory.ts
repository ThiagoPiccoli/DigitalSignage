import Factory from '@adonisjs/lucid/factories'
import User from '#models/user'

const UserFactory = Factory.define(User, ({ faker }) => {
  return {
    email: faker.internet.email(),
    password: faker.internet.password(),
    username: faker.internet.username(),
  }
}).build()
export { UserFactory }
