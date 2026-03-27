<!--
  ContextImagePicker.vue — Modal for choosing a context illustration.

  Three options for each context:
  1. "Automatique" — no imageUrl stored; theme-adaptive illustration via name mapping
  2. Built-in variants — alternate images from the _backups library (grouped by room)
  3. Custom upload — user uploads their own file (stored in /images/uploads/{userId}/)

  Emits `select` with the chosen URL (or null for "auto").
-->
<script setup lang="ts">
import { useThemeStore } from '~/stores/use-theme-store';

interface IllustrationVariant {
  id: string;
  daylight: string;
  warm: string;
}

interface IllustrationGroup {
  slug: string;
  label: string;
  main: { daylight: string; warm: string } | null;
  variants: IllustrationVariant[];
}

const props = defineProps<{
  /** Currently stored imageUrl (null = auto) */
  currentImageUrl: string | null;
  /** Current context name — used to pre-scroll to the matching group */
  contextName?: string;
}>();

const emit = defineEmits<{
  select: [url: string | null];
  close: [];
}>();

const themeStore = useThemeStore();
const groups = ref<IllustrationGroup[]>([]);
const loading = ref(true);
const uploading = ref(false);
const uploadError = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Fetch available illustrations on mount
onMounted(async () => {
  try {
    const res = await $fetch<{ data: IllustrationGroup[] }>('/api/skills/todo-at-home/illustrations');
    groups.value = res.data;
  } catch {
    // Graceful degradation: picker still works with upload-only if API fails
  } finally {
    loading.value = false;
  }
});

/** Return the URL to display as thumbnail based on the current illustration set */
function thumbUrl(variant: { daylight: string; warm: string }): string {
  return themeStore.illustrationSet === 'warm' ? variant.warm : variant.daylight;
}

function selectAuto() {
  emit('select', null);
}

function selectVariant(url: string) {
  emit('select', url);
}

function triggerUpload() {
  fileInputRef.value?.click();
}

async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  uploadError.value = null;
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append('image', file);
    const res = await $fetch<{ data: { url: string } }>('/api/skills/todo-at-home/upload', {
      method: 'POST',
      body: formData,
    });
    emit('select', res.data.url);
  } catch (err: unknown) {
    // Extract readable message from Nuxt fetch error
    const message = (err as { data?: { message?: string } })?.data?.message ?? 'Erreur lors du chargement';
    uploadError.value = message;
  } finally {
    uploading.value = false;
    // Reset so the same file can be re-selected
    input.value = '';
  }
}

function isSelected(url: string | null): boolean {
  return props.currentImageUrl === url;
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
    role="dialog"
    aria-modal="true"
    aria-label="Choisir une illustration"
    @click.self="emit('close')"
  >
    <div class="flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-percy-bg-card sm:max-w-lg sm:rounded-xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-percy-border px-4 py-3">
        <h2 class="text-base font-bold text-percy-text-primary">Choisir une illustration</h2>
        <button
          type="button"
          class="rounded-md p-1 text-percy-text-muted hover:bg-percy-bg-hover hover:text-percy-text-primary"
          aria-label="Fermer"
          @click="emit('close')"
        >
          <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto p-4 space-y-5">
        <!-- Loading skeleton -->
        <template v-if="loading">
          <div class="grid grid-cols-4 gap-2">
            <div
              v-for="i in 8"
              :key="i"
              class="aspect-square rounded-lg bg-percy-bg-hover animate-pulse"
            />
          </div>
        </template>

        <template v-else>
          <!-- "Automatique" option -->
          <section>
            <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-percy-text-muted">
              Automatique
            </h3>
            <button
              type="button"
              class="flex items-center gap-3 w-full rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-colors"
              :class="isSelected(null)
                ? 'border-percy-primary bg-percy-accent-light text-percy-primary'
                : 'border-percy-border bg-percy-bg-card text-percy-text-secondary hover:border-percy-primary/50'"
              @click="selectAuto"
            >
              <span class="text-xl" aria-hidden="true">🔄</span>
              <span>Selon le nom du contexte (thème adaptatif)</span>
              <svg
                v-if="isSelected(null)"
                class="ml-auto h-4 w-4 shrink-0 text-percy-primary"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
            </button>
          </section>

          <!-- Built-in illustrations grouped by room -->
          <section v-for="group in groups" :key="group.slug">
            <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-percy-text-muted">
              {{ group.label }}
            </h3>
            <div class="grid grid-cols-4 gap-2 sm:grid-cols-5">
              <!-- Main (theme-adaptive) image for the room — shown as preview only,
                   selecting it sets imageUrl=null (auto) only if contextName matches -->
              <button
                v-if="group.main"
                type="button"
                class="relative aspect-square overflow-hidden rounded-lg border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-percy-primary"
                :class="isSelected(null) && contextName?.toLowerCase().includes(group.slug.replace('-', ' '))
                  ? 'border-percy-primary'
                  : 'border-transparent'"
                :aria-label="`${group.label} — illustration principale`"
                @click="selectAuto"
              >
                <img
                  :src="thumbUrl(group.main)"
                  :alt="group.label"
                  class="h-full w-full object-cover"
                >
                <span class="absolute bottom-0.5 left-0.5 rounded bg-black/40 px-1 py-0.5 text-[9px] font-bold text-white">
                  Défaut
                </span>
              </button>

              <!-- Backup variants -->
              <button
                v-for="variant in group.variants"
                :key="variant.id"
                type="button"
                class="relative aspect-square overflow-hidden rounded-lg border-2 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-percy-primary"
                :class="isSelected(thumbUrl(variant)) ? 'border-percy-primary' : 'border-transparent'"
                :aria-label="`${group.label} — variante`"
                @click="selectVariant(thumbUrl(variant))"
              >
                <img
                  :src="thumbUrl(variant)"
                  :alt="`${group.label} variante`"
                  class="h-full w-full object-cover"
                >
                <svg
                  v-if="isSelected(thumbUrl(variant))"
                  class="absolute right-1 top-1 h-4 w-4 rounded-full bg-percy-primary text-white shadow"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </section>
        </template>

        <!-- Custom upload -->
        <section>
          <h3 class="mb-2 text-xs font-semibold uppercase tracking-wide text-percy-text-muted">
            Image personnalisée
          </h3>
          <p v-if="uploadError" class="mb-2 text-xs text-red-500">{{ uploadError }}</p>
          <button
            type="button"
            :disabled="uploading"
            class="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-percy-border bg-percy-bg-card px-4 py-3 text-sm font-medium text-percy-text-secondary transition-colors hover:border-percy-primary/60 hover:text-percy-primary disabled:opacity-50"
            @click="triggerUpload"
          >
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M9.25 13.25a.75.75 0 001.5 0V4.636l2.955 3.129a.75.75 0 001.09-1.03l-4.25-4.5a.75.75 0 00-1.09 0l-4.25 4.5a.75.75 0 101.09 1.03L9.25 4.636v8.614z" />
              <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
            </svg>
            <span>{{ uploading ? 'Envoi en cours…' : 'Envoyer une image' }}</span>
          </button>
          <!-- Hidden file input -->
          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="sr-only"
            @change="handleFileChange"
          >
        </section>
      </div>
    </div>
  </div>
</template>
