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
      <h1>Dashboards and Management</h1>
      <p>Choose a section from the side navigation, or use these quick actions.</p>

      <div class="action-grid">
        <NuxtLink class="action-card as-link" to="/records">
          <h2>Records Dashboard</h2>
          <p>Open and manage all cleaning records.</p>
        </NuxtLink>

        <NuxtLink class="action-card as-link" to="/upload">
          <h2>Photo Management</h2>
          <p>Review uploaded photos and evidence files.</p>
        </NuxtLink>

        <NuxtLink class="action-card as-link" to="/dashboard/qr-codes">
          <h2>QR Code Section</h2>
          <p>View, select, resize, and print QR code sheets.</p>
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
