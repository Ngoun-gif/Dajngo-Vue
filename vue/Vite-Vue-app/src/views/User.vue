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
  UserPlus,
  Eye,
  EyeOff,
  Key
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
const EyeIcon = Eye
const EyeOffIcon = EyeOff
const KeyIcon = Key

const users = ref<User[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')

const currentPage = ref(1)
const itemsPerPage = ref(10)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const currentEditingUser = ref<User | null>(null)

// Password visibility states
const showPassword = ref(false)
const showEditPassword = ref(false)
const enablePasswordEdit = ref(false)

const newUser = ref<Omit<User, 'id'>>({
  username: '',
  email: '',
  password: '',
  is_staff: false,
  is_active: true
})

const editingUser = ref<Partial<Omit<User, 'id'>>>({
  username: '',
  email: '',
  password: '',
  is_staff: false,
  is_active: true
})

const filteredUsers = computed(() => {
  if (!searchQuery.value) return users.value
  return users.value.filter(user =>
    user.username.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
    user.id.toString().includes(searchQuery.value))
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredUsers.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredUsers.value.length / itemsPerPage.value)
})

async function loadUsers() {
  loading.value = true
  error.value = null
  try {
    users.value = await fetchUsers()
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load users. Please try again later.'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  newUser.value = {
    username: '',
    email: '',
    password: '',
    is_staff: false,
    is_active: true
  }
  showPassword.value = false
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
    password: '', // Don't show actual password
    is_staff: user.is_staff,
    is_active: user.is_active
  }
  enablePasswordEdit.value = false
  showEditPassword.value = false
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  currentEditingUser.value = null
  editingUser.value = {
    username: '',
    email: '',
    password: '',
    is_staff: false,
    is_active: true
  }
}

async function handleCreate() {
  if (!newUser.value.username.trim() || !newUser.value.email.trim() || !newUser.value.password.trim()) {
    await Swal.fire({
      position: "top-end",
      title: 'Error!',
      text: 'Username, email and password are required',
      icon: 'error',
      timer: 1500,
      showConfirmButton: false,

    })
    return
  }

  try {
    const createdUser = await createUser(newUser.value)
    users.value.unshift(createdUser)
    closeCreateModal()
    await Swal.fire({
      position: "top-end",
      title: 'Success!',
      text: 'User created successfully',
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
      text: 'Failed to create user',
      icon: 'error',
      timer: 1500,
      showConfirmButton: false,


    })
  }
}

async function handleUpdate() {
  if (!currentEditingUser.value) return

  // If password edit is enabled but no password provided
  if (enablePasswordEdit.value && !editingUser.value.password?.trim()) {
    await Swal.fire({
      position: "top-end",
      title: 'Error!',
      text: 'Please enter a new password or disable password change',
      icon: 'error',
      timer: 1500,
      showConfirmButton: false,

    })
    return
  }

  // If password edit is not enabled, remove password from the update data
  const updateData = { ...editingUser.value }
  if (!enablePasswordEdit.value) {
    delete updateData.password
  }

  try {
    const updated = await updateUser(currentEditingUser.value.id, updateData)
    const index = users.value.findIndex(u => u.id === currentEditingUser.value?.id)
    if (index !== -1) {
      users.value.splice(index, 1, updated)
    }
    closeEditModal()
    await Swal.fire({
      position: "top-end",
      title: 'Success!',
      text: 'User updated successfully',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,

    })
  } catch (err) {
    console.error(err)
    await Swal.fire({
      position: "top-end",
      title: 'Error!',
      text: 'Failed to update user',
      icon: 'error',
      timer: 1500,
      showConfirmButton: false,

    })
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
    confirmButtonText: 'Yes, delete it!',

  })

  if (result.isConfirmed) {
    try {
      await deleteUser(user.id)
      users.value = users.value.filter(u => u.id !== user.id)
      await Swal.fire({
        position: "top-end",
        title: 'Deleted!',
        text: 'User has been deleted.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,

      })
      if (paginatedUsers.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      console.error(err)
      await Swal.fire({
        position: "top-end",
        title: 'Error!',
        text: 'Failed to delete user',
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
  loadUsers()
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
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">USERNAME</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">EMAIL</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">STATUS</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ROLE</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ACTIONS</th>
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ user.email }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              <span
                :class="{
                  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200': user.is_active,
                  'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200': !user.is_active
                }"
                class="px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ user.is_active ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              <span
                :class="{
                  'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200': user.is_staff,
                  'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200': !user.is_staff
                }"
                class="px-2 py-1 rounded-full text-xs font-medium"
              >
                {{ user.is_staff ? 'Staff' : 'Regular' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button
                @click="openEditModal(user)"
                class="inline-flex items-center px-3 py-1 rounded-md
                      bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors duration-200"
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
          <DialogDescription>
            Add a new user to the system
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="username" class="text-right">
              Username
            </Label>
            <Input
              id="username"
              v-model="newUser.username"
              class="col-span-3"
              placeholder="Username"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="email" class="text-right">
              Email
            </Label>
            <Input
              id="email"
              v-model="newUser.email"
              type="email"
              class="col-span-3"
              placeholder="Email"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="password" class="text-right">
              Password
            </Label>
            <div class="col-span-3 relative">
              <Input
                id="password"
                v-model="newUser.password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full pr-10"
                placeholder="Password"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
                @click="showPassword = !showPassword"
              >
                <component :is="showPassword ? EyeOffIcon : EyeIcon" class="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="is_staff" class="text-right">
              Staff Member
            </Label>
            <input
              id="is_staff"
              v-model="newUser.is_staff"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="is_active" class="text-right">
              Active
            </Label>
            <input
              id="is_active"
              v-model="newUser.is_active"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
          <DialogDescription>
            Update the user details
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-username" class="text-right">
              Username
            </Label>
            <Input
              id="edit-username"
              v-model="editingUser.username"
              class="col-span-3"
              placeholder="Username"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-email" class="text-right">
              Email
            </Label>
            <Input
              id="edit-email"
              v-model="editingUser.email"
              type="email"
              class="col-span-3"
              placeholder="Email"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-password" class="text-right">
              Password
            </Label>
            <div class="col-span-3 space-y-2">
              <div class="flex items-center">
                <Input
                  id="edit-password"
                  :value="enablePasswordEdit ? editingUser.password : '******'"
                  :disabled="!enablePasswordEdit"
                  class="flex-1 pr-10"
                  placeholder="New password"
                  :type="showEditPassword ? 'text' : 'password'"
                  @input="editingUser.password = ($event.target as HTMLInputElement).value"
                />
                <button
                  type="button"
                  class="ml-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  @click="enablePasswordEdit = !enablePasswordEdit"
                  :title="enablePasswordEdit ? 'Cancel password change' : 'Change password'"
                >
                  <KeyIcon class="h-5 w-5" :class="enablePasswordEdit ? 'text-blue-500' : 'text-gray-400'" />
                </button>
                <button
                  v-if="enablePasswordEdit"
                  type="button"
                  class="ml-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  @click="showEditPassword = !showEditPassword"
                >
                  <component :is="showEditPassword ? EyeOffIcon : EyeIcon" class="h-5 w-5 text-gray-400" />
                </button>
              </div>
              <p v-if="!enablePasswordEdit" class="text-xs text-gray-500 dark:text-gray-400">
                Password is hidden. Click the key icon to change.
              </p>
            </div>
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-is_staff" class="text-right">
              Staff Member
            </Label>
            <input
              id="edit-is_staff"
              v-model="editingUser.is_staff"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-is_active" class="text-right">
              Active
            </Label>
            <input
              id="edit-is_active"
              v-model="editingUser.is_active"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
            :disabled="!editingUser.username?.trim() || !editingUser.email?.trim() || (enablePasswordEdit && !editingUser.password?.trim())"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>