<!--
  pages/index.vue — Root page redirect.
  Redirects authenticated users to /dashboard and unauthenticated users to /login.
  This page never renders any visible content.
-->
<script setup lang="ts">
const { status } = useAuth();

// Redirect based on authentication state
watchEffect(() => {
  if (status.value === 'authenticated') {
    navigateTo('/dashboard');
  } else if (status.value === 'unauthenticated') {
    navigateTo('/login');
  }
  // While status is 'loading', we wait (no redirect)
});
</script>

<template>
  <!-- Loading state while auth status is being determined -->
  <div class="flex h-screen items-center justify-center">
    <div class="text-sm text-slate-500">Chargement...</div>
  </div>
</template>
