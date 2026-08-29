<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

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
      {{ t('sourceOutput.title') }}
    </v-card-title>
    <v-card-text>
      <p class="source-output__filename">
        <span>{{ t('sourceOutput.filename') }}</span>
        <code>{{ filename }}</code>
      </p>
      <pre
        :aria-label="t('sourceOutput.preview')"
        class="source-output__preview"
        tabindex="0"
      ><code>{{ content }}</code></pre>
      <div
        v-if="$slots.actions"
        :aria-label="t('sourceOutput.actions')"
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
