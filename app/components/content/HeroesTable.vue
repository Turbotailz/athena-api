<script setup lang="ts">
import type { Hero } from '~/src/data/types'

const { data: heroes } = await useFetch<Hero[]>('/api/heroes')

const columns = [
  {
    accessorKey: 'name',
    header: 'Hero',
    cell: ({ row }) => {
      return h(resolveComponent('NuxtLink'), { 
        to: `/reference/heroes/${row.original.id}`,
        class: 'flex items-center gap-2 hover:text-primary-500'
      }, () => [
        row.original.image_url ? h('img', { 
          src: row.original.image_url, 
          alt: row.original.name,
          class: 'w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700'
        }) : null,
        h('span', { class: 'font-medium text-lg' }, row.original.name)
      ])
    }
  }
]

const search = ref('')

const roles = ['Tank', 'Damage', 'Support']

const getHeroesByRole = (role: string) => {
  let result = heroes.value?.filter(h => h.role?.toLowerCase() === role.toLowerCase()) || []
  
  if (search.value) {
    result = result.filter(hero => hero.name.toLowerCase().includes(search.value.toLowerCase()))
  }
  
  return result
}
</script>

<template>
  <div>
    <div class="mb-8">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search heroes..."
        class="max-w-sm"
      />
    </div>

    <div v-for="role in roles" :key="role" class="mb-8">
      <h2 class="text-2xl font-bold mb-4 flex items-center gap-2">
        <span class="w-2 h-8 rounded-full" :class="{
          'bg-blue-500': role === 'Tank',
          'bg-red-500': role === 'Damage',
          'bg-green-500': role === 'Support'
        }"></span>
        {{ role }}
      </h2>
      
      <div v-if="getHeroesByRole(role).length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <NuxtLink
          v-for="hero in getHeroesByRole(role)"
          :key="hero.id"
          :to="`/reference/heroes/${hero.id}`"
          class="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary-500 dark:hover:border-primary-500 transition-colors bg-white dark:bg-gray-900"
        >
          <img 
            v-if="hero.image_url" 
            :src="hero.image_url" 
            :alt="hero.name"
            class="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h3 class="font-bold text-lg">{{ hero.name }}</h3>
            <p v-if="hero.stadium" class="text-xs text-primary-500 font-medium">Stadium Hero</p>
          </div>
        </NuxtLink>
      </div>
      <p v-else class="text-muted text-sm italic">No heroes found.</p>
    </div>
  </div>
</template>
