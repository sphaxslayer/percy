<!--
  grocery-summary.vue — Dashboard summary widget for the Grocery List skill.
  Shows active/checked item counts and last added item name.
  Fetches data on mount — displays nothing while loading to avoid layout shift.
-->
<script setup lang="ts">
import { onMounted } from 'vue';
import { useGroceryList } from '~/composables/use-grocery-list';

const { activeCount, checkedCount, lastAddedName, fetchItems } = useGroceryList();

onMounted(() => fetchItems());
</script>

<template>
  <div
    class="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500"
    data-testid="grocery-summary"
  >
    <p v-if="activeCount > 0">
      {{ activeCount }} article{{ activeCount > 1 ? 's' : '' }} à acheter
    </p>
    <p v-if="checkedCount > 0">{{ checkedCount }} déjà pris</p>
    <p v-if="activeCount === 0 && checkedCount === 0">Liste vide</p>
    <p v-if="lastAddedName" class="truncate text-slate-400">Dernier ajout : {{ lastAddedName }}</p>
  </div>
</template>
