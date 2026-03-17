/**
 * app/composables/use-offline-queue.ts — Offline-resilient action queue.
 *
 * All mutating actions (create, update, delete) go through this queue.
 * Actions are applied optimistically to local state, then synced to the
 * server in FIFO order. If the network is down, actions wait in the queue
 * and are retried when connectivity returns.
 *
 * The queue is persisted in localStorage to survive page refreshes.
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface QueuedAction {
  id: string
  /** Key used for deduplication (e.g. "item:abc123" or "item:temp-xyz") */
  entityKey: string
  type: 'create' | 'update' | 'delete'
  endpoint: string
  method: 'POST' | 'PATCH' | 'DELETE'
  body?: Record<string, unknown>
  timestamp: number
  retryCount: number
}

export type RollbackFn = () => void
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SuccessFn = (data: any) => void

const STORAGE_KEY = 'percy:offline-queue'
const MAX_RETRIES = 5
const RETRY_INTERVAL_MS = 10_000

/**
 * Creates an offline-resilient action queue.
 * Each composable that needs offline support should create its own queue
 * instance with a unique storage key prefix.
 */
export function useOfflineQueue(storagePrefix = '') {
  const queue = ref<QueuedAction[]>([])
  const isSyncing = ref(false)
  const isOnline = ref(true)

  const pendingCount = computed(() => queue.value.length)
  const hasPending = computed(() => queue.value.length > 0)

  const storageKey = storagePrefix ? `${STORAGE_KEY}:${storagePrefix}` : STORAGE_KEY

  // ─── Persistence ──────────────────────────────────────────────────
  function saveToStorage() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(queue.value))
    } catch {
      // localStorage full or unavailable — queue stays in memory only
    }
  }

  function loadFromStorage() {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        queue.value = JSON.parse(stored)
      }
    } catch {
      queue.value = []
    }
  }

  // ─── Deduplication ────────────────────────────────────────────────
  function deduplicateQueue(newAction: QueuedAction): QueuedAction[] {
    const existing = queue.value
    const key = newAction.entityKey

    // Delete always wins — remove any pending create/update for this entity
    if (newAction.type === 'delete') {
      const filtered = existing.filter((a) => a.entityKey !== key)
      return [...filtered, newAction]
    }

    // Update replaces a previous update for the same entity
    if (newAction.type === 'update') {
      const pendingCreate = existing.find((a) => a.entityKey === key && a.type === 'create')
      if (pendingCreate) {
        // Merge update data into the pending create's body
        return existing.map((a) =>
          a.id === pendingCreate.id
            ? { ...a, body: { ...a.body, ...newAction.body }, timestamp: newAction.timestamp }
            : a,
        )
      }
      // Replace previous update for the same entity
      const hasUpdate = existing.some((a) => a.entityKey === key && a.type === 'update')
      if (hasUpdate) {
        return existing.map((a) =>
          a.entityKey === key && a.type === 'update' ? { ...newAction, id: a.id } : a,
        )
      }
    }

    return [...existing, newAction]
  }

  // ─── Queue Management ─────────────────────────────────────────────
  function enqueue(
    action: Omit<QueuedAction, 'id' | 'timestamp' | 'retryCount'>,
    rollback?: RollbackFn,
    onSuccess?: SuccessFn,
  ): string {
    const id = crypto.randomUUID()
    const queuedAction: QueuedAction = {
      ...action,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    }

    queue.value = deduplicateQueue(queuedAction)
    saveToStorage()

    // Try to flush immediately if online
    if (isOnline.value) {
      flush(rollback, onSuccess)
    }

    return id
  }

  async function flush(rollback?: RollbackFn, onSuccess?: SuccessFn) {
    if (isSyncing.value || queue.value.length === 0) return
    isSyncing.value = true

    // Process queue in FIFO order
    while (queue.value.length > 0) {
      const action = queue.value[0]!
      try {
        const data = await $fetch(action.endpoint, {
          method: action.method,
          body: action.body,
        })
        // Success — remove from queue and notify caller
        queue.value = queue.value.slice(1)
        saveToStorage()
        onSuccess?.(data)
      } catch (error: unknown) {
        const fetchError = error as { status?: number; statusCode?: number }
        const status = fetchError?.status ?? fetchError?.statusCode ?? 0

        if (status >= 400 && status < 500) {
          // Client error (validation, not found, etc.) — remove from queue + rollback
          queue.value = queue.value.slice(1)
          saveToStorage()
          rollback?.()
          break
        }

        // Network error or server error — increment retry and stop flushing
        action.retryCount++
        if (action.retryCount >= MAX_RETRIES) {
          queue.value = queue.value.slice(1)
          saveToStorage()
          rollback?.()
        }
        break
      }
    }

    isSyncing.value = false
  }

  // ─── Online/Offline Detection ─────────────────────────────────────
  let retryTimer: ReturnType<typeof setInterval> | null = null

  function handleOnline() {
    isOnline.value = true
    flush()
  }

  function handleOffline() {
    isOnline.value = false
  }

  function startRetryTimer() {
    retryTimer = setInterval(() => {
      if (isOnline.value && queue.value.length > 0) {
        flush()
      }
    }, RETRY_INTERVAL_MS)
  }

  onMounted(() => {
    isOnline.value = navigator.onLine
    loadFromStorage()
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    startRetryTimer()

    // Flush any persisted actions from a previous session
    if (isOnline.value && queue.value.length > 0) {
      flush()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (retryTimer) clearInterval(retryTimer)
  })

  return {
    queue,
    pendingCount,
    hasPending,
    isSyncing,
    isOnline,
    enqueue,
    flush,
  }
}
