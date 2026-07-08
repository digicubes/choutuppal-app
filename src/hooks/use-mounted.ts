'use client'

import { useSyncExternalStore } from 'react'

// ─── External mounted state ────────────────────────────────────────────────
// Module-level variable that transitions from false to true AFTER hydration.
// On the server, this is always false.
// On the client, it starts as false and becomes true after requestAnimationFrame.

let clientMounted = false
const subscribers = new Set<() => void>()

function subscribe(callback: () => void): () => void {
  subscribers.add(callback)
  return () => subscribers.delete(callback)
}

function getSnapshot(): boolean {
  return clientMounted
}

function getServerSnapshot(): boolean {
  return false
}

// Schedule the mounted=true transition AFTER hydration on the client.
// requestAnimationFrame fires after the browser has completed layout,
// which is after React hydration. This ensures:
// 1. Server render: getServerSnapshot() = false
// 2. Client first render (hydration): getSnapshot() = false ← MATCHES SERVER
// 3. After rAF fires: clientMounted = true → subscribers notified → re-render
if (typeof window !== 'undefined') {
  requestAnimationFrame(() => {
    clientMounted = true
    subscribers.forEach((cb) => cb())
  })
}

/**
 * useMounted — Returns true only after the component has mounted on the client.
 *
 * HYDRATION SAFE: The previous implementation used useSyncExternalStore with
 * getSnapshot() returning true on the client, which caused hydration mismatches
 * because the server rendered with false but the client's first render used true.
 *
 * This version returns false on BOTH server and client's first render,
 * then transitions to true after hydration via requestAnimationFrame.
 * Components that conditionally render based on useMounted() will now
 * produce identical HTML on server and client first paint, eliminating
 * hydration mismatch errors.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
