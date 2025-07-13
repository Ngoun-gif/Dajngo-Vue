<script setup lang="ts">
import { reactive } from 'vue'
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
  PackagePlus,
  Upload, User
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
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product
} from '@/services/productService'
import {
  fetchCategories,
  type Category
} from '@/services/categoryService'

const SquarePenIcon = SquarePen
const Trash2Icon = Trash2
const PackagePlusIcon = PackagePlus

// State
const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showProductDialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const currentEditingProduct = ref<Product | null>(null)
const imagePreviewUrl = ref<string | null>(null)

// Reactive error messages
const errors = reactive({
  name: '',
  price: '',
  stock: '',
  category: ''
})

// Form data
const formData = ref({
  name: '',
  category: null as number | null,
  price: 0,
  stock: 0,
  description: '',
  image: null as File | null
})

// Computed properties
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  const query = searchQuery.value.toLowerCase()
  return products.value.filter(product =>
    product.name.toLowerCase().includes(query) ||
    product.id.toString().includes(query) ||
    getCategoryName(product.category).toLowerCase().includes(query))
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredProducts.value.slice(start, start + itemsPerPage.value)
})

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
})

// Methods
function getCategoryName(categoryId: number | null) {
  if (!categoryId) return 'Uncategorized'
  const category = categories.value.find(c => c.id === categoryId)
  return category ? category.name : 'Unknown'
}

async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [productsData, categoriesData] = await Promise.all([
      fetchProducts(true),
      fetchCategories()
    ])
    products.value = productsData
    categories.value = categoriesData
  } catch (err) {
    error.value = 'Failed to load data. Please try again later.'
  } finally {
    loading.value = false
  }
}

// Image handling
const handleImageChange = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (input.files && input.files[0]) {
    const file = input.files[0]

    // Validate file type
    if (!file.type.match('image.*')) {
      showErrorToast('Please select an image file')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showErrorToast('Image must be smaller than 2MB')
      return
    }

    // Create preview URL
    imagePreviewUrl.value = URL.createObjectURL(file)
    formData.value.image = file
  }
}

const clearImage = () => {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  imagePreviewUrl.value = null
  formData.value.image = null
  const fileInput = document.getElementById('image') as HTMLInputElement
  if (fileInput) fileInput.value = ''
}

// Modal handling
function openCreateModal() {
  formData.value = {
    name: '',
    category: null,
    price: 0,
    stock: 0,
    description: '',
    image: null
  }
  imagePreviewUrl.value = null
  dialogMode.value = 'create'
  showProductDialog.value = true
}

function openEditModal(product: Product) {
  currentEditingProduct.value = product
  formData.value = {
    name: product.name,
    category: product.category,
    price: product.price,
    stock: product.stock,
    description: product.description || '',
    image: null
  }
  imagePreviewUrl.value = product.image ? `${product.image}` : null
  dialogMode.value = 'edit'
  showProductDialog.value = true
}

function closeProductDialog() {
  if (imagePreviewUrl.value) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
  imagePreviewUrl.value = null
  showProductDialog.value = false
  currentEditingProduct.value = null
}
// Validation
function validateForm() {
  errors.name = formData.value.name.trim() ? '' : 'Name is required.'
  errors.price = formData.value.price > 0 ? '' : 'Price must be greater than 0.'
  errors.stock = formData.value.stock >= 0 ? '' : 'Stock cannot be negative.'
  errors.category = formData.value.category ? '' : 'Please select a category.'

  return !errors.name && !errors.price && !errors.stock && !errors.category
}

// Form submission
async function handleSubmit() {
  if (!formData.value.name.trim() || formData.value.category === null ||(!validateForm())) {
    await showErrorToast('Name and category are required')
    return
  }


  try {
    const payload = new FormData()

    payload.append("name", formData.value.name.trim())
    payload.append("category", formData.value.category.toString())
    payload.append("price", formData.value.price.toString())
    payload.append("stock", formData.value.stock.toString())
    payload.append("description", formData.value.description)

    if (formData.value.image) {
      payload.append("image", formData.value.image)
    } else if (formData.value.image === null) {
      payload.append("image", "")
    }

    if (dialogMode.value === "create") {
      const createdProduct = await createProduct(payload)
      products.value = [
        ...products.value,
        {
          ...createdProduct,
          category_details: categories.value.find(c => c.id === createdProduct.category)
        }
      ]
      await showSuccessToast('Product created successfully')
      currentPage.value = 1
    } else {
      if (!currentEditingProduct.value) return
      const updatedProduct = await updateProduct(currentEditingProduct.value.id, payload)
      products.value = products.value.map(p =>
        p.id === updatedProduct.id
          ? {
              ...updatedProduct,
              category_details: p.category_details
            }
          : p
      )
      await showSuccessToast('Product updated successfully')
    }
    closeProductDialog()
  } catch (err) {
    await showErrorToast(`Failed to ${dialogMode.value === 'create' ? 'create' : 'update'} product`)
  }
}

// Delete product
async function confirmDelete(product: Product) {
  const result = await Swal.fire({
    title: 'Are you sure?',
    text: `You are about to delete "${product.name}". This action cannot be undone.`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!'
  })

  if (result.isConfirmed) {
    try {
      await deleteProduct(product.id)
      products.value = products.value.filter(p => p.id !== product.id)
      await showSuccessToast('Product deleted successfully')
      if (paginatedProducts.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      await showErrorToast('Failed to delete product')
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
      <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Product Management</h1>
      <p class="text-gray-600 dark:text-gray-400 mt-1">Manage your products and categories</p>
    </div>

    <!-- Search and Actions -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <div class="relative flex-1 md:max-w-md">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search products..."
          class="border border-gray-300 rounded-md px-3 py-2 w-full pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="currentPage = 1"
        />
        <MagnifyingGlassIcon class="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
      </div>
      <div class="flex space-x-2">
        <button
          @click="openCreateModal"
          class="flex items-center space-x-1 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          <PackagePlusIcon class="w-5 h-5" />
          <span>New Product</span>
        </button>
      </div>
    </div>

    <!-- Product Table -->
    <div class="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">NAME</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PRICE</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">STOCK</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">DESCRIPTION</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">IMAGE</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">CATEGORY</th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="loading">
              <td colspan="8" class="px-6 py-4 text-center">
                <div class="inline-flex items-center justify-center space-x-2">
                  <ArrowPathIcon class="animate-spin h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span class="text-gray-600 dark:text-gray-300">Loading products...</span>
                </div>
              </td>
            </tr>
            <tr v-else-if="error">
              <td colspan="8" class="px-6 py-4 text-center">
                <div class="inline-flex items-center px-4 py-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-300">
                  <ExclamationTriangleIcon class="h-5 w-5 mr-2" />
                  {{ error }}
                </div>
              </td>
            </tr>
            <tr v-else-if="filteredProducts.length === 0">
              <td colspan="8" class="px-6 py-4 text-center">
                <div class="flex flex-col items-center justify-center space-y-2 text-gray-500 dark:text-gray-400">
                  <FolderIcon class="h-12 w-12 opacity-40" />
                  <p class="text-lg">No products found</p>
                  <p v-if="searchQuery" class="text-sm">No results for "{{ searchQuery }}"</p>
                </div>
              </td>
            </tr>
            <tr 
              v-else
              v-for="(product,index) in paginatedProducts" 
              :key="product.id" 
              class="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ (currentPage - 1) * itemsPerPage + index + 1}}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ product.name }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">$
                {{ product.price }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ product.stock }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ product.description }}
              </td>
               <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
              <img
                v-if="product.image"
                :src="product.image.startsWith('http') ? product.image : `/media/${product.image}`"
                alt="teacher photo"
                class="w-15 h-15 rounded-full object-cover border border-gray-200 dark:border-gray-600"
              />
              <div v-else class="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User class="w-5 h-5 text-gray-400" />
              </div>
            </td>

              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {{ getCategoryName(product.category) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button 
                  @click="openEditModal(product)"
                  class="inline-flex items-center px-3 py-1 rounded-md bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800/50 transition-colors duration-200"
                >
                  <SquarePenIcon class="h-4 w-4 mr-1" />
                  Edit
                </button>
                <button 
                  @click="() => confirmDelete(product)"
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
                <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, filteredProducts.length) }}</span>
                of 
                <span class="font-medium">{{ filteredProducts.length }}</span>
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

    <!-- Product Dialog (for both create and edit) -->
    <Dialog :open="showProductDialog" @update:open="val => val || closeProductDialog()">
      <DialogContent class="sm:max-w-[750px]">
        <DialogHeader>
          <DialogTitle>{{ dialogMode === 'create' ? 'Create New Product' : 'Edit Product' }}</DialogTitle>
          <DialogDescription>
            {{ dialogMode === 'create' ? 'Add a new product to your collection' : 'Update the product details' }}
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <!-- Name -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">
              Name
            </Label>
            <Input
              id="name"
              v-model="formData.name"
              class="col-span-3"
              placeholder="Product name"
            />
          </div>
          
          <!-- Price -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="price" class="text-right">
              Price
            </Label>
            <Input
              id="price"
              type="number"
              v-model="formData.price"
              class="col-span-3"
              placeholder="Product price"
            />
          </div>
          
          <!-- Description -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="description" class="text-right">
              Description
            </Label>
            <Input
              id="description"
              v-model="formData.description"
              class="col-span-3"
              placeholder="Product description"
            />
          </div>
          
          <!-- Stock -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="stock" class="text-right">
              Stock
            </Label>
            <Input
              id="stock"
              type="number"
              v-model="formData.stock"
              class="col-span-3"
              placeholder="Product stock"
            />
          </div>
          
          <!-- Updated Image Upload Section -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="image" class="text-right">
              Image
            </Label>
            <div class="col-span-3 space-y-2">
              <!-- Preview Container -->
              <div v-if="imagePreviewUrl" class="mt-2">
                <img
                  :src="imagePreviewUrl"
                  alt="Preview"
                  class="h-32 w-32 object-cover rounded-md border"
                >
                <Button
                  @click="clearImage"
                  type="button"
                  variant="ghost"
                  size="sm"
                  class="mt-2 text-red-600"
                >
                  Remove Image
                </Button>
              </div>

              <!-- Upload Button -->
              <label class="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div class="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload class="w-8 h-8 mb-3 text-gray-400" />
                  <p class="mb-2 text-sm text-gray-500">
                    <span class="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p class="text-xs text-gray-500">
                    PNG, JPG (MAX. 2MB)
                  </p>
                </div>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  @change="handleImageChange"
                  class="hidden"
                />
              </label>
            </div>
          </div>
          
          <!-- Category -->
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="category" class="text-right">
              Category
            </Label>
            <select
              id="category"
              v-model="formData.category"
              class="
              col-span-3 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500
              border-gray-300 dark:border-gray-600
              bg-white dark:bg-gray-800
              text-gray-900 dark:text-white
              focus:border-blue-500 dark:focus:border-blue-500
              placeholder-gray-400 dark:placeholder-gray-500"
            >
              <option :value="null">Select a category</option>
              <option 
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="closeProductDialog">
            Cancel
          </Button>
          <Button 
            type="submit" 
            @click="handleSubmit"
            :disabled="!formData.name.trim() || formData.category === null || !validateForm()"
          >
            {{ dialogMode === 'create' ? 'Create' : 'Save Changes' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>