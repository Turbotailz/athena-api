import { defineEventHandler, getRouterParam, createError } from 'h3'
import { getPlayerStats } from '../../../../src/blizzard'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
     throw createError({ statusCode: 400, statusMessage: 'ID required' })
  }

  try {
    const stats = await getPlayerStats(id)
    if (!stats) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Player stats not found',
        data: { error: 'Player stats not found' }
      })
    }
    
    return stats
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch player stats',
      data: { error: 'Failed to fetch player stats', details: e.message }
    })
  }
})

