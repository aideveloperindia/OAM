import axios, { AxiosHeaders } from 'axios'

const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

apiClient.interceptors.request.use((config) => {
  const stored = window.localStorage.getItem('oam::auth')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const token = parsed?.tokens?.accessToken
      if (token) {
        const headers =
          config.headers instanceof AxiosHeaders
            ? config.headers
            : new AxiosHeaders(config.headers ?? {})
        headers.set('Authorization', `Bearer ${token}`)
        config.headers = headers
      }
    } catch (error) {
      console.warn('Unable to parse auth cache', error)
    }
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!navigator.onLine) {
      return Promise.reject(
        new Error('You appear to be offline. Data will sync when online.')
      )
    }
    return Promise.reject(error)
  }
)

