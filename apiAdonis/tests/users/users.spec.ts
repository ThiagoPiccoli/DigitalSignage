import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:3333`
let token = ''
let user = {} as User

test.group('User', (group) => {
  group.setup(async () => {
    await testUtils.db().migrate()
    const passwordInput = 'securePassword123'
    const newUser = await UserFactory.merge({ password: passwordInput, isAdmin: true }).create()

    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email: newUser.email, password: passwordInput })
      .expect(201)
    console.log('Session response:', body)
    token = body.token
    user = newUser
  })

  group.each.setup(async () => {
    await testUtils.db().migrate()
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })
  test('Creating an user', async ({ assert }) => {
    const userPayload = {
      email: 'peddad@dvd.com',
      password: '123456',
      username: 'dadada',
      isAdmin: false,
    }
    const response = await supertest(BASE_URL)
      .post('/users')
      .send(userPayload)
      .set('Authorization', `Bearer ${token}`)
      .expect(201)

    console.log(response.body)
    assert.exists(response.body.user.id, 'User ID should be defined')
    assert.equal(response.body.user.email, userPayload.email, 'Email should match')
    assert.equal(response.body.user.username, userPayload.username, 'Username should match')
    assert.notExists(response.body.user.password, 'Password should not be returned')
  })

  test('Creating an user with existing email should fail', async ({ assert }) => {
    const { email } = await UserFactory.create()
    const response = await supertest(BASE_URL)
      .post('/users')
      .send({ email, password: '123456', username: 'Sergio' })
      .expect(409)
    console.log(response.body)
    assert.include(response.body.message, 'email')
    assert.equal(response.body.error, 'BAD_REQUEST')
    assert.equal(response.body.status, 409)
  })
    .tags(['create_user_conflict'])
    .skip()

  test('Creating an user with existing username should fail', async ({ assert }) => {
    const { username } = await UserFactory.create()
    const response = await supertest(BASE_URL)
      .post('/users')
      .send({ email: 'raulseixas@dvd.com', password: '123456', username })
      .expect(409)
    console.log(response.body)
    assert.include(response.body.message, 'username')
    assert.equal(response.body.error, 'BAD_REQUEST')
    assert.equal(response.body.status, 409)
  })
    .tags(['create_user_conflict'])
    .skip()

  test('Usernamne was not provided', async ({ assert }) => {
    const response = await supertest(BASE_URL)
      .post('/users')
      .send({ email: 'raulseixas@dvd.com', password: '123456' })
      .expect(422)
    console.log(response.body.error)
    assert.equal(response.body.code, 'BAD_REQUEST')
    assert.equal(response.body.status, 422)
  })
    .tags(['create_user_bad_request'])
    .skip()

  test('Password too short', async ({ assert }) => {
    const response = await supertest(BASE_URL)
      .post('/users')
      .send({ email: 'raulseixas@dvd.com', password: '123', username: 'raulseixas' })
      .expect(422)
    assert.equal(response.body.code, 'BAD_REQUEST')
    assert.equal(response.body.status, 422)
  })
    .tags(['create_user_bad_request'])
    .skip()

  test('Email format is invalid', async ({ assert }) => {
    const response = await supertest(BASE_URL)
      .post('/users')
      .send({ email: 'raulseixas', password: '123456', username: 'raulseixas' })
      .expect(422)
    assert.equal(response.body.code, 'BAD_REQUEST')
    assert.equal(response.body.status, 422)
  })
    .tags(['create_user_bad_request'])
    .skip()

  test('Updating an user info', async ({ assert }) => {
    const newEmail = 'updated@dvd.com'
    const newUsername = 'UpdatedUser'
    console.log('Updating user with id:', user.id)
    const response = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: newEmail, username: newUsername })
      .expect(200)
    assert.equal(response.body.user.email, newEmail)
    assert.equal(response.body.user.username, newUsername)
  }).skip()

  test('Updating an user password', async ({ assert }) => {
    const newPassword = 'testePassword123'
    const response = await supertest(BASE_URL)
      .put(`/users/${user.id}`)
      .send({ email: user.email, username: user.username, password: newPassword })
      .expect(200)
    assert.equal(response.body.user.id, user.id)
  }).skip()

  test('Updating data not provided', async ({ assert }) => {
    const { id } = await UserFactory.create()
    const response = await supertest(BASE_URL)
      .put(`/users/${id}`)
      .send({ username: undefined, email: undefined, password: '123' })
      .expect(422)
    assert.equal(response.body.code, 'BAD_REQUEST')
    assert.equal(response.body.status, 422)
  }).skip()

  test('Creating an Admin user', async ({ assert }) => {
    const userPayload = {
      email: 'admin@example.com',
      password: 'AdminPass123',
      username: 'AdminUser',
      isAdmin: true,
    }
    const response = await supertest(BASE_URL).post('/users').send(userPayload).expect(201)
    assert.equal(response.body.user.email, userPayload.email)
    assert.equal(response.body.user.username, userPayload.username)
    assert.equal(response.body.user.isAdmin, true)
  }).skip()

  test('Deleting an user', async ({}) => {
    const newUser = await UserFactory.create()
    console.log('Created user to delete:', newUser.username, 'with email:', newUser.email)
    console.log('Deleting user with id:', newUser.id)
    await supertest(BASE_URL)
      .delete(`/users/${newUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)
  })

  test('Deleting a non-existing user should fail', async ({ assert }) => {
    const nonExistingUserId = 9999
    const response = await supertest(BASE_URL)
      .delete(`/users/${nonExistingUserId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404)
    assert.equal(response.body.code, 'NOT_FOUND')
    assert.equal(response.body.status, 404)
  }).skip()

  test('Get list of users', async ({}) => {
    await UserFactory.createMany(3)

    const response = await supertest(BASE_URL)
      .get('/users')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    console.log(response.body.users)
  })
})
