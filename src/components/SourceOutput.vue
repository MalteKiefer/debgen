<script setup lang="ts">
defineProps<{
  filename: 'debian.sources' | 'debian.list'
  content: string
}>()
</script>

<template>
  <v-card
    class="source-output"
    variant="outlined"
  >
    <v-card-title id="source-output-title">
      Erzeugte Konfiguration
    </v-card-title>
    <v-card-text>
      <p class="source-output__filename">
        <span>Dateiname</span>
        <code>{{ filename }}</code>
      </p>
      <pre
        aria-label="Vorschau der erzeugten Paketquellen"
        class="source-output__preview"
        tabindex="0"
      ><code>{{ content }}</code></pre>
      <div
        v-if="$slots.actions"
        aria-label="Aktionen für die erzeugte Konfiguration"
        class="source-output__actions"
        role="group"
      >
        <slot
          name="actions"
          :content="content"
          :filename="filename"
        />
      </div>
    </v-card-text>
  </v-card>
</template>
