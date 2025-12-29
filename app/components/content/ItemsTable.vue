<script setup lang="ts">
import type { Item, Hero } from '~/src/data/types'

const { data: items } = await useFetch<Item[]>('/api/items')
const { data: heroes } = await useFetch<Hero[]>('/api/heroes')

const columns = [
  {
    accessorKey: 'name',
    header: 'Item',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        row.original.image_url ? h('img', { 
          src: row.original.image_url, 
          alt: row.original.name,
          class: 'w-8 h-8 rounded-md object-cover'
        }) : null,
        h('div', { class: 'flex flex-col' }, [
          h('span', { class: 'font-medium' }, row.original.name),
          h('span', { class: 'text-xs text-muted' }, row.original.upgrade_type)
        ])
      ])
    }
  },
  {
    accessorKey: 'cost',
    header: 'Cost',
    cell: ({ row }) => `${row.original.cost}g`
  },
  {
    accessorKey: 'rarity',
    header: 'Rarity',
    cell: ({ row }) => {
      const rarity = row.original.rarity?.toLowerCase()
      let color = 'neutral'
      if (rarity === 'common') color = 'neutral'
      if (rarity === 'rare') color = 'blue'
      if (rarity === 'epic') color = 'purple'
      if (rarity === 'legendary') color = 'orange'
      
      return h('UBadge', { color, variant: 'subtle', class: 'capitalize' }, rarity)
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => row.original.description,
    size: 100,
  },
  {
    accessorKey: 'stat_changes',
    header: 'Stats',
    cell: ({ row }) => {
      const stats = row.original.stat_changes || {}
      const statList = Object.entries(stats).map(([key, value]) => `${key}: ${value}`).join(', ')
      return h('span', { class: 'text-xs text-muted truncate max-w-[200px] block', title: statList }, statList)
    }
  }
]

const search = ref('')
const typeFilter = ref('all')
const heroFilter = ref('all')

const filteredItems = computed(() => {
  let result = items.value || []
  
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(item => 
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q))
    )
  }
  
  if (typeFilter.value !== 'all') {
    result = result.filter(item => item.upgrade_type === typeFilter.value)
  }

  if (heroFilter.value !== 'all') {
    result = result.filter(item => item.hero === heroFilter.value)
  }
  
  return result
})

const upgradeTypes = computed(() => {
  const types = new Set(items.value?.map(i => i.upgrade_type).filter(Boolean) as string[])
  return ['all', ...Array.from(types)]
})

const heroOptions = computed(() => {
  const options = heroes.value?.filter(h => h.stadium).map(h => ({ label: h.name, value: h.id })) || []
  return [{ label: 'All Heroes', value: 'all' }, ...options.sort((a, b) => a.label.localeCompare(b.label))]
})
</script>

<template>
  <div>
    <div class="mb-4 flex gap-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search items..."
        class="max-w-sm"
      />
      <USelect 
        v-model="typeFilter" 
        :items="upgradeTypes"
        class="w-40"
      />
      <USelect 
        v-model="heroFilter" 
        :items="heroOptions"
        option-attribute="label"
        value-attribute="value"
        placeholder="Filter by Hero"
        class="w-48"
      />
    </div>
    <UTable 
      :data="filteredItems" 
      :columns="columns" 
      class="flex-1"
    />
  </div>
</template>
