<template>
  <v-container class="py-6">
    <v-row justify="center">
      <v-col cols="12" md="9" lg="7">
        <v-card rounded="xl" elevation="6" class="pa-4 pa-md-6">
          <h1 class="text-h4 text-md-h3 font-weight-bold mb-1">Scan QR Code</h1>
          <p class="text-medium-emphasis mb-4">Point your camera at a QR code to continue.</p>

          <v-card variant="outlined" rounded="lg" class="mb-4 pa-2">
            <video ref="videoRef" class="scanner-video" autoplay playsinline muted />
          </v-card>

          <v-alert type="info" variant="tonal" border="start" class="mb-4">{{ status }}</v-alert>

          <v-form @submit.prevent="submitManualCode">
            <v-text-field
              v-model="manualCode"
              label="Manual code fallback"
              prepend-inner-icon="mdi-keyboard"
              variant="outlined"
              placeholder="Paste QR value (e.g. /scan/REC-1A7C9D or REC-1A7C9D)"
            />
            <div class="d-flex flex-wrap ga-2">
              <v-btn type="submit" color="primary" prepend-icon="mdi-open-in-new">Open Code</v-btn>
              <v-btn variant="tonal" prepend-icon="mdi-arrow-left" @click="goBack()">Back Home</v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const { goBack } = useAppNavigation()
const videoRef = ref<HTMLVideoElement | null>(null)
const stream = ref<MediaStream | null>(null)
const status = ref('Requesting camera access...')
const manualCode = ref('')

let detector: any = null
let animationFrameId = 0
let scanned = false

const parseToRecordPath = (value: string): string | null => {
  const raw = value.trim()
  const normalized = raw.toUpperCase()

  if (/^[A-Z0-9-]+$/.test(normalized)) {
    return `/scan/${normalized}`
  }

  if (/^\d+$/.test(raw)) {
    return `/scan/${raw}`
  }

  const localMatch = raw.match(/^\/scan\/([A-Za-z0-9-]+)$/)
  if (localMatch) {
    return `/scan/${localMatch[1].toUpperCase()}`
  }

  const urlMatch = raw.match(/\/scan\/([A-Za-z0-9-]+)/)
  if (urlMatch) {
    return `/scan/${urlMatch[1].toUpperCase()}`
  }

  return null
}

const processCode = (value: string) => {
  const destination = parseToRecordPath(value)

  if (!destination) {
    status.value = 'QR detected, but the code format is not recognized.'
    return
  }

  scanned = true
  stopScanner()
  navigateTo(destination)
}

const scanFrame = async () => {
  if (!detector || !videoRef.value || scanned) {
    return
  }

  try {
    const qrCodes = await detector.detect(videoRef.value)
    if (qrCodes.length > 0 && qrCodes[0].rawValue) {
      status.value = 'QR code detected. Opening record...'
      processCode(qrCodes[0].rawValue)
      return
    }
  } catch {
    status.value = 'Scanning is active. Hold your QR code steady in front of the camera.'
  }

  animationFrameId = window.requestAnimationFrame(() => {
    scanFrame()
  })
}

const startScanner = async () => {
  if (!import.meta.client) {
    return
  }

  const BarcodeDetectorCtor = (window as any).BarcodeDetector

  if (!BarcodeDetectorCtor) {
    status.value = 'This browser does not support automatic QR scanning. Use manual code input below.'
    return
  }

  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false
    })

    if (!videoRef.value) {
      return
    }

    videoRef.value.srcObject = stream.value
    await videoRef.value.play()
    detector = new BarcodeDetectorCtor({ formats: ['qr_code'] })
    status.value = 'Scanner ready. Point your camera at a QR code.'
    scanFrame()
  } catch {
    status.value = 'Could not access camera. Please allow camera permissions or use manual input.'
  }
}

const stopScanner = () => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
  }

  if (!stream.value) {
    return
  }

  stream.value.getTracks().forEach(track => track.stop())
  stream.value = null
}

const submitManualCode = () => {
  if (!manualCode.value.trim()) {
    status.value = 'Enter a manual QR value first.'
    return
  }

  processCode(manualCode.value)
}

onMounted(() => {
  startScanner()
})

onBeforeUnmount(() => {
  stopScanner()
})
</script>

<style scoped>
.scanner-video {
  width: 100%;
  min-height: 220px;
  border-radius: 12px;
  background: #111827;
}
</style>
