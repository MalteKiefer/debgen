<script setup lang="ts">
import type { WorkbenchStep } from '../state'

defineProps<{
  step: WorkbenchStep
  title: string
  number: number
  active: boolean
}>()
</script>

<template>
  <section
    :id="step"
    class="workbench-step"
    :data-step="step"
    :data-active="active ? 'true' : 'false'"
    :aria-labelledby="`${step}-title`"
  >
    <header class="step-heading">
      <p class="eyebrow">
        {{ String(number).padStart(2, '0') }} / 05
      </p>
      <h2 :id="`${step}-title`">
        {{ title }}
      </h2>
    </header>
    <slot />
  </section>
</template>
