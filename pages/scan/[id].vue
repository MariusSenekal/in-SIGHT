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
        <p class="history-hint">Tap any row to view full details</p>

        <div class="table-wrapper">
          <table class="history-table">
            <thead>
              <tr>
                <th>
                  <span class="material-symbols-outlined table-icon">event</span>
                  <span class="header-text">Date & Time</span>
                </th>
                <th>
                  <span class="material-symbols-outlined table-icon">task_alt</span>
                  <span class="header-text">Task Completed</span>
                </th>
                <th>
                  <span class="material-symbols-outlined table-icon">person</span>
                  <span class="header-text">Completed By</span>
                </th>
                <th>
                  <span class="material-symbols-outlined table-icon">flag</span>
                  <span class="header-text">Status</span>
                </th>
                <th class="location-header">
                  <span class="material-symbols-outlined table-icon">location_on</span>
                  <span class="header-text">Location</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="entry in serviceHistory"
                :key="entry.id"
                class="clickable-row"
                @click="openHistoryDetail(entry)"
              >
                <td class="time-cell">
                  <span class="time-full">{{ entry.startTime }}</span>
                  <span class="time-short">{{ formatTimeShort(entry.startTime) }}</span>
                </td>
                <td class="task-completed-cell">
                  <div class="task-completed-content">
                    <span class="material-symbols-outlined task-icon">{{ getTaskIcon(entry) }}</span>
                    <span class="task-label">{{ getTaskLabel(entry) }}</span>
                  </div>
                </td>
                <td class="user-role-cell">
                  <div class="user-role-content">
                    <span class="role-badge" :class="getRoleClass(entry)">
                      {{ getRoleLabel(entry) }}
                    </span>
                  </div>
                </td>
                <td class="status-cell">
                  <span class="status-badge" :class="entry.status">
                    <span class="status-emoji">{{ getStatusEmoji(entry.status) }}</span>
                    <span class="status-text">{{ entry.status }}</span>
                  </span>
                </td>
                <td class="location-cell">
                  <span v-if="entry.latitude && entry.longitude" class="location-indicator" :title="`Location: ${entry.latitude.toFixed(4)}, ${entry.longitude.toFixed(4)}`">
                    <span class="material-symbols-outlined">pin_drop</span>
                  </span>
                  <span v-else class="no-location">—</span>
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

              <!-- Location Information (if available) -->
              <div v-if="selectedHistory.latitude && selectedHistory.longitude" class="location-info">
                <h4>
                  <span class="material-symbols-outlined">location_on</span>
                  Location
                </h4>
                <div class="location-content">
                  <div class="location-coordinates">
                    <div class="coordinate-item">
                      <strong>Latitude:</strong> {{ selectedHistory.latitude.toFixed(6) }}
                    </div>
                    <div class="coordinate-item">
                      <strong>Longitude:</strong> {{ selectedHistory.longitude.toFixed(6) }}
                    </div>
                  </div>
                  <a
                    :href="`https://www.google.com/maps?q=${selectedHistory.latitude},${selectedHistory.longitude}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="view-map-btn"
                  >
                    <span class="material-symbols-outlined">map</span>
                    View on Map
                  </a>
                </div>
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

              <!-- Completion History Section -->
              <div v-if="selectedHistory.completionHistory && selectedHistory.completionHistory.length > 0" class="completion-history-section">
                <h4>
                  <span class="material-symbols-outlined">history</span>
                  Completion History
                </h4>
                <p class="history-description">Individual button clicks recorded for this service entry:</p>
                <ul class="completion-history-list">
                  <li v-for="record in selectedHistory.completionHistory" :key="record.id" class="completion-history-item">
                    <div class="history-action">
                      <span class="material-symbols-outlined action-icon">{{ getActionIcon(record.actionType) }}</span>
                      <span class="action-label">{{ getActionLabel(record.actionType) }}</span>
                    </div>
                    <div class="history-time">{{ record.completedAt }}</div>
                  </li>
                </ul>
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

      <!-- Satisfaction Rating — shown to all visitors when there are service entries,
           but hidden from cleaner and UV Hero users (they see completion buttons instead) -->
      <div v-if="serviceHistory.length > 0 && !isCleaner && !isUvHero" class="simple-panel satisfaction-panel">
        <div class="panel-header">
          <span class="material-symbols-outlined satisfaction-icon">sentiment_satisfied</span>
          <h2>How was your last service?</h2>
        </div>

        <div class="satisfaction-latest">
          <span class="satisfaction-latest-label">Latest service:</span>
          <span class="satisfaction-latest-date">{{ serviceHistory[0].startTime }}</span>
          <span class="status-badge" :class="serviceHistory[0].status">
            {{ getStatusEmoji(serviceHistory[0].status) }} {{ serviceHistory[0].status }}
          </span>
        </div>

        <div class="emoji-row">
          <button
            type="button"
            class="emoji-btn"
            :class="{ 'emoji-btn--selected': satisfactionChoice === 'happy' }"
            @click="satisfactionChoice = 'happy'"
            aria-label="Happy"
          >
            <span class="emoji-face">😊</span>
            <span class="emoji-label">Happy</span>
          </button>
          <button
            type="button"
            class="emoji-btn"
            :class="{ 'emoji-btn--selected emoji-btn--sad': satisfactionChoice === 'sad' }"
            @click="satisfactionChoice = 'sad'"
            aria-label="Sad"
          >
            <span class="emoji-face">😞</span>
            <span class="emoji-label">Sad</span>
          </button>
        </div>

        <div class="satisfaction-save-row">
          <button
            type="button"
            class="primary-btn"
            :disabled="!satisfactionChoice || satisfactionSent"
            @click="submitSatisfaction"
          >
            {{ satisfactionSent ? 'Feedback sent ✓' : 'Save Feedback' }}
          </button>
        </div>
      </div>

      <!-- Action Buttons Section -->
      <div class="simple-panel actions-panel">
        <!-- UV Hero users: specialized UV workflow buttons -->
        <template v-if="isUvHero">
          <button
            type="button"
            class="action-button uv-check-button"
            :disabled="completionLoading"
            @click="markUvCheckCompleted"
          >
            <span class="material-symbols-outlined">verified</span>
            {{ uvCheckCompletedFeedback || 'Check Completed' }}
          </button>
          <button
            type="button"
            class="action-button job-started-button"
            :disabled="completionLoading"
            @click="markJobStarted"
          >
            <span class="material-symbols-outlined">play_circle</span>
            {{ jobStartedFeedback || 'Job Started' }}
          </button>
          <button
            type="button"
            class="action-button job-completed-button"
            :disabled="completionLoading"
            @click="markJobCompleted"
          >
            <span class="material-symbols-outlined">task_alt</span>
            {{ jobCompletedFeedback || 'Job Completed' }}
          </button>
          <button
            type="button"
            class="action-button upload-photo-button"
            @click="goToUpload"
          >
            <span class="material-symbols-outlined">photo_camera</span>
            Upload Photo
          </button>
          <button
            type="button"
            class="action-button maintenance-button"
            @click="requestMaintenance"
          >
            <span class="material-symbols-outlined">build</span>
            Request Maintenance
          </button>
        </template>

        <!-- Staff / Cleaner users: specialized workflow buttons -->
        <template v-else-if="isStaffOrCleaner">
          <button
            type="button"
            class="action-button check-completed-button"
            :disabled="completionLoading"
            @click="markCheckCompleted"
          >
            <span class="material-symbols-outlined">fact_check</span>
            {{ checkCompletedFeedback || 'Check Completed' }}
          </button>
          <button
            type="button"
            class="action-button cleaning-done-button"
            :disabled="completionLoading"
            @click="markCleaningCompleted"
          >
            <span class="material-symbols-outlined">cleaning_services</span>
            {{ cleaningCompletedFeedback || 'Cleaning Completed' }}
          </button>
          <button
            type="button"
            class="action-button maintenance-button"
            @click="requestMaintenance"
          >
            <span class="material-symbols-outlined">build</span>
            Request Maintenance
          </button>
        </template>

        <!-- Regular users: request buttons -->
        <template v-else>
          <button
            type="button"
            class="action-button cleaning-button"
            @click="requestCleaning"
          >
            <span class="material-symbols-outlined">cleaning_services</span>
            Request Cleaning
          </button>
          <button
            type="button"
            class="action-button maintenance-button"
            @click="requestMaintenance"
          >
            <span class="material-symbols-outlined">build</span>
            Request Maintenance
          </button>
        </template>
      </div>

      <!-- Completion Confirmation Modal -->
      <transition name="request-modal">
        <div
          v-if="showCompletionConfirmModal"
          class="request-modal-overlay"
          role="dialog"
          aria-modal="true"
          @click="cancelCompletionUpdate"
        >
          <div class="request-modal-card" @click.stop>
            <div class="request-modal-header">
              <h3>Update Completion Time?</h3>
              <button type="button" class="close-btn" @click="cancelCompletionUpdate">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="request-form-wrap">
              <p class="mb-3">
                This {{ pendingCompletionAction === 'check' ? 'check' : 'cleaning' }} was already marked as completed 
                at <strong>{{ pendingCompletionExistingTime }}</strong>.
              </p>
              <p class="mb-4">
                Would you like to update the completion time to now?
              </p>
              <div class="request-form-actions">
                <button type="button" class="ghost-btn" @click="cancelCompletionUpdate">Cancel</button>
                <button type="button" class="primary-btn" @click="confirmCompletionUpdate">Update Time</button>
              </div>
            </div>
          </div>
        </div>
      </transition>

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
              <!-- Anonymous users: simplified form — target auto-set to this QR code -->
              <template v-if="!currentUser">
                <div class="anon-request-info">
                  <span class="material-symbols-outlined">qr_code_2</span>
                  <span>Request for: <strong>{{ record?.name }}</strong></span>
                </div>
                <label>
                  Short Message
                  <textarea
                    v-model="requestMessage"
                    class="request-input"
                    rows="3"
                    maxlength="160"
                    placeholder="Briefly describe what you need..."
                    required
                  />
                </label>
              </template>

              <!-- Logged-in users: full form with target selection -->
              <template v-else>
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
              </template>

              <div class="request-form-actions">
                <button type="button" class="ghost-btn" @click="cancelRequest">Cancel</button>
                <button type="button" class="primary-btn" @click="submitServiceRequest">Send Request</button>
              </div>

              <p v-if="requestFeedback" class="request-feedback">{{ requestFeedback }}</p>
            </div>
          </div>
        </div>
      </transition>

      <!-- Back Link — only shown to authenticated users, anonymous users stay on this page -->
      <div v-if="currentUser" class="back-link-container">
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
const { currentUser, isAdmin, isCleaner, isUvHero, isStaffOrCleaner, authToken } = useAuth()
const { loadRecords, getRecords } = useRecords()
const { addRequest } = useServiceRequests()
const { toggleTask, addMessage, markCompletion, unmarkCompletion } = useScheduleTracking()

const recordCode = computed(() => String(route.params.id || '').trim().toUpperCase())

const record = ref<{ id: number; code: string; name: string; location: string; description: string; type: string; ownerUserId: number | null; ownerCompanyId: number | null; createdAt: string } | null>(null)
const serviceHistory = ref<ServiceEntry[]>([])
const pageLoading = ref(true)

const authHeaders = computed((): Record<string, string> =>
  authToken.value ? { Authorization: `Bearer ${authToken.value}` } : {}
)

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
const satisfactionChoice = ref<'happy' | 'sad' | null>(null)
const satisfactionSent = ref(false)

const canUpdateChecklist = computed(() => Boolean(currentUser.value) && !isCleaner.value && !isUvHero.value)

// ── Geolocation helper ────────────────────────────────────────────────────
const getCurrentLocation = (): Promise<{ latitude: number; longitude: number } | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported')
      resolve(null)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('Location acquired:', {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
      },
      (error) => {
        console.warn('Geolocation error:', error.message, error.code)
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    )
  })
}


// ── Completion toggle (remove a completion from the history table) ────────
const completionToggleLoading = ref(false)
const toggleCompletion = async (
  entry: ServiceEntry,
  action: 'check' | 'cleaning' | 'uv-check' | 'job-started' | 'job-completed'
) => {
  if (completionToggleLoading.value) return
  completionToggleLoading.value = true
  try {
    await unmarkCompletion(entry.id, action)
    const data = await $fetch<{ record: typeof record.value; entries: ServiceEntry[] }>(
      `/api/scan/${encodeURIComponent(recordCode.value)}`
    )
    serviceHistory.value = data.entries ?? []
  } catch (error: any) {
    console.error('Uncomplete error:', error)
  } finally {
    completionToggleLoading.value = false
  }
}

// ── Completion buttons (staff + cleaner) ──────────────────────────────────
const completionLoading = ref(false)
const checkCompletedFeedback = ref('')
const cleaningCompletedFeedback = ref('')
const showCompletionConfirmModal = ref(false)
const pendingCompletionAction = ref<'check' | 'cleaning' | null>(null)
const pendingCompletionExistingTime = ref('')

// ── UV Hero completion buttons ────────────────────────────────────────────
const uvCheckCompletedFeedback = ref('')
const jobStartedFeedback = ref('')
const jobCompletedFeedback = ref('')

const cancelCompletionUpdate = () => {
  showCompletionConfirmModal.value = false
  pendingCompletionAction.value = null
  pendingCompletionExistingTime.value = ''
}

const confirmCompletionUpdate = async () => {
  showCompletionConfirmModal.value = false
  const action = pendingCompletionAction.value
  pendingCompletionAction.value = null
  pendingCompletionExistingTime.value = ''
  
  if (action === 'check') {
    await performCheckCompletion(true)
  } else if (action === 'cleaning') {
    await performCleaningCompletion(true)
  }
}

const markCheckCompleted = async () => {
  if (!record.value || completionLoading.value) return
  
  // Check authentication
  if (!currentUser.value) {
    checkCompletedFeedback.value = 'Please log in first'
    setTimeout(() => { checkCompletedFeedback.value = '' }, 3000)
    return
  }
  
  // Check if user has the right role
  if (!isStaffOrCleaner.value) {
    checkCompletedFeedback.value = 'Requires staff/cleaner role'
    setTimeout(() => { checkCompletedFeedback.value = '' }, 3000)
    return
  }

  // Check if already completed
  const latestEntry = serviceHistory.value[0]
  if (latestEntry && latestEntry.checkCompletedAt) {
    pendingCompletionAction.value = 'check'
    pendingCompletionExistingTime.value = latestEntry.checkCompletedAt
    showCompletionConfirmModal.value = true
    return
  }

  await performCheckCompletion(false)
}

const performCheckCompletion = async (isUpdate: boolean) => {
  if (!record.value || completionLoading.value) return
  
  completionLoading.value = true
  checkCompletedFeedback.value = ''
  
  try {
    console.log('Marking check completed for:', record.value.code, '(Update:', isUpdate, ')')
    console.log('Auth token present:', !!authToken.value)
    console.log('User role:', currentUser.value?.role)
    const result: { entryId: number; timestamp: string; endTimeSet?: boolean } = await markCompletion(record.value.code, 'check')
    checkCompletedFeedback.value = `✅ ${result.timestamp}`
    
    // Always refresh full data to ensure status and end_time are current
    try {
      const data = await $fetch<{ record: typeof record.value; entries: ServiceEntry[] }>(
        `/api/scan/${encodeURIComponent(recordCode.value)}`
      )
      serviceHistory.value = data.entries ?? []
      console.log('Data refreshed. Latest entry status:', data.entries?.[0]?.status)
    } catch (error) {
      console.error('Failed to refresh data:', error)
      // Fallback: manually update the completion timestamp
      const existingIndex = serviceHistory.value.findIndex((e: ServiceEntry) => e.id === result.entryId)
      if (existingIndex >= 0) {
        serviceHistory.value = serviceHistory.value.map((e: ServiceEntry) =>
          e.id === result.entryId ? { ...e, checkCompletedAt: result.timestamp } : e
        )
      }
    }
  } catch (error: any) {
    console.error('Check completion error:', error)
    const errorMsg = error?.data?.message || error?.message || 'Failed to mark check completed'
    checkCompletedFeedback.value = errorMsg
    setTimeout(() => { checkCompletedFeedback.value = '' }, 5000)
  } finally {
    completionLoading.value = false
  }
}

const markCleaningCompleted = async () => {
  if (!record.value || completionLoading.value) return
  
  // Check authentication
  if (!currentUser.value) {
    cleaningCompletedFeedback.value = 'Please log in first'
    setTimeout(() => { cleaningCompletedFeedback.value = '' }, 3000)
    return
  }
  
  // Check if user has the right role
  if (!isStaffOrCleaner.value) {
    cleaningCompletedFeedback.value = 'Requires staff/cleaner role'
    setTimeout(() => { cleaningCompletedFeedback.value = '' }, 3000)
    return
  }

  // Check if already completed
  const latestEntry = serviceHistory.value[0]
  if (latestEntry && latestEntry.cleaningCompletedAt) {
    pendingCompletionAction.value = 'cleaning'
    pendingCompletionExistingTime.value = latestEntry.cleaningCompletedAt
    showCompletionConfirmModal.value = true
    return
  }

  await performCleaningCompletion(false)
}

const performCleaningCompletion = async (isUpdate: boolean) => {
  if (!record.value || completionLoading.value) return
  
  completionLoading.value = true
  cleaningCompletedFeedback.value = ''
  
  try {
    console.log('Marking cleaning completed for:', record.value.code, '(Update:', isUpdate, ')')
    console.log('Auth token present:', !!authToken.value)
    console.log('User role:', currentUser.value?.role)
    const result: { entryId: number; timestamp: string; endTimeSet?: boolean } = await markCompletion(record.value.code, 'cleaning')
    cleaningCompletedFeedback.value = `✅ ${result.timestamp}`
    
    // Always refresh full data to ensure status and end_time are current
    try {
      const data = await $fetch<{ record: typeof record.value; entries: ServiceEntry[] }>(
        `/api/scan/${encodeURIComponent(recordCode.value)}`
      )
      serviceHistory.value = data.entries ?? []
      console.log('Data refreshed. Latest entry status:', data.entries?.[0]?.status)
    } catch (error) {
      console.error('Failed to refresh data:', error)
      // Fallback: manually update the completion timestamp
      const existingIndex = serviceHistory.value.findIndex((e: ServiceEntry) => e.id === result.entryId)
      if (existingIndex >= 0) {
        serviceHistory.value = serviceHistory.value.map((e: ServiceEntry) =>
          e.id === result.entryId ? { ...e, cleaningCompletedAt: result.timestamp } : e
        )
      }
    }
  } catch (error: any) {
    console.error('Cleaning completion error:', error)
    const errorMsg = error?.data?.message || error?.message || 'Failed to mark cleaning completed'
    cleaningCompletedFeedback.value = errorMsg
    setTimeout(() => { cleaningCompletedFeedback.value = '' }, 5000)
  } finally {
    completionLoading.value = false
  }
}

// ── UV Hero completion handlers ───────────────────────────────────────────

const markUvCheckCompleted = async () => {
  if (!record.value || completionLoading.value) return
  if (!currentUser.value || !isUvHero.value) {
    uvCheckCompletedFeedback.value = 'Requires UV Hero role'
    setTimeout(() => { uvCheckCompletedFeedback.value = '' }, 3000)
    return
  }
  
  completionLoading.value = true
  uvCheckCompletedFeedback.value = ''
  
  try {
    uvCheckCompletedFeedback.value = '📍 Getting accurate location...'
    const location = await getCurrentLocation()
    if (location) {
      console.log('UV Check - Location captured:', location)
    } else {
      console.warn('UV Check - Location unavailable, proceeding without coordinates')
    }
    const result = await markCompletion(
      record.value.code,
      'uv-check',
      location?.latitude,
      location?.longitude
    )
    uvCheckCompletedFeedback.value = `✅ ${result.timestamp}`
    
    const data = await $fetch<{ record: typeof record.value; entries: ServiceEntry[] }>(
      `/api/scan/${encodeURIComponent(recordCode.value)}`
    )
    serviceHistory.value = data.entries ?? []
  } catch (error: any) {
    uvCheckCompletedFeedback.value = error?.data?.message || 'Failed to mark UV check completed'
    setTimeout(() => { uvCheckCompletedFeedback.value = '' }, 5000)
  } finally {
    completionLoading.value = false
  }
}

const markJobStarted = async () => {
  if (!record.value || completionLoading.value) return
  if (!currentUser.value || !isUvHero.value) {
    jobStartedFeedback.value = 'Requires UV Hero role'
    setTimeout(() => { jobStartedFeedback.value = '' }, 3000)
    return
  }
  
  completionLoading.value = true
  jobStartedFeedback.value = ''
  
  try {
    jobStartedFeedback.value = '📍 Getting accurate location...'
    const location = await getCurrentLocation()
    if (location) {
      console.log('Job Started - Location captured:', location)
    } else {
      console.warn('Job Started - Location unavailable, proceeding without coordinates')
    }
    const result = await markCompletion(
      record.value.code,
      'job-started',
      location?.latitude,
      location?.longitude
    )
    jobStartedFeedback.value = `✅ ${result.timestamp}`
    
    const data = await $fetch<{ record: typeof record.value; entries: ServiceEntry[] }>(
      `/api/scan/${encodeURIComponent(recordCode.value)}`
    )
    serviceHistory.value = data.entries ?? []
  } catch (error: any) {
    jobStartedFeedback.value = error?.data?.message || 'Failed to mark job started'
    setTimeout(() => { jobStartedFeedback.value = '' }, 5000)
  } finally {
    completionLoading.value = false
  }
}

const markJobCompleted = async () => {
  if (!record.value || completionLoading.value) return
  if (!currentUser.value || !isUvHero.value) {
    jobCompletedFeedback.value = 'Requires UV Hero role'
    setTimeout(() => { jobCompletedFeedback.value = '' }, 3000)
    return
  }
  
  completionLoading.value = true
  jobCompletedFeedback.value = ''
  
  try {
    jobCompletedFeedback.value = '📍 Getting accurate location...'
    const location = await getCurrentLocation()
    if (location) {
      console.log('Job Completed - Location captured:', location)
    } else {
      console.warn('Job Completed - Location unavailable, proceeding without coordinates')
    }
    const result = await markCompletion(
      record.value.code,
      'job-completed',
      location?.latitude,
      location?.longitude
    )
    jobCompletedFeedback.value = `✅ ${result.timestamp}`
    
    const data = await $fetch<{ record: typeof record.value; entries: ServiceEntry[] }>(
      `/api/scan/${encodeURIComponent(recordCode.value)}`
    )
    serviceHistory.value = data.entries ?? []
  } catch (error: any) {
    jobCompletedFeedback.value = error?.data?.message || 'Failed to mark job completed'
    setTimeout(() => { jobCompletedFeedback.value = '' }, 5000)
  } finally {
    completionLoading.value = false
  }
}

const closeRequestOnEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape') return
  if (showCompletionConfirmModal.value) {
    cancelCompletionUpdate()
    return
  }
  if (requestType.value) {
    cancelRequest()
  }
}

onMounted(async () => {
  if (!import.meta.client) return
  window.addEventListener('keydown', closeRequestOnEscape)

  // Fetch record + service history from the public scan API
  try {
    const data = await $fetch<any>(
      `/api/scan/${encodeURIComponent(recordCode.value)}`
    )
    
    // Check if this is a vehicle or equipment code - redirect to tracking page
    if (data.type === 'vehicle') {
      await navigateTo(`/modules/vehicles/${data.id}`)
      return
    }
    if (data.type === 'equipment') {
      await navigateTo(`/modules/equipment/${data.id}`)
      return
    }
    
    // Default: treat as a record
    record.value = data.record
    serviceHistory.value = data.entries ?? []
  } catch {
    record.value = null
    serviceHistory.value = []
  } finally {
    pageLoading.value = false
  }

  selectedRecordCode.value = record.value?.code || ''

  // Load all records for authenticated users (needed for the request form dropdown)
  if (currentUser.value) {
    await loadRecords()
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  window.removeEventListener('keydown', closeRequestOnEscape)
})

const getStatusEmoji = (status: string) => {
  const map: Record<string, string> = { 'Done': '✅', 'Incomplete': '⚠️', 'Not Done': '❌' }
  return map[status] || '❓'
}

const openHistoryDetail = (entry: ServiceEntry) => {
  selectedHistory.value = { ...entry }
  staffMessageFeedback.value = ''
}

const closeHistoryDetail = () => {
  selectedHistory.value = null
  staffMessageFeedback.value = ''
}

const syncSelectedFromHistory = () => {
  if (!selectedHistory.value) return
  const refreshed = serviceHistory.value.find(e => e.id === selectedHistory.value?.id)
  selectedHistory.value = refreshed ? { ...refreshed } : null
}

const onTaskCheckboxChange = async (taskId: number, event: Event) => {
  const completed = Boolean((event.target as HTMLInputElement)?.checked)
  if (!selectedHistory.value) return
  const entryId = selectedHistory.value.id
  await toggleTask(entryId, taskId, completed)
  // Sync the modal's copy from the updated local state
  const updated = serviceHistory.value.find(e => e.id === entryId)
  if (updated) serviceHistory.value = serviceHistory.value.map(e => e.id === entryId ? { ...updated } : e)
  syncSelectedFromHistory()
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })

const formatTimeShort = (timeStr: string) => {
  if (!timeStr || timeStr === '—') return '—'
  try {
    // timeStr is already formatted like "25 Dec 2024, 14:30"
    // For mobile, show just "25/12 14:30"
    const match = timeStr.match(/(\d+)\s+(\w+).*?(\d{2}:\d{2})/)
    if (match) {
      const day = match[1]
      const month = match[2]
      const time = match[3]
      const monthMap: Record<string, string> = {
        Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
        Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
      }
      const monthNum = monthMap[month] || '01'
      return `${day}/${monthNum} ${time}`
    }
    return timeStr
  } catch {
    return timeStr
  }
}

const getActionIcon = (actionType: string) => {
  const iconMap: Record<string, string> = {
    'check': 'fact_check',
    'cleaning': 'cleaning_services',
    'uv-check': 'light_mode',
    'job-started': 'play_circle',
    'job-completed': 'check_circle'
  }
  return iconMap[actionType] || 'radio_button_checked'
}

const getActionLabel = (actionType: string) => {
  const labelMap: Record<string, string> = {
    'check': 'Check Completed',
    'cleaning': 'Cleaning Completed',
    'uv-check': 'UV Check Completed',
    'job-started': 'Job Started',
    'job-completed': 'Job Completed'
  }
  return labelMap[actionType] || actionType
}

const getTaskIcon = (entry: ServiceEntry) => {
  if (entry.checkCompletedAt) return 'fact_check'
  if (entry.cleaningCompletedAt) return 'cleaning_services'
  if (entry.uvCheckCompletedAt) return 'light_mode'
  if (entry.jobStartedAt) return 'play_circle'
  if (entry.jobCompletedAt) return 'check_circle'
  return 'task_alt'
}

const getTaskLabel = (entry: ServiceEntry) => {
  if (entry.checkCompletedAt) return 'Check Completed'
  if (entry.cleaningCompletedAt) return 'Cleaning Completed'
  if (entry.uvCheckCompletedAt) return 'UV Check Completed'
  if (entry.jobStartedAt) return 'Job Started'
  if (entry.jobCompletedAt) return 'Job Completed'
  return entry.notes || 'Service Completed'
}

const getRoleLabel = (entry: ServiceEntry) => {
  if (!entry.createdByRole) return 'Unknown'
  const roleMap: Record<string, string> = {
    'cleaner': 'Cleaner',
    'uv-hero': 'UV Hero',
    'staff': 'Staff',
    'admin': 'Admin'
  }
  return roleMap[entry.createdByRole] || entry.createdByRole
}

const getRoleClass = (entry: ServiceEntry) => {
  if (!entry.createdByRole) return 'role-unknown'
  return `role-${entry.createdByRole}`
}

const submitTaskMessage = async () => {
  if (!selectedHistory.value) return
  const text = staffMessageDraft.value.trim()
  if (!text) { staffMessageFeedback.value = 'Type a short update first.'; return }

  await addMessage(
    selectedHistory.value.id,
    isAdmin.value ? 'admin' : 'staff',
    currentUser.value?.profile?.displayName || currentUser.value?.name || 'Staff',
    text
  )
  staffMessageDraft.value = ''
  staffMessageFeedback.value = 'Update sent. Admin and the site user can now see it.'
  syncSelectedFromHistory()
}

const requestCleaning = () => {
  requestType.value = 'cleaning'
  requestTargetType.value = 'qr'
  selectedRecordCode.value = record.value?.code || ''
  requestFeedback.value = ''
}

const requestMaintenance = () => {
  requestType.value = 'maintenance'
  requestTargetType.value = 'qr'
  selectedRecordCode.value = record.value?.code || ''
  requestFeedback.value = ''
}

const goToUpload = () => {
  navigateTo('/upload')
}

const submitSatisfaction = async () => {
  if (!satisfactionChoice.value || !record.value) return
  const latest = serviceHistory.value[0]
  const emojiLabel = satisfactionChoice.value === 'happy' ? '😊 Happy' : '😞 Sad'
  const requester = currentUser.value
    ? (currentUser.value.profile?.displayName || currentUser.value.name)
    : 'Anonymous (QR scan)'

  await addRequest({
    requestType: 'satisfaction',
    targetType: 'qr',
    recordCode: record.value.code,
    siteRoom: null,
    message: `${emojiLabel} — Satisfaction feedback for the latest service at ${record.value.name} (${record.value.location}). Service date: ${latest?.startTime ?? 'unknown'}.`,
    requestedBy: requester,
    requestedByUserId: currentUser.value?.id ?? null,
    satisfactionEmoji: satisfactionChoice.value,
    satisfactionEntryId: latest?.id ?? null,
    isAnon: !currentUser.value
  })
  satisfactionSent.value = true
}

const cancelRequest = () => {
  requestType.value = null
  siteRoomReference.value = ''
  requestMessage.value = ''
  requestFeedback.value = ''
}

const submitServiceRequest = async () => {
  if (!requestType.value) return
  const message = requestMessage.value.trim()
  if (!message) { requestFeedback.value = 'Please enter a short message before sending.'; return }
  if (requestTargetType.value === 'qr' && !selectedRecordCode.value) {
    requestFeedback.value = 'Please select a QR code target.'
    return
  }
  const siteRoom = siteRoomReference.value.trim()
  if (requestTargetType.value === 'site-room' && !siteRoom) {
    requestFeedback.value = 'Please provide a site or room reference.'
    return
  }

  await addRequest({
    requestType: requestType.value,
    targetType: requestTargetType.value,
    recordCode: requestTargetType.value === 'qr' ? selectedRecordCode.value : null,
    siteRoom: requestTargetType.value === 'site-room' ? siteRoom : null,
    message,
    requestedBy: currentUser.value
      ? (currentUser.value.profile?.displayName || currentUser.value.name)
      : 'Anonymous (QR scan)',
    requestedByUserId: currentUser.value?.id ?? null,
    isAnon: !currentUser.value
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

/* UV Hero buttons */
.uv-check-button,
.job-started-button,
.job-completed-button {
  background: linear-gradient(145deg, #10b981, #059669);
}

.uv-check-button:hover,
.job-started-button:hover,
.job-completed-button:hover {
  background: linear-gradient(145deg, #059669, #047857);
}

.upload-photo-button {
  background: linear-gradient(145deg, #06b6d4, #0891b2);
}

.upload-photo-button:hover {
  background: linear-gradient(145deg, #0891b2, #0e7490);
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
  transition: background-color 0.2s ease, transform 0.15s ease;
}

.clickable-row:hover {
  background-color: #f0f4ff !important;
}

.clickable-row:active {
  transform: scale(0.99);
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

/* Location Information */
.location-info {
  margin-bottom: 24px;
  padding: 20px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 12px;
}

.location-info h4 {
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.location-info h4 .material-symbols-outlined {
  color: #16a34a;
  font-size: 24px;
}

.location-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.location-coordinates {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.coordinate-item {
  background: white;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  border: 1px solid #d9f99d;
}

.coordinate-item strong {
  color: #16a34a;
  margin-right: 8px;
}

.view-map-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: linear-gradient(145deg, #16a34a, #15803d);
  color: white;
  text-decoration: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.view-map-btn:hover {
  background: linear-gradient(145deg, #15803d, #166534);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.view-map-btn .material-symbols-outlined {
  font-size: 20px;
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

/* Completion History Section */
.completion-history-section {
  margin-bottom: 24px;
  padding: 20px;
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
}

.completion-history-section h4 {
  font-size: 1.1rem;
  color: var(--ink);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.completion-history-section h4 .material-symbols-outlined {
  color: var(--brand);
  font-size: 24px;
}

.history-description {
  color: var(--muted);
  font-size: 0.85rem;
  margin-bottom: 16px;
  font-style: italic;
}

.completion-history-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 8px;
}

.completion-history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: white;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.completion-history-item:hover {
  background: #f0f9ff;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.history-action {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.action-icon {
  color: var(--brand);
  font-size: 24px;
}

.action-label {
  font-weight: 600;
  color: var(--ink);
  font-size: 0.95rem;
}

.history-time {
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
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

.panel-header {
  text-align: center;
  margin-bottom: 28px;
}

.panel-header h2 {
  font-size: 1.4rem;
  color: var(--ink);
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

.table-icon {
  font-size: 20px;
  vertical-align: middle;
  margin-right: 6px;
}

.header-text {
  vertical-align: middle;
}

.history-hint {
  text-align: center;
  color: var(--muted);
  font-size: 0.85rem;
  margin-bottom: 16px;
  font-style: italic;
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
  font-weight: 600;
  color: var(--brand-dark);
  font-size: 0.88rem;
}

.time-full {
  display: inline;
}

.time-short {
  display: none;
}

.status-emoji {
  display: inline;
}

.status-text {
  display: inline;
}

.completion-icon {
  display: inline;
  margin-right: 4px;
}

.completion-time {
  display: inline;
}

.description-cell {
  color: var(--muted);
  line-height: 1.5;
}

.task-completed-cell {
  font-weight: 600;
  color: var(--ink);
}

.task-completed-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.task-icon {
  color: var(--brand);
  font-size: 24px;
}

.task-label {
  font-size: 0.95rem;
}

.user-role-cell {
  text-align: center;
}

.user-role-content {
  display: flex;
  justify-content: center;
  align-items: center;
}

.role-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.role-cleaner {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.role-uv-hero {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.role-staff {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
}

.role-admin {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
}

.role-unknown {
  background: #e5e7eb;
  color: #6b7280;
}

/* Location Column */
.location-header {
  text-align: center;
  min-width: 70px;
}

.location-cell {
  text-align: center;
  padding: 10px 8px;
}

.location-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #16a34a;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.location-indicator .material-symbols-outlined {
  font-size: 22px;
}

.location-indicator:hover {
  color: #15803d;
  transform: scale(1.1);
}

.no-location {
  color: var(--muted);
  font-size: 1.2rem;
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

  .table-wrapper {
    max-height: none;
    font-size: 0.8rem;
  }

  .history-table {
    font-size: 0.85rem;
  }

  .history-table th,
  .history-table td {
    padding: 8px 4px;
  }

  /* Show icons only, hide text on mobile */
  .header-text {
    display: none;
  }

  .table-icon {
    margin-right: 0;
    font-size: 18px;
  }

  .history-table th {
    text-align: center;
    padding: 10px 4px;
  }

  .history-table td {
    text-align: center;
    padding: 8px 4px;
  }

  /* Show short time format on mobile */
  .time-full {
    display: none;
  }

  .time-short {
    display: inline;
    font-size: 0.75rem;
    line-height: 1.3;
  }

  .time-cell {
    font-size: 0.75rem;
    min-width: 55px;
  }

  /* Status: emoji only on mobile */
  .status-text {
    display: none;
  }

  .status-badge {
    padding: 4px 6px;
    font-size: 1.1rem;
  }

  .status-emoji {
    font-size: 1.1rem;
  }

  /* Task completed cell: compact layout */
  .task-completed-cell {
    min-width: 70px;
  }

  .task-completed-content {
    flex-direction: column;
    gap: 2px;
    align-items: center;
  }

  .task-icon {
    font-size: 18px;
  }

  .task-label {
    font-size: 0.65rem;
    line-height: 1.2;
    text-align: center;
    word-break: break-word;
    max-width: 65px;
  }

  /* Role badge: compact on mobile */
  .user-role-cell {
    min-width: 60px;
  }

  .role-badge {
    padding: 4px 6px;
    font-size: 0.65rem;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  /* Location column: compact on mobile */
  .location-cell {
    padding: 8px 4px;
    min-width: 50px;
  }

  .location-indicator .material-symbols-outlined {
    font-size: 18px;
  }

  .no-location {
    font-size: 1rem;
  }

  .history-hint {
    font-size: 0.8rem;
  }

  .request-form-actions {
    flex-direction: column-reverse;
  }

  .request-form-actions .primary-btn,
  .request-form-actions .ghost-btn {
    width: 100%;
  }

  .record-info-card {
    padding: 24px 20px;
  }

  .record-info-card h2 {
    font-size: 1.5rem;
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
  .tracking-container {
    padding: 0 10px;
  }

  .success-badge {
    width: 64px;
    height: 64px;
  }

  .success-badge .material-symbols-outlined {
    font-size: 36px;
  }

  .modal-overlay {
    padding: 8px;
  }

  .modal-header {
    padding: 14px 14px;
  }

  .modal-header h3 {
    font-size: 1.05rem;
  }

  .modal-body {
    padding: 14px;
  }

  .request-modal-overlay {
    padding: 8px;
  }

  .request-modal-header {
    padding: 14px 14px 12px;
  }

  .request-form-wrap {
    padding: 12px;
  }

  /* Extra mobile optimizations for very small screens */
  .history-table {
    font-size: 0.78rem;
  }

  .table-icon {
    font-size: 16px;
  }

  .history-table th,
  .history-table td {
    padding: 8px 3px;
  }

  .time-short {
    font-size: 0.75rem;
  }

  .status-badge {
    font-size: 0.9rem;
    padding: 3px 6px;
  }

  .completion-icon {
    font-size: 1rem;
  }
}

/* ── Satisfaction panel ───────────────────────────────────────────────────── */
.satisfaction-panel {
  margin-bottom: 24px;
}

.satisfaction-icon {
  color: #f59e0b;
}

.satisfaction-latest {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f8fbff;
  border-radius: 12px;
  font-size: 0.9rem;
}

.satisfaction-latest-label {
  font-weight: 700;
  color: var(--muted);
}

.satisfaction-latest-date {
  color: var(--brand);
  font-weight: 600;
}

.emoji-row {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 20px;
}

.emoji-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 32px;
  border: 2.5px solid var(--border);
  border-radius: 20px;
  background: #f0f6ff;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  flex: 1;
  max-width: 160px;
}

.emoji-btn:hover {
  border-color: var(--brand);
  background: #e8efff;
  transform: translateY(-3px);
}

.emoji-btn--selected {
  border-color: #10b981;
  background: #d1fae5;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.25);
}

.emoji-btn--sad.emoji-btn--selected {
  border-color: #ef4444;
  background: #fee2e2;
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.25);
}

.emoji-face {
  font-size: 2.8rem;
  line-height: 1;
}

.emoji-label {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--ink);
}

.satisfaction-save-row {
  display: flex;
  justify-content: center;
}

/* ── Anonymous request info banner ──────────────────────────────────────── */
.anon-request-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #e8efff;
  border-radius: 10px;
  margin-bottom: 14px;
  font-size: 0.95rem;
  color: var(--brand-dark);
}

.anon-request-info .material-symbols-outlined {
  font-size: 22px;
  color: var(--brand);
  flex-shrink: 0;
}

/* ── Cleaning button ──────────────────────────────────────────────────────── */
.cleaning-button {
  background: linear-gradient(145deg, #059669, #047857);
}

.cleaning-button:hover {
  background: linear-gradient(145deg, #047857, #065f46);
}

/* ── Check Completed button (staff / cleaner) ─────────────────────────────── */
.check-completed-button {
  background: linear-gradient(145deg, #0284c7, #0369a1);
}

.check-completed-button:hover {
  background: linear-gradient(145deg, #0369a1, #075985);
}

.check-completed-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* ── Cleaning Completed button (staff / cleaner) ──────────────────────────── */
.cleaning-done-button {
  background: linear-gradient(145deg, #7c3aed, #6d28d9);
}

.cleaning-done-button:hover {
  background: linear-gradient(145deg, #6d28d9, #5b21b6);
}

.cleaning-done-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* ── Static (non-clickable) table row for cleaner view ───────────────────── */
.static-row {
  cursor: default;
}

.static-row:hover {
  background: transparent !important;
}

/* ── Completion timestamp cells ───────────────────────────────────────────── */
.completion-cell {
  white-space: nowrap;
  text-align: center;
}

.completion-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 0.8rem;
  color: #059669;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.15s, background 0.15s;
}

.completion-btn:hover {
  color: #dc2626;
  background: rgba(220, 38, 38, 0.08);
}

.completion-icon-done {
  font-size: 1.15rem;
  color: inherit;
}

.completion-none {
  color: var(--text-muted, #9ca3af);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.completion-icon-empty {
  font-size: 1.15rem;
  color: var(--text-muted, #9ca3af);
}

/* ── Shared button states ─────────────────────────────────────────────────── */
.primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
</style>
