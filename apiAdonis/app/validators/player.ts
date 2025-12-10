import vine from '@vinejs/vine'

export const createImageValidator = vine.compile(
  vine.object({
    title: vine.string(),
    fileUrl: vine.string(),
    lastModified: vine.number(),
    durationMs: vine.number().optional(),
    schedule: vine
      .object({
        days: vine.array(vine.string()),
        start: vine.string(),
        end: vine.string(),
        tz: vine.string(),
      })
      .optional(),
  })
)

export const createVideoValidator = vine.compile(
  vine.object({
    title: vine.string(),
    fileUrl: vine.string(),
    lastModified: vine.number(),
    durationMs: vine.number().optional(),
    schedule: vine
      .object({
        days: vine.array(vine.string()),
        start: vine.string(),
        end: vine.string(),
        tz: vine.string(),
      })
      .optional(),
  })
)

export const createHtmlValidator = vine.compile(
  vine.object({
    filename: vine.string(),
    title: vine.string(),
    bodyHtml: vine.string().optional(),
    bgColor: vine.string().optional(),
    textColor: vine.string().optional(),
    fontFamily: vine.string().optional(),
    fontSizePx: vine.number().optional(),
    textAlign: vine.string().optional(),
    paddingPx: vine.number().optional(),
    maxWidthPx: vine.number().optional(),
    lastModified: vine.number(),
    durationMs: vine.number().optional(),
    schedule: vine
      .object({
        days: vine.array(vine.string()),
        start: vine.string(),
        end: vine.string(),
        tz: vine.string(),
      })
      .optional(),
  })
)

export const updatePlayerValidator = vine.compile(
  vine.object({
    fileType: vine.string().optional(),
    title: vine.string().optional(),
    fileUrl: vine.string().optional(),
    lastModified: vine.number().optional(),
    durationMs: vine.number().optional(),
    schedule: vine
      .object({
        days: vine.array(vine.string()),
        start: vine.string(),
        end: vine.string(),
        tz: vine.string(),
      })
      .optional(),
  })
)

export const createDeadlineValidator = vine.compile(
  vine.object({
    title: vine.string(),
    deadlineISO: vine.string(),
    filename: vine.string().optional(),
    bgColor: vine.string().optional(),
    textColor: vine.string().optional(),
    accentColor: vine.string().optional(),
    fontFamily: vine.string().optional(),
    lastModified: vine.number(),
  })
)
