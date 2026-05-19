<template>
  <v-container class="py-5 py-md-7" fluid>
    <v-row justify="center">
      <v-col cols="12" md="11" lg="10" xl="9">
        
        <!-- Page header -->
        <div class="d-flex align-center justify-space-between mb-5">
          <div class="d-flex align-center">
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="navigateTo('/modules')"
              class="mr-2"
            />
            <div>
              <h1 class="text-h4 font-weight-bold">QR Codes</h1>
              <p class="text-medium-emphasis mb-0">Generate and print QR codes for your records</p>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64" />
        </div>

        <!-- Content -->
        <template v-else>
          <v-card rounded="xl" elevation="2" class="pa-4 pa-md-6">
            <v-row class="qr-layout-row" dense>
              <!-- Left side: Record Selection & Settings -->
              <v-col cols="12" md="5" class="qr-controls-col qr-controls-scroll">
                <!-- Record Selection Card -->
                <v-card variant="outlined" rounded="lg" class="record-selection-card">
                  <v-card-title class="d-flex align-center ga-2">
                    <v-icon icon="mdi-checklist" />Record Selection
                  </v-card-title>
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

                    <v-list v-if="filteredRecords.length > 0" class="qr-record-list-material" lines="two" nav>
                      <v-list-item v-for="record in filteredRecords" :key="record.id" rounded="lg">
                        <template #prepend>
                          <v-checkbox-btn
                            :model-value="selectedIds.includes(record.id)"
                            @update:model-value="setRecordSelection(record.id, Boolean($event))"
                          />
                        </template>

                        <v-list-item-title>{{ record.name }}</v-list-item-title>
                        <v-list-item-subtitle>{{ record.code }}</v-list-item-subtitle>

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

                    <v-alert v-else type="info" variant="tonal" density="compact" class="mt-2">
                      No records found for your company. Records are automatically filtered to show only those belonging to your organization.
                    </v-alert>
                  </v-card-text>
                </v-card>

                <!-- Page Settings Card -->
                <v-card variant="outlined" rounded="lg" class="page-settings-card">
                  <v-card-title class="d-flex align-center ga-2">
                    <v-icon icon="mdi-tune-vertical" />Page and QR Settings
                  </v-card-title>
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

                    <v-btn color="primary" block prepend-icon="mdi-printer" :disabled="expandedRecords.length === 0" @click="printSheets">
                      Print QR Sheets
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>

              <!-- Right side: QR Preview -->
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
                                :value="toScanUrl(recordEntry.record)"
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
        </template>

      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

const { currentUser, isClientAdmin, isClientTechnician, authToken } = useAuth()
const { records, loadRecords } = useRecords()

const loading = ref(true)
const userCompanyId = ref<number | null>(null)

// Filter records to only show those belonging to the user's company
const companyRecords = computed(() => {
  if (!userCompanyId.value) return []
  return records.value.filter(r => r.ownerCompanyId === userCompanyId.value)
})

const selectedIds = ref<number[]>([])
const recordSearch = ref('')
const quantityById = ref<Record<number, number>>({})

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

const pagePresetItems = ['A4', 'Letter', 'A3', 'Custom']
const orientationItems: Array<'portrait' | 'landscape'> = ['portrait', 'landscape']

// Fetch user's company
const fetchUserCompany = async () => {
  if (!authToken.value || !currentUser.value) return null
  
  try {
    const response = await $fetch<any[]>('/api/companies', {
      headers: { Authorization: `Bearer ${authToken.value}` }
    })
    
    // Find the company that the current user is linked to
    const userCompany = response.find((company: any) => 
      company.linkedUserIds && company.linkedUserIds.includes(currentUser.value!.id)
    )
    
    return userCompany?.id || null
  } catch (error) {
    console.error('Failed to fetch user company:', error)
    return null
  }
}

onMounted(async () => {
  if (!currentUser.value || (!isClientAdmin.value && !isClientTechnician.value)) {
    navigateTo('/modules')
    return
  }

  try {
    await loadRecords()
    userCompanyId.value = await fetchUserCompany()
    
    // Auto-select all company records and initialize quantities
    selectedIds.value = companyRecords.value.map(r => r.id)
    quantityById.value = Object.fromEntries(
      companyRecords.value.map(record => [record.id, 1])
    )
  } finally {
    loading.value = false
  }
})

const filteredRecords = computed(() => {
  const term = recordSearch.value.trim().toLowerCase()
  if (!term) return companyRecords.value
  
  return companyRecords.value.filter(record => {
    return record.name.toLowerCase().includes(term) || record.code.toLowerCase().includes(term)
  })
})

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

// Page sizing calculations
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
  return companyRecords.value.filter(record => selectedIds.value.includes(record.id))
})

const expandedRecords = computed(() => {
  const output: Array<{ record: (typeof companyRecords.value)[number]; copyIndex: number }> = []

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

const toScanUrl = (record: { code: string; name: string; location: string }) => {
  const { siteUrl } = useRuntimeConfig().public
  const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
  const origin = import.meta.client ? window.location.origin : siteUrl
  const params = new URLSearchParams({ name: record.name, location: record.location })
  return `${origin}${base}/scan/${record.code}?${params.toString()}`
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

@media (max-width: 959px) {
  .qr-controls-scroll {
    position: static;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }

  .preview-pane {
    position: static;
    max-height: none;
  }

  .preview-pane :deep(.v-card-text) {
    max-height: none;
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
  display: grid;
  align-content: start;
}

.qr-sheet-item {
  box-sizing: border-box;
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.qr-code-frame {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-item-code {
  margin-top: 2mm;
  text-align: center;
  font-weight: 600;
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
