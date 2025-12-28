<script setup lang="ts">
import type { Hero, Item, Power } from '~/src/data/types'

definePageMeta({
  layout: 'docs'
})

const route = useRoute()
const id = route.params.id as string

const { data: hero, error } = await useFetch<Hero>(`/api/heroes/${id}`, {
  query: { expand: 'items,powers' }
})

if (error.value || !hero.value) {
  console.error('Failed to fetch hero:', id, error.value)
  throw createError({ 
    statusCode: 404, 
    statusMessage: `Hero not found: ${id}. ${error.value?.message || ''}` 
  })
}

useHead({
  title: `${hero.value?.name} - Athena API`,
  description: `Hero details for ${hero.value?.name}`
})

// Stats Logic
const healthStats = computed(() => {
  if (!hero.value) return { hp: 0, armor: 0, shield: 0, total: 0, hpPercent: 0, armorPercent: 0, shieldPercent: 0 }
  
  const stats = hero.value.base_stats || {}
  const hp = stats.base_hp || 0
  const armor = stats.Armor || 0
  const shield = stats.Shield || 0
  const total = hp + armor + shield
  
  return {
    hp,
    armor,
    shield,
    total,
    hpPercent: total ? (hp / total) * 100 : 0,
    armorPercent: total ? (armor / total) * 100 : 0,
    shieldPercent: total ? (shield / total) * 100 : 0
  }
})
</script>

<template>
  <div class="max-w-4xl mx-auto py-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
      <img 
        v-if="hero.image_url"
        :src="hero.image_url" 
        :alt="hero.name"
        class="w-32 h-32 rounded-full border-4 border-gray-200 dark:border-gray-800 shadow-lg"
      />
      <div class="text-center md:text-left flex-1">
        <h1 class="text-4xl font-bold mb-2">{{ hero.name }}</h1>
        <div class="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
          <UBadge 
            size="lg"
            :color="hero.role === 'Tank' ? 'blue' : hero.role === 'Damage' ? 'red' : 'green'"
          >
            {{ hero.role }}
          </UBadge>
          <UBadge v-if="hero.stadium" color="yellow" variant="subtle">Stadium Hero</UBadge>
        </div>
        
        <!-- Bio Info -->
        <div v-if="hero.bio" class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
          <div v-if="hero.bio.real_name"><span class="font-bold">Real Name:</span> {{ hero.bio.real_name }}</div>
          <div v-if="hero.bio.age"><span class="font-bold">Age:</span> {{ hero.bio.age }}</div>
          <div v-if="hero.bio.occupation"><span class="font-bold">Occupation:</span> {{ hero.bio.occupation }}</div>
          <div v-if="hero.bio.base_of_operations"><span class="font-bold">Base:</span> {{ hero.bio.base_of_operations }}</div>
          <div v-if="hero.bio.affiliation"><span class="font-bold">Affiliation:</span> {{ hero.bio.affiliation }}</div>
          <div v-if="hero.bio.voice_actor"><span class="font-bold">Voice:</span> {{ hero.bio.voice_actor }}</div>
        </div>
      </div>
    </div>

    <!-- Health Stats -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold mb-4">Base Stats</h2>
      <div class="bg-gray-100 dark:bg-gray-800 rounded-xl p-6">
        <div class="flex items-end gap-2 mb-2 font-mono">
          <span class="text-3xl font-bold">{{ healthStats.total }}</span>
          <span class="text-sm text-gray-500 mb-1">Total Health</span>
        </div>
        
        <!-- Health Bar -->
        <div class="h-8 w-full bg-gray-900 rounded-sm flex overflow-hidden relative shadow-inner">
          <!-- Grid lines for 25hp chunks could go here if we want to be fancy -->
          
          <div 
            v-if="healthStats.hp > 0"
            class="h-full bg-white transition-all duration-500 relative group"
            :style="{ width: `${healthStats.hpPercent}%` }"
          >
            <UTooltip :text="`Health: ${healthStats.hp}`" class="w-full h-full" />
          </div>
          
          <div 
            v-if="healthStats.armor > 0"
            class="h-full bg-yellow-500 transition-all duration-500 relative group"
            :style="{ width: `${healthStats.armorPercent}%` }"
          >
            <UTooltip :text="`Armor: ${healthStats.armor}`" class="w-full h-full" />
          </div>
          
          <div 
            v-if="healthStats.shield > 0"
            class="h-full bg-blue-500 transition-all duration-500 relative group"
            :style="{ width: `${healthStats.shieldPercent}%` }"
          >
            <UTooltip :text="`Shields: ${healthStats.shield}`" class="w-full h-full" />
          </div>

          <!-- Separators -->
          <div 
            v-for="i in Math.floor((healthStats.total - 1) / 25)" 
            :key="i"
            class="absolute top-0 bottom-0 border-r border-black/20 pointer-events-none"
            :style="{ left: `${(i * 25 / healthStats.total) * 100}%` }"
          ></div>
        </div>

        <!-- Legend -->
        <div class="flex gap-6 mt-4 text-sm">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 bg-white border border-gray-300 dark:border-gray-600"></div>
            <span>Health: <span class="font-bold">{{ healthStats.hp }}</span></span>
          </div>
          <div v-if="healthStats.armor > 0" class="flex items-center gap-2">
            <div class="w-3 h-3 bg-yellow-500"></div>
            <span>Armor: <span class="font-bold">{{ healthStats.armor }}</span></span>
          </div>
          <div v-if="healthStats.shield > 0" class="flex items-center gap-2">
            <div class="w-3 h-3 bg-blue-500"></div>
            <span>Shields: <span class="font-bold">{{ healthStats.shield }}</span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Abilities -->
    <div v-if="hero.abilities?.length" class="mb-8">
      <h2 class="text-2xl font-bold mb-4">Abilities</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div 
          v-for="ability in hero.abilities" 
          :key="ability.name"
          class="border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex gap-4 bg-white dark:bg-gray-900"
        >
          <img 
            v-if="ability.icon_url"
            :src="ability.icon_url"
            class="w-12 h-12 rounded-md object-contain bg-gray-100 dark:bg-gray-800 p-1"
          />
          <div>
            <h3 class="font-bold text-lg">{{ ability.name }}</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ ability.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Perks (Core Game) -->
    <div v-if="hero.perks?.length" class="mb-8">
      <h2 class="text-2xl font-bold mb-4">Hero Mastery Perks</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div 
          v-for="perk in hero.perks" 
          :key="perk.name"
          class="border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex gap-4"
        >
          <img 
            v-if="perk.icon_url"
            :src="perk.icon_url"
            class="w-12 h-12 rounded-md object-contain bg-gray-100 dark:bg-gray-800 p-1"
          />
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold">{{ perk.name }}</h3>
              <UBadge 
                size="xs" 
                :color="perk.type === 'major' ? 'orange' : 'gray'" 
                variant="subtle"
                class="capitalize"
              >
                {{ perk.type }}
              </UBadge>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ perk.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Powers (Stadium) -->
    <div v-if="hero.powers?.length" class="mb-8">
      <h2 class="text-2xl font-bold mb-4">Stadium Powers</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div 
          v-for="power in hero.powers" 
          :key="power.id"
          class="border border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg p-4 flex gap-4"
        >
          <img 
            v-if="power.image_url"
            :src="power.image_url"
            class="w-12 h-12 rounded-md object-cover"
          />
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-bold text-lg">{{ power.name }}</h3>
              <UBadge size="xs" color="yellow" variant="subtle">Power</UBadge>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ power.description }}</p>
            <div class="mt-2 text-xs text-primary-500 font-mono" v-if="power.stat_changes">
              {{ Object.entries(power.stat_changes).map(([k,v]) => `${k}: ${v}`).join(', ') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Items (Stadium) -->
    <div v-if="hero.items?.length" class="mb-8">
      <h2 class="text-2xl font-bold mb-4">Exclusive Items</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div 
          v-for="item in hero.items" 
          :key="item.id"
          class="border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex gap-4 hover:border-primary-500 transition-colors"
        >
          <img 
            v-if="item.image_url"
            :src="item.image_url"
            class="w-12 h-12 rounded-md object-cover"
          />
          <div>
            <h3 class="font-bold">{{ item.name }}</h3>
            <div class="flex gap-2 my-1">
              <UBadge size="xs" variant="subtle">{{ item.rarity }}</UBadge>
              <span class="text-xs font-mono">{{ item.cost }}g</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2" :title="item.description">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
