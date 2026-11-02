<template>
  <v-dialog v-model="open" max-width="480" persistent>
    <v-card rounded="xl">
      <v-card-title class="pa-5 pb-3 d-flex align-center ga-2">
        <v-icon icon="mdi-cake-variant" color="warning" />
        Upcoming Birthdays
      </v-card-title>
      <v-divider />
      <v-card-text class="pa-5">
        <p class="text-body-2 text-medium-emphasis mb-4">
          On {{ currentUser?.name }}'s account:
        </p>
        <v-list class="pa-0">
          <v-list-item
            v-for="item in birthdays"
            :key="`${item.type}-${item.id}`"
            rounded="lg"
            class="mb-2 border"
          >
            <template #prepend>
              <v-icon
                :icon="item.type === 'client' ? 'mdi-account-tie' : 'mdi-account-group'"
                color="primary"
              />
            </template>
            <v-list-item-title class="font-weight-medium">{{ item.name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ item.type === 'client' ? 'Client' : 'HR' }} ·
              birthday {{ item.when === 'today' ? 'is today' : 'is tomorrow' }}
            </v-list-item-subtitle>
            <template #append>
              <v-chip :color="item.when === 'today' ? 'success' : 'info'" size="small" variant="tonal">
                {{ item.when }}
              </v-chip>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-divider />
      <v-card-actions class="px-5 py-4">
        <v-spacer />
        <v-btn variant="flat" color="primary" @click="dismiss">Got it</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
interface UpcomingBirthday {
  type: 'client' | 'staff'
  id: number
  name: string
  dateOfBirth: string
  when: 'today' | 'tomorrow'
}

const { currentUser } = useAuth()
const open = ref(false)
const birthdays = ref<UpcomingBirthday[]>([])

const dismissedKey = () => {
  const userId = currentUser.value?.id
  const today = new Date()
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`
  return `birthday-popup-dismissed-${userId}-${dateStr}`
}

const dismiss = () => {
  open.value = false
  localStorage.setItem(dismissedKey(), '1')
}

const checkBirthdays = async () => {
  if (!currentUser.value?.id) return
  if (localStorage.getItem(dismissedKey())) return

  try {
    const result = await $fetch<UpcomingBirthday[]>('/api/birthdays/upcoming')
    if (result.length > 0) {
      birthdays.value = result
      open.value = true
    }
  } catch {
    // Non-fatal — just skip showing the reminder this load.
  }
}

watch(() => currentUser.value?.id, (id) => {
  if (id) checkBirthdays()
}, { immediate: true })
</script>
