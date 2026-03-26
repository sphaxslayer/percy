/**
 * Unit tests for the todo tasks composable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTodoTasks } from '~/composables/use-todo-tasks';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

const TEST_TASK = {
  id: 'task-1',
  contextId: 'ctx-1',
  context: { id: 'ctx-1', name: 'Cuisine', color: '#F59E0B', icon: '🍳', domainId: 'domain-1' },
  title: 'Nettoyer le four',
  description: null,
  status: 'todo' as const,
  priority: 'normal' as const,
  color: null,
  dueDate: null,
  assigneeId: null,
  assignee: null,
  sortOrder: 0,
  completedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  subtasks: [],
};

const HIGH_TASK = { ...TEST_TASK, id: 'task-2', priority: 'high' as const, title: 'Urgent' };

describe('useTodoTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchTasks populates the list', async () => {
    mockFetch.mockResolvedValue({ data: [TEST_TASK, HIGH_TASK] });
    const { tasks, fetchTasks, openCount, urgentCount } = useTodoTasks();

    await fetchTasks();

    expect(tasks.value).toHaveLength(2);
    expect(openCount.value).toBe(2);
    expect(urgentCount.value).toBe(1);
  });

  it('fetchTasks builds query string from filters', async () => {
    mockFetch.mockResolvedValue({ data: [] });
    const { fetchTasks } = useTodoTasks();

    await fetchTasks({ status: 'todo', contextId: 'ctx-1' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('status=todo'),
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('contextId=ctx-1'),
    );
  });

  it('addTask prepends to task list', async () => {
    mockFetch.mockResolvedValue({ data: TEST_TASK });
    const { tasks, addTask } = useTodoTasks();

    await addTask({ contextId: 'ctx-1', title: 'Nettoyer le four' });

    expect(tasks.value).toHaveLength(1);
    expect(tasks.value[0]!.title).toBe('Nettoyer le four');
  });

  it('toggleTaskDone switches between todo and done', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [TEST_TASK] })
      .mockResolvedValueOnce({ data: { ...TEST_TASK, status: 'done' } });

    const { tasks, fetchTasks, toggleTaskDone } = useTodoTasks();
    await fetchTasks();
    await toggleTaskDone('task-1');

    expect(mockFetch).toHaveBeenLastCalledWith(
      '/api/skills/todo-at-home/tasks/task-1',
      expect.objectContaining({ body: { status: 'done' } }),
    );
    expect(tasks.value[0]!.status).toBe('done');
  });

  it('tasksByStatus groups correctly', async () => {
    const doneTask = { ...TEST_TASK, id: 'task-3', status: 'done' as const };
    const inProgressTask = { ...TEST_TASK, id: 'task-4', status: 'in_progress' as const };
    mockFetch.mockResolvedValue({ data: [TEST_TASK, doneTask, inProgressTask] });

    const { fetchTasks, tasksByStatus } = useTodoTasks();
    await fetchTasks();

    expect(tasksByStatus.value.todo).toHaveLength(1);
    expect(tasksByStatus.value.in_progress).toHaveLength(1);
    expect(tasksByStatus.value.done).toHaveLength(1);
  });

  it('removeTask filters from list', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [TEST_TASK] })
      .mockResolvedValueOnce({});

    const { tasks, fetchTasks, removeTask } = useTodoTasks();
    await fetchTasks();
    await removeTask('task-1');

    expect(tasks.value).toHaveLength(0);
  });

  it('addSubtask appends to task subtasks', async () => {
    const subtask = { id: 'sub-1', title: 'Étape 1', completed: false, sortOrder: 0 };
    mockFetch
      .mockResolvedValueOnce({ data: [TEST_TASK] })
      .mockResolvedValueOnce({ data: subtask });

    const { tasks, fetchTasks, addSubtask } = useTodoTasks();
    await fetchTasks();
    await addSubtask('task-1', 'Étape 1');

    expect(tasks.value[0]!.subtasks).toHaveLength(1);
    expect(tasks.value[0]!.subtasks[0]!.title).toBe('Étape 1');
  });

  it('toggleSubtask updates the subtask', async () => {
    const taskWithSub = {
      ...TEST_TASK,
      subtasks: [{ id: 'sub-1', title: 'Étape 1', completed: false, sortOrder: 0 }],
    };
    const toggledSub = { id: 'sub-1', title: 'Étape 1', completed: true, sortOrder: 0 };
    mockFetch
      .mockResolvedValueOnce({ data: [taskWithSub] })
      .mockResolvedValueOnce({ data: toggledSub });

    const { tasks, fetchTasks, toggleSubtask } = useTodoTasks();
    await fetchTasks();
    await toggleSubtask('task-1', 'sub-1');

    expect(tasks.value[0]!.subtasks[0]!.completed).toBe(true);
  });

  it('removeSubtask filters from subtasks', async () => {
    const taskWithSub = {
      ...TEST_TASK,
      subtasks: [{ id: 'sub-1', title: 'Étape 1', completed: false, sortOrder: 0 }],
    };
    mockFetch
      .mockResolvedValueOnce({ data: [taskWithSub] })
      .mockResolvedValueOnce({});

    const { tasks, fetchTasks, removeSubtask } = useTodoTasks();
    await fetchTasks();
    await removeSubtask('task-1', 'sub-1');

    expect(tasks.value[0]!.subtasks).toHaveLength(0);
  });
});
