# 🛠️ Django + Vue.js + TypeScript Project

This is a full-stack web application built with **Django REST Framework** as the backend API and **Vue 3 + TypeScript** as the frontend. It supports full CRUD operations, authentication, and role-based access, making it suitable for admin dashboards, content management systems, or internal tools.

---

## 📦 Tech Stack

### 🔙 Backend (Django)
- Django 4.x
- Django REST Framework
- JWT Authentication (`SimpleJWT`)
- PostgreSQL or MySQL (configurable)
- Role & Permission System
- CORS headers and secure API endpoints

### 🔜 Frontend (Vue 3 + TypeScript)
- Vue 3 Composition API
- Vue Router
- Pinia (or Vuex) for state management
- Axios for API calls
- SweetAlert2 for UI alerts
- Tailwind CSS or Bootstrap (optional)

---

## 🚀 Features

- ✅ User Registration & Login (JWT)
- ✅ Role-based access control (Admin, Staff, Customer)
- ✅ Token storage & auto-refresh
- ✅ Modular and reusable Vue components
- ✅ Image/file upload with preview
- ✅ Responsive and modern UI
- ✅ Pagination, search, and filtering
- ✅ Realtime form validation
- ✅ Backend services organized by module (products, teachers, etc.)

---

## 🧾 Project StructurDajngo-Vue/
│
├── backend/ # Django project folder
│ ├── accounts/ # Auth, roles, permissions
│ ├── products/ # Product & category management
│ ├── teachers/ # Teacher CRUD and file upload
│ ├── db.sqlite3
│ └── manage.py
│
├── frontend/ # Vue 3 + TypeScript project
│ ├── src/
│ │ ├── components/
│ │ ├── views/
│ │ ├── services/
│ │ └── App.vue
│ ├── public/
│ └── vite.config.ts
│
└── README.mde
---


## ⚙️ Setup Instructions



```bash
# Step 1: Create virtual env
python -m venv env
source env/bin/activate  # On Windows: env\Scripts\activate

# Step 2: Install requirements
pip install -r requirements.txt

# Step 3: Migrate and run server
python manage.py migrate
python manage.py runserver

---


### 🔧 Backend (Django)
# Step 1: Install dependencies
cd frontend
npm install

# Step 2: Start development server
npm run dev
