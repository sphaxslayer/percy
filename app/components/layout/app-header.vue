<!--
  components/layout/app-header.vue — Top header bar.
  Shows app name (on mobile), hamburger menu button, and user dropdown menu.
  The user dropdown contains the logout action.
-->
<script setup lang="ts">
import { Menu, LogOut, User } from 'lucide-vue-next';

const emit = defineEmits<{
  'toggle-mobile-nav': [];
}>();

// Get the current user session from nuxt-auth
const { data: session, signOut } = useAuth();

// Extract user info from session
const userName = computed(
  () => session.value?.user?.name || session.value?.user?.email || 'Utilisateur',
);

async function handleLogout() {
  await signOut({ redirect: true, callbackUrl: '/login' });
}
</script>

<template>
  <header
    class="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4"
    data-testid="header"
  >
    <!-- Left side: mobile menu button + app name on mobile -->
    <div class="flex items-center gap-3">
      <button
        class="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        data-testid="mobile-menu-button"
        @click="emit('toggle-mobile-nav')"
      >
        <Menu class="h-5 w-5" />
      </button>

      <!-- App name visible only on mobile (sidebar hidden) -->
      <span class="text-lg font-semibold text-slate-900 md:hidden"> Percy </span>
    </div>

    <!-- Right side: user dropdown -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button
          class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          data-testid="user-menu-button"
        >
          <User class="h-4 w-4" />
          <span class="hidden sm:inline">{{ userName }}</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" class="w-48">
        <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          class="cursor-pointer text-red-600 focus:text-red-600"
          data-testid="logout-button"
          @click="handleLogout"
        >
          <LogOut class="mr-2 h-4 w-4" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
