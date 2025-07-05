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
  PackagePlus,
  
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

// Rename icons to match Vue component conventions
const SquarePenIcon = SquarePen
const Trash2Icon = Trash2
const PackagePlusIcon = PackagePlus


const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(10)

// Modals state
const showCreateModal = ref(false)
const showEditModal = ref(false)
const currentEditingProduct = ref<Product | null>(null)

// Form data
const newProductData = ref({
  name: '',
  category: null as number | null
})
const editingProductData = ref({
  name: '',
  category: null as number | null
})


// Computed properties
const filteredProducts = computed(() => {
  if (!searchQuery.value) return products.value
  const query = searchQuery.value.toLowerCase()
  return products.value.filter(product => 
    product.name.toLowerCase().includes(query) ||
    product.id.toString().includes(query) ||
    getCategoryName(product.category).toLowerCase().includes(query)
  )
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
      fetchProducts(true), // with category details
      fetchCategories()
    ])
    products.value = productsData
    categories.value = categoriesData
  } catch (err) {
    console.error(err)
    error.value = 'Failed to load data. Please try again later.'
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  newProductData.value = { name: '', category: null }
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

function openEditModal(product: Product) {
  currentEditingProduct.value = product
  editingProductData.value = {
    name: product.name,
    category: product.category
  }
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  currentEditingProduct.value = null
}



async function handleCreateProduct() {
  if (!newProductData.value.name.trim() || newProductData.value.category === null) return
  
  try {
    const createdProduct = await createProduct({
      name: newProductData.value.name.trim(),
      category: newProductData.value.category
    })
    
    // Add the new product with category details
    products.value = [
      ...products.value,
      {
        ...createdProduct,
        category_details: categories.value.find(c => c.id === createdProduct.category)
      }
    ]
    
    closeCreateModal()
    await showSuccessToast('Product created successfully')
    currentPage.value = 1
  } catch (err) {
    console.error(err)
    await showErrorToast('Failed to create product')
  }
}

async function handleUpdateProduct() {
  if (!currentEditingProduct.value || 
      !editingProductData.value.name.trim() || 
      editingProductData.value.category === null) return
  
  try {
    const updatedProduct = await updateProduct(currentEditingProduct.value.id, {
      name: editingProductData.value.name.trim(),
      category: editingProductData.value.category
    })
    
    // Update the product with category details
    products.value = products.value.map(p => 
      p.id === updatedProduct.id 
        ? { 
            ...updatedProduct, 
            category_details: categories.value.find(c => c.id === updatedProduct.category) 
          }
        : p
    )
    
    closeEditModal()
    await showSuccessToast('Product updated successfully')
  } catch (err) {
    console.error(err)
    await showErrorToast('Failed to update product')
  }
}



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
      
      // Adjust pagination if needed
      if (paginatedProducts.value.length === 0 && currentPage.value > 1) {
        currentPage.value--
      }
    } catch (err) {
      console.error(err)
      await showErrorToast('Failed to delete product')
    }
  }
}

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
      <h1 class="text-2xl font-bold text-gray-800">Product Management</h1>
      <p class="text-gray-600 mt-1">Manage your products and categories</p>
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
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CATEGORY</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ACTIONS</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading">
            <td colspan="4" class="px-6 py-4 text-center">
              <div class="inline-flex items-center justify-center space-x-2">
                <ArrowPathIcon class="animate-spin h-5 w-5 text-gray-500" />
                <span class="text-gray-600">Loading products...</span>
              </div>
            </td>
          </tr>
          <tr v-else-if="error">
            <td colspan="4" class="px-6 py-4 text-center">
              <div class="inline-flex items-center px-4 py-2 bg-red-50 rounded-lg text-red-600">
                <ExclamationTriangleIcon class="h-5 w-5 mr-2" />
                {{ error }}
              </div>
            </td>
          </tr>
          <tr v-else-if="filteredProducts.length === 0">
            <td colspan="4" class="px-6 py-4 text-center">
              <div class="flex flex-col items-center justify-center space-y-2 text-gray-500">
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
            class="hover:bg-gray-50"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {{ (currentPage - 1) * itemsPerPage + index + 1}}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              {{ product.name }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {{ getCategoryName(product.category) }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
              <button 
                @click="openEditModal(product)"
                class="inline-flex items-center px-3 py-1 rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors duration-200"
              >
                <SquarePenIcon class="h-4 w-4 mr-1" />
                Edit
              </button>
              <button 
                @click="() => confirmDelete(product)"
                class="inline-flex items-center px-3 py-1 rounded-md bg-red-100 text-red-800 hover:bg-red-200 transition-colors duration-200"
              >
                <Trash2Icon class="h-4 w-4 mr-1" />
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Previous
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
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
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
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
                  'bg-blue-50 border-blue-500 text-blue-600 z-10': currentPage === page,
                  'bg-white border-gray-300 text-gray-500 hover:bg-gray-50': currentPage !== page
                }"
                class="relative inline-flex items-center px-4 py-2 border text-sm font-medium"
              >
                {{ page }}
              </button>
              
              <button
                @click="nextPage"
                :disabled="currentPage === totalPages"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span class="sr-only">Next</span>
                &gt;
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Product Modal -->
    <Dialog :open="showCreateModal" @update:open="val => val || closeCreateModal()">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
          <DialogDescription>
            Add a new product to your collection
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="name" class="text-right">
              Name
            </Label>
            <Input
              id="name"
              v-model="newProductData.name"
              class="col-span-3"
              placeholder="Product name"
              @keyup.enter="handleCreateProduct"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="category" class="text-right">
              Category
            </Label>
            <select
              id="category"
              v-model="newProductData.category"
              class="col-span-3 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <Button variant="outline" @click="closeCreateModal">
            Cancel
          </Button>
          <Button 
            type="submit" 
            @click="handleCreateProduct"
            :disabled="!newProductData.name.trim() || newProductData.category === null"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Edit Product Modal -->
    <Dialog :open="showEditModal" @update:open="val => val || closeEditModal()">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product details
          </DialogDescription>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-name" class="text-right">
              Name
            </Label>
            <Input
              id="edit-name"
              v-model="editingProductData.name"
              class="col-span-3"
              placeholder="Product name"
              @keyup.enter="handleUpdateProduct"
            />
          </div>
          <div class="grid grid-cols-4 items-center gap-4">
            <Label for="edit-category" class="text-right">
              Category
            </Label>
            <select
              id="edit-category"
              v-model="editingProductData.category"
              class="col-span-3 border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <Button variant="outline" @click="closeEditModal">
            Cancel
          </Button>
          <Button 
            type="submit" 
            @click="handleUpdateProduct"
            :disabled="!editingProductData.name.trim() || editingProductData.category === null"
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    
    
  </div>
</template>