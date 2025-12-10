import { middleware } from './kernel.js'
import router from '@adonisjs/core/services/router'

const UsersController = () => import('#controllers/users_controller')
const PasswordsController = () => import('#controllers/passwords_controller')
const SessionController = () => import('#controllers/session_controller')
const PlayerController = () => import('#controllers/player_controller')
const HtmlController = () => import('#controllers/html_controller')
const ManifestController = () => import('#controllers/manifest_controller')

//User routes
router.put('/users/:id', [UsersController, 'update']).use(middleware.auth()) // Testado
router.get('/users/:id', [UsersController, 'show']).use([middleware.auth()]) // Testado

//Admin User routes
router.post('/users', [UsersController, 'store']).use([middleware.auth(), middleware.admin()]) // Testado
router.get('/users', [UsersController, 'index']).use([middleware.auth(), middleware.admin()]) // Testado
router
  .delete('/users/:id', [UsersController, 'destroy'])
  .use([middleware.auth(), middleware.admin()]) // Testado
router
  .put('/change-password/admin/:id', [PasswordsController, 'adminChangePassword'])
  .use([middleware.auth(), middleware.admin()]) // Testado

//Session routes
router.post('/sessions', [SessionController, 'store']) // Testado
router.get('/sessions/me', [SessionController, 'me']).use(middleware.auth()) //Testado
router.delete('/sessions', [SessionController, 'destroy']).use(middleware.auth()) // Testado

//Password routes
router.post('/change-password/:id', [PasswordsController, 'changePassword']).use(middleware.auth()) // Testado

//Admin routes
router
  .get('/admin/state', [UsersController, 'adminState'])
  .use([middleware.auth(), middleware.admin()]) // Testado
router
  .get('/admin/local-ip', [UsersController, 'localIp'])
  .use([middleware.auth(), middleware.admin()]) //Testado

//Manifest routes
router.post('/defaults', [ManifestController, 'setDefaults']).use(middleware.auth()) //Testado
router.get('/manifest', [ManifestController, 'show']) //Testado

//Player routes
router.post('/player', [PlayerController, 'upload']).use(middleware.auth()) // Testado
router.put('/player/:id', [PlayerController, 'updateMedia']).use(middleware.auth()) //Testado
router.get('/player', [PlayerController, 'index']).use(middleware.auth()) // Testado
router.get('/player/:id', [PlayerController, 'show']).use(middleware.auth()) //Testado
router.delete('/player/:id', [PlayerController, 'destroy']).use(middleware.auth()) //Testado

//HTML Player routes
router.post('/html', [HtmlController, 'createHtml']).use(middleware.auth()) // Testado
router.post('/html/deadline', [HtmlController, 'createDeadline']).use(middleware.auth()) //Testado
router.post('/html/duplicate/:id', [HtmlController, 'duplicateHtml']).use(middleware.auth()) //Testado
router.put('/html/:id', [HtmlController, 'updateHtml']).use(middleware.auth()) // Testado
router.get('/html', [HtmlController, 'index']).use(middleware.auth()) //Testado
router.get('/html/:id', [HtmlController, 'show']).use(middleware.auth()) //Testado
router.delete('/html/:id', [HtmlController, 'destroy']).use(middleware.auth()) //Testado
