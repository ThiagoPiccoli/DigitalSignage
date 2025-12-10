import type { HttpContext } from '@adonisjs/core/http'
import HtmlPlayer from '#models/html_player'
import MediaService from '../services/media_service.js'

const DEFAULT_HTML_PADDING = 24
const DEFAULT_HTML_MAX_WIDTH = 1200

export default class HtmlController {
  /**
   * Generate HTML document content
   */
  private makeHtmlDoc(options: {
    title?: string
    bodyHtml?: string
    bgColor?: string
    textColor?: string
    fontFamily?: string
    fontSizePx?: number
    textAlign?: string
    paddingPx?: number
    maxWidthPx?: number
  }): string {
    const {
      title = 'Aviso',
      bodyHtml = '<p>Escreva sua mensagem…</p>',
      bgColor = '#000000',
      textColor = '#ffffff',
      fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      fontSizePx = 48,
      textAlign = 'center',
      paddingPx = DEFAULT_HTML_PADDING,
      maxWidthPx = DEFAULT_HTML_MAX_WIDTH,
    } = options

    const safeBody = MediaService.sanitizeUserHtml(bodyHtml)
    const align = ['left', 'center', 'right', 'justify'].includes(String(textAlign).toLowerCase())
      ? String(textAlign).toLowerCase()
      : 'center'

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  html,body{height:100%}
  body{
    margin:0;
    background:${bgColor};
    color:${textColor};
    font-family:${fontFamily};
    display:flex;
    align-items:center;
    justify-content:center;
  }
  .wrap{
    box-sizing:border-box;
    max-width:${Number(maxWidthPx) || DEFAULT_HTML_MAX_WIDTH}px;
    width:100%;
    padding:${Number(paddingPx) || DEFAULT_HTML_PADDING}px;
    font-size:${Number(fontSizePx) || 48}px;
    line-height:1.25;
    text-align:${align};
    word-wrap:break-word;
    overflow-wrap:break-word;
  }
  * { cursor:none !important; }
</style>
</head>
<body>
  <div class="wrap">
    ${safeBody}
  </div>
</body>
</html>`
  }

  /**
   * Create an HTML notice file and save to media directory
   */
  public async createHtml({ request, response, auth }: HttpContext) {
    const {
      filename,
      title,
      bodyHtml,
      bgColor,
      textColor,
      fontFamily,
      fontSizePx,
      textAlign,
      paddingPx = DEFAULT_HTML_PADDING,
      maxWidthPx = DEFAULT_HTML_MAX_WIDTH,
    } = request.only([
      'filename',
      'title',
      'bodyHtml',
      'bgColor',
      'textColor',
      'fontFamily',
      'fontSizePx',
      'textAlign',
      'paddingPx',
      'maxWidthPx',
    ])

    const baseName = MediaService.sanitizeFilename(filename || '') || `aviso-${Date.now()}.html`
    if (!MediaService.isHtmlFile(baseName)) {
      return response.badRequest({ error: 'filename must end with .html' })
    }

    const html = this.makeHtmlDoc({
      title,
      bodyHtml,
      bgColor,
      textColor,
      fontFamily,
      fontSizePx,
      textAlign,
      paddingPx,
      maxWidthPx,
    })

    await MediaService.writeFile(baseName, html)
    const fileUrl = MediaService.getFileUrl(baseName)

    const htmlPlayer = await HtmlPlayer.create({
      fileType: 'html',
      title: title || 'Aviso',
      htmlUrl: fileUrl,
      bodyHtml: bodyHtml || '',
      bgColor: bgColor || '#000000',
      textColor: textColor || '#ffffff',
      fontFamily:
        fontFamily ||
        'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      fontSizePx: fontSizePx || 48,
      textAlign: textAlign || 'center',
      paddingPx: paddingPx,
      maxWidthPx: maxWidthPx,
      lastModified: auth.user?.id || 0,
    })

    return response.created({
      ok: true,
      file: baseName,
      player: htmlPlayer,
    })
  }

  /**
   * Create countdown deadline HTML
   */
  public async createDeadline({ request, response, auth }: HttpContext) {
    const {
      title,
      deadlineISO,
      filename,
      bgColor = '#000000',
      textColor = '#ffffff',
      accentColor = '#22c55e',
      fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
    } = request.only([
      'title',
      'deadlineISO',
      'filename',
      'bgColor',
      'textColor',
      'accentColor',
      'fontFamily',
    ])

    if (!title || !deadlineISO) {
      return response.badRequest({ error: 'title and deadlineISO are required' })
    }

    const baseName = MediaService.sanitizeFilename(filename || '') || `deadline-${Date.now()}.html`
    if (!MediaService.isHtmlFile(baseName)) {
      return response.badRequest({ error: 'filename must end with .html' })
    }

    // Generate countdown HTML with embedded config
    const config = { title, deadlineISO, bgColor, textColor, accentColor, fontFamily }
    const configJson = JSON.stringify(config).replace(/</g, '\\u003c')

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  :root{--bg:${bgColor};--fg:${textColor};--accent:${accentColor}}
  html,body{height:100%}
  body{margin:0;background:var(--bg);color:var(--fg);font-family:${fontFamily};display:flex;align-items:center;justify-content:center}
  .wrap{box-sizing:border-box;width:100%;max-width:1200px;padding:24px;text-align:center}
  h1{margin:0 0 12px;font-size:80px;letter-spacing:.3px}
  .when{opacity:.85;margin-bottom:20px;font-size:clamp(14px,2.4vw,18px)}
  .clock{display:flex;gap:14px;justify-content:center;align-items:stretch;flex-wrap:wrap}
  .block{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;min-width:120px;padding:16px 10px}
  .num{font-variant-numeric:tabular-nums;font-size:clamp(34px,9vw,84px);font-weight:800;line-height:1;color:var(--accent);text-shadow:0 2px 14px rgba(34,197,94,.25)}
  .lab{margin-top:8px;font-size:clamp(12px,2.2vw,16px);opacity:.85}
  .done{margin-top:14px;font-weight:700;color:var(--accent);font-size:clamp(16px,3.6vw,22px)}
  *{cursor:none!important}
</style>
</head>
<body>
  <div class="wrap">
    <h1 id="t"></h1>
    <div class="when" id="w"></div>
    <div class="clock" id="c" hidden>
      <div class="block"><div class="num" id="d">0</div><div class="lab">dias</div></div>
      <div class="block"><div class="num" id="h">00</div><div class="lab">horas</div></div>
      <div class="block"><div class="num" id="m">00</div><div class="lab">min</div></div>
      <div class="block"><div class="num" id="s">00</div><div class="lab">seg</div></div>
    </div>
    <div class="done" id="done" hidden>Encerrado</div>
  </div>
  <script id="CFG" type="application/json">${configJson}</script>
  <script>
  (function(){
    const cfg=JSON.parse(document.getElementById('CFG').textContent);
    const elT=document.getElementById('t'),elW=document.getElementById('w'),elC=document.getElementById('c');
    const elD=document.getElementById('d'),elH=document.getElementById('h'),elM=document.getElementById('m'),elS=document.getElementById('s'),elDone=document.getElementById('done');
    elT.textContent=cfg.title;
    const dl=new Date(cfg.deadlineISO);
    try{const fmt=new Intl.DateTimeFormat(undefined,{dateStyle:'full',timeStyle:'short'});elW.textContent='Prazo: '+fmt.format(dl)}catch{elW.textContent='Prazo: '+dl.toString()}
    function pad2(n){n=Math.floor(n);return(n<10?'0':'')+n}
    function tick(){
      const now=new Date();let diff=dl.getTime()-now.getTime();
      if(diff<=0){elC.hidden=true;elDone.hidden=false;return}
      elC.hidden=false;elDone.hidden=true;
      const s=Math.floor(diff/1000),d=Math.floor(s/86400),h=Math.floor((s%86400)/3600),m=Math.floor((s%3600)/60),sec=s%60;
      elD.textContent=d;elH.textContent=pad2(h);elM.textContent=pad2(m);elS.textContent=pad2(sec);
      requestAnimationFrame(()=>{})
    }
    tick();setInterval(tick,1000)
  })();
  </script>
</body>
</html>`

    await MediaService.writeFile(baseName, html)
    const fileUrl = MediaService.getFileUrl(baseName)

    // Create HtmlPlayer record
    const htmlPlayer = await HtmlPlayer.create({
      fileType: 'html',
      title: title,
      htmlUrl: fileUrl,
      bodyHtml: `Countdown to ${deadlineISO}`,
      bgColor: bgColor,
      textColor: textColor,
      fontFamily: fontFamily,
      fontSizePx: 48,
      textAlign: 'center',
      paddingPx: 24,
      maxWidthPx: 1200,
      lastModified: auth.user?.id || 0,
    })

    return response.created({
      ok: true,
      file: baseName,
      player: htmlPlayer,
    })
  }

  public async duplicateHtml({ request, response, auth, params }: HttpContext) {
    const id = params.id

    if (!id) {
      return response.badRequest({ error: 'Missing player id' })
    }

    // Find the original player
    const originalPlayer = await HtmlPlayer.findOrFail(id)

    // Generate new filename
    const timestamp = Date.now()
    const baseName = `${originalPlayer.title.toLowerCase().replace(/\s+/g, '-')}-copia-${timestamp}.html`
    const sanitizedFilename = MediaService.sanitizeFilename(baseName)

    if (!sanitizedFilename) {
      return response.badRequest({ error: 'Invalid filename generated' })
    }

    // Generate HTML content with original player settings
    const html = this.makeHtmlDoc({
      title: originalPlayer.title,
      bodyHtml: originalPlayer.bodyHtml,
      bgColor: originalPlayer.bgColor,
      textColor: originalPlayer.textColor,
      fontFamily: originalPlayer.fontFamily,
      fontSizePx: originalPlayer.fontSizePx,
      textAlign: originalPlayer.textAlign,
      paddingPx: originalPlayer.paddingPx,
      maxWidthPx: originalPlayer.maxWidthPx,
    })

    // Save the new HTML file
    await MediaService.writeFile(sanitizedFilename, html)
    const fileUrl = MediaService.getFileUrl(sanitizedFilename)

    // Create new player with duplicated settings
    const duplicatedPlayer = await HtmlPlayer.create({
      fileType: originalPlayer.fileType,
      title: `${originalPlayer.title} (Cópia)`,
      htmlUrl: fileUrl,
      bodyHtml: originalPlayer.bodyHtml,
      bgColor: originalPlayer.bgColor,
      textColor: originalPlayer.textColor,
      fontFamily: originalPlayer.fontFamily,
      fontSizePx: originalPlayer.fontSizePx,
      textAlign: originalPlayer.textAlign,
      paddingPx: originalPlayer.paddingPx,
      maxWidthPx: originalPlayer.maxWidthPx,
      lastModified: auth.user?.id || 0,
    })
    return response.created({
      ok: true,
      file: sanitizedFilename,
      player: duplicatedPlayer,
    })
  }

  public async updateHtml({ request, response, params, auth }: HttpContext) {
    const htmlPlayer = await HtmlPlayer.findOrFail(params.id)

    const updateData = request.only([
      'title',
      'bodyHtml',
      'bgColor',
      'textColor',
      'fontFamily',
      'fontSizePx',
      'textAlign',
      'paddingPx',
      'maxWidthPx',
    ])

    htmlPlayer.merge({
      ...updateData,
      lastModified: auth.user?.id || htmlPlayer.lastModified,
    })

    await htmlPlayer.save()

    if (updateData.bodyHtml && htmlPlayer.htmlUrl) {
      const filename = htmlPlayer.htmlUrl.split('/').pop()
      if (filename) {
        const html = this.makeHtmlDoc({
          title: htmlPlayer.title,
          bodyHtml: htmlPlayer.bodyHtml,
          bgColor: htmlPlayer.bgColor,
          textColor: htmlPlayer.textColor,
          fontFamily: htmlPlayer.fontFamily,
          fontSizePx: htmlPlayer.fontSizePx,
          textAlign: htmlPlayer.textAlign,
          paddingPx: htmlPlayer.paddingPx,
          maxWidthPx: htmlPlayer.maxWidthPx,
        })
        await MediaService.writeFile(filename, html)
      }
    }

    return response.ok(htmlPlayer)
  }

  public async destroy({ response, params }: HttpContext) {
    const htmlPlayer = await HtmlPlayer.findOrFail(params.id)

    const filename = htmlPlayer.htmlUrl.split('/').pop()
    if (filename) {
      try {
        await MediaService.deleteFile(filename)
      } catch (error) {
        console.warn(`Could not delete file ${filename}:`, error)
      }
    }

    await htmlPlayer.delete()
    return response.noContent()
  }

  public async index({ response }: HttpContext) {
    const players = await HtmlPlayer.all()
    return response.ok(players)
  }

  public async show({ response, params }: HttpContext) {
    const player = await HtmlPlayer.findOrFail(params.id)
    return response.ok(player)
  }
}
