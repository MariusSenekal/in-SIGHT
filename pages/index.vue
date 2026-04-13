<template>
  <div class="container auth-shell">
    <section v-if="!currentUser" class="auth-panel">
      <div class="auth-header">
        <div class="brand-title-row">
          <InSightSearchIcon class="heading-search-icon" />
          <h1>in-<span class="sight-highlight">SIGHT</span></h1>
        </div>
        <h2>Welcome Back!</h2>
      </div>

      <form v-if="mode === 'login'" class="auth-form" @submit.prevent="submitLogin">
        <label class="field">
          Username
          <div class="field-row">
            <span class="material-symbols-outlined input-icon" aria-hidden="true">person</span>
            <input v-model="loginForm.username" type="text" required autocomplete="username" />
          </div>
        </label>

        <label class="field">
          Password
          <div class="field-row password-row">
              <span class="material-symbols-outlined input-icon" aria-hidden="true">lock</span>
              <input
                v-model="loginForm.password"
                :type="showLoginPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
              />
            <button
              type="button"
              class="toggle-password-inline"
              aria-label="Toggle password visibility"
              @click="showLoginPassword = !showLoginPassword"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                {{ showLoginPassword ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
        </label>

        <button type="submit" class="primary-btn">
          <span class="material-symbols-outlined" aria-hidden="true">login</span>
          Login
        </button>
      </form>

      <form v-else class="auth-form" @submit.prevent="submitSignup">
        <label class="field">
          Full Name
          <div class="field-row">
            <span class="material-symbols-outlined input-icon" aria-hidden="true">badge</span>
            <input v-model="signupForm.name" type="text" required autocomplete="name" />
          </div>
        </label>

        <label class="field">
          Username
          <div class="field-row">
            <span class="material-symbols-outlined input-icon" aria-hidden="true">person_add</span>
            <input v-model="signupForm.username" type="text" required autocomplete="username" />
          </div>
        </label>

        <label class="field">
          Password
          <div class="field-row password-row">
              <span class="material-symbols-outlined input-icon" aria-hidden="true">lock</span>
              <input
                v-model="signupForm.password"
                :type="showSignupPassword ? 'text' : 'password'"
                required
                autocomplete="new-password"
              />
            <button
              type="button"
              class="toggle-password-inline"
              aria-label="Toggle password visibility"
              @click="showSignupPassword = !showSignupPassword"
            >
              <span class="material-symbols-outlined" aria-hidden="true">
                {{ showSignupPassword ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
        </label>

        <button type="submit" class="primary-btn">
          <span class="material-symbols-outlined" aria-hidden="true">person_add</span>
          Create Account
        </button>
      </form>

      <p v-if="formMessage" class="form-message">{{ formMessage }}</p>

      <p class="demo-credentials auth-footer-note">
        <span class="material-symbols-outlined" aria-hidden="true">info</span>
        Admin demo login: <strong>admin</strong> / <strong>admin123</strong>
      </p>

      <p class="auth-bottom-link">
        <span class="auth-bottom-label" v-if="mode === 'login'">Don't have an account?</span>
        <span class="auth-bottom-label" v-else>Already have an account?</span>

        <button
          v-if="mode === 'login'"
          type="button"
          class="text-link"
          @click="mode = 'signup'"
        >
          Sign Up
        </button>
        <button
          v-else
          type="button"
          class="text-link"
          @click="mode = 'login'"
        >
          Back to Login
        </button>
      </p>
    </section>

    <section v-else class="dashboard-panel">
      <div class="dashboard-header">
        <h1>Welcome Back {{ currentUser.name }}</h1>
        <button class="ghost-btn" type="button" @click="logout">Log Out</button>
      </div>

      <div class="action-grid dashboard-actions">
        <button type="button" class="action-card" @click="goToScan">
          <div class="action-card-title-row">
            <span class="material-symbols-outlined" aria-hidden="true">qr_code_scanner</span>
            <h2>Scan QR Code</h2>
          </div>
          <p>Open the camera and start scanning immediately.</p>
        </button>

        <button type="button" class="action-card" @click="goToUpload">
          <div class="action-card-title-row">
            <span class="material-symbols-outlined" aria-hidden="true">photo_camera</span>
            <h2>Upload Photo</h2>
          </div>
          <p>Upload a cleaning photo for your records.</p>
        </button>

        <button v-if="isAdmin" type="button" class="action-card admin-card" @click="goToDashboard">
          <div class="action-card-title-row">
            <span class="material-symbols-outlined" aria-hidden="true">dashboard</span>
            <h2>Dashboards and Management</h2>
          </div>
          <p>Admin tools, reports, and record management.</p>
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
type AuthMode = 'login' | 'signup'

const { currentUser, isAdmin, initAuth, login, signup, logout } = useAuth()

const mode = ref<AuthMode>('login')
const formMessage = ref('')
const showLoginPassword = ref(false)
const showSignupPassword = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const signupForm = reactive({
  name: '',
  username: '',
  password: ''
})

onMounted(() => {
  initAuth()
})

const submitLogin = () => {
  const result = login(loginForm.username, loginForm.password)
  if (!result.ok) {
    formMessage.value = result.message
    return
  }

  formMessage.value = ''
  loginForm.username = ''
  loginForm.password = ''
}

const submitSignup = () => {
  const result = signup(signupForm.name, signupForm.username, signupForm.password)
  formMessage.value = result.message

  if (!result.ok) {
    return
  }

  signupForm.name = ''
  signupForm.username = ''
  signupForm.password = ''
  mode.value = 'login'
}

const goToScan = () => navigateTo('/scan')
const goToUpload = () => navigateTo('/upload')
const goToDashboard = () => navigateTo('/dashboard')
</script>
