import { defineEventHandler } from 'h3'

export default defineEventHandler((event) => {
  return {
    message: 'Welcome to the Athena API',
    documentation: 'https://athena-api.pages.dev',
    endpoints: {
      meta: '/api/meta',
      heroes: '/api/heroes',
      items: '/api/items',
      powers: '/api/powers',
      players: '/api/players/search'
    }
  }
})

