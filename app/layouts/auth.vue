<!--
  layouts/auth.vue — Layout for authentication pages (login, register).
  Displays a centered card on a neutral background. No sidebar or header.
-->
<script setup lang="ts">
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-md">
      <!-- App branding -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-slate-900">Percy</h1>
        <p class="mt-2 text-sm text-slate-600">Votre assistant personnel</p>
      </div>

      <!-- Page content (login or register form) -->
      <slot />
    </div>
  </div>
</template>
