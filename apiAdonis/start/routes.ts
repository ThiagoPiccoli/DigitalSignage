import { middleware } from './kernel.js'
/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const UsersController = () => import('#controllers/users_controller')
const PasswordsController = () => import('#controllers/passwords_controller')
const SessionController = () => import('#controllers/session_controller')
const PlayerController = () => import('#controllers/player_controller')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})

//User routes
router.put('/users/:id', [UsersController, 'update']).use(middleware.auth())

//Admin User routes
router.post('/users', [UsersController, 'store']).use([middleware.auth(), middleware.admin()])
router.get('/users', [UsersController, 'index']).use([middleware.auth(), middleware.admin()])
router.get('/users/:id', [UsersController, 'show']).use([middleware.auth()])
router
  .delete('/users/:id', [UsersController, 'destroy'])
  .use([middleware.auth(), middleware.admin()])
router
  .put('/change-password/admin/:id', [PasswordsController, 'adminChangePassword'])
  .use([middleware.auth(), middleware.admin()])

//Session routes
router.post('/sessions', [SessionController, 'store'])
router.delete('/sessions', [SessionController, 'destroy']).use(middleware.auth())

//Password routes
router.post('/change-password/:id', [PasswordsController, 'changePassword']).use(middleware.auth())

//Player routes
router.post('/player', [PlayerController, 'upload']).use(middleware.auth())
router.put('/player/:id', [PlayerController, 'update']).use(middleware.auth())
router.delete('/player/:id', [PlayerController, 'destroy']).use(middleware.auth())
