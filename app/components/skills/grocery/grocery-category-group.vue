<!--
  grocery-category-group.vue — Collapsible category section with item list.
  Shows category name, item count, and a list of GroceryItemRow components.
-->
<script setup lang="ts">
import { ref } from 'vue';
import { ChevronDown } from 'lucide-vue-next';
import type { GroceryItemGroup } from '~/types/grocery';

const props = defineProps<{
  group: GroceryItemGroup;
}>();

defineEmits<{
  toggle: [id: string];
  remove: [id: string];
}>();

const expanded = ref(true);
const categoryName = props.group.category?.name ?? 'Sans catégorie';
</script>

<template>
  <div class="space-y-1">
    <button
      class="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 transition-colors hover:bg-slate-100"
      @click="expanded = !expanded"
    >
      <ChevronDown class="h-3.5 w-3.5 transition-transform" :class="{ '-rotate-90': !expanded }" />
      <span>{{ categoryName }}</span>
      <span class="text-slate-400">({{ props.group.items.length }})</span>
    </button>

    <div v-if="expanded" class="space-y-0.5 pl-2">
      <GroceryItemRow
        v-for="item in props.group.items"
        :key="item.id"
        :item="item"
        @toggle="$emit('toggle', $event)"
        @remove="$emit('remove', $event)"
      />
    </div>
  </div>
</template>
