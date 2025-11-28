<script setup lang="ts">
const { data: items } = await useFetch('/api/items')

function getRarityColor(rarity: string) {
  switch (rarity?.toLowerCase()) {
    case 'common': return 'gray'
    case 'rare': return 'blue'
    case 'epic': return 'purple'
    case 'legendary': return 'orange'
    default: return 'gray'
  }
}
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 not-prose">
    <UCard
      v-for="item in items"
      :key="item.id"
      :to="`/api/items/${item.id}`"
      target="_blank"
      class="hover:ring-2 hover:ring-primary-500 transition-all"
      :ui="{ body: { padding: 'p-3' } }"
    >
      <div class="flex gap-3">
        <UAvatar
          :src="item.image_url || undefined"
          :alt="item.name"
          size="md"
          :ui="{ rounded: 'rounded-md' }"
        />
        <div class="min-w-0 flex-1">
          <div class="font-bold text-sm truncate">{{ item.name }}</div>
          <div class="flex gap-1 mt-1">
            <UBadge :color="getRarityColor(item.rarity)" size="xs" variant="subtle">{{ item.cost }}g</UBadge>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

