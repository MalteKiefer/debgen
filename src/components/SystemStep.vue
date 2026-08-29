<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { ReleaseCodename, SourceFormat } from '../features/sources/model'
import type { SystemArchitecture } from '../features/vendors/model'
import GeneratorControls from './GeneratorControls.vue'

const { t } = useI18n()

defineProps<{
  release: ReleaseCodename
  architecture: SystemArchitecture
  format: SourceFormat
  includeSource: boolean
  includeContrib: boolean
  includeNonFree: boolean
  includeFirmware: boolean
  includeSecurity: boolean
  includeUpdates: boolean
  includeBackports: boolean
}>()

const emit = defineEmits<{
  'update:release': [value: ReleaseCodename]
  'update:architecture': [value: SystemArchitecture]
  'update:format': [value: SourceFormat]
  'update:includeSource': [value: boolean]
  'update:includeContrib': [value: boolean]
  'update:includeNonFree': [value: boolean]
  'update:includeFirmware': [value: boolean]
  'update:includeSecurity': [value: boolean]
  'update:includeUpdates': [value: boolean]
  'update:includeBackports': [value: boolean]
}>()
</script>

<template>
  <section
    aria-labelledby="system-step-title"
    class="system-step"
  >
    <div class="system-step__heading">
      <div>
        <p class="system-step__eyebrow">
          {{ t('system.eyebrow') }}
        </p>
        <h2 id="system-step-title" tabindex="-1">
          {{ t('system.heading') }}
        </h2>
        <p>
          {{ t('system.description') }}
        </p>
      </div>
      <v-chip
        :aria-label="t('system.currentSystem')"
        color="primary"
        prepend-icon="mdi-cpu-64-bit"
        variant="tonal"
      >
        {{ release.charAt(0).toUpperCase() + release.slice(1) }} · {{ architecture }}
      </v-chip>
    </div>

    <GeneratorControls
      :architecture="architecture"
      :format="format"
      :include-backports="includeBackports"
      :include-contrib="includeContrib"
      :include-firmware="includeFirmware"
      :include-non-free="includeNonFree"
      :include-security="includeSecurity"
      :include-source="includeSource"
      :include-updates="includeUpdates"
      :release="release"
      @update:architecture="emit('update:architecture', $event)"
      @update:format="emit('update:format', $event)"
      @update:include-backports="emit('update:includeBackports', $event)"
      @update:include-contrib="emit('update:includeContrib', $event)"
      @update:include-firmware="emit('update:includeFirmware', $event)"
      @update:include-non-free="emit('update:includeNonFree', $event)"
      @update:include-security="emit('update:includeSecurity', $event)"
      @update:include-source="emit('update:includeSource', $event)"
      @update:include-updates="emit('update:includeUpdates', $event)"
      @update:release="emit('update:release', $event)"
    />
  </section>
</template>
