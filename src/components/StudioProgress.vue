<script setup lang="ts">
const currentStep = defineModel<number>({ required: true })

const steps = [
  { value: 1, label: 'Debian-System', icon: 'mdi-debian' },
  { value: 2, label: 'Offizielle Software', icon: 'mdi-package-variant-closed-check' },
  { value: 3, label: 'Prüfen und exportieren', icon: 'mdi-file-check-outline' },
] as const

function activate(step: number): void {
  currentStep.value = step
}
</script>

<template>
  <nav
    aria-label="Studio-Schritte"
    class="studio-progress"
  >
    <ol>
      <li
        v-for="step in steps"
        :key="step.value"
      >
        <button
          :aria-current="currentStep === step.value ? 'step' : undefined"
          :aria-label="`Schritt ${step.value}: ${step.label}`"
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
