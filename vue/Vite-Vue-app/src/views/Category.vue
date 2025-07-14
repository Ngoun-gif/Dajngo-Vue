<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Swal from 'sweetalert2'
import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  FolderIcon
} from '@heroicons/vue/24/outline'
import {
  SquarePen,
  Trash2,
  PackagePlus
} from 'lucide-vue-next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  fetchCategories,
  createCategories,
  updateCategories,
  deleteCategories,
  type Category
} from '@/services/categoryService'

const SquarePenIcon = SquarePen
const Trash2Icon = Trash2
const PackagePlusIcon = PackagePlus

const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')

const currentPage = ref(1)
const itemsPerPage = ref(10)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const currentEditingCategory = ref<Category | null>(null)

const newCategoryName = ref('')
const editingName = ref('')

const filteredCategories = computed(() => {
  if (!searchQuery.value) return categories.value
  return categories.value.filter(category =>
    category.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    category.id.toString().includes(searchQuery.value))
})

const paginatedCategories = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredCategories.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredCategories.value.length / itemsPerPage.value)
})

async function loadCategories() {
  loading.value = true
  error.value = null
  try {
    categories.value = await fetchCategories()
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load categories. Please try again later.'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  newCategoryName.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function openEditModal(category: Category) {
  currentEditingCategory.value = category
  editingName.value = category.name
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  currentEditingCategory.value = null
  editingName.value = ''
}

async function handleCreate() {
  if (!newCategoryName.value.trim()) return

  try {
    const newCat = await createCategories({ name: newCategoryName.value.trim() })
    categories.value.unshift(newCat)
    closeCreateModal()
    await Swal.fire({
      position: "top-end",
      title: 'Success!',
      text: 'Category created successfully',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,

    })
    currentPage.value = 1
  } catch (err) {
    console.error(err)
    await Swal.fire({
      position: "top-end",
      title: 'Error!',
      text: 'Failed to create category',
      icon: 'error',
      timer: 1500,
      showConfirmButton: false,

    })
  }
}

async function handleUpdate() {
  if (!currentEditingCategory.value || !editingName.value.trim()) return

  try {
    const updated = await updateCategories(currentEditingCategory.value.id, {
      name: editingName.value.trim()
    })
    const index = categories.value.findIndex(c => c.id === currentEditingCategory.value?.id)
    if (index !== -1) {
      categories.value.splice(index, 1, updated)
    }
    closeEditModal()
    await Swal.fire({
      position: "top-end",
      title: 'Success!',
      text: 'Category updated successfully',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,

    })
  } catch (err) {
    console.error(err)
    await Swal.fire({
      position: "top-end",
      title: 'Error!',
      text: 'Failed to update category',
      icon: 'error',
      timer: 1500,
      showConfirmButton: false,

    })
  }
}

async function confirmDelete(category: Category) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `You are about to delete "${category.name}". This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',

  })

  if (result.isConfirmed) {
    try {
      await deleteCategories(category.id)
      categories.value = categories.value.filter(c => c.id !== category.id)
      await Swal.fire({
        position: "top-end",
        title: 'Deleted!',
        text: 'Category has been deleted.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,

      })
      if (paginatedCategories.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      console.error(err)
      await Swal.fire({
        position: "top-end",
        title: 'Error!',
        text: 'Failed to delete category',
        icon: 'error',
        timer: 1500,
        showConfirmButton: false,

      })
    }
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

onMounted(() => {
  loadCategories()
})
</script>

<template>
  <div class="p-3 space-y-6">
    <!-- Header Section -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Category Management</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Manage your categories</p>
    </div>

    <!-- Search and Add Category -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div class="relative flex-1 md:max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search categories..."
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          @input="currentPage = 1"
        />
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center space-x-1 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
      >
        <PackagePlusIcon class="w-5 h-5" />
        <span>New Category</span>
      </button>
    </div>

    <!-- Category Table -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NAME</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ACTIONS</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading">
            <td colspan="3" class="px-6 py-4 text-center">
              <div class="inline-flex items-center justify-center space-x-2">
                <ArrowPathIcon class="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span class="text-gray-600 dark:text-gray-300">Loading categories...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="error">
            <td colspan="3" class="px-6 py-4 text-center">
              <div class="inline-flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-300">
                <ExclamationTriangleIcon class="h-5 w-5 mr-2" />
                {{ error }}
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredCategories.length === 0">
            <td colspan="3" class="px-6 py-4 text-center">
              <div class="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                <FolderIcon class="h-12 w-12 opacity-40" />
                <p class="text-lg">No categories found</p>
                <p v-if="searchQuery" class="text-sm">No results for "{{ searchQuery }}"</p>
              </div>
            </td>
          </tr>
          <tr
            v-else
            v-for="(category, index) in paginatedCategories"
            :key="category.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ (currentPage - 1) * itemsPerPage + index + 1 }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ category.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button
                @click="openEditModal(category)"
                class="inline-flex items-center px-3 py-1 rounded-md
                      bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors duration-200"
              >
                <SquarePenIcon class="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                @click="() => confirmDelete(category)"
                class="inline-flex items-center px-3 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors duration-200"
              >
                <Trash2Icon class="h-4 w-4 mr-1" />
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="bg-white dark:bg-gray-900 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Previous
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Showing
              <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span>
              to
              <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredCategories.length) }}</span>
              of
              <span class="font-medium">{{ filteredCategories.length }}</span>
              results
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                @click="prevPage"
                :disabled="currentPage === 1"
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span class="sr-only">Previous</span>
                &lt;
              </button>

              <!-- Page numbers -->
              <button
                v-for="page in totalPages"
                :key="page"
                @click="goToPage(page)"
                :class="{
                  'bg-blue-50 dark:bg-blue-900/30 border-blue-500 dark:border-blue-600 text-blue-600 dark:text-blue-200 z-10': currentPage === page,
                  'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700': currentPage !== page
                }"
                class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                {{ page }}
              </button>

              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span class="sr-only">Next</span>
                &gt;
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Category Modal -->
    <Dialog :open="showCreateModal" @update:open="val => val || closeCreateModal()">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Add a new category to your collection
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">
              Name
            </Label>
            <Input
              id="name"
              v-model="newCategoryName"
              class="col-span-3"
              placeholder="Category name"
              @keyup.enter="handleCreate"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeCreateModal">
            Cancel
          </Button>
          <Button
            type="submit"
            @click="handleCreate"
            :disabled="!newCategoryName.trim()"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Category Modal -->
    <Dialog :open="showEditModal" @update:open="val => val || closeEditModal()">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the category details
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-name" class="text-right">
              Name
            </Label>
            <Input
              id="edit-name"
              v-model="editingName"
              class="col-span-3"
              placeholder="Category name"
              @keyup.enter="handleUpdate"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeEditModal">
            Cancel
          </Button>
          <Button
            type="submit"
            @click="handleUpdate"
            :disabled="!editingName.trim() || editingName.trim() === currentEditingCategory?.name"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>