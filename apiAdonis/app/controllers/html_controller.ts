import type { HttpContext } from '@adonisjs/core/http'
import HtmlPlayer from '#models/html_player'
import MediaService from '../services/media_service.js'

const DEFAULT_HTML_PADDING = 24
const DEFAULT_HTML_MAX_WIDTH = 1200

/** Strip characters that could break out of a CSS value context */
function sanitizeCssValue(value: string): string {
  return String(value).replace(/[{}<>;@\\]/g, '')
}

/** Validate a CSS color value (hex, rgb, rgba, hsl, hsla, or named color) */
function sanitizeCssColor(value: string, fallback: string): string {
  const s = String(value).trim()
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return s
  if (/^(rgb|rgba|hsl|hsla)\([^){};<>@]+\)$/.test(s)) return s
  if (/^[a-zA-Z]{1,30}$/.test(s)) return s
  return fallback
}

/** Convert a hex color to rgba() with a given alpha (0-1) */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const r = Number.parseInt(full.substring(0, 2), 16)
  const g = Number.parseInt(full.substring(2, 4), 16)
  const b = Number.parseInt(full.substring(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

const DEFAULT_SCHEDULE = {
  days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  start: '00:00',
  end: '23:59',
  tz: 'America/Sao_Paulo',
}

export default class HtmlController {
  private normalizeSchedule(value: any) {
    if (!value) {
      return DEFAULT_SCHEDULE
    }

    let parsed = value
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value)
      } catch {
        return DEFAULT_SCHEDULE
      }
    }

    return {
      days: Array.isArray(parsed?.days) ? parsed.days : DEFAULT_SCHEDULE.days,
      start: parsed?.start || DEFAULT_SCHEDULE.start,
      end: parsed?.end || DEFAULT_SCHEDULE.end,
      tz: parsed?.tz || DEFAULT_SCHEDULE.tz,
    }
  }

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

    const safeBg = sanitizeCssColor(bgColor, '#000000')
    const safeFg = sanitizeCssColor(textColor, '#ffffff')
    const safeFont = sanitizeCssValue(fontFamily)

    const fg10 = hexToRgba(safeFg, 0.1)
    const fg25 = hexToRgba(safeFg, 0.25)
    const fg35 = hexToRgba(safeFg, 0.35)
    const fg75 = hexToRgba(safeFg, 0.75)
    const fg80 = hexToRgba(safeFg, 0.8)

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;cursor:none!important}
  html,body{height:100%;overflow:hidden}
  body{
    background:${safeBg};
    color:${safeFg};
    font-family:${safeFont};
    display:flex;
    align-items:center;
    justify-content:center;
  }
  body::before{
    content:'';position:fixed;inset:0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 50%,${fg10} 0%,transparent 70%),
      radial-gradient(ellipse 60% 80% at 80% 30%,${fg10} 0%,transparent 70%);
    animation:bgShift 8s ease-in-out infinite alternate;
    z-index:0;pointer-events:none;
  }
  @keyframes bgShift{from{opacity:.7}to{opacity:1}}
  body::after{
    content:'';position:fixed;inset:0;
    background-image:
      linear-gradient(${fg10} 1px,transparent 1px),
      linear-gradient(90deg,${fg10} 1px,transparent 1px);
    background-size:60px 60px;z-index:0;pointer-events:none;
  }
  .card{
    position:relative;z-index:1;
    width:min(88vw,${Number(maxWidthPx) || DEFAULT_HTML_MAX_WIDTH}px);
    padding:${Number(paddingPx) || DEFAULT_HTML_PADDING}px;
    border-radius:24px;
    background:${fg10};
    border:1px solid ${fg10};
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    box-shadow:0 0 0 1px ${fg10},0 32px 80px rgba(0,0,0,0.6),inset 0 1px 0 ${fg10};
    display:flex;flex-direction:column;align-items:center;gap:24px;
    animation:fadeUp .7s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  .card::before{
    content:'';position:absolute;top:0;left:10%;right:10%;height:3px;
    border-radius:0 0 4px 4px;
    background:linear-gradient(90deg,${fg25},${fg75},${fg25});
    opacity:.7;
  }
  .badge{
    display:inline-flex;align-items:center;gap:10px;
    padding:8px 20px;border-radius:100px;
    background:${fg10};border:1px solid ${fg35};
    animation:pulse 2.5s ease-in-out infinite;
  }
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 ${fg25}}50%{box-shadow:0 0 0 8px transparent}}
  .badge-dot{width:8px;height:8px;border-radius:50%;background:${safeFg};animation:blink 1.2s ease-in-out infinite}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
  .badge-text{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:${fg80}}
  .title{
    font-size:${Number(fontSizePx) || 48}px;
    font-weight:800;letter-spacing:-.02em;line-height:1.15;
    text-align:${align};color:${safeFg};
    text-shadow:0 2px 20px rgba(0,0,0,0.4);
  }
  .divider{width:80px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,${fg25},transparent)}
  .body{
    font-size:${Math.max(Math.round((Number(fontSizePx) || 48) * 0.5), 18)}px;
    font-weight:400;line-height:1.6;text-align:${align};
    color:${fg80};max-width:700px;
    word-wrap:break-word;overflow-wrap:break-word;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="badge">
      <span class="badge-dot"></span>
      <span class="badge-text">Aviso</span>
    </div>
    <div class="title">${title}</div>
    <div class="divider"></div>
    <div class="body">${safeBody}</div>
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
      schedule,
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
      'schedule',
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
      fileType: 'aviso',
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
      schedule: this.normalizeSchedule(schedule),
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
      schedule,
    } = request.only([
      'title',
      'deadlineISO',
      'filename',
      'bgColor',
      'textColor',
      'accentColor',
      'fontFamily',
      'schedule',
    ])

    if (!title || !deadlineISO) {
      return response.badRequest({ error: 'title and deadlineISO are required' })
    }

    const baseName = MediaService.sanitizeFilename(filename || '') || `deadline-${Date.now()}.html`
    if (!MediaService.isHtmlFile(baseName)) {
      return response.badRequest({ error: 'filename must end with .html' })
    }

    // Sanitize CSS values
    const safeBg = sanitizeCssColor(bgColor, '#000000')
    const safeFg = sanitizeCssColor(textColor, '#ffffff')
    const safeAccent = sanitizeCssColor(accentColor, '#22c55e')
    const safeFont = sanitizeCssValue(fontFamily)

    // Generate countdown HTML with embedded config
    const config = {
      title,
      deadlineISO,
      bgColor: safeBg,
      textColor: safeFg,
      accentColor: safeAccent,
      fontFamily: safeFont,
    }
    const configJson = JSON.stringify(config).replace(/</g, '\\u003c')

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title}</title>
<style>
  :root{--bg:${safeBg};--fg:${safeFg};--accent:${safeAccent}}
  html,body{height:100%}
  body{margin:0;background:var(--bg);color:var(--fg);font-family:${safeFont};display:flex;align-items:center;justify-content:center}
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
      fileType: 'contador',
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
      schedule: this.normalizeSchedule(schedule),
      lastModified: auth.user?.id || 0,
    })

    return response.created({
      ok: true,
      file: baseName,
      player: htmlPlayer,
    })
  }

  public async duplicateHtml({ response, auth, params }: HttpContext) {
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
      schedule: originalPlayer.schedule,
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
      'schedule',
    ])

    if (updateData.schedule) {
      updateData.schedule = this.normalizeSchedule(updateData.schedule)
    }

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
    const players = await HtmlPlayer.query().preload('lastModifiedUser')
    return response.ok(players)
  }

  public async show({ response, params }: HttpContext) {
    const player = await HtmlPlayer.findOrFail(params.id)
    return response.ok(player)
  }
}
