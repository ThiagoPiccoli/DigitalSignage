import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

export default defineConfig({
  default: 'smtp',

  mailers: {
    smtp: transports.smtp({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        type: 'login',
        user: '3aa43ff05dd103',
        pass: 'cfc5bea25bed5a',
      },
    }),
  },
})
