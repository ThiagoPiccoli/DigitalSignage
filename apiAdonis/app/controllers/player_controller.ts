import type { HttpContext } from '@adonisjs/core/http'
import Player from '#models/player'
import { createPlayerValidator, updatePlayerValidator } from '#validators/player'

export default class PlayerController {
  public async upload({ request, response }: HttpContext) {
    const playerPayload = await request.validateUsing(createPlayerValidator)
    const player = await Player.create(playerPayload)
    return response.created(player)
  }
  public async update({ request, response, params }: HttpContext) {
    console.log('Updating player with id:', params.id)
    const player = await Player.findOrFail(params.id)
    const playerPayload = await request.validateUsing(updatePlayerValidator)
    player.merge(playerPayload)
    await player.save()
    return response.ok(player)
  }

  public async destroy({ response, params }: HttpContext) {
    const player = await Player.findOrFail(params.id)
    await player.delete()
    return response.noContent()
  }

  public async index({ response }: HttpContext) {
    const players = await Player.all()
    return response.ok(players)
  }

  public async show({ response, params }: HttpContext) {
    const player = await Player.findOrFail(params.id)
    return response.ok(player)
  }
}
