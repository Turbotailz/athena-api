<script setup lang="ts">
const config = useRuntimeConfig()
const version = `v${config.public.version}`
</script>

<template>
  <UBadge
    :label="version"
    variant="subtle"
    class="-mb-[6px] font-semibold rounded-full"
  />
</template>
