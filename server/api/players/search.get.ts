import { defineEventHandler, getQuery, createError, getRequestURL } from 'h3'
import { searchPlayers } from '../../../../src/blizzard'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const name = query.name as string | undefined
  
  if (!name) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name parameter is required',
      data: { error: 'Name parameter is required' }
    })
  }
  
  try {
    const players = await searchPlayers(name)
    
    // Construct full stats URL
    const reqUrl = getRequestURL(event)
    const baseUrl = `${reqUrl.protocol}//${reqUrl.host}`
    
    const results = players.map(p => ({
      ...p,
      statsUrl: `${baseUrl}/api/players/${encodeURIComponent(p.url)}/stats`
    }))

    return results
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to search players',
      data: { error: 'Failed to search players', details: e.message }
    })
  }
})

