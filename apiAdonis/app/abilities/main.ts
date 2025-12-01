import { Bouncer } from '@adonisjs/bouncer'
import User from '#models/user'

export const updateUser = Bouncer.ability((user: User, targetUser: User) => {
  return user.id === targetUser.id
})

export const isAdmin = Bouncer.ability((user: User) => {
  return user.isAdmin === true
})
