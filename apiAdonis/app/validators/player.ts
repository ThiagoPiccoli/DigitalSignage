import vine from '@vinejs/vine'

export const createPlayerValidator = vine.compile(
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
    fitMode: vine.string().optional(),
    bgColor: vine.string().optional(),
    durationMs: vine.number().optional(),
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
