// stores/auth.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{
    name: string
    email: string
    avatar: string
  } | null>(null)

  function setUser(newUser: any) {
    user.value = newUser
  }

  function clearUser() {
    user.value = null
  }

  return { user, setUser, clearUser }
})