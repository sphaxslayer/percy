/**
 * Unit tests for the offline queue composable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useOfflineQueue } from '~/composables/use-offline-queue'
import type { QueuedAction } from '~/composables/use-offline-queue'

// Mock $fetch
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Mock localStorage
const store: Record<string, string> = {}
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value },
  removeItem: (key: string) => { store[key] = undefined as never },
})

// Mock crypto.randomUUID
vi.stubGlobal('crypto', { randomUUID: () => 'mock-uuid' })

// Mock navigator.onLine
Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: true },
  writable: true,
})

// Stub Vue lifecycle hooks (not running in component context)
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...(actual as Record<string, unknown>),
    onMounted: vi.fn(),
    onUnmounted: vi.fn(),
  }
})

describe('useOfflineQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    for (const k of Object.keys(store)) store[k] = undefined as never
    mockFetch.mockResolvedValue({})
  })

  it('enqueues an action and flushes it', async () => {
    const { enqueue } = useOfflineQueue('test')

    enqueue({
      entityKey: 'item:1',
      type: 'create',
      endpoint: '/api/items',
      method: 'POST',
      body: { name: 'Lait' },
    })

    // After successful flush, queue should be empty
    // (flush is called automatically on enqueue when online)
    await vi.waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/items', {
        method: 'POST',
        body: { name: 'Lait' },
      })
    })
  })

  it('deduplicates updates for the same entity', () => {
    const { enqueue, queue } = useOfflineQueue('test-dedup')

    // Simulate offline — don't auto-flush
    mockFetch.mockImplementation(() => new Promise(() => {})) // never resolves

    enqueue({
      entityKey: 'item:1',
      type: 'update',
      endpoint: '/api/items/1',
      method: 'PATCH',
      body: { checked: true },
    })

    enqueue({
      entityKey: 'item:1',
      type: 'update',
      endpoint: '/api/items/1',
      method: 'PATCH',
      body: { checked: false },
    })

    // Should only have one update for item:1
    const item1Actions = queue.value.filter((a: QueuedAction) => a.entityKey === 'item:1')
    expect(item1Actions).toHaveLength(1)
    expect(item1Actions[0]!.body).toEqual({ checked: false })
  })

  it('delete removes pending create/update for the same entity', () => {
    const { enqueue, queue } = useOfflineQueue('test-delete')

    mockFetch.mockImplementation(() => new Promise(() => {}))

    enqueue({
      entityKey: 'item:2',
      type: 'create',
      endpoint: '/api/items',
      method: 'POST',
      body: { name: 'Pain' },
    })

    enqueue({
      entityKey: 'item:2',
      type: 'delete',
      endpoint: '/api/items/2',
      method: 'DELETE',
    })

    // Should only have the delete action
    const item2Actions = queue.value.filter((a: QueuedAction) => a.entityKey === 'item:2')
    expect(item2Actions).toHaveLength(1)
    expect(item2Actions[0]!.type).toBe('delete')
  })

  it('merges update into pending create for the same entity', () => {
    const { enqueue, queue } = useOfflineQueue('test-merge')

    mockFetch.mockImplementation(() => new Promise(() => {}))

    enqueue({
      entityKey: 'item:3',
      type: 'create',
      endpoint: '/api/items',
      method: 'POST',
      body: { name: 'Lait', quantity: 1 },
    })

    enqueue({
      entityKey: 'item:3',
      type: 'update',
      endpoint: '/api/items/3',
      method: 'PATCH',
      body: { quantity: 3 },
    })

    // Should merge into a single create
    const item3Actions = queue.value.filter((a: QueuedAction) => a.entityKey === 'item:3')
    expect(item3Actions).toHaveLength(1)
    expect(item3Actions[0]!.type).toBe('create')
    expect(item3Actions[0]!.body).toEqual({ name: 'Lait', quantity: 3 })
  })

  it('calls rollback on 4xx error', async () => {
    const rollback = vi.fn()
    mockFetch.mockRejectedValueOnce({ status: 400 })

    const { enqueue } = useOfflineQueue('test-rollback')

    enqueue(
      {
        entityKey: 'item:4',
        type: 'create',
        endpoint: '/api/items',
        method: 'POST',
        body: { name: '' },
      },
      rollback,
    )

    await vi.waitFor(() => {
      expect(rollback).toHaveBeenCalled()
    })
  })

  it('persists queue to localStorage', () => {
    const { enqueue } = useOfflineQueue('test-persist')

    mockFetch.mockImplementation(() => new Promise(() => {}))

    enqueue({
      entityKey: 'item:5',
      type: 'create',
      endpoint: '/api/items',
      method: 'POST',
      body: { name: 'Beurre' },
    })

    const stored = store['percy:offline-queue:test-persist']
    expect(stored).toBeDefined()
    const parsed = JSON.parse(stored!)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].entityKey).toBe('item:5')
  })

  it('leaves actions for different entities untouched', () => {
    const { enqueue, queue } = useOfflineQueue('test-different')

    mockFetch.mockImplementation(() => new Promise(() => {}))

    enqueue({
      entityKey: 'item:a',
      type: 'update',
      endpoint: '/api/items/a',
      method: 'PATCH',
      body: { checked: true },
    })

    enqueue({
      entityKey: 'item:b',
      type: 'update',
      endpoint: '/api/items/b',
      method: 'PATCH',
      body: { checked: false },
    })

    expect(queue.value).toHaveLength(2)
  })
})
