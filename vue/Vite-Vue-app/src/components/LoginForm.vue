<script setup lang="ts">
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { login } from '@/services/authService'
import type { HTMLAttributes } from 'vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

async function handleSubmit(event: Event) {
  event.preventDefault()
  loading.value = true
  errorMessage.value = ''

  if (!username.value || !password.value) {
    errorMessage.value = 'Please enter both username and password'
    loading.value = false
    return
  }

  try {
    const { access, refresh } = await login(username.value, password.value)
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    router.push('/dashboard')
  } catch (err: any) {
    if (err?.response?.status === 401) {
      errorMessage.value = 'Invalid username or password'
    } else if (err instanceof Error) {
      errorMessage.value = err.message || 'Something went wrong. Please try again.'
    } else {
      errorMessage.value = 'An unexpected error occurred.'
    }
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <form 
    :class="cn('flex flex-col gap-6', props.class)"
    @submit="handleSubmit"
  >
    <div class="flex flex-col items-center gap-2 text-center">
      <h1 class="text-2xl font-bold text-foreground">
        Login to your account
      </h1>
      <p class="text-balance text-sm text-muted-foreground">
        Enter your credentials below to login
      </p>
    </div>

    <div v-if="errorMessage" class="text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">
      {{ errorMessage }}
    </div>

    <div class="grid gap-6">
      <div class="grid gap-2">
        <Label for="username">Username</Label>
        <Input 
          id="username" 
          v-model="username"
          type="text" 
          placeholder="Enter your username" 
          required
          :disabled="loading"
          class="dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-gray-500"
        />
      </div>

      <div class="grid gap-2">
        <div class="flex items-center">
          <Label for="password">Password</Label>
          <a
            href="#"
            class="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground"
          >
            Forgot your password?
          </a>
        </div>
        <Input 
          id="password" 
          v-model="password"
          type="password" 
          placeholder="Enter your password"
          required
          :disabled="loading"
          class="dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:ring-gray-500"
        />
      </div>

      <Button 
        type="submit" 
        class="w-full"
        :disabled="loading"
      >
        <span v-if="loading" class="flex items-center justify-center">
          <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Logging in...
        </span>
        <span v-else>
          Login
        </span>
      </Button>

      <div class="relative text-center text-sm">
        <div class="absolute inset-0 flex items-center">
          <span class="w-full border-t border-border dark:border-gray-700" />
        </div>
        <span class="relative bg-background px-2 text-muted-foreground">
          Or continue with
        </span>
      </div>

      <Button 
        variant="outline" 
        class="w-full"
        type="button"
        :disabled="loading"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24"
          class="mr-2 h-4 w-4"
        >
          <path
            d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
            fill="currentColor"
          />
        </svg>
        Login with GitHub
      </Button>
    </div>

    <div class="text-center text-sm text-muted-foreground">
      Don't have an account?
      <router-link 
        to="/register" 
        class="font-medium underline underline-offset-4 text-primary hover:text-primary/80"
      >
        Sign up
      </router-link>
    </div>
  </form>
</template>