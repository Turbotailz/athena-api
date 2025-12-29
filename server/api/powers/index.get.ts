import { defineEventHandler, getQuery } from 'h3'
import { DATA } from '../../../src/data/db'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const type = query.type as string | undefined
  let powers = DATA.powers
  
  if (type) {
    powers = powers.filter(p => p.upgrade_type?.toLowerCase() === type.toLowerCase())
  }
  
  return powers
})

