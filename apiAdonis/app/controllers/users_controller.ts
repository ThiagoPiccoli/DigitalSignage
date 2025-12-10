import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Player from '#models/player'
import HtmlPlayer from '#models/html_player'
import BadRequestException from '#exceptions/bad_request_exception'
import { createUserValidator, updateUserValidator } from '#validators/create_user'

export default class UsersController {
  public async store({ request, response }: HttpContext) {
    const userPayload = await request.validateUsing(createUserValidator)

    const { email, password, username, isAdmin } = userPayload

    const userByEmail = await User.findBy('email', email)
    if (userByEmail) {
      throw new BadRequestException('email already in use', { status: 409 })
    }

    const userByUsername = await User.findBy('username', username)
    if (userByUsername) {
      throw new BadRequestException('username already in use', { status: 409 })
    }

    const user = await User.create({
      email,
      password,
      username,
      isAdmin: isAdmin ?? false,
    })

    return response.created({ user })
  }

  public async update({ request, response, params, bouncer }: HttpContext) {
    const { email, username } = await request.validateUsing(updateUserValidator)
    const user = await User.findOrFail(params.id)
    await bouncer.authorize('updateUser', user)

    if (email !== undefined) user.email = email
    if (username !== undefined) user.username = username

    await user.save()
    return response.ok({ user })
  }

  public async index({ response }: HttpContext) {
    const users = await User.all()
    return response.ok({ users })
  }

  public async show({ response, params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    return response.ok({ user })
  }

  public async destroy({ response, params }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()
    return response.noContent()
  }

  /**
   * Get complete admin state (users, files, players, etc.)
   */
  public async adminState({ response, auth }: HttpContext) {
    const players = await Player.all()
    const htmlPlayers = await HtmlPlayer.all()

    let users: { id: number; email: string; username: string; isAdmin: boolean }[] = []
    if (auth.user?.isAdmin) {
      const allUsers = await User.all()
      users = allUsers.map((u) => ({
        id: u.id,
        email: u.email,
        username: u.username,
        isAdmin: u.isAdmin,
      }))
    }

    return response.ok({
      players: players.map((p) => p.serialize()),
      htmlPlayers: htmlPlayers.map((p) => p.serialize()),
      currentUser: auth.user,
      users,
    })
  }

  /**
   * Get local network IP addresses
   */
  public async localIp({ response }: HttpContext) {
    const os = await import('node:os')
    const nets = os.networkInterfaces()
    const ips: string[] = []

    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          ips.push(net.address)
        }
      }
    }

    return response.ok({ ips })
  }
}
