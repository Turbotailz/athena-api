import { defineEventHandler, getQuery } from 'h3'
import { DATA } from '../../../src/data/db'

export default defineEventHandler((event) => {
  const query = getQuery(event)
  const role = query.role as string | undefined
  let heroes = DATA.heroes
  
  if (role) {
    heroes = heroes.filter(h => h.role?.toLowerCase() === role.toLowerCase())
  }
  
  return heroes
})

