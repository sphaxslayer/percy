<!--
  meal-planner-summary.vue — Dashboard preview card for the Meal Planner skill.
  Shows the recipe count and how many meals are planned this week.
-->
<script setup lang="ts">
import { useRecipes } from '~/composables/use-recipes';
import { useMealSlots } from '~/composables/use-meal-slots';

const { recipes, fetchRecipes } = useRecipes();
const { slotCount, fetchSlots } = useMealSlots();

onMounted(async () => {
  await Promise.all([fetchRecipes(), fetchSlots()]);
});
</script>

<template>
  <div class="space-y-1 text-sm text-percy-text-secondary">
    <p>{{ recipes.length }} recette{{ recipes.length > 1 ? 's' : '' }}</p>
    <p>
      {{ slotCount }} repas planifié{{ slotCount > 1 ? 's' : '' }} cette semaine
    </p>
  </div>
</template>
