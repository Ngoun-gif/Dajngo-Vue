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
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  type Subject
} from '@/services/subjectService'

const SquarePenIcon = SquarePen
const Trash2Icon = Trash2
const PackagePlusIcon = PackagePlus

const subjects = ref<Subject[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')

const currentPage = ref(1)
const itemsPerPage = ref(10)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const currentEditingSubject = ref<Subject | null>(null)

const newSubjectName = ref('')
const editingSubjectName = ref('')

const filteredSubjects = computed(() => {
  if (!searchQuery.value) return subjects.value
  return subjects.value.filter(subject =>
    subject.subject_name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    subject.id.toString().includes(searchQuery.value))
})

const paginatedSubjects = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredSubjects.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredSubjects.value.length / itemsPerPage.value)
})

async function load() {
  loading.value = true
  error.value = null
  try {
    subjects.value = await fetchSubjects()
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load subjects. Please try again later.'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  newSubjectName.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function openEditModal(subject: Subject) {
  currentEditingSubject.value = subject
  editingSubjectName.value = subject.subject_name
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  currentEditingSubject.value = null
  editingSubjectName.value = ''
}

async function handleCreate() {
  if (!newSubjectName.value.trim()) return

  try {
    const newSubj = await createSubject({ subject_name: newSubjectName.value.trim() })
    subjects.value.unshift(newSubj)
    closeCreateModal()
    await Swal.fire({
      position: "top-end",
      title: 'Success!',
      text: 'Subject created successfully',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
    currentPage.value = 1
  } catch (err) {
    console.error(err)
    await Swal.fire({
      position: "top-end",
      title: 'Error!',
      text: 'Failed to create subject',
      icon: 'error',
      timer: 1500,
      showConfirmButton: false
    })
  }
}

async function handleUpdate() {
  if (!currentEditingSubject.value || !editingSubjectName.value.trim()) return

  try {
    const updated = await updateSubject(currentEditingSubject.value.id, {
      subject_name: editingSubjectName.value.trim()
    })
    const index = subjects.value.findIndex(s => s.id === currentEditingSubject.value?.id)
    if (index !== -1) {
      subjects.value.splice(index, 1, updated)
    }
    closeEditModal()
    await Swal.fire({
      position: "top-end",
      title: 'Success!',
      text: 'Subject updated successfully',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false
    })
  } catch (err) {
    console.error(err)
    await Swal.fire({
      position: "top-end",
      title: 'Error!',
      text: 'Failed to update subject',
      icon: 'error',
      timer: 1500,
      showConfirmButton: false
    })
  }
}

async function confirmDelete(subject: Subject) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `You are about to delete "${subject.subject_name}". This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  })

  if (result.isConfirmed) {
    try {
      await deleteSubject(subject.id)
      subjects.value = subjects.value.filter(s => s.id !== subject.id)
      await Swal.fire({
        position: "top-end",
        title: 'Deleted!',
        text: 'Subject has been deleted.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      })
      if (paginatedSubjects.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      console.error(err)
      await Swal.fire({
        position: "top-end",
        title: 'Error!',
        text: 'Failed to delete subject',
        icon: 'error',
        timer: 1500,
        showConfirmButton: false
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
function formatDateTime(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth()+1)
    .toString().padStart(2, '0')}-${date.getFullYear()} ${date.getHours()
    .toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const userIdToName: Record<number, string> = {
  1: 'Admin',
  2: 'Staff A',
  3: 'Staff B',
}


onMounted(() => {
  load()
})
</script>
<template>
  <div class="p-3 space-y-6">
    <!-- Header Section -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Subject Management</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Manage your subjects</p>
    </div>

    <!-- Search and Add Subject -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div class="relative flex-1 md:max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search subjects..."
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
        <span>New Subject</span>
      </button>
    </div>

    <!-- Subject Table -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Updated At</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created By</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Updated By</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading">
            <td colspan="3" class="px-6 py-4 text-center">
              <div class="inline-flex items-center justify-center space-x-2">
                <ArrowPathIcon class="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span class="text-gray-600 dark:text-gray-300">Loading subjects...</span>
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
          <tr v-else-if="filteredSubjects.length === 0">
            <td colspan="3" class="px-6 py-4 text-center">
              <div class="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                <FolderIcon class="h-12 w-12 opacity-40" />
                <p class="text-lg">No subjects found</p>
                <p v-if="searchQuery" class="text-sm">No results for "{{ searchQuery }}"</p>
              </div>
            </td>
          </tr>
          <tr
            v-else
            v-for="(subject, index) in paginatedSubjects"
            :key="subject.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ (currentPage - 1) * itemsPerPage + index + 1 }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ subject.subject_name }}
            </td>
           <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              {{ formatDateTime(subject.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              {{ formatDateTime(subject.updated_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              {{ userIdToName[subject.created_by ?? 0] || '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              {{ userIdToName[subject.updated_by ?? 0] || '-' }}
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button
                @click="openEditModal(subject)"
                class="inline-flex items-center px-3 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors duration-200"
              >
                <SquarePenIcon class="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                @click="() => confirmDelete(subject)"
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
              <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredSubjects.length) }}</span>
              of
              <span class="font-medium">{{ filteredSubjects.length }}</span>
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

    <!-- Create Subject Modal -->
    <Dialog :open="showCreateModal" @update:open="val => val || closeCreateModal()">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Subject</DialogTitle>
          <DialogDescription>Add a new subject to your list</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">Name</Label>
            <Input
              id="name"
              v-model="newSubjectName"
              class="col-span-3"
              placeholder="Subject name"
              @keyup.enter="handleCreate"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeCreateModal">Cancel</Button>
          <Button type="submit" @click="handleCreate" :disabled="!newSubjectName.trim()">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Subject Modal -->
    <Dialog :open="showEditModal" @update:open="val => val || closeEditModal()">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>Update the subject name</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-name" class="text-right">Name</Label>
            <Input
              id="edit-name"
              v-model="editingSubjectName"
              class="col-span-3"
              placeholder="Subject name"
              @keyup.enter="handleUpdate"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeEditModal">Cancel</Button>
          <Button
            type="submit"
            @click="handleUpdate"
            :disabled="!editingSubjectName.trim() || editingSubjectName.trim() === currentEditingSubject?.subject_name"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
