import type { HttpContext } from '@adonisjs/core/http'
import HtmlPlayer from '#models/html_player'
import MediaService from '../services/media_service.js'
import CardapioService, { type CardapioData } from '../services/cardapio_service.js'

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
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h
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
      fontSizePx = 64,
      textAlign = 'center',
      paddingPx = DEFAULT_HTML_PADDING,
      maxWidthPx = DEFAULT_HTML_MAX_WIDTH,
    } = options

    const safeBody = MediaService.sanitizeUserHtml(bodyHtml)
    const align = ['left', 'center', 'right', 'justify'].includes(String(textAlign).toLowerCase())
      ? String(textAlign).toLowerCase()
      : 'center'

    const safeBg = sanitizeCssColor(bgColor, '#000000')
    const safeFont = sanitizeCssValue(fontFamily)

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
    color:#f8fafc;
    font-family:${safeFont};
    display:flex;
    align-items:center;
    justify-content:center;
  }
  body::before{
    content:'';position:fixed;inset:0;
    background:
      radial-gradient(ellipse 80% 60% at 20% 50%,rgba(30,80,220,0.15) 0%,transparent 70%),
      radial-gradient(ellipse 60% 80% at 80% 30%,rgba(100,30,200,0.12) 0%,transparent 70%);
    animation:bgShift 8s ease-in-out infinite alternate;
    z-index:0;pointer-events:none;
  }
  @keyframes bgShift{from{opacity:.7}to{opacity:1}}
  .card{
    position:relative;z-index:1;
    width:min(88vw,${Number(maxWidthPx) || DEFAULT_HTML_MAX_WIDTH}px);
    padding:${Number(paddingPx) || DEFAULT_HTML_PADDING}px;
    border-radius:24px;
    background:rgba(255,255,255,0.04);
    border:1px solid rgba(255,255,255,0.1);
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
    box-shadow:0 0 0 1px rgba(255,255,255,0.06),0 32px 80px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.08);
    display:flex;flex-direction:column;align-items:center;gap:24px;
    animation:fadeUp .7s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  .card::before{
    content:'';position:absolute;top:0;left:10%;right:10%;height:3px;
    border-radius:0 0 4px 4px;
    background:linear-gradient(90deg,rgba(59,130,246,0.3),rgba(139,92,246,0.7),rgba(59,130,246,0.3));
    opacity:.7;
  }
  .badge{
    display:inline-flex;align-items:center;gap:10px;
    padding:8px 20px;border-radius:100px;
    background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.4);
    animation:pulse 2.5s ease-in-out infinite;
  }
  @keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0.4)}50%{box-shadow:0 0 0 8px transparent}}
  .badge-dot{width:8px;height:8px;border-radius:50%;background:#60a5fa;animation:blink 1.2s ease-in-out infinite}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
  .badge-text{font-size:13px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#93c5fd}
  .title{
    font-size:${Number(fontSizePx) || 64}px;
    font-weight:800;letter-spacing:-.02em;line-height:1.15;
    text-align:${align};color:#f8fafc;
    text-shadow:0 2px 20px rgba(0,0,0,0.4);
  }
  .divider{width:80px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(148,163,184,0.4),transparent)}
  .body{
    font-size:${Math.max(Math.round((Number(fontSizePx) || 64) * 0.6), 24)}px;
    font-weight:400;line-height:1.6;text-align:${align};
    color:rgba(203,213,225,0.85);max-width:700px;
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
      fontSizePx: fontSizePx || 64,
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
  h1{margin:0 0 12px;font-size:96px;letter-spacing:.3px}
  .when{opacity:.85;margin-bottom:20px;font-size:clamp(16px,2.8vw,22px)}
  .clock{display:flex;gap:14px;justify-content:center;align-items:stretch;flex-wrap:wrap}
  .block{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;min-width:120px;padding:16px 10px}
  .num{font-variant-numeric:tabular-nums;font-size:clamp(40px,10vw,100px);font-weight:800;line-height:1;color:var(--accent);text-shadow:0 2px 14px rgba(34,197,94,.25)}
  .lab{margin-top:8px;font-size:clamp(14px,2.6vw,20px);opacity:.85}
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

  /**
   * Generate a full-screen cardápio HTML page for digital signage
   */
  private makeCardapioHtml(data: CardapioData, bgColor: string = '#0f172a'): string {
    const escHtml = (s: string) =>
      String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

    const safeBg = sanitizeCssColor(bgColor, '#0f172a')

    const itemHtml = (items: CardapioData['almoco'], emptyMsg: string) => {
      if (items.length === 0) {
        return `<div class="empty">${emptyMsg}</div>`
      }
      return items
        .map(
          (item, i) =>
            `<div class="item" style="animation-delay:${0.08 * (i + 1)}s">
              <span class="item-icon">🍽</span>
              <span class="item-name">${escHtml(item.nome)}</span>
              <span class="item-kcal">${escHtml(item.kcal)} kcal</span>
            </div>`
        )
        .join('')
    }

    const dateDisplay = (() => {
      const parts = data.data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!parts) return data.data
      const weekdays = [
        'Domingo',
        'Segunda-feira',
        'Terça-feira',
        'Quarta-feira',
        'Quinta-feira',
        'Sexta-feira',
        'Sábado',
      ]
      const months = [
        'Janeiro',
        'Fevereiro',
        'Março',
        'Abril',
        'Maio',
        'Junho',
        'Julho',
        'Agosto',
        'Setembro',
        'Outubro',
        'Novembro',
        'Dezembro',
      ]
      const day = Number.parseInt(parts[1], 10)
      const month = Number.parseInt(parts[2], 10) - 1
      const year = Number.parseInt(parts[3], 10)
      const d = new Date(year, month, day)
      const weekday = weekdays[d.getDay()]
      return `${weekday}, ${day} de ${months[month]} de ${year}`
    })()

    const unidadeLabel =
      data.unidade === 'CENTRO'
        ? 'Campus Centro'
        : data.unidade === 'CAMPUS'
          ? 'Campus Capão do Leão'
          : data.unidade

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Cardápio RU</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;cursor:none!important}
  html,body{height:100%;overflow:hidden}

  body{
    background:${safeBg};
    color:#f1f5f9;
    font-family:'Inter',system-ui,-apple-system,sans-serif;
    height:100vh;
    display:grid;
    grid-template-rows:auto 1fr;
    position:relative;
  }

  /* Animated gradient orbs in background */
  body::before, body::after{
    content:'';position:fixed;border-radius:50%;filter:blur(80px);opacity:.15;z-index:0;pointer-events:none;
  }
  body::before{
    width:50vw;height:50vw;background:radial-gradient(circle,#3b82f6,transparent 70%);
    top:-15vw;right:-10vw;animation:orbFloat 20s ease-in-out infinite;
  }
  body::after{
    width:40vw;height:40vw;background:radial-gradient(circle,#8b5cf6,transparent 70%);
    bottom:-10vw;left:-10vw;animation:orbFloat 25s ease-in-out infinite reverse;
  }
  @keyframes orbFloat{
    0%,100%{transform:translate(0,0) scale(1)}
    33%{transform:translate(3vw,-2vw) scale(1.1)}
    66%{transform:translate(-2vw,3vw) scale(.95)}
  }

  .page{position:relative;z-index:1;display:grid;grid-template-rows:auto 1fr;height:100vh;padding:2vw 3vw;gap:1.5vw}

  /* ─── Header ─── */
  .header{text-align:center;animation:slideDown .6s cubic-bezier(.16,1,.3,1) both}
  @keyframes slideDown{from{opacity:0;transform:translateY(-30px)}to{opacity:1;transform:translateY(0)}}

  .header-top{
    display:flex;align-items:center;justify-content:center;gap:1vw;margin-bottom:.6vw;
  }
  .logo-icon{
    font-size:clamp(28px,3.5vw,56px);
    filter:drop-shadow(0 0 20px rgba(59,130,246,.4));
    animation:pulse 3s ease-in-out infinite;
  }
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}

  .header h1{
    font-size:clamp(22px,3.2vw,52px);font-weight:900;
    background:linear-gradient(135deg,#f8fafc 0%,#93c5fd 50%,#60a5fa 100%);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;
    letter-spacing:-.03em;line-height:1;
  }

  .header-sub{
    display:flex;align-items:center;justify-content:center;gap:1.5vw;
    font-size:clamp(10px,1.2vw,18px);color:#94a3b8;margin-top:.3vw;
  }
  .header-sub .badge{
    display:inline-flex;align-items:center;gap:.4vw;
    padding:.2vw .8vw;border-radius:100px;
    background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.25);
    color:#93c5fd;font-weight:600;font-size:clamp(8px,.9vw,14px);
    text-transform:uppercase;letter-spacing:.1em;
  }
  .badge .dot{width:.5vw;height:.5vw;border-radius:50%;background:#60a5fa;animation:blink 1.5s ease-in-out infinite}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}

  /* ─── Sections grid ─── */
  .sections{display:grid;grid-template-columns:1fr 1fr;gap:2vw;min-height:0}

  .section{
    background:linear-gradient(145deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.02) 100%);
    border:1px solid rgba(255,255,255,.08);
    border-radius:1.5vw;
    padding:1.6vw;
    display:flex;flex-direction:column;overflow:hidden;
    backdrop-filter:blur(20px);
    box-shadow:0 20px 60px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.08);
    animation:cardAppear .7s cubic-bezier(.16,1,.3,1) both;
  }
  .section:nth-child(1){animation-delay:.15s}
  .section:nth-child(2){animation-delay:.3s}
  @keyframes cardAppear{from{opacity:0;transform:translateY(40px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}

  .section-header{
    display:flex;align-items:center;gap:.8vw;
    padding-bottom:1vw;margin-bottom:.8vw;
    border-bottom:1px solid rgba(255,255,255,.06);
    flex-shrink:0;
  }
  .section-emoji{font-size:clamp(16px,2vw,32px)}
  .section-title{
    font-size:clamp(14px,1.8vw,28px);font-weight:800;
    text-transform:uppercase;letter-spacing:.08em;
    background:linear-gradient(90deg,#60a5fa,#a78bfa);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
    background-clip:text;
  }

  .items{flex:1;overflow:hidden;display:flex;flex-direction:column;gap:.5vw}

  .item{
    display:flex;align-items:center;gap:.6vw;
    padding:.5vw .8vw;border-radius:.6vw;
    font-size:clamp(11px,1.3vw,20px);
    transition:background .2s;
    animation:itemSlide .5s cubic-bezier(.16,1,.3,1) both;
  }
  @keyframes itemSlide{from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)}}

  .item:nth-child(odd){background:rgba(255,255,255,.04)}
  .item:nth-child(even){background:rgba(255,255,255,.02)}

  .item-icon{font-size:clamp(9px,1vw,16px);opacity:.5;flex-shrink:0}
  .item-name{color:#e2e8f0;font-weight:500;flex:1;word-break:break-word}
  .item-kcal{
    color:#64748b;font-size:clamp(8px,1vw,15px);
    white-space:nowrap;font-variant-numeric:tabular-nums;
    padding:.15vw .6vw;border-radius:100px;
    background:rgba(255,255,255,.05);
    font-weight:600;
  }

  .empty{
    color:#475569;font-style:italic;font-size:clamp(11px,1.3vw,20px);
    text-align:center;padding:3vw 0;
    display:flex;flex-direction:column;align-items:center;gap:.5vw;
  }
  .empty::before{content:'📋';font-size:clamp(20px,2.5vw,40px);opacity:.4}

  /* ─── Footer ─── */
  .footer{
    position:fixed;bottom:0;left:0;right:0;
    padding:.6vw 3vw;
    display:flex;align-items:center;justify-content:space-between;
    font-size:clamp(8px,.8vw,12px);color:rgba(148,163,184,.4);
    z-index:2;
  }
  .footer-line{
    flex:1;height:1px;margin:0 1.5vw;
    background:linear-gradient(90deg,transparent,rgba(148,163,184,.15),transparent);
  }

  /* Live clock */
  .clock{font-variant-numeric:tabular-nums;font-weight:600;color:rgba(148,163,184,.5)}
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="header-top">
        <span class="logo-icon">🏛️</span>
        <h1>Cardápio do Dia</h1>
      </div>
      <div class="header-sub">
        <div class="badge"><span class="dot"></span>${escHtml(unidadeLabel)}</div>
        <span>${escHtml(dateDisplay)}</span>
      </div>
    </div>

    <div class="sections">
      <div class="section">
        <div class="section-header">
          <span class="section-emoji">☀️</span>
          <span class="section-title">Almoço</span>
        </div>
        <div class="items">
          ${itemHtml(data.almoco, 'Cardápio de almoço não disponível.')}
        </div>
      </div>
      <div class="section">
        <div class="section-header">
          <span class="section-emoji">🌙</span>
          <span class="section-title">Janta</span>
        </div>
        <div class="items">
          ${itemHtml(data.janta, 'Cardápio de janta não disponível.')}
        </div>
      </div>
    </div>
  </div>

  <div class="footer">
    <span>Restaurante Universitário — UFPel</span>
    <span class="footer-line"></span>
    <span class="clock" id="clock"></span>
  </div>

  <script>
    !function(){
      var c=document.getElementById('clock');
      if(!c)return;
      function u(){
        var n=new Date();
        c.textContent=n.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
      }
      u();setInterval(u,1000);
    }();
  </script>
</body>
</html>`
  }

  /**
   * Create a Cardápio RU HTML page by fetching data from Cobalto (UFPEL)
   */
  public async createCardapioRu({ request, response, auth }: HttpContext) {
    const { title, unidade, date, bgColor, schedule } = request.only([
      'title',
      'unidade',
      'date',
      'bgColor',
      'schedule',
    ])

    if (!unidade || !date) {
      return response.badRequest({ error: 'unidade and date are required' })
    }

    let cardapioData: CardapioData
    try {
      cardapioData = await CardapioService.fetch(unidade, date)
    } catch (err) {
      return response.serviceUnavailable({
        error: 'Não foi possível buscar o cardápio do Cobalto.',
        detail: err instanceof Error ? err.message : String(err),
      })
    }

    const baseName = `cardapio-ru-${Date.now()}.html`
    const html = this.makeCardapioHtml(cardapioData, bgColor || '#0f172a')

    await MediaService.writeFile(baseName, html)
    const fileUrl = MediaService.getFileUrl(baseName)

    const safeBg = sanitizeCssColor(bgColor || '#0f172a', '#0f172a')
    const htmlPlayer = await HtmlPlayer.create({
      fileType: 'cardapio-ru',
      title: title || `Cardápio RU - ${unidade}`,
      htmlUrl: fileUrl,
      bodyHtml: `CardapioRU:${JSON.stringify({ unidade, date: cardapioData.data })}`,
      bgColor: safeBg,
      textColor: '#f1f5f9',
      fontFamily: 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
      fontSizePx: 24,
      textAlign: 'left',
      paddingPx: DEFAULT_HTML_PADDING,
      maxWidthPx: DEFAULT_HTML_MAX_WIDTH,
      schedule: this.normalizeSchedule(schedule),
      lastModified: auth.user?.id || 0,
    })

    return response.created({ ok: true, file: baseName, player: htmlPlayer })
  }

  /**
   * Re-fetch the cardápio from Cobalto and regenerate the HTML file
   */
  public async refreshCardapioRu({ request, response, params, auth }: HttpContext) {
    const htmlPlayer = await HtmlPlayer.findOrFail(params.id)

    const { unidade, date, title, bgColor, schedule } = request.only([
      'unidade',
      'date',
      'title',
      'bgColor',
      'schedule',
    ])

    if (!unidade || !date) {
      return response.badRequest({ error: 'unidade and date are required' })
    }

    let cardapioData: CardapioData
    try {
      cardapioData = await CardapioService.fetch(unidade, date)
    } catch (err) {
      return response.serviceUnavailable({
        error: 'Não foi possível buscar o cardápio do Cobalto.',
        detail: err instanceof Error ? err.message : String(err),
      })
    }

    const resolvedBg = bgColor || htmlPlayer.bgColor || '#0f172a'
    const html = this.makeCardapioHtml(cardapioData, resolvedBg)

    const filename = htmlPlayer.htmlUrl.split('/').pop()
    if (filename) {
      await MediaService.writeFile(filename, html)
    }

    htmlPlayer.merge({
      title: title || htmlPlayer.title,
      bodyHtml: `CardapioRU:${JSON.stringify({ unidade, date: cardapioData.data })}`,
      bgColor: sanitizeCssColor(resolvedBg, '#0f172a'),
      schedule: schedule ? this.normalizeSchedule(schedule) : htmlPlayer.schedule,
      lastModified: auth.user?.id || htmlPlayer.lastModified,
    })
    await htmlPlayer.save()

    return response.ok({ ok: true, player: htmlPlayer })
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
