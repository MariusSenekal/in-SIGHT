<template>
  <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
    <template #activator="{ props: activatorProps }">
      <v-text-field
        v-bind="{ ...activatorProps, ...$attrs }"
        :model-value="displayValue"
        readonly
        clearable
        variant="outlined"
        density="comfortable"
        @click:clear="emit('update:modelValue', null)"
      />
    </template>
    <v-date-picker
      v-model="internalDate"
      color="primary"
      show-adjacent-months
      hide-header
      @update:model-value="menu = false"
    />
  </v-menu>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

const props = defineProps<{ modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [string | null] }>()

const menu = ref(false)

// Parses/formats using LOCAL date parts only (never ISO/UTC) so the
// YYYY-MM-DD string round-trips without shifting a day either side.
const parseLocalDate = (value: string | null | undefined): Date | null => {
  if (!value) return null
  const [y, m, d] = value.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

const internalDate = computed<Date | null>({
  get: () => parseLocalDate(props.modelValue),
  set: (date) => emit('update:modelValue', date ? formatLocalDate(date) : null)
})

const displayValue = computed(() => {
  const date = parseLocalDate(props.modelValue)
  if (!date) return ''
  return date.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })
})
</script>
