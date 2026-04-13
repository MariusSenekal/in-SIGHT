<template>
  <div class="container dashboard-layout qr-page-builder">
    <aside class="dashboard-side-nav">
      <div>
        <p class="dashboard-side-label">Admin Area</p>
        <h2>Dashboards</h2>
      </div>

      <nav class="dashboard-nav-links" aria-label="Dashboard navigation">
        <NuxtLink to="/dashboard" class="dashboard-nav-link" active-class="active">
          <span class="material-symbols-outlined" aria-hidden="true">dashboard</span>
          Dashboard
        </NuxtLink>
        <NuxtLink to="/dashboard/management" class="dashboard-nav-link" active-class="active">
          <span class="material-symbols-outlined" aria-hidden="true">manage_accounts</span>
          Management Tools
        </NuxtLink>
        <NuxtLink to="/dashboard/qr-codes" class="dashboard-nav-link" active-class="active">
          <span class="material-symbols-outlined" aria-hidden="true">qr_code_2</span>
          QR Code Section
        </NuxtLink>
      </nav>

      <NuxtLink to="/" class="back-button dashboard-back-link">
        <span class="material-symbols-outlined" aria-hidden="true">arrow_back</span>
        Back to Main Selection
      </NuxtLink>

      <button type="button" class="ghost-btn dashboard-logout-btn" @click="handleLogout">
        <span class="material-symbols-outlined" aria-hidden="true">logout</span>
        Log Out
      </button>
    </aside>

    <section class="simple-panel dashboard-content-panel">
      <h1>QR Code Section</h1>
      <p>Select records, adjust QR size and paper size, then print smart packed sheets.</p>

      <div class="qr-builder-controls">
        <div class="simple-panel qr-control-panel qr-records-panel">
          <h2>
            <span class="material-symbols-outlined" aria-hidden="true">checklist</span>
            Record Selection
          </h2>
          <div class="qr-control-actions">
            <button
              type="button"
              class="ghost-btn"
              title="Select every available record QR code"
              @click="selectAll"
            >
              <span class="material-symbols-outlined" aria-hidden="true">select_all</span>
              Select All
            </button>
            <button
              type="button"
              class="ghost-btn"
              title="Clear all selected record QR codes"
              @click="clearAll"
            >
              <span class="material-symbols-outlined" aria-hidden="true">deselect</span>
              Clear
            </button>
          </div>
          <label class="field qr-search-row">
            <span class="qr-label-row">
              <span class="material-symbols-outlined" aria-hidden="true">search</span>
              Search Records
              <span
                class="material-symbols-outlined help-tip"
                title="Type record name or code to filter the list"
              >info</span>
            </span>
            <input
              v-model="recordSearch"
              type="text"
              placeholder="Search by record name or code"
            />
          </label>
          <div class="qr-record-list">
            <label v-for="record in filteredRecords" :key="record.id" class="qr-record-option">
              <input
                type="checkbox"
                :value="record.id"
                :checked="selectedIds.includes(record.id)"
                @change="toggleRecord(record.id)"
              />
              <span>
                <strong>{{ record.name }}</strong>
                <small>{{ record.code }}</small>
              </span>

              <div
                class="qr-quantity-control"
                title="How many copies of this QR code to print"
              >
                <span class="material-symbols-outlined" aria-hidden="true">content_copy</span>
                <input
                  type="number"
                  min="1"
                  max="500"
                  :value="quantityById[record.id] || 1"
                  @input="updateQuantity(record.id, $event)"
                />
              </div>
            </label>
            <p v-if="filteredRecords.length === 0" class="qr-no-results">
              No records match your search.
            </p>
          </div>
        </div>

        <div class="simple-panel qr-control-panel">
          <h2>
            <span class="material-symbols-outlined" aria-hidden="true">tune</span>
            Page and QR Settings
          </h2>

          <label class="field">
            <span class="qr-label-row">
              <span class="material-symbols-outlined" aria-hidden="true">article</span>
              Page Size
              <span class="material-symbols-outlined help-tip" title="Choose A4, Letter, A3, or define your own page size">info</span>
            </span>
            <select v-model="selectedPagePreset" class="qr-select">
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
              <option value="A3">A3</option>
              <option value="Custom">Custom</option>
            </select>
          </label>

          <label class="field">
            <span class="qr-label-row">
              <span class="material-symbols-outlined" aria-hidden="true">crop_rotate</span>
              Orientation
              <span class="material-symbols-outlined help-tip" title="Rotate page direction for packing more QR codes">info</span>
            </span>
            <select v-model="orientation" class="qr-select">
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </label>

          <div v-if="selectedPagePreset === 'Custom'" class="qr-custom-size-grid">
            <label class="field">
              <span class="qr-label-row">
                <span class="material-symbols-outlined" aria-hidden="true">width</span>
                Width (mm)
              </span>
              <input v-model.number="customWidthMm" type="number" min="100" max="500" />
            </label>
            <label class="field">
              <span class="qr-label-row">
                <span class="material-symbols-outlined" aria-hidden="true">height</span>
                Height (mm)
              </span>
              <input v-model.number="customHeightMm" type="number" min="100" max="700" />
            </label>
          </div>

          <label class="field">
            <span class="qr-label-row">
              <span class="material-symbols-outlined" aria-hidden="true">qr_code_2</span>
              QR Code Size: {{ qrSizeMm }}mm
              <span class="material-symbols-outlined help-tip" title="Drag to make QR codes very small or very large. The system auto-clamps size to avoid overlap.">info</span>
            </span>
            <input v-model.number="qrSizeMm" type="range" min="10" max="260" step="1" />
          </label>

          <label class="field">
            <span class="qr-label-row">
              <span class="material-symbols-outlined" aria-hidden="true">margin</span>
              Page Margin: {{ marginMm }}mm
            </span>
            <input v-model.number="marginMm" type="range" min="5" max="25" step="1" />
          </label>

          <label class="field">
            <span class="qr-label-row">
              <span class="material-symbols-outlined" aria-hidden="true">format_line_spacing</span>
              Gap Between Codes: {{ gapMm }}mm
            </span>
            <input v-model.number="gapMm" type="range" min="2" max="16" step="1" />
          </label>

          <p v-if="isQrSizeClamped" class="form-message">
            Requested QR size is larger than the printable area. Applied max safe size: {{ effectiveQrSizeMm.toFixed(0) }}mm.
          </p>

          <div class="qr-layout-metrics">
            <p><strong>Sheet Size:</strong> {{ pageWidthMm.toFixed(0) }}mm x {{ pageHeightMm.toFixed(0) }}mm</p>
            <p><strong>Effective QR Size:</strong> {{ effectiveQrSizeMm.toFixed(0) }}mm</p>
            <p><strong>Smart Packing:</strong> {{ perRow }} across x {{ perColumn }} down = {{ perPage }} per page</p>
            <p><strong>Total QR Labels:</strong> {{ expandedRecords.length }} ({{ pages.length }} page{{ pages.length === 1 ? '' : 's' }})</p>
            <p><strong>Overlap Protection:</strong> Active (fixed grid cell sizing)</p>
          </div>

          <button
            type="button"
            class="primary-btn"
            :disabled="expandedRecords.length === 0"
            title="Print all generated QR pages using your selected size and layout"
            @click="printSheets"
          >
            <span class="material-symbols-outlined" aria-hidden="true">print</span>
            Print QR Sheets
          </button>
        </div>
      </div>

      <p class="qr-preview-note" v-if="expandedRecords.length > 0">
        Preview below reflects your settings and auto-packs QR codes to fit each page.
      </p>
      <p class="qr-preview-note" v-else>
        Select at least one record to generate printable QR sheets.
      </p>

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
    </section>
  </div>
</template>

<script setup lang="ts">
import QrcodeVue from 'qrcode.vue'

const { currentUser, isAdmin, initAuth, logout } = useAuth()
const { getRecords } = useRecords()
const records = getRecords()

const selectedIds = ref<number[]>(records.map(record => record.id))
const recordSearch = ref('')
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

const filteredRecords = computed(() => {
  const term = recordSearch.value.trim().toLowerCase()

  if (!term) {
    return records
  }

  return records.filter(record => {
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

const updateQuantity = (id: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const parsed = Number.parseInt(input.value || '1', 10)
  const next = normalizeQuantity(Number.isNaN(parsed) ? 1 : parsed)
  quantityById.value = {
    ...quantityById.value,
    [id]: next
  }
}

const toggleRecord = (id: number) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter(selectedId => selectedId !== id)
    return
  }

  selectedIds.value = [...selectedIds.value, id]
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
const usableWidthMm = computed(() => Math.max(pageWidthMm.value - marginMm.value * 2, 20))
const usableHeightMm = computed(() => Math.max(pageHeightMm.value - marginMm.value * 2, 20))
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
    justifyContent: 'start'
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
    lineHeight: '1.35'
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
