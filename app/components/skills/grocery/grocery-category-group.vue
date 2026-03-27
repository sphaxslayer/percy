<!--
  grocery-category-group.vue — Collapsible category section with drag-to-reorder item list.
  Items within each category can be reordered via drag handles.
-->
<script setup lang="ts">
import { ref, watch } from 'vue';
import { ChevronDown, GripVertical } from 'lucide-vue-next';
import draggable from 'vuedraggable';
import type { GroceryItem, GroceryItemGroup } from '~/types/grocery';

const props = defineProps<{
  group: GroceryItemGroup;
}>();

const emit = defineEmits<{
  toggle: [id: string];
  remove: [id: string];
  reorder: [items: Array<{ id: string; sortOrder: number }>];
}>();

const expanded = ref(true);
const categoryName = props.group.category?.name ?? 'Sans catégorie';

// Local copy for drag-and-drop — kept in sync with the prop
const draggableItems = ref<GroceryItem[]>([...props.group.items]);

watch(
  () => props.group.items,
  (items) => { draggableItems.value = [...items]; },
);

function onDragEnd() {
  const updated = draggableItems.value.map((item, idx) => ({ id: item.id, sortOrder: idx }));
  emit('reorder', updated);
}
</script>

<template>
  <div class="space-y-1">
    <button
      class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-percy-text-muted transition-colors hover:bg-percy-bg-nav"
      @click="expanded = !expanded"
    >
      <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="{ '-rotate-90': !expanded }" />
      <span>{{ categoryName }}</span>
      <span class="text-percy-text-muted">({{ props.group.items.length }})</span>
    </button>

    <draggable
      v-if="expanded"
      v-model="draggableItems"
      item-key="id"
      handle=".drag-handle"
      :animation="150"
      ghost-class="opacity-30"
      class="space-y-0.5 pl-2"
      @end="onDragEnd"
    >
      <template #item="{ element: item }">
        <div class="group flex items-center gap-1">
          <!-- Drag handle -->
          <button
            class="drag-handle shrink-0 cursor-grab p-0.5 text-percy-text-muted opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
            aria-label="Réordonner"
            @click.stop
          >
            <GripVertical class="h-3.5 w-3.5" />
          </button>

          <GroceryItemRow
            :item="item"
            class="flex-1"
            @toggle="emit('toggle', $event)"
            @remove="emit('remove', $event)"
          />
        </div>
      </template>
    </draggable>
  </div>
</template>
