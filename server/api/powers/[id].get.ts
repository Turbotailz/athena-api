import { defineEventHandler, getRouterParam, createError } from 'h3'
import { DATA } from '../../../src/data/db'

export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  const power = DATA.powers.find(p => p.id === id)
  
  if (!power) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Power not found',
      data: { error: 'Power not found' }
    })
  }
  
  return power
})

