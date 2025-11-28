<script setup lang="ts">
import type { Hero } from '~/src/data/types'

const { data: heroes } = await useFetch<Hero[]>('/api/heroes')

const columns = [
  {
    accessorKey: 'name',
    header: 'Hero',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        row.original.image_url ? h('img', { 
          src: row.original.image_url, 
          alt: row.original.name,
          class: 'w-8 h-8 rounded-full object-cover'
        }) : null,
        h('span', { class: 'font-medium' }, row.original.name)
      ])
    }
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ row }) => row.original.role,
    // cell: ({ row }) => {
    //   const role = row.original.role?.toLowerCase()
    //   let color = 'neutral'
    //   if (role === 'tank') color = 'blue'
    //   if (role === 'damage') color = 'red'
    //   if (role === 'support') color = 'green'
      
    //   return h('UBadge', { color, variant: 'subtle', size: 'xs', class: 'capitalize' }, () => row.original.role)
    // }
  },
  {
    accessorKey: 'base_stats.base_hp',
    header: 'Health',
    cell: ({ row }) => row.original.base_stats?.base_hp || '-'
  },
  {
    accessorKey: 'base_stats.armor',
    header: 'Armor',
    cell: ({ row }) => row.original.base_stats?.armor || '-'
  },
  {
    accessorKey: 'base_stats.shield',
    header: 'Shield',
    cell: ({ row }) => row.original.base_stats?.shield || '-'
  },
  {
    accessorKey: 'base_stats.move_speed',
    header: 'Speed',
    cell: ({ row }) => row.original.base_stats?.move_speed || '-'
  }
]

const search = ref('')

const filteredHeroes = computed(() => {
  if (!search.value) return heroes.value
  return heroes.value?.filter(hero => 
    hero.name.toLowerCase().includes(search.value.toLowerCase()) ||
    hero.role?.toLowerCase().includes(search.value.toLowerCase())
  )
})
</script>

<template>
  <div>
    <div class="mb-4">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search heroes..."
        class="max-w-sm"
      />
    </div>
    <UTable 
      :data="filteredHeroes" 
      :columns="columns" 
      class="flex-1"
    />
  </div>
</template>

