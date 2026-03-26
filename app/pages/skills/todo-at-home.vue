<!--
  pages/skills/todo-at-home.vue — Main page for the TodoAtHome skill.
  Manages views (dashboard, context detail, agenda, settings)
  and orchestrates all composables.
-->
<script setup lang="ts">
import { ClipboardList, Calendar, Settings, ChevronDown, ChevronUp } from 'lucide-vue-next';
import { useHouseholdMembers } from '~/composables/use-household-members';
import { useTodoDomains } from '~/composables/use-todo-domains';
import { useTodoContexts } from '~/composables/use-todo-contexts';
import { useTodoTasks } from '~/composables/use-todo-tasks';
import type { TodoTaskFilters, ColorMode, TodoContext } from '~/types/todo';

definePageMeta({
  middleware: 'auth',
});

// ─── Composables ─────────────────────────────────────────────────────
const { members, fetchMembers, addMember, removeMember } = useHouseholdMembers();
const { domains, fetchDomains } = useTodoDomains();
const { contexts, fetchContexts, addContext, removeContext } = useTodoContexts();
const {
  tasks,
  loading,
  error,
  filters,
  openCount,
  urgentCount,
  fetchTasks,
  addTask,
  updateTask,
  removeTask,
  toggleTaskDone,
  toggleSubtask,
  setFilters,
} = useTodoTasks();

// ─── View state ──────────────────────────────────────────────────────
type ViewMode = 'dashboard' | 'detail' | 'agenda';
const viewMode = ref<ViewMode>('dashboard');
const selectedContextId = ref<string | null>(null);
const colorMode = ref<ColorMode>('context');
const showTaskModal = ref(false);
const editingTaskId = ref<string | null>(null);
const showSettings = ref(false);
const showContextAdd = ref(false);

const selectedContext = computed<TodoContext | null>(() => {
  if (!selectedContextId.value) return null;
  return contexts.value.find((c) => c.id === selectedContextId.value) ?? null;
});

const contextTasks = computed(() => {
  if (!selectedContextId.value) return [];
  return tasks.value.filter((t) => t.contextId === selectedContextId.value);
});

const editingTask = computed(() => {
  if (!editingTaskId.value) return null;
  return tasks.value.find((t) => t.id === editingTaskId.value) ?? null;
});

// Current domain (v1: single domain)
const currentDomainId = computed(() => domains.value[0]?.id ?? '');

// ─── Actions ─────────────────────────────────────────────────────────
function selectContext(contextId: string) {
  selectedContextId.value = contextId;
  viewMode.value = 'detail';
}

function goBack() {
  viewMode.value = 'dashboard';
  selectedContextId.value = null;
}

function openTaskModal(taskId?: string) {
  editingTaskId.value = taskId ?? null;
  showTaskModal.value = true;
}

async function handleSaveTask(payload: Parameters<typeof addTask>[0]) {
  if (editingTaskId.value) {
    await updateTask(editingTaskId.value, payload);
  } else {
    await addTask(payload);
  }
  showTaskModal.value = false;
  editingTaskId.value = null;
  await fetchTasks();
}

async function handleDeleteTask(taskId: string) {
  await removeTask(taskId);
}

async function handleToggleTask(taskId: string) {
  await toggleTaskDone(taskId);
}

async function handleToggleSubtask(taskId: string, subtaskId: string) {
  await toggleSubtask(taskId, subtaskId);
}

async function handleAddContext(payload: { domainId: string; name: string; color: string }) {
  await addContext(payload);
  await fetchContexts();
}

async function handleQuickAdd(payload: { contextId: string; title: string }) {
  await addTask({ contextId: payload.contextId, title: payload.title });
  await fetchTasks();
}

async function handleDeleteContext(contextId: string) {
  await removeContext(contextId);
  await Promise.all([fetchContexts(), fetchTasks()]);
}

async function handleAddMember(payload: { name: string; avatar?: string }) {
  await addMember(payload);
}

async function handleDeleteMember(memberId: string) {
  await removeMember(memberId);
}

function handleFilterUpdate(newFilters: TodoTaskFilters) {
  setFilters(newFilters);
  fetchTasks(newFilters);
}

// ─── Init ────────────────────────────────────────────────────────────
async function initData() {
  // Seed default data on first visit (idempotent)
  await $fetch('/api/skills/todo-at-home/seed', { method: 'POST' }).catch(() => {});
  await Promise.all([fetchDomains(), fetchContexts(), fetchTasks(), fetchMembers()]);
}

onMounted(initData);
</script>

<template>
  <div class="mx-auto max-w-4xl space-y-4 p-4 sm:p-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="rounded-lg bg-percy-primary-light p-2">
          <ClipboardList class="h-5 w-5 text-percy-primary" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-percy-text-primary" data-testid="todo-title">
            Tâches à la maison
          </h1>
          <p v-if="openCount > 0" class="text-sm text-percy-text-muted">
            {{ openCount }} ouverte{{ openCount > 1 ? 's' : '' }}
            <span v-if="urgentCount > 0" class="font-semibold text-percy-danger">
              · {{ urgentCount }} urgente{{ urgentCount > 1 ? 's' : '' }}
            </span>
          </p>
        </div>
      </div>

      <!-- View toggles + settings -->
      <div class="flex items-center gap-1.5">
        <nav class="inline-flex gap-0.5 rounded-lg bg-percy-bg-nav p-0.5">
          <button
            class="rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors"
            :class="viewMode !== 'agenda' ? 'bg-percy-primary text-percy-primary-text' : 'text-percy-text-muted hover:bg-percy-bg-card'"
            data-testid="todo-view-dashboard"
            @click="viewMode = 'dashboard'; selectedContextId = null"
          >
            <ClipboardList class="inline-block h-3.5 w-3.5" />
          </button>
          <button
            class="rounded-md px-2.5 py-1.5 text-xs font-bold transition-colors"
            :class="viewMode === 'agenda' ? 'bg-percy-primary text-percy-primary-text' : 'text-percy-text-muted hover:bg-percy-bg-card'"
            data-testid="todo-view-agenda"
            @click="viewMode = 'agenda'"
          >
            <Calendar class="inline-block h-3.5 w-3.5" />
          </button>
        </nav>
        <button
          class="rounded-md p-1.5 text-percy-text-muted hover:bg-percy-bg-nav hover:text-percy-primary"
          data-testid="todo-settings-btn"
          @click="showSettings = true"
        >
          <Settings class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <Skeleton class="h-10 w-full" />
      <Skeleton class="h-32 w-full" />
      <Skeleton class="h-32 w-3/4" />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg border border-percy-danger/30 bg-percy-danger-light p-4 text-center text-sm text-percy-danger"
    >
      {{ error }}
    </div>

    <template v-else>
      <!-- Dashboard view -->
      <template v-if="viewMode === 'dashboard'">
        <!-- Quick add -->
        <TodoQuickAdd :contexts="contexts" @add="handleQuickAdd" />

        <!-- Filters -->
        <TodoFilters
          :contexts="contexts"
          :members="members"
          :filters="filters"
          :color-mode="colorMode"
          @update:filters="handleFilterUpdate"
          @update:color-mode="colorMode = $event"
        >
          <!-- Add context toggle, placed after the color mode pills -->
          <button
            v-if="currentDomainId"
            class="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-xs text-percy-text-muted transition-colors hover:bg-percy-bg-card hover:text-percy-primary"
            @click="showContextAdd = !showContextAdd"
          >
            Nouveau contexte
            <ChevronUp v-if="showContextAdd" class="h-3.5 w-3.5" />
            <ChevronDown v-else class="h-3.5 w-3.5" />
          </button>
        </TodoFilters>

        <!-- Add context form (collapsible) -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          leave-active-class="transition-all duration-150 ease-in"
          enter-from-class="opacity-0 -translate-y-1"
          leave-to-class="opacity-0 -translate-y-1"
        >
          <TodoContextAdd
            v-if="showContextAdd && currentDomainId"
            :domain-id="currentDomainId"
            @add="handleAddContext"
          />
        </Transition>

        <!-- Context grid -->
        <TodoDashboard
          :contexts="contexts"
          :tasks="tasks"
          @select-context="selectContext"
        />

        <!-- Empty state -->
        <div
          v-if="contexts.length === 0"
          class="py-12 text-center"
          data-testid="todo-empty"
        >
          <ClipboardList class="mx-auto h-12 w-12 text-percy-text-muted" />
          <p class="mt-3 text-sm text-percy-text-muted">Aucun contexte créé</p>
          <p class="text-xs text-percy-text-muted">Cliquez sur « Ajouter un contexte » pour commencer</p>
        </div>
      </template>

      <!-- Context detail view -->
      <template v-if="viewMode === 'detail' && selectedContext">
        <TodoContextDetail
          :context="selectedContext"
          :tasks="contextTasks"
          :color-mode="colorMode"
          @back="goBack"
          @add-task="openTaskModal()"
          @toggle-task="handleToggleTask"
          @edit-task="openTaskModal($event)"
          @delete-task="handleDeleteTask"
          @toggle-subtask="handleToggleSubtask"
        />
      </template>

      <!-- Agenda view -->
      <template v-if="viewMode === 'agenda'">
        <TodoAgendaView
          :tasks="tasks"
          @toggle-task="handleToggleTask"
          @edit-task="openTaskModal($event)"
        />
      </template>
    </template>

    <!-- Task modal -->
    <TodoTaskModal
      :open="showTaskModal"
      :contexts="contexts"
      :members="members"
      :edit-task="editingTask"
      @close="showTaskModal = false; editingTaskId = null"
      @save="handleSaveTask"
    />

    <!-- Settings modal -->
    <TodoSettings
      :open="showSettings"
      :contexts="contexts"
      :members="members"
      @close="showSettings = false"
      @delete-context="handleDeleteContext"
      @add-member="handleAddMember"
      @delete-member="handleDeleteMember"
    />
  </div>
</template>
