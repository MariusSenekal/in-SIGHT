<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ ssr: false })

onMounted(() => {
  navigateTo('/settings/profile')
})
</script>
