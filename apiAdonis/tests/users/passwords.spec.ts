import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import { DateTime, Duration } from 'luxon'
import supertest from 'supertest'
import User from '#models/user'
import bodyParserConfig from '#config/bodyparser'

const BASE_URL = `http://${process.env.HOST}:3333`
let token = ''
let user = {} as User

test.group('Password', (group) => {
  group.each.setup(async () => {
    await testUtils.db().migrate()
  })
  group.setup(async () => {
    const passwordInput = 'securePassword123'
    const newUser = await UserFactory.merge({ password: passwordInput, isAdmin: true }).create()

    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email: newUser.email, password: passwordInput })
      .expect(201)
    token = body.token
    user = newUser
  })

  group

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('User reset password test', async ({}) => {
    const newUser = await UserFactory.create()
    newUser.password = 'securePassword123'
    await newUser.save()
    await supertest(BASE_URL)
      .post(`/change-password/${newUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        oldPassword: 'securePassword123',
        newPassword: 'newSecurePassword456',
        confirmPassword: 'newSecurePassword456',
      })
      .expect(200)
  })

  test('Return 404 when user does not exist', async ({ assert }) => {
    const response = await supertest(BASE_URL)
      .post('/forgot-password')
      .send({ email: 'nonexistent@example.com', resetPasswordUrl: 'http://example.com/reset' })
      .expect(404)

    assert.equal(response.body.message, 'User not found')
  }).skip()

  test('Required fields missing in password reset', async ({ assert }) => {
    const response = await supertest(BASE_URL).post('/reset-password').send({}).expect(422)
    console.log('Response body:', response.body)
    assert.exists(response.body.errors)
  }).skip()

  test('Admin reset user password', async ({}) => {
    await supertest(BASE_URL)
      .put(`/change-password/admin/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'newSecurePassword456' })
      .expect(200)
    await user.refresh()
    await hash.verify(user.password, 'newSecurePassword456')
  }).skip()
})
