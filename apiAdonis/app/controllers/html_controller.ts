import type { HttpContext } from '@adonisjs/core/http'
import QRCode from 'qrcode'
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
    qrSvg?: string | null
  }): string {
    const {
      title = 'Aviso',
      bodyHtml = '<p>Escreva sua mensagem…</p>',
      bgColor = '#000000',
      textColor = '#ffffff',
      fontFamily = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
      fontSizePx = 80,
      textAlign = 'center',
      paddingPx = DEFAULT_HTML_PADDING,
      maxWidthPx = DEFAULT_HTML_MAX_WIDTH,
      qrSvg = null,
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
    font-size:${Number(fontSizePx) || 80}px;
    font-weight:800;letter-spacing:-.02em;line-height:1.15;
    text-align:${align};color:#f8fafc;
    text-shadow:0 2px 20px rgba(0,0,0,0.4);
  }
  .divider{width:80px;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,rgba(148,163,184,0.4),transparent)}
  .body{
    font-size:${Math.max(Math.round((Number(fontSizePx) || 80) * 0.6), 28)}px;
    font-weight:400;line-height:1.6;text-align:${align};
    color:rgba(203,213,225,0.85);max-width:700px;
    word-wrap:break-word;overflow-wrap:break-word;
  }
  .qr-overlay{
    position:fixed;bottom:24px;right:24px;z-index:100;
    background:#ffffff;padding:12px 12px 8px;
    border-radius:10px;
    display:flex;flex-direction:column;align-items:center;gap:6px;
    box-shadow:0 6px 24px rgba(0,0,0,0.55);
  }
  .qr-overlay svg{width:150px;height:150px;display:block;}
  .qr-overlay span{
    font-size:11px;color:#1e293b;font-weight:700;
    letter-spacing:.06em;text-transform:uppercase;
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
  ${qrSvg ? `<div class="qr-overlay">${qrSvg}<span>Acesse</span></div>` : ''}
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
      qrUrl,
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
      'qrUrl',
    ])

    const baseName = MediaService.sanitizeFilename(filename || '') || `aviso-${Date.now()}.html`
    if (!MediaService.isHtmlFile(baseName)) {
      return response.badRequest({ error: 'filename must end with .html' })
    }

    let qrSvg: string | null = null
    if (qrUrl && typeof qrUrl === 'string' && qrUrl.trim()) {
      try {
        const safeQrUrl = qrUrl.trim().slice(0, 2048)
        qrSvg = await QRCode.toString(safeQrUrl, {
          type: 'svg',
          errorCorrectionLevel: 'M',
          width: 200,
          margin: 1,
        })
      } catch (err) {
        console.error('QR generation failed:', err)
      }
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
      qrSvg,
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
      fontSizePx: fontSizePx || 80,
      textAlign: textAlign || 'center',
      paddingPx: paddingPx,
      maxWidthPx: maxWidthPx,
      qrUrl: qrUrl ? String(qrUrl).trim().slice(0, 2048) : null,
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
  h1{margin:0 0 12px;font-size:clamp(80px,12vw,140px);letter-spacing:.3px}
  .when{opacity:.85;margin-bottom:20px;font-size:clamp(20px,3.2vw,28px)}
  .clock{display:flex;gap:14px;justify-content:center;align-items:stretch;flex-wrap:wrap}
  .block{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:14px;min-width:120px;padding:16px 10px}
  .num{font-variant-numeric:tabular-nums;font-size:clamp(56px,13vw,130px);font-weight:800;line-height:1;color:var(--accent);text-shadow:0 2px 14px rgba(34,197,94,.25)}
  .lab{margin-top:8px;font-size:clamp(18px,3vw,26px);opacity:.85}
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

    // Regenerate QR code if the original had one
    let dupQrSvg: string | null = null
    if (originalPlayer.qrUrl) {
      try {
        dupQrSvg = await QRCode.toString(originalPlayer.qrUrl, {
          type: 'svg',
          errorCorrectionLevel: 'M',
          width: 200,
          margin: 1,
        })
      } catch (err) {
        console.error('QR generation failed (duplicate):', err)
      }
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
      qrSvg: dupQrSvg,
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
      qrUrl: originalPlayer.qrUrl ?? null,
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
      'qrUrl',
    ])

    if (updateData.schedule) {
      updateData.schedule = this.normalizeSchedule(updateData.schedule)
    }

    if ('qrUrl' in updateData) {
      updateData.qrUrl =
        updateData.qrUrl && typeof updateData.qrUrl === 'string' && updateData.qrUrl.trim()
          ? String(updateData.qrUrl).trim().slice(0, 2048)
          : null
    }

    htmlPlayer.merge({
      ...updateData,
      lastModified: auth.user?.id || htmlPlayer.lastModified,
    })

    await htmlPlayer.save()

    if (updateData.bodyHtml && htmlPlayer.htmlUrl) {
      const filename = htmlPlayer.htmlUrl.split('/').pop()
      if (filename) {
        let qrSvg: string | null = null
        if (htmlPlayer.qrUrl) {
          try {
            qrSvg = await QRCode.toString(htmlPlayer.qrUrl, {
              type: 'svg',
              errorCorrectionLevel: 'M',
              width: 200,
              margin: 1,
            })
          } catch (err) {
            console.error('QR generation failed (update):', err)
          }
        }
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
          qrSvg,
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

    // Use almoco if available, fall back to janta. Deduplicate by name.
    const raw = data.almoco.length > 0 ? data.almoco : data.janta
    const seen = new Set<string>()
    const items = raw.filter((item) => {
      const key = item.nome.trim().toUpperCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

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
      return `${weekdays[d.getDay()]}, ${day} de ${months[month]} de ${year}`
    })()

    const unidadeLabel =
      data.unidade === 'CENTRO'
        ? 'Campus Centro'
        : data.unidade === 'CAMPUS'
          ? 'Campus Capão do Leão'
          : data.unidade === 'ANGLO'
            ? 'Campus Anglo'
            : data.unidade

    // Auto-select columns: 3 for ≤9 items, 4 for more
    const cols = items.length <= 9 ? 3 : 4

    const renderItem = (item: (typeof items)[0]) => {
      const hasKcal = item.kcal && item.kcal !== '0'
      const hasDesc = item.ingredientes && item.ingredientes.trim().length > 0
      return `<div class="card">
        <div class="card-name">${escHtml(item.nome)}</div>
        ${hasDesc ? `<div class="card-desc">${escHtml(item.ingredientes)}</div>` : ''}
        ${hasKcal ? `<div class="card-kcal">${escHtml(item.kcal)} <span class="kcal-label">kcal</span></div>` : ''}
      </div>`
    }

    return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Cardápio RU</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;cursor:none!important}
  html,body{height:100%;overflow:hidden}
  body{
    background:${safeBg};
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    height:100vh;
    display:flex;
    flex-direction:column;
    padding:2vw 3vw 1.5vw;
    gap:1.5vw;
  }

  /* ── Header ── */
  .header{
    text-align:center;
    flex-shrink:0;
  }
  .header-sub{
    font-size:clamp(9px,.9vw,14px);
    font-weight:600;
    text-transform:uppercase;
    letter-spacing:.14em;
    color:#64748b;
    margin-bottom:.5vw;
  }
  .header h1{
    font-size:clamp(36px,5vw,80px);
    font-weight:800;
    color:#f8fafc;
    line-height:1;
    margin-bottom:.25vw;
  }
  .header-date{
    font-size:clamp(11px,1.1vw,17px);
    color:#94a3b8;
  }

  /* ── Card grid ── */
  .grid{
    flex:1;
    display:grid;
    grid-template-columns:repeat(${cols},1fr);
    gap:1.2vw;
    align-content:start;
    min-height:0;
  }
  .card{
    background:rgba(255,255,255,.06);
    border:1px solid rgba(255,255,255,.09);
    border-radius:.8vw;
    padding:1.1vw 1.3vw;
    display:flex;
    flex-direction:column;
    gap:.35vw;
  }
  .card-name{
    font-size:clamp(16px,1.9vw,30px);
    font-weight:700;
    color:#f1f5f9;
    line-height:1.2;
  }
  .card-desc{
    font-size:clamp(12px,1.3vw,19px);
    color:#94a3b8;
    line-height:1.4;
    flex:1;
  }
  .card-kcal{
    font-size:clamp(14px,1.6vw,24px);
    font-weight:700;
    color:#38bdf8;
    margin-top:.2vw;
    font-variant-numeric:tabular-nums;
  }
  .kcal-label{
    font-size:.7em;
    font-weight:400;
    color:#475569;
  }
  .empty{
    grid-column:1/-1;
    text-align:center;
    color:#475569;
    font-style:italic;
    font-size:clamp(13px,1.4vw,22px);
    padding:4vw 0;
  }

  /* ── Footer ── */
  .footer{
    display:flex;
    justify-content:space-between;
    border-top:1px solid rgba(255,255,255,.07);
    padding-top:.6vw;
    font-size:clamp(8px,.8vw,12px);
    color:#334155;
    flex-shrink:0;
  }
  .clock{font-variant-numeric:tabular-nums}
</style>
</head>
<body>
  <div class="header">
    <div class="header-sub">Restaurante Universitário · ${escHtml(unidadeLabel)}</div>
    <h1>Cardápio do Dia</h1>
    <div class="header-date">${escHtml(dateDisplay)}</div>
  </div>

  <div class="grid">
    ${items.length === 0 ? '<div class="empty">Cardápio não disponível para hoje.</div>' : items.map(renderItem).join('')}
  </div>

  <div class="footer">
    <span>UFPel — Cardápio sujeito a alterações</span>
    <span class="clock" id="clock"></span>
  </div>

  <script>
    !function(){
      var c=document.getElementById('clock');
      if(!c)return;
      function u(){c.textContent=new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});}
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

    // Schedule is active only on today's weekday (cardápio is only valid for the day it was created)
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    const todaySchedule = {
      days: [dayNames[new Date().getDay()]],
      start: '00:00',
      end: '23:59',
      tz: 'America/Sao_Paulo',
    }

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
      schedule: todaySchedule,
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
