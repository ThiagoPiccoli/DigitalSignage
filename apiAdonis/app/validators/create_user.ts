import vine from '@vinejs/vine'

export const createUserValidator = vine.compile(
  vine.object({
    username: vine.string(),
    email: vine.string().email(),
    password: vine.string().minLength(4),
    isAdmin: vine.boolean(),
  })
)

export const updateUserValidator = vine.compile(
  vine.object({
    username: vine.string().optional(),
    email: vine.string().email().optional(),
    password: vine.string().minLength(4).optional(),
  })
)
