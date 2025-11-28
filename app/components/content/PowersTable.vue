<script setup lang="ts">
import type { Power, Hero } from '~/src/data/types'

const { data: powers } = await useFetch<Power[]>('/api/powers')
const { data: heroes } = await useFetch<Hero[]>('/api/heroes')

const columns = [
  {
    accessorKey: 'name',
    header: 'Power',
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
    id: 'hero',
    header: 'Hero',
    cell: ({ row }) => {
      const heroId = row.original.hero_id
      const hero = heroes.value?.find(h => h.id === heroId)
      if (!hero) return '-'
      
      return h('div', { class: 'flex items-center gap-2' }, [
        hero.image_url ? h('img', { 
          src: hero.image_url, 
          alt: hero.name,
          class: 'w-6 h-6 rounded-full object-cover'
        }) : null,
        h('span', { class: 'text-sm' }, hero.name)
      ])
    }
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted line-clamp-2', title: row.original.description }, row.original.description)
  }
]

const search = ref('')
const heroFilter = ref('all')

const filteredPowers = computed(() => {
  let result = powers.value || []
  
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(power => 
      power.name.toLowerCase().includes(q) ||
      power.description.toLowerCase().includes(q)
    )
  }

  if (heroFilter.value !== 'all') {
    result = result.filter(power => power.hero_id === heroFilter.value)
  }
  
  return result
})

const heroOptions = computed(() => {
  const options = heroes.value?.map(h => ({ label: h.name, value: h.id })) || []
  return [{ label: 'All Heroes', value: 'all' }, ...options.sort((a, b) => a.label.localeCompare(b.label))]
})
</script>

<template>
  <div>
    <div class="mb-4 flex gap-2">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search powers..."
        class="max-w-sm"
      />
      <USelect 
        v-model="heroFilter" 
        :items="heroOptions"
        option-attribute="label"
        value-attribute="value"
        class="w-48"
      />
    </div>
    <UTable 
      :data="filteredPowers" 
      :columns="columns" 
      class="flex-1"
    />
  </div>
</template>
