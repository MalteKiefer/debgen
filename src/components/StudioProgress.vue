<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const currentStep = defineModel<number>({ required: true })
const { t } = useI18n()

const steps = computed(() => [
  { value: 1, label: t('progress.steps.system'), icon: 'mdi-debian' },
  { value: 2, label: t('progress.steps.software'), icon: 'mdi-package-variant-closed-check' },
  { value: 3, label: t('progress.steps.review'), icon: 'mdi-file-check-outline' },
] as const)

function activate(step: number): void {
  currentStep.value = step
}
</script>

<template>
  <nav
    :aria-label="t('progress.ariaLabel')"
    class="studio-progress"
  >
    <ol>
      <li
        v-for="step in steps"
        :key="step.value"
      >
        <button
          :aria-current="currentStep === step.value ? 'step' : undefined"
          :aria-label="t('progress.stepAria', { step: step.value, label: step.label })"
          :class="{ 'studio-progress__button--current': currentStep === step.value }"
          type="button"
          @click="activate(step.value)"
          @keydown.enter.prevent="activate(step.value)"
          @keydown.space.prevent="activate(step.value)"
        >
          <v-icon
            :icon="step.icon"
            size="20"
          />
          <span>{{ step.value }}. {{ step.label }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>
