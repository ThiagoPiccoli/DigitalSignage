import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class PasswordsController {
  public async changePassword({ request, response, bouncer }: HttpContext) {
    const { username, oldPassword, newPassword } = request.only([
      'username',
      'oldPassword',
      'newPassword',
    ])
    const user = await User.findBy('username', username)

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    await bouncer.authorize('updateUser', user)

    if ((await hash.verify(user.password, oldPassword)) === false) {
      return response.unauthorized({ message: 'Current password is incorrect' })
    }

    // Set new password
    user.password = newPassword
    await user.save()

    return response.ok({ message: 'Password changed successfully' })
  }

  public async adminChangePassword({ request, response }: HttpContext) {
    const { userId, newPassword } = request.only(['userId', 'newPassword'])

    const user = await User.findOrFail(userId)
    user.password = newPassword
    await user.save()

    console.log(`Admin changed password for user ID: ${userId}`)
    return response.ok({ message: 'User password has been changed by admin' })
  }
}
