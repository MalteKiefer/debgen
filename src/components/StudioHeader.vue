<script setup lang="ts">
import { useI18n } from 'vue-i18n'

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

    <nav :aria-label="t('header.projectLinks')">
      <v-btn
        class="studio-touch-target"
        href="https://de.liberapay.com/beli3ver"
        prepend-icon="mdi-heart-outline"
        rel="noopener noreferrer"
        target="_blank"
        variant="text"
      >
        {{ t('header.liberapay') }}
      </v-btn>
      <v-btn
        class="studio-touch-target"
        href="https://github.com/maltekiefer/debgen"
        prepend-icon="mdi-github"
        rel="noopener noreferrer"
        target="_blank"
        variant="text"
      >
        {{ t('header.github') }}
      </v-btn>
    </nav>
  </header>
</template>
