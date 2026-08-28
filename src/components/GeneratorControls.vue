<script setup lang="ts">
import { computed } from 'vue'
import type { ReleaseCodename, SourceFormat } from '../features/sources/model'
import { getRelease, RELEASES } from '../features/sources/releases'

const release = defineModel<ReleaseCodename>('release', { required: true })
const format = defineModel<SourceFormat>('format', { required: true })
const includeSource = defineModel<boolean>('includeSource', { required: true })
const includeContrib = defineModel<boolean>('includeContrib', { required: true })
const includeNonFree = defineModel<boolean>('includeNonFree', { required: true })
const includeFirmware = defineModel<boolean>('includeFirmware', { required: true })
const includeSecurity = defineModel<boolean>('includeSecurity', { required: true })
const includeUpdates = defineModel<boolean>('includeUpdates', { required: true })
const includeBackports = defineModel<boolean>('includeBackports', { required: true })

const availabilityId = 'release-capability-status'
const selectedRelease = computed(() => getRelease(release.value))

const releaseItems = RELEASES.map((entry) => ({
  title: entry.codename.charAt(0).toUpperCase() + entry.codename.slice(1),
  value: entry.codename,
}))

const formatItems = computed(() => selectedRelease.value.formats.map((entry) => ({
  title: entry === 'deb822' ? 'DEB822 (.sources)' : 'Legacy sources.list (.list)',
  value: entry,
})))

const supportsFirmware = computed(() => selectedRelease.value.components.includes('non-free-firmware'))
const supportsSecurity = computed(() => selectedRelease.value.capabilities.security)
const supportsUpdates = computed(() => selectedRelease.value.capabilities.updates)
const supportsBackports = computed(() => selectedRelease.value.capabilities.backports)

const availabilityMessage = computed(() => {
  const name = selectedRelease.value.codename.charAt(0).toUpperCase()
    + selectedRelease.value.codename.slice(1)

  if (selectedRelease.value.codename === 'bullseye') {
    return 'Bullseye does not provide non-free-firmware or backports. Those controls are disabled.'
  }
  if (!supportsSecurity.value && !supportsUpdates.value && !supportsBackports.value) {
    return `${name} is base-only: security, updates, and backports suites are unavailable.`
  }
  if (selectedRelease.value.formats.length === 1) {
    return `${name} uses the recommended DEB822 format. Security, updates, and backports are available.`
  }
  return `${name} supports DEB822 and the legacy sources.list format.`
})

function describedBy(supported: boolean): string | undefined {
  return supported ? undefined : availabilityId
}
</script>

<template>
  <v-card
    class="generator-controls"
    variant="outlined"
  >
    <v-card-title id="generator-controls-title">
      Repository configuration
    </v-card-title>
    <v-card-subtitle>
      {{ selectedRelease.status }}
    </v-card-subtitle>

    <v-card-text>
      <div class="generator-controls__selects">
        <v-select
          v-model="release"
          aria-label="Debian release"
          :items="releaseItems"
          label="Debian release"
          variant="outlined"
        />
        <v-select
          v-model="format"
          aria-label="Output format"
          :items="formatItems"
          label="Output format"
          variant="outlined"
        />
      </div>

      <v-alert
        :id="availabilityId"
        class="generator-controls__status"
        density="compact"
        role="status"
        type="info"
        variant="tonal"
      >
        {{ availabilityMessage }}
      </v-alert>

      <div class="generator-controls__groups">
        <fieldset>
          <legend>Package indexes</legend>
          <v-switch
            v-model="includeSource"
            aria-label="Source packages"
            color="primary"
            hide-details
            label="Source packages"
          />
        </fieldset>

        <fieldset>
          <legend>Repository components</legend>
          <v-checkbox
            v-model="includeContrib"
            aria-label="Contrib"
            color="primary"
            hide-details
            label="Contrib"
          />
          <v-checkbox
            v-model="includeNonFree"
            aria-label="Non-free"
            color="primary"
            hide-details
            label="Non-free"
          />
          <v-checkbox
            v-model="includeFirmware"
            aria-label="Non-free firmware"
            :aria-describedby="describedBy(supportsFirmware)"
            color="primary"
            :disabled="!supportsFirmware"
            hide-details
            label="Non-free firmware"
          />
        </fieldset>

        <fieldset>
          <legend>Additional suites</legend>
          <v-checkbox
            v-model="includeSecurity"
            aria-label="Security"
            :aria-describedby="describedBy(supportsSecurity)"
            color="primary"
            :disabled="!supportsSecurity"
            hide-details
            label="Security"
          />
          <v-checkbox
            v-model="includeUpdates"
            aria-label="Updates"
            :aria-describedby="describedBy(supportsUpdates)"
            color="primary"
            :disabled="!supportsUpdates"
            hide-details
            label="Updates"
          />
          <v-checkbox
            v-model="includeBackports"
            aria-label="Backports"
            :aria-describedby="describedBy(supportsBackports)"
            color="primary"
            :disabled="!supportsBackports"
            hide-details
            label="Backports"
          />
        </fieldset>
      </div>
    </v-card-text>
  </v-card>
</template>
