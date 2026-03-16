<!--
  app/app.vue — Application root component.
  Renders the NuxtLayout (which provides sidebar/header) and NuxtPage (route content).
  Also includes global UI: loading indicator (top progress bar) and toast notifications.
-->
<template>
  <div>
    <!-- Top progress bar shown during page navigation -->
    <NuxtLoadingIndicator color="#2563eb" />

    <!-- Layout wrapper (default.vue or auth.vue depending on the page) -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Global toast notifications (vue-sonner) -->
    <Sonner position="top-right" :duration="4000" />
  </div>
</template>
