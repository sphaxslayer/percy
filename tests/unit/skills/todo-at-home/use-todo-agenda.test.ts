/**
 * Unit tests for the todo agenda composable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTodoAgenda } from '~/composables/use-todo-agenda';
import type { TodoTask } from '~/types/todo';

const makeTask = (overrides: Partial<TodoTask> = {}): TodoTask => ({
  id: 'task-1',
  contextId: 'ctx-1',
  context: { id: 'ctx-1', name: 'Cuisine', color: '#F59E0B', icon: '🍳', domainId: 'domain-1' },
  title: 'Test task',
  description: null,
  status: 'todo',
  priority: 'normal',
  color: null,
  dueDate: null,
  assigneeId: null,
  assignee: null,
  sortOrder: 0,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  subtasks: [],
  ...overrides,
});

describe('useTodoAgenda', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-26T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('separates scheduled and unscheduled tasks', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-03-26T12:00:00Z' }),
      makeTask({ id: '2', dueDate: null }),
    ];

    const { scheduledTasks, unscheduledTasks } = useTodoAgenda(() => tasks);

    expect(scheduledTasks.value).toHaveLength(1);
    expect(unscheduledTasks.value).toHaveLength(1);
  });

  it('groups tasks by day', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-03-26T09:00:00Z' }),
      makeTask({ id: '2', dueDate: '2026-03-26T14:00:00Z' }),
      makeTask({ id: '3', dueDate: '2026-03-27T10:00:00Z' }),
    ];

    const { agendaDays } = useTodoAgenda(() => tasks);

    expect(agendaDays.value).toHaveLength(2);
    expect(agendaDays.value[0]!.tasks).toHaveLength(2);
    expect(agendaDays.value[1]!.tasks).toHaveLength(1);
  });

  it('labels today and tomorrow correctly', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-03-26T12:00:00Z' }),
      makeTask({ id: '2', dueDate: '2026-03-27T12:00:00Z' }),
    ];

    const { agendaDays } = useTodoAgenda(() => tasks);

    expect(agendaDays.value[0]!.label).toBe("Aujourd'hui");
    expect(agendaDays.value[1]!.label).toBe('Demain');
  });

  it('identifies overdue tasks', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-03-25T12:00:00Z', status: 'todo' }),
      makeTask({ id: '2', dueDate: '2026-03-25T12:00:00Z', status: 'done' }),
      makeTask({ id: '3', dueDate: '2026-03-27T12:00:00Z', status: 'todo' }),
    ];

    const { overdueTasks } = useTodoAgenda(() => tasks);

    // Only task 1 is overdue (task 2 is done, task 3 is future)
    expect(overdueTasks.value).toHaveLength(1);
    expect(overdueTasks.value[0]!.id).toBe('1');
  });

  it('identifies today tasks', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: '2026-03-26T09:00:00Z' }),
      makeTask({ id: '2', dueDate: '2026-03-27T09:00:00Z' }),
    ];

    const { todayTasks } = useTodoAgenda(() => tasks);

    expect(todayTasks.value).toHaveLength(1);
    expect(todayTasks.value[0]!.id).toBe('1');
  });

  it('excludes done tasks from unscheduled', () => {
    const tasks = [
      makeTask({ id: '1', dueDate: null, status: 'done' }),
      makeTask({ id: '2', dueDate: null, status: 'todo' }),
    ];

    const { unscheduledTasks } = useTodoAgenda(() => tasks);

    expect(unscheduledTasks.value).toHaveLength(1);
  });
});
