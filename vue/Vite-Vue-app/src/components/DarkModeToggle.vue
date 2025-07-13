<!-- src/components/DarkModeToggle.vue -->
<script setup lang="ts">
import { Sun, Moon } from 'lucide-vue-next'
import { useDarkMode } from '@/composables/useDarkMode'
import { Button } from '@/components/ui/button'

const { isDark, toggle } = useDarkMode()
</script>

<template>
  <Button 
    @click="toggle" 
    variant="ghost" 
    size="icon"
    aria-label="Toggle dark mode"
  >
    <Sun v-if="isDark" class="h-5 w-5" />
    <Moon v-else class="h-5 w-5" />
  </Button>
</template>