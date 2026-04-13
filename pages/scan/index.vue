<template>
  <div class="container simple-panel">
    <h1>Scan QR Code</h1>
    <p>Point your camera at a QR code to continue.</p>

    <div class="scanner-wrap">
      <video ref="videoRef" class="scanner-video" autoplay playsinline muted />
    </div>

    <p class="scan-status">{{ status }}</p>

    <form class="manual-form" @submit.prevent="submitManualCode">
      <label>
        Manual code fallback
        <input
          v-model="manualCode"
          type="text"
          placeholder="Paste QR value (e.g. /scan/REC-1A7C9D or REC-1A7C9D)"
        />
      </label>
      <button type="submit" class="primary-btn">Open Code</button>
    </form>

    <NuxtLink to="/" class="back-button" style="margin-top: 25px;">Back Home</NuxtLink>
  </div>
</template>

<script setup lang="ts">
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
