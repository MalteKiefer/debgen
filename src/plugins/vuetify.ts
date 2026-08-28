import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'

export default createVuetify({
  defaults: {
    VBtn: { rounded: 'lg', elevation: 0 },
    VCard: { rounded: 'xl' },
    VChip: { rounded: 'lg' },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
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
