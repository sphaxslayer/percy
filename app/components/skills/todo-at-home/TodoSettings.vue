<!--
  TodoSettings.vue — Settings panel for contexts + household members.
-->
<script setup lang="ts">
import { Trash2, X } from 'lucide-vue-next';
import type { TodoContext, HouseholdMember } from '~/types/todo';

defineProps<{
  open: boolean;
  contexts: TodoContext[];
  members: HouseholdMember[];
}>();

const emit = defineEmits<{
  close: [];
  'delete-context': [contextId: string];
  'add-member': [payload: { name: string; avatar?: string }];
  'delete-member': [memberId: string];
}>();

const newMemberName = ref('');
const newMemberAvatar = ref('👤');

function handleAddMember() {
  const trimmed = newMemberName.value.trim();
  if (!trimmed) return;
  emit('add-member', { name: trimmed, avatar: newMemberAvatar.value });
  newMemberName.value = '';
  newMemberAvatar.value = '👤';
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => !v && emit('close')">
    <DialogContent class="max-h-[90vh] overflow-y-auto border-percy-border bg-percy-bg-card sm:max-w-md">
      <DialogHeader>
        <DialogTitle class="text-percy-text-primary">Paramètres</DialogTitle>
        <button
          class="absolute right-3 top-3 rounded-md p-1 text-percy-text-muted hover:bg-percy-bg-nav"
          @click="emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </DialogHeader>

      <div class="space-y-6 pt-2">
        <!-- Contexts management -->
        <section>
          <h3 class="mb-2 text-sm font-bold text-percy-text-primary">Contextes</h3>
          <div class="space-y-1.5">
            <div
              v-for="ctx in contexts"
              :key="ctx.id"
              class="flex items-center justify-between rounded-md border border-percy-border px-3 py-2"
            >
              <div class="flex items-center gap-2">
                <span
                  class="h-3 w-3 rounded-full"
                  :style="{ backgroundColor: ctx.color }"
                />
                <span class="text-sm text-percy-text-primary">{{ ctx.icon }} {{ ctx.name }}</span>
                <span
                  v-if="ctx.isGlobal"
                  class="rounded-sm bg-percy-accent-light px-1.5 py-0.5 text-[10px] font-bold text-percy-accent-text"
                >
                  Global
                </span>
              </div>
              <button
                v-if="!ctx.isGlobal"
                class="rounded p-1 text-percy-text-muted hover:text-percy-danger"
                title="Supprimer (les tâches seront déplacées vers Global)"
                @click="emit('delete-context', ctx.id)"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        <!-- Household members management -->
        <section>
          <h3 class="mb-2 text-sm font-bold text-percy-text-primary">Membres du foyer</h3>
          <div class="space-y-1.5">
            <div
              v-for="member in members"
              :key="member.id"
              class="flex items-center justify-between rounded-md border border-percy-border px-3 py-2"
            >
              <span class="text-sm text-percy-text-primary">
                {{ member.avatar ?? '👤' }} {{ member.name }}
              </span>
              <button
                class="rounded p-1 text-percy-text-muted hover:text-percy-danger"
                title="Supprimer"
                @click="emit('delete-member', member.id)"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <!-- Add member form -->
          <form class="mt-2 flex gap-2" @submit.prevent="handleAddMember">
            <input
              v-model="newMemberName"
              type="text"
              placeholder="Nom du membre..."
              class="flex-1 rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-1.5 text-sm text-percy-text-primary placeholder:text-percy-text-muted focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
            />
            <button
              type="submit"
              :disabled="!newMemberName.trim()"
              class="rounded-md bg-percy-primary px-3 py-1.5 text-sm font-bold text-percy-primary-text transition-colors hover:bg-percy-primary-hover disabled:opacity-50"
            >
              Ajouter
            </button>
          </form>
        </section>
      </div>
    </DialogContent>
  </Dialog>
</template>
