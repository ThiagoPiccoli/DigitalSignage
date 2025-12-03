import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import User from '#models/user'
import { DateTime, Duration } from 'luxon'
import supertest from 'supertest'

const BASE_URL = `http://${process.env.HOST}:3333`
let token = ''

test.group('Player', (group) => {
  group.each.setup(async () => {
    await testUtils.db().migrate()
    const passwordInput = 'securePassword123'
    const newUser = await UserFactory.merge({ password: passwordInput }).create()
    const { body } = await supertest(BASE_URL)
      .post('/sessions')
      .send({ email: newUser.email, password: passwordInput })
      .expect(201)

    token = body.token
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
    await supertest(BASE_URL)
      .delete('/sessions')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })
  test('New file was uploaded to the player', async () => {
    const user = await UserFactory.create()
    const playerPayload = {
      fileType: 'image/png',
      title: 'Fotinho de Gatinho Fofinho',
      imageUrl: 'http://someurl.com/image.png',
      lastModified: user.id,
      schedule: {
        days: ['mon', 'thu', 'fri', 'sat', 'sun'],
        start: '08:00',
        end: '20:00',
        tz: 'America/Sao_Paulo',
      },
    }
    const { body } = await supertest(BASE_URL)
      .post('/player')
      .set('Authorization', `Bearer ${token}`)
      .send(playerPayload)
      .expect(201)
    console.log(await User.findOrFail(body.lastModified))(body)
  }).skip()

  test('422 when missing required fields', async () => {
    const playerPayload = {
      title: 'Fotinho de Gatinho Fofinho',
      imageUrl: 'http://someurl.com/image.png',
      lastModified: 1,
      schedule: {
        days: ['mon', 'thu', 'fri', 'sat', 'sun'],
        start: '08:00',
        end: '20:00',
        tz: 'America/Sao_Paulo',
      },
    }
    await supertest(BASE_URL)
      .post('/player')
      .set('Authorization', `Bearer ${token}`)
      .send(playerPayload)
      .expect(422)
  }).skip()

  test('Update player file info', async () => {
    const user = await UserFactory.create()
    const playerPayload = {
      fileType: 'image/png',
      title: 'Fotinho de Gatinho Fofinho',
      imageUrl: 'http://someurl.com/image.png',
      lastModified: user.id,
      schedule: {
        days: ['mon', 'thu', 'fri', 'sat', 'sun'],
        start: '08:00',
        end: '20:00',
        tz: 'America/Sao_Paulo',
      },
    }
    const { body: createdPlayer } = await supertest(BASE_URL)
      .post('/player')
      .set('Authorization', `Bearer ${token}`)
      .send(playerPayload)
      .expect(201)

    const updatedPayload = {
      title: 'Updated Title',
      bgColor: '#000000',
    }
    console.log('Created player ID:', createdPlayer.id)
    const { body: updatedPlayer } = await supertest(BASE_URL)
      .put(`/player/${createdPlayer.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send(updatedPayload)
      .expect(200)

    console.log(updatedPlayer)
  }).skip()

  test('Delete player file', async () => {
    const user = await UserFactory.create()
    const playerPayload = {
      fileType: 'image/png',
      title: 'Fotinho de Gatinho Fofinho',
      imageUrl: 'http://someurl.com/image.png',
      lastModified: user.id,
      schedule: {
        days: ['mon', 'thu', 'fri', 'sat', 'sun'],
        start: '08:00',
        end: '20:00',
        tz: 'America/Sao_Paulo',
      },
    }
    const { body: createdPlayer } = await supertest(BASE_URL)
      .post('/player')
      .set('Authorization', `Bearer ${token}`)
      .send(playerPayload)
      .expect(201)

    console.log('Created player ID for deletion:', createdPlayer.id)

    await supertest(BASE_URL)
      .delete(`/player/${createdPlayer.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204)
    console.log('Deleted player ID:', createdPlayer.id)
  })
})
