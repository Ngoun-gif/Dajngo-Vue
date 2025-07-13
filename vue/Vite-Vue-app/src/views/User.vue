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
  UserPlus
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
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  type User
} from '@/services/userService'

const SquarePenIcon = SquarePen
const Trash2Icon = Trash2
const UserPlusIcon = UserPlus

// State
const users = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const currentEditingUser = ref<User | null>(null)
const formErrors = ref<Record<string, string[]>>({})

// Form models
const newUser = ref({
  username: '',
  email: '',
  password: '',
  is_staff: false,
  is_active: true
})

const editingUser = ref({
  username: '',
  email: '',
  current_password: '',
  new_password: '',
  confirm_password: '',
  is_staff: false,
  is_active: true,
  changingPassword: false
})

// Computed properties
const filteredUsers = computed(() => {
  if (!searchQuery.value?.trim()) return users.value
  const searchTerm = searchQuery.value.toLowerCase().trim()
  return users.value.filter(user =>
    user.username?.toLowerCase().includes(searchTerm) ||
    user.email?.toLowerCase().includes(searchTerm))
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredUsers.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage.value)
})

// Methods
async function load() {
  loading.value = true
  error.value = null
  try {
    users.value = await fetchUsers()
  } catch (err) {
    console.error('Failed to load users:', err)
    error.value = 'Failed to load users. Please try again later.'
    await showErrorToast('Failed to load users')
  } finally {
    loading.value = false
  }
}

function resetForms() {
  newUser.value = {
    username: '',
    email: '',
    password: '',
    is_staff: false,
    is_active: true
  }
  editingUser.value = {
    username: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
    is_staff: false,
    is_active: true,
    changingPassword: false
  }
  formErrors.value = {}
}

async function showSuccessToast(message: string) {
  await Swal.fire({
    position: 'top-end',
    title: 'Success!',
    text: message,
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  })
}

async function showErrorToast(message: string) {
  await Swal.fire({
    position: 'top-end',
    title: 'Error!',
    text: message,
    icon: 'error',
    timer: 1500,
    showConfirmButton: false
  })
}

function openCreateModal() {
  resetForms()
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function openEditModal(user: User) {
  currentEditingUser.value = user
  editingUser.value = {
    username: user.username,
    email: user.email,
    current_password: '',
    new_password: '',
    confirm_password: '',
    is_staff: user.is_staff,
    is_active: user.is_active,
    changingPassword: false
  }
  formErrors.value = {}
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  currentEditingUser.value = null
  formErrors.value = {}
}

async function handleCreate() {
  if (!newUser.value.username.trim() || !newUser.value.email.trim() || !newUser.value.password.trim()) {
    await showErrorToast('Username, email and password are required')
    return
  }

  try {
    const createdUser = await createUser(newUser.value)
    users.value.unshift(createdUser)
    closeCreateModal()
    await showSuccessToast('User created successfully')
    currentPage.value = 1
  } catch (err: any) {
    console.error('Failed to create user:', err)
    if (err.response?.data) {
      formErrors.value = err.response.data
    }
    await showErrorToast('Failed to create user')
  }
}

async function handleUpdate() {
  if (!currentEditingUser.value) return

  // Reset errors
  formErrors.value = {}

  // Validate required fields
  if (!editingUser.value.username.trim() || !editingUser.value.email.trim()) {
    await showErrorToast('Username and email are required')
    return
  }

  // Current password is always required
  if (!editingUser.value.current_password.trim()) {
    formErrors.value.current_password = ['Current password is required']
    return
  }

  // If changing password, validate new password fields
  if (editingUser.value.changingPassword) {
    if (!editingUser.value.new_password.trim()) {
      formErrors.value.password = ['New password is required']
      return
    }
    if (editingUser.value.new_password !== editingUser.value.confirm_password) {
      await showErrorToast('New passwords do not match')
      return
    }
  }

  try {
    const payload: any = {
      username: editingUser.value.username,
      email: editingUser.value.email,
      current_password: editingUser.value.current_password,
      is_staff: editingUser.value.is_staff,
      is_active: editingUser.value.is_active
    }

    // Only include new password if changing it
    if (editingUser.value.changingPassword) {
      payload.password = editingUser.value.new_password
    }

    const updated = await updateUser(currentEditingUser.value.id, payload)
    const index = users.value.findIndex(u => u.id === currentEditingUser.value?.id)
    if (index !== -1) {
      users.value.splice(index, 1, updated)
    }
    closeEditModal()
    await showSuccessToast('User updated successfully')
  } catch (err: any) {
    console.error('Failed to update user:', err)
    if (err.response?.data) {
      formErrors.value = err.response.data
    }
    await showErrorToast('Failed to update user')
  }
}

async function confirmDelete(user: User) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `You are about to delete user "${user.username}". This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  })

  if (result.isConfirmed) {
    try {
      await deleteUser(user.id)
      users.value = users.value.filter(u => u.id !== user.id)
      await showSuccessToast('User has been deleted')

      if (paginatedUsers.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      console.error('Failed to delete user:', err)
      await showErrorToast('Failed to delete user')
    }
  }
}

// Pagination methods
function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) currentPage.value = page
}

// Lifecycle
onMounted(() => {
  load()
})
</script>

<template>
  <div class="p-3 space-y-6">
    <!-- Header Section -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">User Management</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Manage system users</p>
    </div>

    <!-- Search and Add User -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div class="relative flex-1 md:max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search users..."
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          @input="currentPage = 1"
        />
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center space-x-1 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
      >
        <UserPlusIcon class="w-5 h-5" />
        <span>New User</span>
      </button>
    </div>

    <!-- User Table -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Username</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Staff</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading">
            <td colspan="6" class="px-6 py-4 text-center">
              <div class="inline-flex items-center justify-center space-x-2">
                <ArrowPathIcon class="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span class="text-gray-600 dark:text-gray-300">Loading users...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="error">
            <td colspan="6" class="px-6 py-4 text-center">
              <div class="inline-flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-300">
                <ExclamationTriangleIcon class="h-5 w-5 mr-2" />
                {{ error }}
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredUsers.length === 0">
            <td colspan="6" class="px-6 py-4 text-center">
              <div class="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                <FolderIcon class="h-12 w-12 opacity-40" />
                <p class="text-lg">No users found</p>
                <p v-if="searchQuery" class="text-sm">No results for "{{ searchQuery }}"</p>
              </div>
            </td>
          </tr>
          <tr
            v-else
            v-for="(user, index) in paginatedUsers"
            :key="user.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ (currentPage - 1) * itemsPerPage + index + 1 }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ user.username }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              {{ user.email }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': user.is_staff,
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': !user.is_staff
                  }">
              {{ user.is_staff ? 'Yes' : 'No' }}
            </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': user.is_active,
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': !user.is_active
                  }">
              {{ user.is_active ? 'Active' : 'Inactive' }}
            </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button
                @click="openEditModal(user)"
                class="inline-flex items-center px-3 py-1 rounded-md
                bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200
                hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors duration-200"
              >
                <SquarePenIcon class="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                @click="() => confirmDelete(user)"
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
              <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredUsers.length) }}</span>
              of
              <span class="font-medium">{{ filteredUsers.length }}</span>
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

    <!-- Create User Modal -->
    <Dialog :open="showCreateModal" @update:open="val => val || closeCreateModal()">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>Add a new user to the system</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="username" class="text-right">Username*</Label>
            <Input
              id="username"
              v-model="newUser.username"
              class="col-span-3"
              placeholder="Username"
              required
              :class="{ 'border-red-500 dark:border-red-500': formErrors.username }"
              @input="formErrors.username = []"
            />
            <p v-if="formErrors.username" class="col-span-3 col-start-2 text-sm text-red-500 dark:text-red-400">
              {{ formErrors.username[0] }}
            </p>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="email" class="text-right">Email*</Label>
            <Input
              id="email"
              v-model="newUser.email"
              type="email"
              class="col-span-3"
              placeholder="Email"
              required
              :class="{ 'border-red-500 dark:border-red-500': formErrors.email }"
              @input="formErrors.email = []"
            />
            <p v-if="formErrors.email" class="col-span-3 col-start-2 text-sm text-red-500 dark:text-red-400">
              {{ formErrors.email[0] }}
            </p>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="password" class="text-right">Password*</Label>
            <Input
              id="password"
              v-model="newUser.password"
              type="password"
              class="col-span-3"
              placeholder="Password"
              required
              :class="{ 'border-red-500 dark:border-red-500': formErrors.password }"
              @input="formErrors.password = []"
            />
            <p v-if="formErrors.password" class="col-span-3 col-start-2 text-sm text-red-500 dark:text-red-400">
              {{ formErrors.password[0] }}
            </p>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="is_staff" class="text-right">Staff Member</Label>
            <input
              id="is_staff"
              type="checkbox"
              v-model="newUser.is_staff"
              class="col-span-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="is_active" class="text-right">Active</Label>
            <input
              id="is_active"
              type="checkbox"
              v-model="newUser.is_active"
              class="col-span-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeCreateModal">Cancel</Button>
          <Button
            type="submit"
            @click="handleCreate"
            :disabled="!newUser.username.trim() || !newUser.email.trim() || !newUser.password.trim()"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit User Modal -->
    <Dialog :open="showEditModal" @update:open="val => val || closeEditModal()">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>Update user details</DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-username" class="text-right">Username*</Label>
            <Input
              id="edit-username"
              v-model="editingUser.username"
              class="col-span-3"
              placeholder="Username"
              required
              :class="{ 'border-red-500 dark:border-red-500': formErrors.username }"
              @input="formErrors.username = []"
            />
            <p v-if="formErrors.username" class="col-span-3 col-start-2 text-sm text-red-500 dark:text-red-400">
              {{ formErrors.username[0] }}
            </p>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-email" class="text-right">Email*</Label>
            <Input
              id="edit-email"
              v-model="editingUser.email"
              type="email"
              class="col-span-3"
              placeholder="Email"
              required
              :class="{ 'border-red-500 dark:border-red-500': formErrors.email }"
              @input="formErrors.email = []"
            />
            <p v-if="formErrors.email" class="col-span-3 col-start-2 text-sm text-red-500 dark:text-red-400">
              {{ formErrors.email[0] }}
            </p>
          </div>

          <!-- Current Password Field -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-current_password" class="text-right">
              <span v-if="!editingUser.changingPassword">Current Password*</span>
              <span v-else>Verify Current Password*</span>
            </Label>
            <div class="col-span-3 space-y-1">
              <Input
                id="edit-current_password"
                v-model="editingUser.current_password"
                type="password"
                :placeholder="editingUser.changingPassword ? 'Enter current password to verify changes' : 'Enter current password'"
                required
                :class="{ 'border-red-500 dark:border-red-500': formErrors.current_password }"
                @input="formErrors.current_password = []"
              />
              <p v-if="formErrors.current_password" class="text-sm text-red-500 dark:text-red-400">
                {{ formErrors.current_password[0] }}
              </p>
            </div>
          </div>


          <!-- Password Change Toggle -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-change_password" class="text-right">Change Password?</Label>
            <input
              id="edit-change_password"
              type="checkbox"
              v-model="editingUser.changingPassword"
              class="col-span-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>

          <!-- New Password Fields (shown when changing password) -->
          <template v-if="editingUser.changingPassword">
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit-new_password" class="text-right">New Password*</Label>
              <div class="col-span-3 space-y-1">
                <Input
                  id="edit-new_password"
                  v-model="editingUser.new_password"
                  type="password"
                  placeholder="Enter new password"
                  required
                  :class="{ 'border-red-500 dark:border-red-500': formErrors.password }"
                  @input="formErrors.password = []"
                />
                <p v-if="formErrors.password" class="text-sm text-red-500 dark:text-red-400">
                  {{ formErrors.password[0] }}
                </p>
              </div>
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
              <Label for="edit-confirm_password" class="text-right">Confirm New Password*</Label>
              <Input
                id="edit-confirm_password"
                v-model="editingUser.confirm_password"
                type="password"
                class="col-span-3"
                placeholder="Re-enter new password"
                required
              />
            </div>
          </template>

          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-is_staff" class="text-right">Staff Member</Label>
            <input
              id="edit-is_staff"
              type="checkbox"
              v-model="editingUser.is_staff"
              class="col-span-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-is_active" class="text-right">Active</Label>
            <input
              id="edit-is_active"
              type="checkbox"
              v-model="editingUser.is_active"
              class="col-span-3 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeEditModal">Cancel</Button>
          <Button
            type="submit"
            @click="handleUpdate"
            :disabled="!editingUser.username.trim() || !editingUser.email.trim() || !editingUser.current_password.trim() ||
                      (editingUser.changingPassword && (!editingUser.new_password.trim() || editingUser.new_password !== editingUser.confirm_password))"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>