<template>
  <v-app>
    <header class="app-header">
      <v-app-bar elevation="1">
        <v-app-bar-title>
          <v-icon icon="mdi-debian" />
          DebGen
        </v-app-bar-title>

        <v-spacer />

        <v-btn
          class="app-header__link"
          href="https://de.liberapay.com/beli3ver"
          variant="text"
          target="_blank"
          rel="noopener noreferrer"
        >
          Liberapay
        </v-btn>
        <v-btn
          class="app-header__link"
          href="https://github.com/maltekiefer/debgen"
          variant="text"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </v-btn>
      </v-app-bar>
    </header>

    <v-main>
      <main class="app-main">
        <SourceGenerator />
      </main>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import SourceGenerator from './components/SourceGenerator.vue'
</script>
