<script setup lang="ts">
import { computed } from 'vue'
import type { ReleaseCodename, SourceFormat } from '../features/sources/model'
import type { SystemArchitecture } from '../features/vendors/model'
import { getRelease, RELEASES } from '../features/sources/releases'

const release = defineModel<ReleaseCodename>('release', { required: true })
const architecture = defineModel<SystemArchitecture>('architecture', { required: true })
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
const releaseStatus = computed(() => {
  const statuses: Record<string, string> = {
    stable: 'stabil',
    'oldstable / LTS': 'vorherige stabile Version / LTS',
    'oldoldstable / LTS': 'ältere stabile Version / LTS',
    testing: 'Testversion',
    unstable: 'instabil',
  }

  return statuses[selectedRelease.value.status] ?? selectedRelease.value.status
})

const releaseItems = RELEASES.map((entry) => ({
  title: entry.codename.charAt(0).toUpperCase() + entry.codename.slice(1),
  value: entry.codename,
}))

const architectureItems = [
  { title: 'amd64 (64-Bit-PC)', value: 'amd64' },
  { title: 'arm64 (64-Bit-ARM)', value: 'arm64' },
  { title: 'armhf (32-Bit-ARM)', value: 'armhf' },
  { title: 'i386 (32-Bit-PC)', value: 'i386' },
] satisfies { title: string, value: SystemArchitecture }[]

const formatItems = computed(() => selectedRelease.value.formats.map((entry) => ({
  title: entry === 'deb822' ? 'DEB822 (.sources)' : 'Klassische sources.list (.list, veraltet)',
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
    return 'Bullseye bietet weder non-free-firmware noch Backports. Diese Steuerelemente sind deaktiviert. Das klassische sources.list-Format ist veraltet.'
  }
  if (selectedRelease.value.codename === 'bookworm') {
    return 'Bookworm unterstützt DEB822 und das veraltete klassische sources.list-Format. Die Backports-Unterstützung endete am 09.08.2026, deshalb ist dieses Steuerelement deaktiviert.'
  }
  if (!supportsSecurity.value && !supportsUpdates.value && !supportsBackports.value) {
    return `${name} enthält nur die Basisquelle: Security, Updates und Backports sind nicht verfügbar.`
  }
  if (selectedRelease.value.formats.length === 1) {
    return `${name} nutzt das empfohlene DEB822-Format. Security, Updates und Backports sind verfügbar.`
  }
  return `${name} unterstützt DEB822 und das veraltete klassische sources.list-Format.`
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
      Paketquellen konfigurieren
    </v-card-title>
    <v-card-subtitle>
      {{ releaseStatus }}
    </v-card-subtitle>

    <v-card-text>
      <div class="generator-controls__selects">
        <v-select
          v-model="release"
          aria-label="Debian-Version"
          :items="releaseItems"
          label="Debian-Version"
        variant="outlined"
      />
        <v-select
          v-model="architecture"
          aria-label="Architektur"
          :items="architectureItems"
          label="Architektur"
          variant="outlined"
        />
        <v-select
          v-model="format"
          aria-label="Ausgabeformat"
          :items="formatItems"
          label="Ausgabeformat"
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
          <legend>Paketindizes</legend>
          <v-switch
            v-model="includeSource"
            aria-label="Quellpakete"
            color="primary"
            hide-details
            label="Quellpakete"
          />
        </fieldset>

        <fieldset>
          <legend>Repository-Komponenten</legend>
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
          <legend>Zusätzliche Suiten</legend>
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
