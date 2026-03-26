/**
 * app/composables/use-todo-agenda.ts — Agenda view composable.
 * Groups tasks by day for calendar-like display.
 */
import { computed } from 'vue';
import type { TodoTask } from '~/types/todo';

export interface AgendaDay {
  date: string; // ISO date string (YYYY-MM-DD)
  label: string; // "Aujourd'hui", "Demain", "Mercredi 26 mars"
  tasks: TodoTask[];
}

function formatDayLabel(date: Date, today: Date): string {
  const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  if (diff === -1) return 'Hier';

  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function toDateKey(dateStr: string): string {
  return dateStr.slice(0, 10); // "2026-03-26T..." → "2026-03-26"
}

export function useTodoAgenda(tasksRef: () => TodoTask[]) {
  /** Tasks that have a dueDate, sorted by date */
  const scheduledTasks = computed(() => {
    return tasksRef()
      .filter((t) => t.dueDate !== null)
      .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());
  });

  /** Tasks without a dueDate */
  const unscheduledTasks = computed(() => {
    return tasksRef().filter((t) => t.dueDate === null && t.status !== 'done');
  });

  /** Tasks grouped by day */
  const agendaDays = computed<AgendaDay[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const groups = new Map<string, TodoTask[]>();

    for (const task of scheduledTasks.value) {
      const key = toDateKey(task.dueDate!);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(task);
    }

    const days: AgendaDay[] = [];
    for (const [dateKey, dayTasks] of groups) {
      const date = new Date(dateKey + 'T00:00:00');
      days.push({
        date: dateKey,
        label: formatDayLabel(date, today),
        tasks: dayTasks,
      });
    }

    return days.sort((a, b) => a.date.localeCompare(b.date));
  });

  /** Overdue tasks (dueDate < today, not done) */
  const overdueTasks = computed(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return scheduledTasks.value.filter(
      (t) => t.status !== 'done' && new Date(t.dueDate!) < now,
    );
  });

  /** Today's tasks */
  const todayTasks = computed(() => {
    const todayKey = toDateKey(new Date().toISOString());
    return scheduledTasks.value.filter((t) => toDateKey(t.dueDate!) === todayKey);
  });

  return {
    scheduledTasks,
    unscheduledTasks,
    agendaDays,
    overdueTasks,
    todayTasks,
  };
}
