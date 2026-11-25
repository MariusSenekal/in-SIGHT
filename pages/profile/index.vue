<template>
  <div />
</template>

<script setup lang="ts">
// Superseded by the Settings pages (/settings/profile, /settings/theme,
// /settings/notifications) -- kept as a redirect so old bookmarks/PWA
// shortcuts still land somewhere useful.
definePageMeta({ ssr: false })

onMounted(() => {
  navigateTo('/settings/profile')
})
</script>
