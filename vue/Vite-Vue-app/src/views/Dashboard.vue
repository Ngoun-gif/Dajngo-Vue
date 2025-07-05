<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-3xl font-bold">Dashboard</h1>
      <p class="text-muted-foreground mt-1">
        Welcome back! Here's your overview!
      </p>
    </div>

    <!-- Top Metrics Row -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Metric Cards -->
      <Card class="bg-white shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Categories Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold">2</p>
        </CardContent>
      </Card>

      <Card class="bg-white shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Products Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold">2</p>
        </CardContent>
      </Card>

      <Card class="bg-white shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Order Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold">2</p>
        </CardContent>
      </Card>

      <Card class="bg-white shadow-sm">
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Order Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-2xl font-bold">2</p>
        </CardContent>
      </Card>
    </div>

    <!-- Recent Activity -->
    <Card class="mt-6">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent class="min-h-[420px]">
        <div class="space-y-4">
          <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
              <List class="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <p class="font-medium">No recent activity</p>
              <p class="text-sm text-muted-foreground">Your activities will appear here</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { List } from 'lucide-vue-next'
</script>
