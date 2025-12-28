import { defineEventHandler } from 'h3'
import { DATA } from '../../src/data/db'

export default defineEventHandler((event) => {
  return {
    version: DATA.version,
    hero_count: DATA.heroes.length,
    item_count: DATA.items.length,
    power_count: DATA.powers.length,
    last_updated: DATA.version,
    stat_definitions: DATA.stat_definitions
  }
})

