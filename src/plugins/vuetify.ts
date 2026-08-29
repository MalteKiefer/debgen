import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import { createVueI18nAdapter } from 'vuetify/locale/adapters/vue-i18n'
import { useI18n } from 'vue-i18n'
import { i18n } from '../i18n'

export default createVuetify({
  defaults: {
    VBtn: { rounded: 'lg', elevation: 0 },
    VCard: { rounded: 'xl' },
    VChip: { rounded: 'lg' },
    VSelectionControl: { style: 'min-block-size: 44px' },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  locale: {
    adapter: createVueI18nAdapter({ i18n, useI18n }),
  },
  theme: {
    defaultTheme: 'debianStudio',
    themes: {
      debianStudio: {
        dark: false,
        colors: {
          background: '#f7f3f1',
          surface: '#fffdfc',
          'surface-bright': '#ffffff',
          'surface-variant': '#f2e9ec',
          primary: '#d70a53',
          'primary-darken-1': '#a4073e',
          secondary: '#4d2337',
          warning: '#a05a00',
          error: '#a30f3d',
          info: '#375b7d',
          success: '#31664d',
          'on-background': '#2a1921',
          'on-surface': '#2a1921',
        },
      },
    },
  },
})
