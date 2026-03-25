<!--
  grocery-item-row.vue — Single item in the grocery list.
  Shows checkbox, name, quantity/unit, and delete button on hover.
-->
<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next';
import { Checkbox } from '~/components/ui/checkbox';
import type { GroceryItem } from '~/types/grocery';

const props = defineProps<{
  item: GroceryItem;
}>();

const emit = defineEmits<{
  toggle: [id: string];
  remove: [id: string];
}>();

function formatQuantity(item: GroceryItem): string {
  if (item.unit) return `× ${item.quantity} ${item.unit}`;
  if (item.quantity > 1) return `× ${item.quantity}`;
  return '';
}
</script>

<template>
  <div
    class="group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-percy-bg-page"
    :class="{ 'opacity-50': props.item.checked }"
    :data-testid="`grocery-item-${props.item.id}`"
  >
    <Checkbox
      :model-value="props.item.checked"
      :data-testid="`grocery-checkbox-${props.item.id}`"
      @update:model-value="emit('toggle', props.item.id)"
    />

    <span class="flex-1 text-sm" :class="{ 'line-through text-percy-text-muted': props.item.checked }">
      {{ props.item.name }}
    </span>

    <span v-if="formatQuantity(props.item)" class="text-xs text-percy-text-muted">
      {{ formatQuantity(props.item) }}
    </span>

    <button
      class="invisible text-percy-text-muted transition-colors hover:text-percy-danger group-hover:visible"
      :data-testid="`grocery-delete-${props.item.id}`"
      @click="emit('remove', props.item.id)"
    >
      <Trash2 class="h-4 w-4" />
    </button>
  </div>
</template>
