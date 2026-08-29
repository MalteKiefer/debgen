<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  setLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from '../i18n'

const { locale, t } = useI18n()

function updateLocale(event: Event): void {
  const target = event.target
  if (target && 'value' in target && typeof target.value === 'string') {
    setLocale(target.value as SupportedLocale)
  }
}
</script>

<template>
  <label class="language-select">
    <v-icon aria-hidden="true" icon="mdi-web" size="20" />
    <span class="language-select__label">{{ t('locale.label') }}</span>
    <select
      :aria-label="t('locale.label')"
      class="language-select__control studio-touch-target"
      :value="locale"
      @change="updateLocale"
    >
      <option
        v-for="supportedLocale in SUPPORTED_LOCALES"
        :key="supportedLocale"
        :value="supportedLocale"
      >
        {{ t(`locale.names.${supportedLocale}`) }}
      </option>
    </select>
  </label>
</template>
