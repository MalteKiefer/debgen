<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import type { HLJSApi } from 'highlight.js'

const props = defineProps<{
  code: string
  lang?: 'bash'
  ariaLabel?: string
}>()

const highlighter = shallowRef<HLJSApi | null>(null)

// Derived from props.code so the shown command always matches what Copy/Download use.
const highlighted = computed(() => highlighter.value?.highlight(props.code, { language: 'bash' }).value ?? null)

onMounted(async () => {
  if (props.lang !== 'bash') return
  const [{ default: hljs }, { default: bash }] = await Promise.all([
    import('highlight.js/lib/core'),
    import('highlight.js/lib/languages/bash'),
  ])
  if (!hljs.getLanguage('bash')) hljs.registerLanguage('bash', bash)
  highlighter.value = hljs
})
</script>

<template>
  <pre :aria-label="ariaLabel" tabindex="0"><code v-if="highlighted" class="hljs language-bash" v-html="highlighted"></code><code v-else>{{ code }}</code></pre>
</template>
