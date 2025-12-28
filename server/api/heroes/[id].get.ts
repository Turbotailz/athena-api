import { defineEventHandler, getRouterParam, getQuery, createError } from 'h3'
import { DATA } from '../../../src/data/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const hero = DATA.heroes.find(h => h.id.toLowerCase() === id?.toLowerCase())
  
  if (!hero) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Hero not found',
      data: { error: 'Hero not found' }
    })
  }
  
  const query = getQuery(event)
  const expand = query.expand as string | undefined
  const expansions = expand ? expand.split(',') : []
  
  const result: any = { ...hero }
  
  if (expansions.includes('items')) {
    result.items = hero.item_ids
      .map(itemId => DATA.items.find(i => i.id === itemId))
      .filter(Boolean)
  }

  if (expansions.includes('powers')) {
    result.powers = hero.power_ids
      .map(powerId => DATA.powers.find(p => p.id === powerId))
      .filter(Boolean)
  }
  
  return result
})

