import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true, // allow access from network
    allowedHosts: ['server1'], // add your hostname here
  },
})