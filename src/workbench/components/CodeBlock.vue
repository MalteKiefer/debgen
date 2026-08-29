<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  code: string
  lang?: 'bash'
  ariaLabel?: string
}>()

const highlighted = ref<string | null>(null)

onMounted(async () => {
  if (props.lang !== 'bash') return
  const [{ default: hljs }, { default: bash }] = await Promise.all([
    import('highlight.js/lib/core'),
    import('highlight.js/lib/languages/bash'),
  ])
  if (!hljs.getLanguage('bash')) hljs.registerLanguage('bash', bash)
  highlighted.value = hljs.highlight(props.code, { language: 'bash' }).value
})
</script>

<template>
  <pre :aria-label="ariaLabel" tabindex="0"><code v-if="highlighted" class="hljs language-bash" v-html="highlighted"></code><code v-else>{{ code }}</code></pre>
</template>
