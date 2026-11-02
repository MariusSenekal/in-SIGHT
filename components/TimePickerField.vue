<template>
  <v-menu v-model="menu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
    <template #activator="{ props: activatorProps }">
      <v-text-field
        v-bind="{ ...activatorProps, ...$attrs }"
        :model-value="modelValue || ''"
        readonly
        clearable
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-clock-outline"
        @click:clear="emit('update:modelValue', null)"
      />
    </template>
    <v-time-picker
      :model-value="modelValue || undefined"
      format="24hr"
      color="primary"
      @update:model-value="(val: string | null) => emit('update:modelValue', val)"
    />
  </v-menu>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false })

defineProps<{ modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [string | null] }>()

const menu = ref(false)
</script>
