import { middleware } from './kernel.js'
import router from '@adonisjs/core/services/router'

const UsersController = () => import('#controllers/users_controller')
const PasswordsController = () => import('#controllers/passwords_controller')
const SessionController = () => import('#controllers/session_controller')
const PlayerController = () => import('#controllers/player_controller')
const HtmlController = () => import('#controllers/html_controller')
const ManifestController = () => import('#controllers/manifest_controller')
const MediaController = () => import('../app/controllers/media_controller.js')

//User routes
router.put('/users/:id', [UsersController, 'update']).use(middleware.auth()) // Testado //front
router.get('/users/:id', [UsersController, 'show']).use([middleware.auth()]) // Testado //front
router.post('/change-password/:id', [PasswordsController, 'changePassword']).use(middleware.auth()) // Testado //front

//Admin User routes
router.post('/users', [UsersController, 'store']).use([middleware.auth(), middleware.admin()]) // Testado
router.get('/users', [UsersController, 'index']).use([middleware.auth(), middleware.admin()]) // Testado //front
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

//Public media files route
router.get('/media/:filename', [MediaController, 'show'])

//Player routes
router.post('/player', [PlayerController, 'upload']).use(middleware.auth()) // Testado
router.put('/player/:id', [PlayerController, 'updateMedia']).use(middleware.auth()) //Testado
router.get('/player', [PlayerController, 'index']) // Public for signage playback
router.get('/player/:id', [PlayerController, 'show']) // Public for signage playback
router.delete('/player/:id', [PlayerController, 'destroy']).use(middleware.auth()) //Testado

//HTML Player routes
router.post('/html', [HtmlController, 'createHtml']).use(middleware.auth()) // Testado
router.post('/html/deadline', [HtmlController, 'createDeadline']).use(middleware.auth()) //Testado
router.post('/html/duplicate/:id', [HtmlController, 'duplicateHtml']).use(middleware.auth()) //Testado
router.post('/html/cardapio-ru', [HtmlController, 'createCardapioRu']).use(middleware.auth())
router.put('/html/cardapio-ru/:id', [HtmlController, 'refreshCardapioRu']).use(middleware.auth())
router.put('/html/:id', [HtmlController, 'updateHtml']).use(middleware.auth()) // Testado
router.get('/html', [HtmlController, 'index']) // Public for signage playback
router.get('/html/:id', [HtmlController, 'show']) // Public for signage playback
router.delete('/html/:id', [HtmlController, 'destroy']).use(middleware.auth()) //Testado
