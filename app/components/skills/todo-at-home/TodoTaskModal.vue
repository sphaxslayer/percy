<!--
  TodoTaskModal.vue — Full creation/edition modal for a task.
-->
<script setup lang="ts">
import { X, Plus, Trash2 } from 'lucide-vue-next';
import type { TodoContext, TodoTask, HouseholdMember } from '~/types/todo';

const props = defineProps<{
  open: boolean;
  contexts: TodoContext[];
  members: HouseholdMember[];
  editTask?: TodoTask | null;
}>();

const emit = defineEmits<{
  close: [];
  save: [payload: {
    contextId: string;
    title: string;
    description?: string;
    status?: 'todo' | 'in_progress' | 'done';
    priority?: 'low' | 'normal' | 'high';
    assigneeId?: string | null;
    dueDate?: string | null;
    color?: string | null;
    subtasks?: { title: string }[];
  }];
}>();

// Form state
const title = ref('');
const description = ref('');
const contextId = ref('');
const status = ref('todo');
const priority = ref('normal');
const assigneeId = ref<string | null>(null);
const dueDate = ref('');
const color = ref('');
const subtaskInputs = ref<string[]>([]);

// Populate form when editing
watch(
  () => props.editTask,
  (task) => {
    if (task) {
      title.value = task.title;
      description.value = task.description ?? '';
      contextId.value = task.contextId;
      status.value = task.status;
      priority.value = task.priority;
      assigneeId.value = task.assigneeId;
      dueDate.value = task.dueDate ? task.dueDate.slice(0, 16) : '';
      color.value = task.color ?? '';
      subtaskInputs.value = task.subtasks.map((s) => s.title);
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

watch(
  () => props.contexts,
  (ctxs) => {
    if (!contextId.value && ctxs.length > 0) {
      contextId.value = ctxs[0]!.id;
    }
  },
  { immediate: true },
);

function resetForm() {
  title.value = '';
  description.value = '';
  contextId.value = props.contexts[0]?.id ?? '';
  status.value = 'todo';
  priority.value = 'normal';
  assigneeId.value = null;
  dueDate.value = '';
  color.value = '';
  subtaskInputs.value = [];
}

function addSubtaskInput() {
  subtaskInputs.value = [...subtaskInputs.value, ''];
}

function removeSubtaskInput(index: number) {
  subtaskInputs.value = subtaskInputs.value.filter((_, i) => i !== index);
}

function handleSave() {
  const trimmed = title.value.trim();
  if (!trimmed || !contextId.value) return;

  const subtasks = subtaskInputs.value
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ title: s }));

  emit('save', {
    contextId: contextId.value,
    title: trimmed,
    description: description.value.trim() || undefined,
    status: status.value as 'todo' | 'in_progress' | 'done',
    priority: priority.value as 'low' | 'normal' | 'high',
    assigneeId: assigneeId.value || null,
    dueDate: dueDate.value ? new Date(dueDate.value).toISOString() : null,
    color: color.value || null,
    subtasks: subtasks.length > 0 ? subtasks : undefined,
  });
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => !v && emit('close')">
    <DialogContent class="max-h-[90vh] overflow-y-auto border-percy-border bg-percy-bg-card sm:max-w-lg">
      <DialogHeader>
        <DialogTitle class="text-percy-text-primary">
          {{ editTask ? 'Modifier la tâche' : 'Nouvelle tâche' }}
        </DialogTitle>
        <button
          class="absolute right-3 top-3 rounded-md p-1 text-percy-text-muted hover:bg-percy-bg-nav"
          @click="emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </DialogHeader>

      <form class="space-y-4 pt-2" @submit.prevent="handleSave">
        <!-- Title -->
        <div>
          <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">Titre</label>
          <input
            v-model="title"
            type="text"
            class="w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary placeholder:text-percy-text-muted focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
            placeholder="Titre de la tâche..."
            data-testid="task-modal-title"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">Description</label>
          <textarea
            v-model="description"
            rows="2"
            class="w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary placeholder:text-percy-text-muted focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
            placeholder="Description optionnelle..."
          />
        </div>

        <!-- Context + Status -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">Contexte</label>
            <select
              v-model="contextId"
              class="w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
              data-testid="task-modal-context"
            >
              <option v-for="ctx in contexts" :key="ctx.id" :value="ctx.id">
                {{ ctx.icon }} {{ ctx.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">Statut</label>
            <select
              v-model="status"
              class="w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
            >
              <option value="todo">À faire</option>
              <option value="in_progress">En cours</option>
              <option value="done">Fait</option>
            </select>
          </div>
        </div>

        <!-- Priority + Assignee -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">Priorité</label>
            <select
              v-model="priority"
              class="w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
            >
              <option value="low">Basse</option>
              <option value="normal">Normale</option>
              <option value="high">Haute</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">Assignée à</label>
            <select
              v-model="assigneeId"
              class="w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
            >
              <option :value="null">Libre</option>
              <option v-for="m in members" :key="m.id" :value="m.id">
                {{ m.avatar ?? '👤' }} {{ m.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Due date -->
        <div>
          <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">Échéance</label>
          <input
            v-model="dueDate"
            type="datetime-local"
            class="w-full rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-2 text-sm text-percy-text-primary focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
          />
        </div>

        <!-- Subtasks -->
        <div>
          <label class="mb-1 block text-xs font-semibold text-percy-text-secondary">Sous-tâches</label>
          <div class="space-y-1.5">
            <div v-for="(_, index) in subtaskInputs" :key="index" class="flex items-center gap-2">
              <input
                v-model="subtaskInputs[index]"
                type="text"
                class="flex-1 rounded-md border border-percy-border-input bg-percy-bg-input px-3 py-1.5 text-sm text-percy-text-primary placeholder:text-percy-text-muted focus:border-percy-primary focus:outline-none focus:ring-2 focus:ring-percy-primary/30"
                placeholder="Sous-tâche..."
              />
              <button
                type="button"
                class="rounded p-1 text-percy-text-muted hover:text-percy-danger"
                @click="removeSubtaskInput(index)"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <button
            type="button"
            class="mt-1.5 flex items-center gap-1 text-xs font-semibold text-percy-primary hover:underline"
            @click="addSubtaskInput"
          >
            <Plus class="h-3 w-3" />
            Ajouter une sous-tâche
          </button>
        </div>

        <!-- Submit -->
        <DialogFooter>
          <button
            type="button"
            class="rounded-md border border-percy-border px-4 py-2 text-sm font-bold text-percy-text-muted transition-colors hover:bg-percy-bg-nav"
            @click="emit('close')"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="!title.trim()"
            class="rounded-md bg-percy-primary px-4 py-2 text-sm font-bold text-percy-primary-text transition-colors hover:bg-percy-primary-hover disabled:opacity-50"
            data-testid="task-modal-submit"
          >
            {{ editTask ? 'Enregistrer' : 'Créer' }}
          </button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
