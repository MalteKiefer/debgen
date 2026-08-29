<script setup lang="ts">
import { computed } from 'vue'
import type { WorkbenchState } from '../state'

const props = defineProps<{
  state: WorkbenchState
}>()

const preview = computed(() => {
  const types = props.state.includeSource ? 'deb deb-src' : 'deb'
  const suites = [
    props.state.release,
    ...(props.state.includeSecurity ? [`${props.state.release}-security`] : []),
    ...(props.state.includeUpdates ? [`${props.state.release}-updates`] : []),
    ...(props.state.includeBackports ? [`${props.state.release}-backports`] : []),
  ]
  return `Types: ${types}\nURIs: https://deb.debian.org/debian\nSuites: ${suites.join(' ')}\nComponents: ${props.state.components.join(' ')}`
})
</script>

<template>
  <pre aria-label="Source file preview"><code>{{ preview }}</code></pre>
</template>
