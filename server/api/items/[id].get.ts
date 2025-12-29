import { defineEventHandler, getRouterParam, createError } from 'h3'
import { DATA } from '../../../src/data/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const item = DATA.items.find(i => i.id === id)
  
  if (!item) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Item not found',
      data: { error: 'Item not found' }
    })
  }
  
  return item
})

