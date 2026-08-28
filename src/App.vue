<template>
  <v-app>
    <StudioHeader />

    <v-main class="app-main">
      <SourceGenerator />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import SourceGenerator from './components/SourceGenerator.vue'
import StudioHeader from './components/StudioHeader.vue'
</script>
