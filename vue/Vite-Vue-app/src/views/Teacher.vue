<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
  PackagePlus,
  User,
  CalendarIcon 
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
  fetchTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  type Teacher
} from '@/services/teacherService'
import {
  fetchSubjects,
  type Subject
} from '@/services/subjectService'
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarDate, DateFormatter, getLocalTimeZone, parseDate, today } from '@internationalized/date'
import { toDate } from 'reka-ui/date'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const df = new DateFormatter('en-US', {
  dateStyle: 'long',
})

const months = [
  'January', 'February', 'March', 'April', 
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December'
]
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

const selectedMonth = ref<string | null>(null)
const selectedYear = ref<string | null>(null)

// State
const teachers = ref<Teacher[]>([])
const subjects = ref<Subject[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showTeacherDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const currentEditingTeacher = ref<Teacher | null>(null)
const photoPreviewUrl = ref<string | null>(null)

// Form data
const formData = ref({
  first_name: '',
  last_name: '',
  gender: 'M' as 'M' | 'F' | 'O',
  date_of_birth: '',
  salary: 0,
  subject: null as number | null,
  photo: null as File | null,
   // Add these if you need to handle them in forms
  created_at: '',
  created_by: null as number | null,
  updated_at: '',
  updated_by: null as number | null


})

// Date picker computed property
const dateOfBirthModel = computed({
  get: () => formData.value.date_of_birth ? parseDate(formData.value.date_of_birth) : undefined,
  set: (val: CalendarDate | null) => {
    formData.value.date_of_birth = val ? val.toString() : ''
  }
})

// Watch for changes in the date picker to update the selects
watch(dateOfBirthModel, (newDate) => {
  if (newDate) {
    selectedMonth.value = (newDate.month - 1).toString()
    selectedYear.value = newDate.year.toString()
  }
}, { immediate: true })

const updateDateFromSelects = () => {
  if (selectedMonth.value && selectedYear.value) {
    const month = parseInt(selectedMonth.value) + 1 // CalendarDate months are 1-indexed
    const year = parseInt(selectedYear.value)
    const currentDay = dateOfBirthModel.value?.day || 1

    // Ensure the day is valid for the selected month/year
    const lastDayOfMonth = new Date(year, month, 0).getDate()
    const safeDay = Math.min(currentDay, lastDayOfMonth)

    dateOfBirthModel.value = new CalendarDate(year, month, safeDay)
  }
}

// Computed properties
const filteredTeachers = computed(() => {
  if (!searchQuery.value) return teachers.value
  const query = searchQuery.value.toLowerCase()
  return teachers.value.filter(teacher =>
    teacher.first_name.toLowerCase().includes(query) ||
    teacher.last_name.toLowerCase().includes(query) ||
    teacher.id.toString().includes(query) ||
    getSubjectName(teacher.subject).toLowerCase().includes(query))
})

const paginatedTeachers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredTeachers.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => {
  return Math.ceil(filteredTeachers.value.length / itemsPerPage.value)
})

// Methods
function getSubjectName(subjectId: number | null) {
  if (!subjectId) return 'No subject'
  const subject = subjects.value.find(s => s.id === subjectId)
  return subject ? subject.subject_name : 'Unknown'
}

function formatDate(dateString?: string): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const monthDiff = today.getMonth() - dob.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--
  }
  return age
}

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [teachersData, subjectsData] = await Promise.all([
      fetchTeachers(),
      fetchSubjects()
    ])
    teachers.value = teachersData
    subjects.value = subjectsData
  } catch (err) {
    error.value = 'Failed to load data. Please try again later.'
  } finally {
    loading.value = false
  }
}

// Photo handling
const handlePhotoChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]

    if (!file.type.match('image.*')) {
      showErrorToast('Please select an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      showErrorToast('Image must be smaller than 2MB')
      return
    }

    photoPreviewUrl.value = URL.createObjectURL(file)
    formData.value.photo = file
  }
}

const clearPhoto = () => {
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
  }
  photoPreviewUrl.value = null
  formData.value.photo = null
  const fileInput = document.getElementById('photo') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

// Modal handling
function openCreateModal() {
  formData.value = {
    first_name: '',
    last_name: '',
    gender: 'M',
    date_of_birth: '',
    salary: 0,
    subject: null,
    photo: null,
    created_at: new Date().toISOString(), // Set current time
    created_by: null, // You'll set this from your auth system
    updated_at: new Date().toISOString(),
    updated_by: null
  }
  photoPreviewUrl.value = null
  dialogMode.value = 'create'
  showTeacherDialog.value = true
}

function openEditModal(teacher: Teacher) {
  currentEditingTeacher.value = teacher
  formData.value = {
    first_name: teacher.first_name,
    last_name: teacher.last_name,
    gender: teacher.gender,
    date_of_birth: teacher.date_of_birth,
    salary: teacher.salary,
    subject: teacher.subject,
    photo: null,
    created_at: new Date().toISOString(), // Set current time
    created_by: null, // You'll set this from your auth system
    updated_at: new Date().toISOString(),
    updated_by: null
  }
  photoPreviewUrl.value = teacher.photo ? `${teacher.photo}` : null
  dialogMode.value = 'edit'
  showTeacherDialog.value = true
}

function closeTeacherDialog() {
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
  }
  photoPreviewUrl.value = null
  showTeacherDialog.value = false
  currentEditingTeacher.value = null
}

// Validation
function validateForm() {
  if (!formData.value.first_name.trim()) {
    showErrorToast('First name is required')
    return false
  }
  if (!formData.value.last_name.trim()) {
    showErrorToast('Last name is required')
    return false
  }
  if (!formData.value.date_of_birth) {
    showErrorToast('Date of birth is required')
    return false
  }
  if (formData.value.salary <= 0) {
    showErrorToast('Salary must be greater than 0')
    return false
  }
  if (!formData.value.subject) {
    showErrorToast('Subject is required')
    return false
  }
  return true
}

// Form submission
async function handleSubmit() {
  if (!validateForm()) return

  try {
    const payload = new FormData()
    payload.append("first_name", formData.value.first_name.trim())
    payload.append("last_name", formData.value.last_name.trim())
    payload.append("gender", formData.value.gender)
    payload.append("date_of_birth", formData.value.date_of_birth)
    payload.append("salary", formData.value.salary.toString())
    payload.append("subject", formData.value.subject?.toString() || '')

    // Add timestamp fields
    if (formData.value.created_at) {
      payload.append("created_at", formData.value.created_at);
    }
    if (formData.value.created_by) {
      payload.append("created_by", formData.value.created_by.toString());
    }
    if (formData.value.updated_at) {
      payload.append("updated_at", formData.value.updated_at);
    }

    if (formData.value.photo) {
      payload.append("photo", formData.value.photo)
    } else if (formData.value.photo === null) {
      payload.append("photo", "")
    }

    if (dialogMode.value === "create") {
      const createdTeacher = await createTeacher(payload)
      teachers.value = [
        ...teachers.value,
        {
          ...createdTeacher,
          subject_details: subjects.value.find(s => s.id === createdTeacher.subject)
        }
      ]
      await showSuccessToast('Teacher created successfully')
      currentPage.value = 1
    } else {
      if (!currentEditingTeacher.value) return
      const updatedTeacher = await updateTeacher(currentEditingTeacher.value.id, payload)
      teachers.value = teachers.value.map(t =>
        t.id === updatedTeacher.id
          ? {
              ...updatedTeacher,
              subject_details: t.subject_details
            }
          : t
      )
      await showSuccessToast('Teacher updated successfully')
    }
    closeTeacherDialog()
  } catch (err) {
    await showErrorToast(`Failed to ${dialogMode.value === 'create' ? 'create' : 'update'} teacher`)
  }
}

// Delete teacher
async function confirmDelete(teacher: Teacher) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `You are about to delete "${teacher.first_name} ${teacher.last_name}". This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  })

  if (result.isConfirmed) {
    try {
      await deleteTeacher(teacher.id)
      teachers.value = teachers.value.filter(t => t.id !== teacher.id)
      await showSuccessToast('Teacher deleted successfully')
      if (paginatedTeachers.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      await showErrorToast('Failed to delete teacher')
    }
  }
}

// Helpers
function showSuccessToast(message: string) {
  return Swal.fire({
    position: 'top-end',
    title: 'Success!',
    text: message,
    icon: 'success',
    timer: 1500,
    showConfirmButton: false
  })
}

function showErrorToast(message: string) {
  return Swal.fire({
    position: 'top-end',
    title: 'Error!',
    text: message,
    icon: 'error',
    timer: 1500,
    showConfirmButton: false
  })
}

// Pagination
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
  loadData()
})
</script>

<template>
  <div class="p-3 space-y-6">
    <!-- Header Section -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Teacher Management</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Manage your teachers and their details</p>
    </div>

    <!-- Search and Actions -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div class="relative flex-1 md:max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search teachers..."
          class="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 w-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          @input="currentPage = 1"
        />
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
      </div>
      <button
        @click="openCreateModal"
        class="flex items-center space-x-1 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
      >
        <PackagePlus class="w-5 h-5" />
        <span>New Teacher</span>
      </button>
    </div>

    <!-- Teacher Table -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Gender</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Age</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date of Birth</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Salary</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Subject</th>
            <!-- Add these columns to your table header -->
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created At</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Updated At</th>

            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Photo</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr v-if="loading">
            <td colspan="9" class="px-6 py-4 text-center">
              <div class="inline-flex items-center justify-center space-x-2">
                <ArrowPathIcon class="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" />
                <span class="text-gray-600 dark:text-gray-300">Loading teachers...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="error">
            <td colspan="9" class="px-6 py-4 text-center">
              <div class="inline-flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-300">
                <ExclamationTriangleIcon class="h-5 w-5 mr-2" />
                {{ error }}
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredTeachers.length === 0">
            <td colspan="9" class="px-6 py-4 text-center">
              <div class="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                <FolderIcon class="h-12 w-12 opacity-40" />
                <p class="text-lg">No teachers found</p>
                <p v-if="searchQuery" class="text-sm">No results for "{{ searchQuery }}"</p>
              </div>
            </td>
          </tr>
          <tr
            v-else
            v-for="(teacher, index) in paginatedTeachers"
            :key="teacher.id"
            class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
              {{ (currentPage - 1) * itemsPerPage + index + 1 }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ teacher.first_name }} {{ teacher.last_name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                :class="{
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': teacher.gender === 'M',
                  'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200': teacher.gender === 'F',
                  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200': teacher.gender === 'O'
                }">
                {{ teacher.gender === 'M' ? 'Male' : teacher.gender === 'F' ? 'Female' : 'Other' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ calculateAge(teacher.date_of_birth) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ formatDate(teacher.date_of_birth) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              ${{ teacher.salary.toLocaleString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                {{ getSubjectName(teacher.subject) }}
              </span>
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ teacher.created_at ? df.format(new Date(teacher.created_at)) : '-' }}
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              {{ teacher.updated_at ? df.format(new Date(teacher.updated_at)) : '-' }}
            </td>

            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              <img
                v-if="teacher.photo"
                :src="teacher.photo.startsWith('http') ? teacher.photo : `/media/${teacher.photo}`"
                alt="teacher photo"
                class="w-15 h-15 rounded-full object-cover border border-gray-200 dark:border-gray-600"
              />
              <div v-else class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User class="w-5 h-5 text-gray-400" />
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button
                @click="openEditModal(teacher)"
                class="inline-flex items-center px-3 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors duration-200"
              >
                <SquarePen class="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                @click="() => confirmDelete(teacher)"
                class="inline-flex items-center px-3 py-1 rounded-md bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors duration-200"
              >
                <Trash2 class="h-4 w-4 mr-1" />
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
              <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredTeachers.length) }}</span>
              of
              <span class="font-medium">{{ filteredTeachers.length }}</span>
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

    <!-- Teacher Dialog -->
    <Dialog :open="showTeacherDialog" @update:open="val => val || closeTeacherDialog()">
      <DialogContent class="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>{{ dialogMode === 'create' ? 'Create New Teacher' : 'Edit Teacher' }}</DialogTitle>
          <DialogDescription>
            {{ dialogMode === 'create' ? 'Add a new teacher to your school' : 'Update the teacher details' }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <!-- First Name -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="first_name" class="text-right">
              First Name
            </Label>
            <Input
              id="first_name"
              v-model="formData.first_name"
              class="col-span-3"
              placeholder="Teacher's first name"
            />
          </div>

          <!-- Last Name -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="last_name" class="text-right">
              Last Name
            </Label>
            <Input
              id="last_name"
              v-model="formData.last_name"
              class="col-span-3"
              placeholder="Teacher's last name"
            />
          </div>

          <!-- Gender -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="gender" class="text-right">
              Gender
            </Label>
            <select
              id="gender"
              v-model="formData.gender"
              class="col-span-3 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
              border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:border-blue-500 dark:focus:border-blue-500"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="O">Other</option>
            </select>
          </div>

          <!-- Date of Birth with Month/Year Selects -->
          <div class="grid grid-cols-4 items-center gap-4 py-4">
            <Label for="date_of_birth" class="text-right">
              Date of Birth
            </Label>
            <Popover>
              <PopoverTrigger as-child>
                <Button
                  variant="outline"
                  class="w-full col-span-3 justify-start text-left font-normal"
                >
                  <span v-if="dateOfBirthModel">
                    {{ df.format(toDate(dateOfBirthModel)) }}
                  </span>
                  <span v-else class="text-muted-foreground">Pick a date</span>
                  <CalendarIcon class="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent class="w-auto p-0">
                <div class="p-3 space-y-4">
                  <div class="flex gap-2">
                    <Select
                      v-model="selectedMonth"
                      @update:model-value="updateDateFromSelects"
                    >
                      <SelectTrigger class="w-[120px]">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="(month, index) in months"
                          :key="index"
                          :value="index.toString()"
                        >
                          {{ month }}
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      v-model="selectedYear"
                      @update:model-value="updateDateFromSelects"
                    >
                      <SelectTrigger class="w-[100px]">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem
                          v-for="year in years"
                          :key="year"
                          :value="year.toString()"
                        >
                          {{ year }}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Calendar
                    v-model="dateOfBirthModel"
                    calendar-label="Date of birth"
                    initial-focus
                    :min-value="new CalendarDate(1900, 1, 1)"
                    :max-value="today(getLocalTimeZone())"
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <!-- Salary -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="salary" class="text-right">
              Salary
            </Label>
            <Input
              id="salary"
              type="number"
              v-model="formData.salary"
              class="col-span-3"
              placeholder="Teacher's salary"
              min="0"
              step="0.01"
            />
          </div>

          <!-- Subject -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="subject" class="text-right">
              Subject
            </Label>
            <select
              id="subject"
              v-model="formData.subject"
              class="col-span-3 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
              border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:border-blue-500 dark:focus:border-blue-500"
            >
              <option :value="null">Select a subject</option>
              <option
                v-for="subject in subjects"
                :key="subject.id"
                :value="subject.id"
              >
                {{ subject.subject_name }}
              </option>
            </select>
          </div>

          <!-- Photo -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="photo" class="text-right">
              Photo
            </Label>
            <div class="col-span-3 space-y-2">
              <div v-if="photoPreviewUrl" class="mt-2">
                <img
                  :src="photoPreviewUrl"
                  alt="Preview"
                  class="h-32 w-32 object-cover rounded-full border"
                >
                <Button
                  @click="clearPhoto"
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="mt-2 text-red-600"
                >
                  Remove Photo
                </Button>
              </div>

              <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700">
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <User class="w-8 h-8 mb-3 text-gray-400" />
                  <p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span class="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG (MAX. 2MB)
                  </p>
                </div>
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  @change="handlePhotoChange"
                  class="hidden"
                />
              </label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeTeacherDialog">
            Cancel
          </Button>
          <Button
            type="submit"
            @click="handleSubmit"
            :disabled="!formData.first_name.trim() || !formData.last_name.trim() || !formData.date_of_birth || !formData.subject"
          >
            {{ dialogMode === 'create' ? 'Create' : 'Save Changes' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>