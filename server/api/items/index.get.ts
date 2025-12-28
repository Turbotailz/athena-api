import { defineEventHandler, getQuery } from 'h3'
import { DATA } from '../../../src/data/db'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const type = query.type as string | undefined
  const rarity = query.rarity as string | undefined
  let items = DATA.items
  
  if (type) {
    items = items.filter(i => i.upgrade_type?.toLowerCase() === type.toLowerCase())
  }
  if (rarity) {
    items = items.filter(i => i.rarity?.toLowerCase() === rarity.toLowerCase())
  }
  
  return items
})

