import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    allowedHosts: [
      'classmate-sync.maruqes.com',
      '.maruqes.com'
    ]
  },
  preview: {
    allowedHosts: [
      'classmate-sync.maruqes.com',
      '.maruqes.com'
    ]
  }
})
