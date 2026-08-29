import { createApp } from 'vue'
import App from './App.vue'
import { i18n, initializeLocale } from './i18n'
import vuetify from './plugins/vuetify'
import './styles/main.scss'

initializeLocale()
createApp(App).use(i18n).use(vuetify).mount('#app')
