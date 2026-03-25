<!--
  grocery-checked-section.vue — Collapsible section showing already-purchased items.
  Collapsed by default, shows count badge. Includes "Vider" button with confirmation.
-->
<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown, Trash2 } from 'lucide-vue-next';
import type { GroceryItem } from '~/types/grocery';

const props = defineProps<{
  items: GroceryItem[];
}>();

const emit = defineEmits<{
  toggle: [id: string];
  remove: [id: string];
  clearAll: [];
}>();

const expanded = ref(false);
const showConfirm = ref(false);

function handleClear() {
  showConfirm.value = false;
  emit('clearAll');
}
</script>

<template>
  <div v-if="props.items.length > 0" class="border-t border-percy-border pt-3">
    <div class="flex items-center justify-between">
      <button
        class="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-percy-text-muted transition-colors hover:bg-percy-bg-nav"
        data-testid="grocery-checked-toggle"
        @click="expanded = !expanded"
      >
        <ChevronDown
          class="h-3.5 w-3.5 transition-transform"
          :class="{ '-rotate-90': !expanded }"
        />
        <span>Déjà acheté</span>
        <span class="rounded-full bg-percy-bg-nav px-2 py-0.5 text-xs text-percy-text-secondary">
          {{ props.items.length }}
        </span>
      </button>

      <!-- Confirm dialog inline -->
      <div v-if="showConfirm" class="flex items-center gap-2 text-sm">
        <span class="text-percy-text-muted">Supprimer tout ?</span>
        <Button
          variant="destructive"
          size="sm"
          data-testid="grocery-clear-confirm"
          @click="handleClear"
        >
          Oui
        </Button>
        <Button variant="ghost" size="sm" @click="showConfirm = false"> Non </Button>
      </div>

      <Button
        v-else
        variant="ghost"
        size="sm"
        class="text-percy-text-muted hover:text-percy-danger"
        data-testid="grocery-clear-button"
        @click="showConfirm = true"
      >
        <Trash2 class="mr-1 h-3.5 w-3.5" />
        Vider
      </Button>
    </div>

    <div v-if="expanded" class="mt-1 space-y-0.5 pl-2">
      <GroceryItemRow
        v-for="item in props.items"
        :key="item.id"
        :item="item"
        @toggle="$emit('toggle', $event)"
        @remove="$emit('remove', $event)"
      />
    </div>
  </div>
</template>
