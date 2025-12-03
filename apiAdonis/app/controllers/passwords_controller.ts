import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'

export default class PasswordsController {
  public async changePassword({ request, response, bouncer, params }: HttpContext) {
    const { oldPassword, newPassword, confirmPassword } = request.only([
      'oldPassword',
      'newPassword',
      'confirmPassword',
    ])
    const user = await User.findOrFail(params.id)

    if (!user) {
      return response.notFound({ message: 'User not found' })
    }

    if ((await hash.verify(user.password, oldPassword)) === false) {
      return response.unauthorized({ message: 'Current password is incorrect' })
    }

    if (newPassword.length < 6) {
      return response.badRequest({ message: 'New password must be at least 6 characters long' })
    }

    if (newPassword !== confirmPassword) {
      return response.badRequest({ message: 'New password and confirmation do not match' })
    }

    // Set new password
    user.password = newPassword
    await user.save()

    return response.ok({ message: 'Password changed successfully' })
  }

  public async adminChangePassword({ request, response, params }: HttpContext) {
    const { newPassword } = request.only(['userId', 'newPassword'])

    const user = await User.findOrFail(params.id)
    user.password = newPassword
    await user.save()

    console.log(`Admin changed password for user ID: ${params.id}`)
    return response.ok({ message: 'User password has been changed by admin' })
  }
}
