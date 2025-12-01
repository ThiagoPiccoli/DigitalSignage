import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import { DateTime, Duration } from 'luxon'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:3333`

test.group('Password', (group) => {
  group.each.setup(async () => {
    await testUtils.db().migrate()
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('Password token creation', async ({ assert }) => {
    mail.fake() // Prevent actual email sending

    const user = await UserFactory.create()
    await supertest(BASE_URL)
      .post('/forgot-password')
      .send({ email: user.email, resetPasswordUrl: 'http://example.com/reset-password' })
      .expect(200)

    const tokens = await user.related('passwordTokens').query()
    console.log('Created tokens:', tokens)
    assert.isNotEmpty(tokens)
    assert.equal(tokens.length, 1)
    assert.exists(tokens[0].token)
  }).skip()

  test('Return 422 when information is missing in password reset request', async ({ assert }) => {
    const response = await supertest(BASE_URL).post('/forgot-password').send({}).expect(422)

    console.log('Response body:', response.body)
    assert.exists(response.body.errors)
  }).skip()

  test('Return 404 when user does not exist', async ({ assert }) => {
    const response = await supertest(BASE_URL)
      .post('/forgot-password')
      .send({ email: 'nonexistent@example.com', resetPasswordUrl: 'http://example.com/reset' })
      .expect(404)

    assert.equal(response.body.message, 'User not found')
  }).skip()

  test('Return 200 when password is reseted', async ({ assert }) => {
    const user = await UserFactory.create()
    await user.related('passwordTokens').create({ token: 'token1234567890abcdef' })
    await supertest(BASE_URL)
      .post('/reset-password')
      .send({ token: 'token1234567890abcdef', newPassword: '24252627' })
      .expect(200)

    await user.refresh()
    console.log('Hashed password:', user.password)
    console.log('Verification result:', await hash.verify(user.password, '24252627'))
    assert.isTrue(await hash.verify(user.password, '24252627'))
  }).skip()

  test('Required fields missing in password reset', async ({ assert }) => {
    const response = await supertest(BASE_URL).post('/reset-password').send({}).expect(422)
    console.log('Response body:', response.body)
    assert.exists(response.body.errors)
  }).skip()

  test('Invalid try using the same token twice in password reset', async ({ assert }) => {
    const user = await UserFactory.create()
    await user.related('passwordTokens').create({ token: 'token1234567890abcdef' })
    await supertest(BASE_URL)
      .post('/reset-password')
      .send({ token: 'token1234567890abcdef', newPassword: '24252627' })
      .expect(200)

    await supertest(BASE_URL)
      .post('/reset-password')
      .send({ token: 'token1234567890abcdef', newPassword: 'anotherpassword' })
      .expect(404)
  }).skip()

  test('Expired token in password reset', async ({ assert }) => {
    const user = await UserFactory.create()
    const expirationDate = DateTime.now().minus(Duration.fromISOTime('02:01:00'))
    await user
      .related('passwordTokens')
      .create({ token: 'token1234567890abcdef', createdAt: expirationDate })
    const response = await supertest(BASE_URL)
      .post('/reset-password')
      .send({ token: 'token1234567890abcdef', newPassword: '24252627' })
      .expect(410)
    console.log('Response body for expired token:', response.body)
    assert.equal(response.body.message, 'Token has expired')
  }).skip()
})
