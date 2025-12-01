import vine from '@vinejs/vine'

export const ForgotPasswordValidator = vine.compile(
  vine.object({
    email: vine.string().email(),
    resetPasswordUrl: vine.string().url(),
  })
)
