<script setup lang="ts">
import type { Power } from '~/src/data/types'

const { data: powers } = await useFetch<Power[]>('/api/powers')

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
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => h('span', { class: 'text-sm text-muted line-clamp-2', title: row.original.description }, row.original.description)
  }
]

const search = ref('')
const typeFilter = ref('all')

const filteredPowers = computed(() => {
  let result = powers.value || []
  
  if (search.value) {
    result = result.filter(power => 
      power.name.toLowerCase().includes(search.value.toLowerCase())
    )
  }

  if (typeFilter.value !== 'all') {
    result = result.filter(power => power.upgrade_type === typeFilter.value)
  }
  
  return result
})

const upgradeTypes = computed(() => {
  const types = new Set(powers.value?.map(p => p.upgrade_type).filter(Boolean) as string[])
  return ['all', ...Array.from(types)]
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
        v-model="typeFilter" 
        :items="upgradeTypes"
        class="w-40"
      />
    </div>
    <UTable 
      :data="filteredPowers" 
      :columns="columns" 
      class="flex-1"
    />
  </div>
</template>

