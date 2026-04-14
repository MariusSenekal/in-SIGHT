<template>
  <div class="container">
    <div v-if="record" class="tracking-container">
      <!-- Header Section -->
      <div class="tracking-header">
        <div class="success-badge">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <h1>Schedule Tracking</h1>
        <div class="record-info-card">
          <h2>{{ record.name }}</h2>
          <p class="location">
            <span class="material-symbols-outlined">location_on</span>
            {{ record.location }}
          </p>
          <span class="code-badge">
            <span class="material-symbols-outlined">qr_code_2</span>
            {{ record.code }}
          </span>
        </div>
      </div>

      <!-- Service History Table -->
      <div class="simple-panel history-panel">
        <div class="panel-header">
          <span class="material-symbols-outlined history-icon">history</span>
          <h2>Service History</h2>
        </div>

        <div class="table-wrapper">
          <table class="history-table">
            <thead>
              <tr>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in serviceHistory"
                :key="entry.id"
                class="clickable-row"
                @click="openHistoryDetail(entry)"
              >
                <td class="time-cell">{{ entry.startTime }}</td>
                <td class="time-cell">{{ entry.endTime }}</td>
                <td class="status-cell">
                  <span class="status-badge" :class="entry.status">
                    {{ getStatusEmoji(entry.status) }} {{ entry.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- History Detail Modal -->
      <transition name="modal">
        <div v-if="selectedHistory" class="modal-overlay" @click="closeHistoryDetail">
          <div class="modal-card" @click.stop>
            <div class="modal-header">
              <h3>Service Details</h3>
              <button type="button" class="close-btn" @click="closeHistoryDetail">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="modal-body">
              <div class="time-info">
                <div class="time-item">
                  <span class="material-symbols-outlined">schedule</span>
                  <div>
                    <strong>Start:</strong> {{ selectedHistory.startTime }}
                  </div>
                </div>
                <div class="time-item">
                  <span class="material-symbols-outlined">schedule</span>
                  <div>
                    <strong>End:</strong> {{ selectedHistory.endTime }}
                  </div>
                </div>
              </div>

              <div class="status-info">
                <strong>Status:</strong>
                <span class="status-badge" :class="selectedHistory.status">
                  {{ getStatusEmoji(selectedHistory.status) }} {{ selectedHistory.status }}
                </span>
              </div>

              <div class="checklist-section">
                <h4>Task Checklist</h4>
                <ul class="task-checklist">
                  <li
                    v-for="task in selectedHistory.checklist"
                    :key="task.id"
                    :class="{ completed: task.completed }"
                  >
                    <label v-if="canUpdateChecklist" class="task-checkbox-label">
                      <input
                        type="checkbox"
                        :checked="task.completed"
                        @change="onTaskCheckboxChange(task.id, $event)"
                      />
                      <span class="checkbox">{{ task.completed ? '✅' : '⬜' }}</span>
                    </label>
                    <span v-else class="checkbox">
                      {{ task.completed ? '✅' : '⬜' }}
                    </span>
                    <span class="task-text">{{ task.task }}</span>
                  </li>
                </ul>
              </div>

              <div class="notes-section">
                <h4>Notes</h4>
                <div class="notes-box">
                  {{ selectedHistory.notes }}
                </div>
              </div>

              <div class="messages-section">
                <h4>Updates and Messages</h4>
                <p v-if="selectedHistory.messages.length === 0" class="empty-message-thread">
                  No updates yet for this service entry.
                </p>
                <ul v-else class="message-thread-list">
                  <li v-for="message in selectedHistory.messages" :key="message.id">
                    <div class="message-line">
                      <strong>{{ message.fromName }}</strong>
                      <span class="message-role">{{ message.fromRole }}</span>
                    </div>
                    <p>{{ message.text }}</p>
                    <small>{{ formatDateTime(message.createdAt) }}</small>
                  </li>
                </ul>

                <div v-if="canUpdateChecklist" class="staff-message-box">
                  <p class="staff-message-help">
                    If tasks are not fully completed, send a short update to the site user so they can view it on this QR page.
                  </p>
                  <textarea
                    v-model="staffMessageDraft"
                    class="request-input"
                    rows="3"
                    maxlength="180"
                    placeholder="Short update for this site"
                  />
                  <div class="request-form-actions">
                    <button type="button" class="primary-btn" @click="submitTaskMessage">
                      Send Update
                    </button>
                  </div>
                  <p v-if="staffMessageFeedback" class="request-feedback">{{ staffMessageFeedback }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Satisfaction Rating Section -->
      <div class="simple-panel rating-panel">
        <div class="panel-header">
          <span class="material-symbols-outlined rating-icon">grade</span>
          <h2>How satisfied are you with the cleanliness?</h2>
        </div>
        
        <div class="emoji-ratings">
          <button
            v-for="emoji in emojis"
            :key="emoji.value"
            type="button"
            class="emoji-button"
            :class="{ selected: selectedRating === emoji.value }"
            @click="selectRating(emoji.value)"
          >
            <span class="emoji">{{ emoji.icon }}</span>
            <span class="emoji-label">{{ emoji.label }}</span>
          </button>
        </div>

        <transition name="fade">
          <div v-if="ratingSubmitted" class="success-message">
            <span class="material-symbols-outlined">check_circle</span>
            Thank you for your feedback!
          </div>
        </transition>
      </div>

      <!-- Action Buttons Section -->
      <div class="simple-panel actions-panel">
        <button
          type="button"
          class="action-button maintenance-button"
          @click="requestMaintenance"
        >
          <span class="material-symbols-outlined">build</span>
          Request Maintenance
        </button>
        
        <button
          type="button"
          class="action-button cleaning-button"
          @click="requestCleaning"
        >
          <span class="material-symbols-outlined">cleaning_services</span>
          Request Cleaning
        </button>
      </div>

      <transition name="request-modal">
        <div
          v-if="requestType"
          class="request-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="request-modal-title"
          @click="cancelRequest"
        >
          <div class="request-modal-card" @click.stop>
            <div class="request-modal-header">
              <h3 id="request-modal-title">
                {{ requestType === 'maintenance' ? 'Maintenance Request' : 'Cleaning Request' }}
              </h3>
              <button type="button" class="close-btn" @click="cancelRequest">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="request-form-wrap">
              <label>
                Request Target
                <select v-model="requestTargetType" class="request-input" required>
                  <option value="qr">Specified QR Code</option>
                  <option value="site-room">Site / Room</option>
                </select>
              </label>

              <label v-if="requestTargetType === 'qr'">
                Select QR Code
                <select v-model="selectedRecordCode" class="request-input" required>
                  <option value="" disabled>Select a QR code</option>
                  <option v-for="item in allRecords" :key="item.id" :value="item.code">
                    {{ item.code }} - {{ item.name }}
                  </option>
                </select>
              </label>

              <label v-else>
                Site / Room Reference
                <input
                  v-model="siteRoomReference"
                  type="text"
                  class="request-input"
                  placeholder="e.g. Ground Floor Kitchen or Room 204"
                  maxlength="80"
                  required
                />
              </label>

              <label>
                Short Request Message
                <textarea
                  v-model="requestMessage"
                  class="request-input"
                  rows="3"
                  maxlength="160"
                  placeholder="Type a short message for the admin team"
                  required
                />
              </label>

              <div class="request-form-actions">
                <button type="button" class="ghost-btn" @click="cancelRequest">Cancel</button>
                <button type="button" class="primary-btn" @click="submitServiceRequest">Send Request</button>
              </div>

              <p v-if="requestFeedback" class="request-feedback">{{ requestFeedback }}</p>
            </div>
          </div>
        </div>
      </transition>

      <!-- Back Link -->
      <div class="back-link-container">
        <button type="button" class="back-button" @click="handleBackToWelcome()">
          <span class="material-symbols-outlined">arrow_back</span>
          Back to Welcome Page
        </button>
      </div>
    </div>

    <!-- Not Found State -->
    <div v-else class="simple-panel not-found-panel">
      <div class="error-badge">
        <span class="material-symbols-outlined">cancel</span>
      </div>
      <h1>Record Not Found</h1>
      <p>This QR code does not match any existing record.</p>
      <button type="button" class="back-button" @click="handleBackToWelcome()">
        <span class="material-symbols-outlined">home</span>
        Go to Home
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ServiceRequestType } from '~/composables/useServiceRequests'
import type { ServiceEntry } from '~/composables/useScheduleTracking'

const route = useRoute()
const { goBack } = useAppNavigation()
const { getRecordByCode, getRecordById, getRecords } = useRecords()
const { currentUser, isAdmin } = useAuth()
const { addRequest } = useServiceRequests()
const { getEntriesByRecordCode, toggleTask, addMessage } = useScheduleTracking()

const recordParam = String(route.params.id || '').trim()
const numericId = Number.parseInt(recordParam, 10)

const record = computed(() => {
  const byCode = getRecordByCode(recordParam)

  if (byCode) {
    return byCode
  }

  if (!Number.isNaN(numericId)) {
    return getRecordById(numericId)
  }

  return undefined
})

const selectedRating = ref<number | null>(null)
const ratingSubmitted = ref(false)
const selectedHistory = ref<ServiceEntry | null>(null)
const allRecords = computed(() => getRecords())
const requestType = ref<ServiceRequestType | null>(null)
const requestTargetType = ref<'qr' | 'site-room'>('qr')
const selectedRecordCode = ref('')
const siteRoomReference = ref('')
const requestMessage = ref('')
const requestFeedback = ref('')
const staffMessageDraft = ref('')
const staffMessageFeedback = ref('')

const canUpdateChecklist = computed(() => Boolean(currentUser.value))

const serviceHistory = computed(() => {
  if (!record.value) {
    return []
  }

  return getEntriesByRecordCode(record.value.code)
})

watch(record, (current) => {
  selectedRecordCode.value = current?.code || ''
  selectedHistory.value = null
  staffMessageDraft.value = ''
  staffMessageFeedback.value = ''
}, { immediate: true })

const closeRequestOnEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !requestType.value) {
    return
  }

  cancelRequest()
}

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  window.addEventListener('keydown', closeRequestOnEscape)
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  window.removeEventListener('keydown', closeRequestOnEscape)
})

const emojis = [
  { value: 1, icon: '😞', label: 'Very Poor' },
  { value: 2, icon: '😕', label: 'Poor' },
  { value: 3, icon: '😐', label: 'Okay' },
  { value: 4, icon: '😊', label: 'Good' },
  { value: 5, icon: '😄', label: 'Excellent' }
]

const getStatusEmoji = (status: string) => {
  const statusEmojis: Record<string, string> = {
    'Done': '✅',
    'Incomplete': '⚠️',
    'Not Done': '❌'
  }
  return statusEmojis[status] || '❓'
}

const openHistoryDetail = (entry: ServiceEntry) => {
  selectedHistory.value = entry
  staffMessageFeedback.value = ''
}

const closeHistoryDetail = () => {
  selectedHistory.value = null
  staffMessageFeedback.value = ''
}

const refreshSelectedHistory = () => {
  if (!selectedHistory.value) {
    return
  }

  const refreshed = serviceHistory.value.find(item => item.id === selectedHistory.value?.id)
  selectedHistory.value = refreshed || null
}

const toggleHistoryTask = (taskId: string, completed: boolean) => {
  if (!selectedHistory.value) {
    return
  }

  toggleTask(selectedHistory.value.id, taskId, completed)
  refreshSelectedHistory()
}

const onTaskCheckboxChange = (taskId: string, event: Event) => {
  const target = event.target as HTMLInputElement | null
  toggleHistoryTask(taskId, Boolean(target?.checked))
}

const formatDateTime = (iso: string) => {
  return new Date(iso).toLocaleString()
}

const submitTaskMessage = () => {
  if (!selectedHistory.value) {
    return
  }

  const message = staffMessageDraft.value.trim()

  if (!message) {
    staffMessageFeedback.value = 'Type a short update first.'
    return
  }

  addMessage(
    selectedHistory.value.id,
    isAdmin.value ? 'admin' : 'staff',
    currentUser.value?.profile?.displayName || currentUser.value?.name || 'Staff',
    message
  )

  staffMessageDraft.value = ''
  staffMessageFeedback.value = 'Update sent. Admin and the site user can now see it.'
  refreshSelectedHistory()
}

const selectRating = (value: number) => {
  selectedRating.value = value
  ratingSubmitted.value = true
  
  // Store rating (you can extend this to save to a backend)
  console.log('Rating selected:', value, 'for record:', record.value?.code)
  
  setTimeout(() => {
    ratingSubmitted.value = false
  }, 3000)
}

const requestMaintenance = () => {
  requestType.value = 'maintenance'
  requestTargetType.value = 'qr'
  requestFeedback.value = ''
}

const requestCleaning = () => {
  requestType.value = 'cleaning'
  requestTargetType.value = 'qr'
  requestFeedback.value = ''
}

const cancelRequest = () => {
  requestType.value = null
  siteRoomReference.value = ''
  requestMessage.value = ''
  requestFeedback.value = ''
}

const submitServiceRequest = () => {
  if (!requestType.value) {
    return
  }

  const message = requestMessage.value.trim()
  if (!message) {
    requestFeedback.value = 'Please enter a short message before sending.'
    return
  }

  if (requestTargetType.value === 'qr' && !selectedRecordCode.value) {
    requestFeedback.value = 'Please select a QR code target.'
    return
  }

  const siteRoom = siteRoomReference.value.trim()
  if (requestTargetType.value === 'site-room' && !siteRoom) {
    requestFeedback.value = 'Please provide a site or room reference.'
    return
  }

  addRequest({
    requestType: requestType.value,
    targetType: requestTargetType.value,
    recordCode: requestTargetType.value === 'qr' ? selectedRecordCode.value : null,
    siteRoom: requestTargetType.value === 'site-room' ? siteRoom : null,
    message,
    requestedBy: currentUser.value?.name || 'Unknown User',
    requestedByUserId: currentUser.value?.id ?? null
  })

  requestFeedback.value = 'Request sent successfully. The admin team can review it in Service Requests.'
  requestMessage.value = ''
  siteRoomReference.value = ''
}

const handleBackToWelcome = () => {
  if (!isAdmin.value) {
    navigateTo('/')
    return
  }

  goBack({ adminFallback: '/dashboard', userFallback: '/' })
}
</script>

<style scoped>
.tracking-container {
  max-width: 820px;
  margin: 0 auto;
}

/* Header Section */
.tracking-header {
  text-align: center;
  margin-bottom: 32px;
}

.success-badge {
  width: 80px;
  height: 80px;
  margin: 0 auto 16px;
  background: linear-gradient(145deg, #10b981, #059669);
  border-radius: 20px;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.success-badge .material-symbols-outlined {
  font-size: 48px;
  color: white;
}

.tracking-header h1 {
  margin-bottom: 24px;
}

.record-info-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 28px;
  box-shadow: var(--shadow);
  max-width: 600px;
  margin: 0 auto;
}

.record-info-card h2 {
  font-size: 1.8rem;
  color: var(--brand);
  margin-bottom: 12px;
}

.record-info-card .location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 1.1rem;
  color: var(--muted);
  margin-bottom: 14px;
}

.record-info-card .location .material-symbols-outlined {
  font-size: 24px;
  color: var(--accent);
}

.code-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #e8efff;
  color: var(--brand-dark);
  padding: 8px 16px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.9rem;
}

.code-badge .material-symbols-outlined {
  font-size: 18px;
}

/* Rating Panel */
.rating-panel {
  margin-bottom: 24px;
}

.panel-header {
  text-align: center;
  margin-bottom: 28px;
}

.rating-icon {
  font-size: 42px !important;
  color: var(--brand);
  margin-bottom: 12px;
  display: block;
}

.panel-header h2 {
  font-size: 1.4rem;
  color: var(--ink);
}

.emoji-ratings {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.emoji-button {
  background: white;
  border: 3px solid #bfd0f0;
  border-radius: 16px;
  padding: 20px 12px;
  min-width: 110px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 12px  rgba(13, 27, 62, 0.08);
}

.emoji-button:hover {
  transform: translateY(-5px) scale(1.05);
  border-color: var(--brand);
  box-shadow: 0 12px 24px rgba(29, 78, 216, 0.2);
}

.emoji-button.selected {
  background: linear-gradient(145deg, var(--brand), var(--accent));
  border-color: var(--brand);
  transform: translateY(-5px) scale(1.08);
  box-shadow: 0 14px 28px rgba(29, 78, 216, 0.3);
}

.emoji {
  font-size: 4rem;
  line-height: 1;
}

.emoji-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--muted);
  text-align: center;
}

.emoji-button.selected .emoji-label {
  color: white;
}

.success-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  background: #d1fae5;
  border: 1px solid #6ee7b7;
  border-radius: 12px;
  color: #065f46;
  font-weight: 600;
  font-size: 1.05rem;
  max-width: 500px;
  margin: 0 auto;
}

.success-message .material-symbols-outlined {
  font-size: 24px;
  color: #10b981;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Actions Panel */
.actions-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.action-button {
  width: 100%;
  padding: 18px 24px;
  border: 0;
  border-radius: 14px;
  font-family: inherit;
  font-size: 1.15rem;
  font-weight: 700;
  cursor: pointer;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  box-shadow: 0 6px 20px rgba(13, 27, 62, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-button .material-symbols-outlined {
  font-size: 28px;
}

.action-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 28px rgba(13, 27, 62, 0.25);
}

.action-button:active {
  transform: translateY(-1px);
}

.maintenance-button {
  background: linear-gradient(145deg, #dc2626, #b91c1c);
}

.maintenance-button:hover {
  background: linear-gradient(145deg, #b91c1c, #991b1b);
}

.cleaning-button {
  background: linear-gradient(145deg, var(--accent), #0284c7);
}

.cleaning-button:hover {
  background: linear-gradient(145deg, #0284c7, #0369a1);
}

.request-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(13, 27, 62, 0.58);
  backdrop-filter: blur(4px);
}

.request-modal-card {
  width: min(100%, 620px);
  border-radius: 18px;
  border: 1px solid var(--border);
  background: #fff;
  box-shadow: 0 24px 60px rgba(13, 27, 62, 0.32);
  overflow: hidden;
}

.request-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 18px 18px 14px;
  background: linear-gradient(145deg, var(--brand), var(--accent));
  color: #fff;
}

.request-modal-header h3 {
  margin: 0;
}

.request-form-wrap {
  padding: 16px;
  background: #f8fbff;
}

.request-form-wrap label {
  display: grid;
  gap: 7px;
  margin-bottom: 10px;
  font-weight: 600;
}

.request-input {
  width: 100%;
  border: 1px solid #bfd0f0;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
}

select.request-input {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 42px;
  background-color: #fff;
  background-image:
    linear-gradient(45deg, transparent 50%, #1e40af 50%),
    linear-gradient(135deg, #1e40af 50%, transparent 50%);
  background-position:
    calc(100% - 20px) calc(50% - 3px),
    calc(100% - 14px) calc(50% - 3px);
  background-size: 7px 7px, 7px 7px;
  background-repeat: no-repeat;
}

.request-form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
}

.request-feedback {
  margin-top: 10px;
  color: #065f46;
  font-weight: 600;
}

textarea.request-input {
  resize: vertical;
}

.request-modal-enter-active,
.request-modal-leave-active {
  transition: opacity 0.22s ease;
}

.request-modal-enter-active .request-modal-card,
.request-modal-leave-active .request-modal-card {
  transition: transform 0.22s ease;
}

.request-modal-enter-from,
.request-modal-leave-to {
  opacity: 0;
}

.request-modal-enter-from .request-modal-card,
.request-modal-leave-to .request-modal-card {
  transform: translateY(10px) scale(0.98);
}
.status-cell {
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.85rem;
}

.status-badge.Done {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.Incomplete {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.Not.Done {
  background: #fee2e2;
  color: #991b1b;
}

.clickable-row {
  cursor: pointer;
}

.clickable-row:hover {
  background-color: #f0f4ff !important;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(13, 27, 62, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-card {
  background: var(--panel);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(13, 27, 62, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 28px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(145deg, var(--brand), var(--accent));
  color: white;
  border-radius: 20px 20px 0 0;
}

.modal-header h3 {
  font-size: 1.5rem;
  margin: 0;
}

.close-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.close-btn .material-symbols-outlined {
  font-size: 24px;
}

.modal-body {
  padding: 28px;
}

.time-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f8fbff;
  padding: 12px 16px;
  border-radius: 12px;
  flex: 1;
  min-width: 200px;
}

.time-item .material-symbols-outlined {
  color: var(--brand);
  font-size: 24px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border);
}

.checklist-section {
  margin-bottom: 24px;
}

.checklist-section h4,
.notes-section h4 {
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-checklist {
  list-style: none;
  padding: 0;
  margin: 0;
}

.task-checklist li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 8px;
  background: #f8fbff;
  transition: all 0.2s ease;
}

.task-checklist li:hover {
  background: #e8efff;
}

.task-checklist li.completed {
  background: #d1fae5;
}

.checkbox {
  font-size: 1.3rem;
  flex-shrink: 0;
}

.task-text {
  flex: 1;
  color: var(--ink);
  font-size: 0.95rem;
}

.task-checklist li.completed .task-text {
  color: var(--muted);
}

.task-checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.task-checkbox-label input {
  width: 16px;
  height: 16px;
}

.notes-section h4::before {
  content: '📝';
  font-size: 1.2rem;
}

.notes-box {
  background: #fff8e1;
  border: 1px solid #ffd54f;
  border-radius: 12px;
  padding: 16px;
  color: var(--ink);
  line-height: 1.6;
  font-size: 0.95rem;
  min-height: 80px;
}

.messages-section {
  margin-top: 20px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.empty-message-thread {
  color: var(--muted);
}

.message-thread-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.message-thread-list li {
  border: 1px solid #d7e3fb;
  border-radius: 10px;
  background: #f8fbff;
  padding: 10px;
}

.message-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.message-role {
  text-transform: uppercase;
  font-size: 0.75rem;
  color: var(--muted);
}

.message-thread-list p {
  margin: 6px 0;
}

.message-thread-list small {
  color: var(--muted);
}

.staff-message-box {
  margin-top: 12px;
  border-top: 1px dashed #c6d6f7;
  padding-top: 12px;
}

.staff-message-help {
  color: var(--muted);
  margin-bottom: 8px;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-card,
.modal-leave-to .modal-card {
  transform: scale(0.9);
}

/* History Panel */
.history-panel {
  margin-bottom: 24px;
}

.history-icon {
  font-size: 38px !important;
  color: var(--brand);
  margin-bottom: 10px;
  display: block;
}

.table-wrapper {
  overflow-x: auto;
  overflow-y: auto;
  max-height: 420px;
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-top: 20px;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.history-table thead {
  position: sticky;
  top: 0;
  background: linear-gradient(145deg, var(--brand), var(--accent));
  color: white;
  z-index: 10;
}

.history-table th {
  padding: 14px 16px;
  text-align: left;
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 0.03em;
  text-transform: uppercase;
}

.history-table th:first-child {
  border-top-left-radius: 12px;
}

.history-table th:last-child {
  border-top-right-radius: 12px;
}

.history-table tbody tr {
  border-bottom: 1px solid #e8efff;
  transition: background-color 0.2s ease;
}

.history-table tbody tr:hover {
  background-color: #f8fbff;
}

.history-table tbody tr:last-child {
  border-bottom: none;
}

.history-table td {
  padding: 14px 16px;
  color: var(--ink);
}

.time-cell {
  white-space: nowrap;
  font-weight: 600;
  color: var(--brand-dark);
  font-size: 0.88rem;
}

.description-cell {
  color: var(--muted);
  line-height: 1.5;
}

/* Back Link */
.back-link-container {
  text-align: center;
  margin-top: 24px;
}

/* Not Found Panel */
.not-found-panel {
  text-align: center;
  max-width: 600px;
  margin: 60px auto;
  padding: 48px 32px;
}

.error-badge {
  width: 100px;
  height: 100px;
  margin: 0 auto 24px;
  background: linear-gradient(145deg, #ef4444, #dc2626);
  border-radius: 20px;
  display: grid;
  place-items: center;
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.error-badge .material-symbols-outlined {
  font-size: 60px;
  color: white;
}

.not-found-panel h1 {
  margin-bottom: 16px;
  color: var(--ink);
}

.not-found-panel p {
  font-size: 1.1rem;
  margin-bottom: 32px;
}

/* Responsive */
@media (max-width: 768px) {
  .tracking-container {
    padding: 0 16px;
  }

  .record-info-card {
    padding: 24px 20px;
  }

  .record-info-card h2 {
    font-size: 1.5rem;
  }

  .emoji-button {
    min-width: 90px;
    padding: 16px 10px;
  }

  .emoji {
    font-size: 3rem;
  }

  .emoji-label {
    font-size: 0.75rem;
  }

  .action-button {
    font-size: 1.05rem;
    padding: 16px 20px;
  }

  .modal-card {
    max-height: 85vh;
  }

  .modal-body {
    padding: 20px;
  }

  .time-info {
    flex-direction: column;
  }

  .time-item {
    min-width: 100%;
  }
}

@media (max-width: 480px) {
  .success-badge {
    width: 64px;
    height: 64px;
  }

  .success-badge .material-symbols-outlined {
    font-size: 36px;
  }

  .emoji-button {
    min-width: 75px;
    padding: 14px 8px;
  }

  .emoji {
    font-size: 2.5rem;
  }

  .emoji-label {
    font-size: 0.7rem;
  }

  .emoji-ratings {
    gap: 8px;
  }

  .modal-overlay {
    padding: 10px;
  }

  .modal-header {
    padding: 18px 20px;
  }

  .modal-header h3 {
    font-size: 1.2rem;
  }
}
</style>
