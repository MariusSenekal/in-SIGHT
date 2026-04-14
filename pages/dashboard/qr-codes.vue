<template>
  <div class="container">
    <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6 app-shell">
      <div class="d-flex flex-wrap align-center justify-space-between ga-2 mb-4 print-hidden">
        <div>
          <h1 class="text-h4 text-md-h3 font-weight-bold">QR Code Section</h1>
          <p class="text-medium-emphasis">Select records, adjust size/layout, then print smart packed sheets.</p>
        </div>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack({ adminFallback: '/' })">Back</v-btn>
          <v-btn color="error" variant="tonal" prepend-icon="mdi-logout" @click="handleLogout">Log Out</v-btn>
        </div>
      </div>

      <v-row dense class="mb-3 print-hidden">
        <v-col cols="12" md="3" v-for="item in quickActions" :key="item.to">
          <v-card :to="item.to" variant="tonal" rounded="lg" class="h-100">
            <v-card-title class="d-flex align-center ga-2"><v-icon :icon="item.icon" />{{ item.title }}</v-card-title>
            <v-card-text class="text-medium-emphasis">{{ item.description }}</v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-row class="qr-layout-row" dense>
        <v-col cols="12" md="5" class="qr-controls-col qr-controls-scroll">
          <v-card variant="outlined" rounded="lg" class="record-selection-card">
            <v-card-title class="d-flex align-center ga-2"><v-icon icon="mdi-checklist" />Record Selection</v-card-title>
            <v-card-text>
              <div class="d-flex ga-2 mb-3 flex-wrap">
                <v-btn variant="tonal" prepend-icon="mdi-select-all" @click="selectAll">Select All</v-btn>
                <v-btn variant="tonal" prepend-icon="mdi-close-box-multiple-outline" @click="clearAll">Clear</v-btn>
                <v-chip color="primary" size="small" variant="tonal">{{ selectedIds.length }} selected</v-chip>
              </div>

              <v-text-field
                v-model="recordSearch"
                label="Search records"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
              />

              <v-select
                v-model="selectedOwnerFilter"
                :items="ownerFilterItems"
                label="Filter by user"
                prepend-inner-icon="mdi-account-filter"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-3"
              />

              <v-list class="qr-record-list-material" lines="two" nav>
                <v-list-item v-for="record in filteredRecords" :key="record.id" rounded="lg">
                  <template #prepend>
                    <v-checkbox-btn
                      :model-value="selectedIds.includes(record.id)"
                      @update:model-value="setRecordSelection(record.id, Boolean($event))"
                    />
                  </template>

                  <v-list-item-title>{{ record.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ record.code }} | {{ recordOwnerLabel(record.ownerUserId) }}</v-list-item-subtitle>

                  <template #append>
                    <v-text-field
                      :model-value="quantityById[record.id] || 1"
                      type="number"
                      min="1"
                      max="500"
                      label="Qty"
                      density="compact"
                      variant="outlined"
                      hide-details
                      style="max-width: 110px;"
                      @update:model-value="updateQuantityValue(record.id, $event)"
                    />
                  </template>
                </v-list-item>
              </v-list>

              <v-alert v-if="filteredRecords.length === 0" type="info" variant="tonal" density="compact" class="mt-2">
                No records match your search.
              </v-alert>
            </v-card-text>
          </v-card>

          <v-card variant="outlined" rounded="lg" class="page-settings-card">
            <v-card-title class="d-flex align-center ga-2"><v-icon icon="mdi-tune-vertical" />Page and QR Settings</v-card-title>
            <v-card-text>
              <v-row dense>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="selectedPagePreset"
                    :items="pagePresetItems"
                    label="Page Size"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="orientation"
                    :items="orientationItems"
                    label="Orientation"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                  />
                </v-col>
              </v-row>

              <v-row v-if="selectedPagePreset === 'Custom'" dense class="mt-1">
                <v-col cols="12" md="6">
                  <v-text-field v-model.number="customWidthMm" type="number" min="100" max="500" label="Width (mm)" variant="outlined" density="comfortable" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field v-model.number="customHeightMm" type="number" min="100" max="700" label="Height (mm)" variant="outlined" density="comfortable" />
                </v-col>
              </v-row>

              <v-slider v-model="qrSizeMm" :min="10" :max="260" :step="1" color="primary" class="mt-2" thumb-label>
                <template #prepend><span class="text-body-2">QR Size</span></template>
                <template #append><span class="text-body-2">{{ qrSizeMm }}mm</span></template>
              </v-slider>

              <v-slider v-model="marginMm" :min="5" :max="25" :step="1" color="primary" thumb-label>
                <template #prepend><span class="text-body-2">Margin</span></template>
                <template #append><span class="text-body-2">{{ marginMm }}mm</span></template>
              </v-slider>

              <v-slider v-model="gapMm" :min="2" :max="16" :step="1" color="primary" thumb-label>
                <template #prepend><span class="text-body-2">Gap</span></template>
                <template #append><span class="text-body-2">{{ gapMm }}mm</span></template>
              </v-slider>

              <v-alert v-if="isQrSizeClamped" type="warning" variant="tonal" border="start" class="mb-3">
                Requested QR size is larger than printable area. Using max safe size: {{ effectiveQrSizeMm.toFixed(0) }}mm.
              </v-alert>

              <v-list density="compact" class="mb-3">
                <v-list-item title="Sheet Size" :subtitle="`${pageWidthMm.toFixed(0)}mm x ${pageHeightMm.toFixed(0)}mm`" />
                <v-list-item title="Effective QR Size" :subtitle="`${effectiveQrSizeMm.toFixed(0)}mm`" />
                <v-list-item title="Smart Packing" :subtitle="`${perRow} across x ${perColumn} down = ${perPage} per page`" />
                <v-list-item title="Total QR Labels" :subtitle="`${expandedRecords.length} (${pages.length} page${pages.length === 1 ? '' : 's'})`" />
              </v-list>

              <v-btn color="primary" prepend-icon="mdi-printer" :disabled="expandedRecords.length === 0" @click="printSheets">
                Print QR Sheets
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="7" class="print-preview-area preview-col">
          <v-card variant="outlined" rounded="lg" class="preview-pane">
            <v-card-title class="d-flex align-center ga-2">
              <v-icon icon="mdi-eye-outline" />
              QR Preview
              <v-spacer />
              <v-btn
                class="print-hidden"
                color="primary"
                variant="flat"
                prepend-icon="mdi-printer"
                :disabled="expandedRecords.length === 0"
                @click="printSheets"
              >
                Print Preview
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-alert v-if="expandedRecords.length > 0" type="info" variant="tonal" border="start" class="mb-3 print-hidden">
                Preview auto-packs QR codes to fit each page.
              </v-alert>
              <v-alert v-else type="info" variant="tonal" border="start" class="print-hidden">
                Select at least one record to generate printable QR sheets.
              </v-alert>

              <div class="qr-sheet-stack" v-if="expandedRecords.length > 0">
                <article
                  v-for="(pageRecords, pageIndex) in pages"
                  :key="`page-${pageIndex}`"
                  class="qr-sheet"
                  :style="sheetStyle"
                >
                  <header class="qr-sheet-header">
                    <h3>QR Sheet {{ pageIndex + 1 }}</h3>
                    <p>{{ pageLabel }} | {{ pageRecords.length }} codes</p>
                  </header>

                  <div class="qr-sheet-grid" :style="gridStyle">
                    <div
                      v-for="recordEntry in pageRecords"
                      :key="`${recordEntry.record.id}-${recordEntry.copyIndex}`"
                      class="qr-sheet-item"
                      :style="sheetItemStyle"
                    >
                      <div class="qr-code-frame" :style="qrFrameStyle">
                        <QrcodeVue
                          :value="toScanUrl(recordEntry.record.code)"
                          :size="qrPixelSize"
                          level="H"
                          render-as="svg"
                          :style="qrSvgStyle"
                        />
                      </div>
                      <p class="qr-item-code" :style="qrCodeTextStyle">{{ recordEntry.record.code }}</p>
                    </div>
                  </div>
                </article>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

const { currentUser, isAdmin, initAuth, logout, users } = useAuth()
const { goBack } = useAppNavigation()
const { getRecords } = useRecords()
const records = getRecords()

const selectedIds = ref<number[]>(records.map(record => record.id))
const recordSearch = ref('')
const selectedOwnerFilter = ref('all')
const quantityById = ref<Record<number, number>>(
  Object.fromEntries(records.map(record => [record.id, 1]))
)
const selectedPagePreset = ref<'A4' | 'Letter' | 'A3' | 'Custom'>('A4')
const orientation = ref<'portrait' | 'landscape'>('portrait')
const customWidthMm = ref(210)
const customHeightMm = ref(297)
const qrSizeMm = ref(38)
const marginMm = ref(10)
const gapMm = ref(6)

const pagePresets = {
  A4: { width: 210, height: 297 },
  Letter: { width: 216, height: 279 },
  A3: { width: 297, height: 420 }
} as const

const quickActions = [
  {
    to: '/dashboard',
    title: 'Dashboard Home',
    description: 'Return to the admin overview.',
    icon: 'mdi-view-dashboard-outline'
  },
  {
    to: '/dashboard/management',
    title: 'Management Tools',
    description: 'Assign checklists and review users.',
    icon: 'mdi-account-cog-outline'
  },
  {
    to: '/dashboard/requests',
    title: 'Service Requests',
    description: 'Review maintenance and cleaning requests.',
    icon: 'mdi-clipboard-list-outline'
  },
  {
    to: '/records',
    title: 'Records',
    description: 'Open all record details and QR links.',
    icon: 'mdi-folder-multiple-outline'
  }
]

const pagePresetItems = ['A4', 'Letter', 'A3', 'Custom']
const orientationItems: Array<'portrait' | 'landscape'> = ['portrait', 'landscape']

const ownerFilterItems = computed(() => {
  return [
    { title: 'All users', value: 'all' },
    { title: 'Unassigned / Admin records', value: 'unassigned' },
    ...users.value.map(user => ({
      title: `${user.profile?.displayName || user.name} (@${user.username})`,
      value: `user-${user.id}`
    }))
  ]
})

onMounted(() => {
  initAuth()

  if (!currentUser.value || !isAdmin.value) {
    navigateTo('/')
  }
})

const handleLogout = () => {
  logout()
  navigateTo('/')
}

const recordsByOwnerFilter = computed(() => {
  if (selectedOwnerFilter.value === 'all') {
    return records
  }

  if (selectedOwnerFilter.value === 'unassigned') {
    return records.filter(record => record.ownerUserId === null)
  }

  const userId = Number.parseInt(selectedOwnerFilter.value.replace('user-', ''), 10)

  if (Number.isNaN(userId)) {
    return records
  }

  return records.filter(record => record.ownerUserId === userId)
})

const filteredRecords = computed(() => {
  const term = recordSearch.value.trim().toLowerCase()

  if (!term) {
    return recordsByOwnerFilter.value
  }

  return recordsByOwnerFilter.value.filter(record => {
    return record.name.toLowerCase().includes(term) || record.code.toLowerCase().includes(term)
  })
})

const recordOwnerLabel = (ownerUserId: number | null) => {
  if (ownerUserId === null) {
    return 'Unassigned/Admin'
  }

  const matched = users.value.find(user => user.id === ownerUserId)
  return matched ? (matched.profile?.displayName || matched.name) : 'Unknown user'
}

const selectAll = () => {
  const visibleIds = filteredRecords.value.map(record => record.id)
  selectedIds.value = [...new Set([...selectedIds.value, ...visibleIds])]
}

const clearAll = () => {
  selectedIds.value = []
}

const normalizeQuantity = (value: number) => {
  return Math.min(Math.max(Math.floor(value || 1), 1), 500)
}

const updateQuantityValue = (id: number, value: string | number | null) => {
  const parsed = typeof value === 'number'
    ? value
    : Number.parseInt(String(value || '1'), 10)
  const next = normalizeQuantity(Number.isNaN(parsed) ? 1 : parsed)

  quantityById.value = {
    ...quantityById.value,
    [id]: next
  }
}

const setRecordSelection = (id: number, checked: boolean) => {
  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value = [...selectedIds.value, id]
    }

    return
  }

  selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id)
}

const basePageSize = computed(() => {
  if (selectedPagePreset.value === 'Custom') {
    return {
      width: customWidthMm.value,
      height: customHeightMm.value
    }
  }

  return pagePresets[selectedPagePreset.value]
})

const pageWidthMm = computed(() => {
  if (orientation.value === 'portrait') {
    return basePageSize.value.width
  }

  return basePageSize.value.height
})

const pageHeightMm = computed(() => {
  if (orientation.value === 'portrait') {
    return basePageSize.value.height
  }

  return basePageSize.value.width
})

const cellPaddingMm = 8
const sheetHeaderReserveMm = 24
const packingSafetyMm = 4
const usableWidthMm = computed(() => {
  return Math.max(pageWidthMm.value - marginMm.value * 2 - packingSafetyMm, 20)
})
const usableHeightMm = computed(() => {
  return Math.max(pageHeightMm.value - marginMm.value * 2 - sheetHeaderReserveMm - packingSafetyMm, 20)
})
const codeFontPx = computed(() => Math.min(Math.max(qrSizeMm.value * 0.45, 11), 20))
const labelHeightMm = computed(() => {
  const codeLineMm = (codeFontPx.value * 1.35) / 3.78
  return Math.max(codeLineMm + 4, 10)
})
const maxQrSizeMm = computed(() => {
  const widthLimit = usableWidthMm.value - cellPaddingMm
  const heightLimit = usableHeightMm.value - labelHeightMm.value
  return Math.max(Math.min(widthLimit, heightLimit), 10)
})
const effectiveQrSizeMm = computed(() => Math.min(qrSizeMm.value, maxQrSizeMm.value))
const isQrSizeClamped = computed(() => qrSizeMm.value > maxQrSizeMm.value)
const cellWidthMm = computed(() => effectiveQrSizeMm.value + cellPaddingMm)
const itemHeightMm = computed(() => effectiveQrSizeMm.value + labelHeightMm.value)

const perRow = computed(() => {
  const raw = Math.floor((usableWidthMm.value + gapMm.value) / (cellWidthMm.value + gapMm.value))
  return Math.max(raw, 1)
})

const perColumn = computed(() => {
  const raw = Math.floor((usableHeightMm.value + gapMm.value) / (itemHeightMm.value + gapMm.value))
  return Math.max(raw, 1)
})

const perPage = computed(() => {
  return Math.max(perRow.value * perColumn.value, 1)
})

const selectedRecords = computed(() => {
  return records.filter(record => selectedIds.value.includes(record.id))
})

const expandedRecords = computed(() => {
  const output: Array<{ record: (typeof records)[number]; copyIndex: number }> = []

  selectedRecords.value.forEach(record => {
    const copies = normalizeQuantity(quantityById.value[record.id] || 1)
    for (let i = 0; i < copies; i += 1) {
      output.push({ record, copyIndex: i + 1 })
    }
  })

  return output
})

const pages = computed(() => {
  const chunks: Array<typeof expandedRecords.value> = []

  for (let i = 0; i < expandedRecords.value.length; i += perPage.value) {
    chunks.push(expandedRecords.value.slice(i, i + perPage.value))
  }

  return chunks
})

const sheetStyle = computed(() => {
  return {
    width: `${pageWidthMm.value}mm`,
    minHeight: `${pageHeightMm.value}mm`,
    padding: `${marginMm.value}mm`
  }
})

const gridStyle = computed(() => {
  return {
    gridTemplateColumns: `repeat(${perRow.value}, ${cellWidthMm.value}mm)`,
    gridAutoRows: `${itemHeightMm.value}mm`,
    columnGap: `${gapMm.value}mm`,
    rowGap: `${gapMm.value}mm`,
    justifyContent: 'start',
    maxWidth: `${usableWidthMm.value}mm`,
    maxHeight: `${usableHeightMm.value}mm`
  }
})

const sheetItemStyle = computed(() => {
  return {
    width: `${cellWidthMm.value}mm`,
    minHeight: `${itemHeightMm.value}mm`
  }
})

const pageLabel = computed(() => {
  if (selectedPagePreset.value === 'Custom') {
    return `${pageWidthMm.value.toFixed(0)} x ${pageHeightMm.value.toFixed(0)} mm`
  }

  return `${selectedPagePreset.value} ${orientation.value === 'portrait' ? 'Portrait' : 'Landscape'}`
})

const qrPixelSize = computed(() => {
  return Math.max(Math.round(effectiveQrSizeMm.value * 8), 320)
})

const qrSvgStyle = computed(() => {
  return {
    width: `${effectiveQrSizeMm.value}mm`,
    height: `${effectiveQrSizeMm.value}mm`,
    display: 'block'
  }
})

const qrFrameStyle = computed(() => {
  return {
    width: `${effectiveQrSizeMm.value}mm`,
    height: `${effectiveQrSizeMm.value}mm`
  }
})

const qrCodeTextStyle = computed(() => {
  return {
    fontSize: `${codeFontPx.value}px`,
    lineHeight: '1.35',
    whiteSpace: 'nowrap'
  }
})

const toScanUrl = (recordCode: string) => {
  if (import.meta.client) {
    return `${window.location.origin}/scan/${recordCode}`
  }

  return `/scan/${recordCode}`
}

const printSheets = () => {
  window.print()
}
</script>

<style scoped>
.qr-layout-row {
  margin-top: 8px;
}

.qr-controls-col,
.preview-col {
  min-width: 0;
}

.qr-controls-scroll {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-settings-card,
.record-selection-card {
  margin-top: 0 !important;
}

@media screen {
  .qr-controls-col {
    display: block !important;
  }
}

@media (min-width: 960px) {
  .qr-controls-scroll {
    position: sticky;
    top: 12px;
    max-height: calc(100vh - 24px);
    overflow-y: auto;
    padding-right: 6px;
  }
}

.preview-pane {
  position: sticky;
  top: 12px;
  max-height: calc(100vh - 110px);
  overflow: hidden;
}

.qr-record-list-material {
  max-height: 320px;
  overflow: auto;
}

.preview-pane :deep(.v-card-text) {
  overflow-x: auto;
  overflow-y: auto;
  max-height: calc(100vh - 190px);
}

.qr-sheet-stack {
  min-width: 0;
  overflow-x: auto;
}

.qr-sheet {
  box-sizing: border-box;
}

.qr-sheet-header {
  margin-bottom: 4mm;
  padding-bottom: 2mm;
}

.qr-sheet-header h3,
.qr-sheet-header p {
  margin: 0;
}

.qr-sheet-grid {
  align-content: start;
}

.qr-sheet-item {
  box-sizing: border-box;
  padding: 0;
}

@media print {
  @page {
    margin: 0;
  }

  .print-hidden {
    display: none !important;
  }

  .qr-controls-col {
    display: none !important;
  }

  .app-shell {
    box-shadow: none !important;
    border: 0 !important;
    padding: 0 !important;
    margin: 0 !important;
  }

  .qr-layout-row {
    margin: 0 !important;
  }

  .print-preview-area {
    width: 100% !important;
    max-width: none !important;
    flex: 1 1 100% !important;
    padding: 0 !important;
  }

  .preview-pane {
    position: static;
    border: 0 !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    max-height: none !important;
    overflow: visible !important;
  }

  .preview-pane :deep(.v-card-title) {
    display: none !important;
  }

  .preview-pane :deep(.v-card-text) {
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    max-height: none !important;
  }

  .qr-sheet-stack {
    margin-top: 0 !important;
    display: block !important;
    gap: 0 !important;
    overflow: visible !important;
  }

  .qr-sheet {
    margin: 0 !important;
    box-shadow: none;
    border: 0;
    box-sizing: border-box;
    overflow: visible !important;
    width: auto !important;
    min-height: auto !important;
    break-after: always;
    page-break-inside: avoid;
    break-inside: avoid;
    page-break-after: always;
  }

  .qr-sheet:last-child {
    break-after: auto;
    page-break-after: auto;
  }

  .qr-sheet-header {
    margin-bottom: 4mm !important;
    padding-bottom: 2mm !important;
  }
}
</style>
