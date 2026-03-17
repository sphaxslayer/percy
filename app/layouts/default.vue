<!--
  layouts/default.vue — Main authenticated layout.
  Used by dashboard and all skill pages. Provides:
  - Collapsible sidebar (desktop) / hamburger menu (mobile)
  - Top header with user menu
  - Main content area via <slot />
-->
<script setup lang="ts">
import { ref } from 'vue';

// Sidebar collapsed state — persisted in component (not in URL)
const sidebarCollapsed = ref(false);

// Mobile navigation open state
const mobileNavOpen = ref(false);

function toggleMobileNav() {
  mobileNavOpen.value = !mobileNavOpen.value;
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-slate-50">
    <!-- Desktop sidebar -->
    <AppSidebar v-model:collapsed="sidebarCollapsed" />

    <!-- Mobile navigation overlay -->
    <MobileNav v-model:open="mobileNavOpen" />

    <!-- Main content area -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <!-- Top header -->
      <AppHeader @toggle-mobile-nav="toggleMobileNav" />

      <!-- Page content — scrollable independently from the sidebar -->
      <main class="flex-1 overflow-y-auto p-4 md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
