import { createApp } from 'vue'
import App from './App.vue'
import { router } from './routes/routers'
import './index.css'  // or tailwind.css


createApp(App)
    .use(router)
    .mount('#app')
