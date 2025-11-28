<script setup lang="ts">
defineProps<{
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  route: string
}>()
</script>

<template>
  <div class="flex items-center gap-2 font-mono">
    <UBadge
      v-if="method"
      color="primary"
      variant="subtle"
    >
      {{ method }}
    </UBadge>
    <span class="font-semibold">{{ route }}</span>
  </div>
</template>

