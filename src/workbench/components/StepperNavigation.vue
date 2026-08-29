<script setup lang="ts">
import type { SiteCopy } from '../../site/locales'
import type { WorkbenchStep } from '../state'

const workbenchSteps: readonly WorkbenchStep[] = ['system', 'debian', 'repositories', 'review', 'export']

defineProps<{
  activeStep: WorkbenchStep
  copy: SiteCopy
}>()

const emit = defineEmits<{
  navigate: [step: WorkbenchStep]
}>()
</script>

<template>
  <nav aria-label="Workflow">
    <ol class="workflow-list">
      <li
        v-for="(step, index) in workbenchSteps"
        :key="step"
      >
        <a
          :href="`#${step}`"
          :aria-current="step === activeStep ? 'step' : undefined"
          @click.prevent="emit('navigate', step)"
        >
          <span class="step-number">{{ index + 1 }}</span>
          <span>{{ copy.steps[step] }}</span>
        </a>
      </li>
    </ol>
  </nav>
</template>
