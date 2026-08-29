<script setup lang="ts">
import { WORKBENCH_STEPS, type WorkbenchStep } from '../steps'

defineProps<{
  step: WorkbenchStep
  title: string
  number: number
  active: boolean
}>()

const totalSteps = WORKBENCH_STEPS.length
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
        {{ String(number).padStart(2, '0') }} / {{ String(totalSteps).padStart(2, '0') }}
      </p>
      <h2 :id="`${step}-title`">
        {{ title }}
      </h2>
    </header>
    <slot />
  </section>
</template>
