import vine from '@vinejs/vine'

export const createImageValidator = vine.compile(
  vine.object({
    fileType: vine.string(),
    title: vine.string(),
    imageUrl: vine.string(),
    lastModified: vine.number(),
    schedule: vine.object({
      days: vine.array(vine.string()),
      start: vine.string(),
      end: vine.string(),
      tz: vine.string(),
    }),
    durationMs: vine.number(),
  })
)

export const createVideoValidator = vine.compile(
  vine.object({
    fileType: vine.string(),
    title: vine.string(),
    videoUrl: vine.string(),
    lastModified: vine.number(),
    schedule: vine.object({
      days: vine.array(vine.string()),
      start: vine.string(),
      end: vine.string(),
      tz: vine.string(),
    }),
  })
)

export const createHtmlValidator = vine.compile(
  vine.object({
    fileType: vine.string(),
    title: vine.string(),
    htmlContent: vine.string(),
    bodyHtml: vine.string().optional(),
    lastModified: vine.number(),
    schedule: vine.object({
      days: vine.array(vine.string()),
      start: vine.string(),
      end: vine.string(),
      tz: vine.string(),
    }),
    fitMode: vine.string().optional(),
    bgColor: vine.string().optional(),
    textColor: vine.string().optional(),
    fontFamily: vine.string().optional(),
    fontSizePx: vine.number().optional(),
    textAlign: vine.string().optional(),
    paddingPx: vine.number().optional(),
    maxWidthPx: vine.number().optional(),
    durationMs: vine.number(),
  })
)

export const updatePlayerValidator = vine.compile(
  vine.object({
    fileType: vine.string().optional(),
    title: vine.string().optional(),
    imageUrl: vine.string().optional(),
    lastModified: vine.number().optional(),
    schedule: vine
      .object({
        days: vine.array(vine.string()),
        start: vine.string(),
        end: vine.string(),
        tz: vine.string(),
      })
      .optional(),
    fitMode: vine.string().optional(),
    bgColor: vine.string().optional(),
    durationMs: vine.number().optional(),
  })
)
