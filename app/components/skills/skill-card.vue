<!--
  components/skills/skill-card.vue — Dashboard skill card.
  Displays a skill's icon, name, and description in a clickable card.
  Used on the dashboard page to show all available skills.
-->
<script setup lang="ts">
import type { SkillDefinition } from '~/config/skills'

defineProps<{
  skill: SkillDefinition
}>()
</script>

<template>
  <NuxtLink :to="skill.route" class="block">
    <Card
      class="transition-shadow duration-150 hover:shadow-md"
      :data-testid="`skill-card-${skill.id}`"
    >
      <CardHeader class="flex flex-row items-center gap-3 pb-2">
        <!-- Skill icon -->
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <component
            :is="skill.iconComponent"
            v-if="skill.iconComponent"
            class="h-5 w-5 text-primary"
          />
        </div>
        <div>
          <CardTitle class="text-base">{{ skill.name }}</CardTitle>
        </div>
      </CardHeader>

      <CardContent>
        <p class="text-sm text-muted-foreground">
          {{ skill.description }}
        </p>
      </CardContent>
    </Card>
  </NuxtLink>
</template>
