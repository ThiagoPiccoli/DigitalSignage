import { tokensGuard } from '@adonisjs/auth/access_tokens'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:3333`

test.group('Sessions', (group) => {
  group.each.setup(async () => {
    await testUtils.db().truncate()
  })

  test('User can login with correct credentials', async ({ assert }) => {
    const passwordInput = 'securePassword123'
    const user = await UserFactory.merge({ password: passwordInput }).create()

    const response = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email: user.email, password: passwordInput })
      .expect(201)

    console.log(response.body)
  }).skip()

  test('Return api token on successful login', async ({ assert }) => {
    const passwordInput = 'securePassword123'
    const user = await UserFactory.merge({ password: passwordInput }).create()

    const response = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email: user.email, password: passwordInput })
      .expect(201)

    console.log(response.body.token)
    assert.isString(response.body.token)
  }).skip()

  test('User cannot login with incorrect credentials', async ({ assert }) => {
    const passwordInput = 'securePassword123'
    const user = await UserFactory.merge({ password: passwordInput }).create()

    const response = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email: user.email, password: 'wrongPassword' })
      .expect(401)

    console.log(response)
    assert.equal(response.body.code, 'E_INVALID_CREDENTIALS')
  }).skip()

  test('Return 200 when user signed out successfully', async ({ assert }) => {
    const passwordInput = 'securePassword123'
    const user = await UserFactory.merge({ password: passwordInput }).create()

    const loginResponse = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email: user.email, password: passwordInput })
      .expect(201)

    const token = loginResponse.body.token

    const response = await supertest(BASE_URL)
      .delete('/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    assert.equal(response.body.message, 'Successfully signed out')

    const tokens = await db.query().select('*').from('auth_access_tokens').where('token', token)
    assert.isEmpty(tokens)
  }).skip()
})
