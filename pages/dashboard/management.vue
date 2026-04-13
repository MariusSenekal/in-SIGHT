<template>
  <div class="container dashboard-layout">
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
      <h1>Management Tools</h1>
      <p>This is the second dashboard page. Add user and system controls here next.</p>

      <div class="action-grid">
        <NuxtLink class="action-card as-link" to="/records">
          <h2>Record Access</h2>
          <p>Go to full record management and auditing.</p>
        </NuxtLink>

        <NuxtLink class="action-card as-link" to="/upload">
          <h2>Media Review</h2>
          <p>Review and organize uploaded cleaning evidence.</p>
        </NuxtLink>

        <NuxtLink class="action-card as-link" to="/dashboard/qr-codes">
          <h2>QR Code Section</h2>
          <p>Build printable QR sheets for selected records.</p>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { currentUser, isAdmin, initAuth, logout } = useAuth()

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
</script>
