<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import LanguageSelect from './LanguageSelect.vue'

const { t } = useI18n()
</script>

<template>
  <header
    class="studio-header"
    role="banner"
  >
    <div>
      <p class="studio-header__eyebrow">
        {{ t('header.brand') }}
      </p>
      <h1>
        {{ t('header.title') }}
      </h1>
      <p class="studio-header__trust">
        {{ t('header.trust') }}
      </p>
    </div>

    <nav :aria-label="t('header.projectLinks')" class="studio-header__controls">
      <LanguageSelect />
      <v-btn
        :aria-label="t('header.liberapay')"
        class="studio-icon-link studio-touch-target"
        href="https://de.liberapay.com/beli3ver"
        icon="mdi-heart-outline"
        rel="noopener noreferrer"
        target="_blank"
        :title="t('header.liberapay')"
        variant="text"
      />
      <v-btn
        :aria-label="t('header.github')"
        class="studio-icon-link studio-touch-target"
        href="https://github.com/maltekiefer/debgen"
        icon="mdi-github"
        rel="noopener noreferrer"
        target="_blank"
        :title="t('header.github')"
        variant="text"
      />
    </nav>
  </header>
</template>
