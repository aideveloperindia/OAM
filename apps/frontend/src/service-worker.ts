/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{
    url: string
    revision: string | null
  }>
}

interface BackgroundSyncEvent extends Event {
  readonly tag: string
  waitUntil: (promise: Promise<unknown>) => void
}

const OFFLINE_CACHE = 'collegeattend-offline'
const API_CACHE = 'collegeattend-api'
const STATIC_CACHE = 'collegeattend-static'
const IMAGE_CACHE = 'collegeattend-images'
const OFFLINE_FALLBACK_URL = '/offline.html'
const BACKGROUND_SYNC_TAG = 'collegeattend-attendance-sync'

self.skipWaiting()
clientsClaim()

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(OFFLINE_CACHE)
      .then((cache) => cache.addAll([OFFLINE_FALLBACK_URL]))
      .catch((error) => console.error('Offline cache prime failed', error))
  )
})

registerRoute(
  new NavigationRoute(async ({ request }) => {
    try {
      const response = await fetch(request)
      if (!response || response.status >= 500) {
        throw new Error(`Bad response: ${response?.status}`)
      }
      return response
    } catch {
      const cache = await caches.open(OFFLINE_CACHE)
      const cached = await cache.match(OFFLINE_FALLBACK_URL)
      return cached ?? Response.error()
    }
  })
)

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: API_CACHE,
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 10
      })
    ]
  })
)

registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: STATIC_CACHE
  })
)

registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: IMAGE_CACHE,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30
      })
    ]
  })
)

self.addEventListener('sync', (event) => {
  const syncEvent = event as BackgroundSyncEvent
  if (syncEvent.tag === BACKGROUND_SYNC_TAG) {
    syncEvent.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'SYNC_ATTENDANCE' })
          })
        })
    )
  }
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})


