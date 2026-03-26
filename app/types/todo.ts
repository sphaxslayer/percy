/**
 * app/types/todo.ts — TypeScript interfaces for the TodoAtHome skill.
 * Matches the Prisma models with serialized types for client-side usage.
 */

export interface HouseholdMember {
  id: string;
  name: string;
  avatar: string | null;
  role: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface TodoDomain {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  _count: { contexts: number };
}

export interface TodoContext {
  id: string;
  domainId: string;
  name: string;
  icon: string | null;
  color: string;
  imageUrl: string | null;
  sortOrder: number;
  isGlobal: boolean;
  createdAt: string;
  _count: { tasks: number };
}

export interface TodoSubtask {
  id: string;
  title: string;
  completed: boolean;
  sortOrder: number;
}

export interface TodoTaskContext {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  domainId: string;
}

export interface TodoTaskAssignee {
  id: string;
  name: string;
  avatar: string | null;
}

export interface TodoTask {
  id: string;
  contextId: string;
  context: TodoTaskContext;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'normal' | 'high';
  color: string | null;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: TodoTaskAssignee | null;
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  subtasks: TodoSubtask[];
}

export interface TodoTaskInput {
  contextId: string;
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'normal' | 'high';
  color?: string | null;
  dueDate?: string | null;
  assigneeId?: string | null;
  subtasks?: { title: string }[];
}

export interface TodoTaskFilters {
  contextId?: string;
  domainId?: string;
  status?: string;
  priority?: string;
  assigneeId?: string;
  search?: string;
  sort?: 'createdAt' | 'dueDate' | 'priority' | 'sortOrder';
  order?: 'asc' | 'desc';
  withDueDate?: boolean;
}

export type ColorMode = 'context' | 'assignee' | 'priority';
