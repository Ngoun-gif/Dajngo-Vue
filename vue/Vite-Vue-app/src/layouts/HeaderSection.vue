<template>
  <header class="flex h-16 shrink-0 items-center gap-2 px-4 border-b border-gray-200">
    <div class="flex items-center gap-2">
      <SidebarTrigger class="-ml-1" />
      <Separator orientation="vertical" class="mr-2 h-4" />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem class="hidden md:block">
            <BreadcrumbLink href="#">
              {{ currentPageName }}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { useRoute } from 'vue-router'
import { computed } from 'vue'

// Get current route
const route = useRoute()

// Dynamic page name (you can enhance this with meta or mappings)
const currentPageName = computed(() => {
  const path = route.path
  if (path.includes('dashboard')) return 'Dashboard'
  if (path.includes('category')) return 'Category'
  if (path.includes('product')) return 'Product'
  return 'Unknown Page'
})
</script>
