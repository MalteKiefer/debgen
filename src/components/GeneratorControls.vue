<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()

const availabilityId = 'release-capability-status'
const selectedRelease = computed(() => getRelease(release.value))
const releaseStatus = computed(() => {
  const statuses: Record<string, string> = {
    stable: 'controls.releaseStatus.stable',
    'oldstable / LTS': 'controls.releaseStatus.oldstableLts',
    'oldoldstable / LTS': 'controls.releaseStatus.oldoldstableLts',
    testing: 'controls.releaseStatus.testing',
    unstable: 'controls.releaseStatus.unstable',
  }

  const key = statuses[selectedRelease.value.status]
  return key ? t(key) : selectedRelease.value.status
})

const releaseItems = RELEASES.map((entry) => ({
  title: entry.codename.charAt(0).toUpperCase() + entry.codename.slice(1),
  value: entry.codename,
}))

const architectureItems = computed(() => ([
  { title: t('controls.architectures.amd64'), value: 'amd64' },
  { title: t('controls.architectures.arm64'), value: 'arm64' },
  { title: t('controls.architectures.armhf'), value: 'armhf' },
  { title: t('controls.architectures.i386'), value: 'i386' },
] satisfies { title: string, value: SystemArchitecture }[]))

const formatItems = computed(() => selectedRelease.value.formats.map((entry) => ({
  title: t(entry === 'deb822' ? 'controls.formats.deb822' : 'controls.formats.legacy'),
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
    return t('controls.availability.bullseye')
  }
  if (selectedRelease.value.codename === 'bookworm') {
    return t('controls.availability.bookworm')
  }
  if (!supportsSecurity.value && !supportsUpdates.value && !supportsBackports.value) {
    return t('controls.availability.baseOnly', { release: name })
  }
  if (selectedRelease.value.formats.length === 1) {
    return t('controls.availability.deb822Only', { release: name })
  }
  return t('controls.availability.legacySupported', { release: name })
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
      {{ t('controls.title') }}
    </v-card-title>
    <v-card-subtitle>
      {{ releaseStatus }}
    </v-card-subtitle>

    <v-card-text>
      <div class="generator-controls__selects">
        <v-select
          v-model="release"
          :aria-label="t('controls.fields.release')"
          :items="releaseItems"
          :label="t('controls.fields.release')"
        variant="outlined"
      />
        <v-select
          v-model="architecture"
          :aria-label="t('controls.fields.architecture')"
          :items="architectureItems"
          :label="t('controls.fields.architecture')"
          variant="outlined"
        />
        <v-select
          v-model="format"
          :aria-label="t('controls.fields.format')"
          :items="formatItems"
          :label="t('controls.fields.format')"
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
          <legend>{{ t('controls.groups.packageIndexes') }}</legend>
          <v-switch
            v-model="includeSource"
            :aria-label="t('controls.options.sourcePackages')"
            color="primary"
            hide-details
            :label="t('controls.options.sourcePackages')"
          />
        </fieldset>

        <fieldset>
          <legend>{{ t('controls.groups.repositoryComponents') }}</legend>
          <v-checkbox
            v-model="includeContrib"
            :aria-label="t('controls.options.contrib')"
            color="primary"
            hide-details
            :label="t('controls.options.contrib')"
          />
          <v-checkbox
            v-model="includeNonFree"
            :aria-label="t('controls.options.nonFree')"
            color="primary"
            hide-details
            :label="t('controls.options.nonFree')"
          />
          <v-checkbox
            v-model="includeFirmware"
            :aria-label="t('controls.options.nonFreeFirmware')"
            :aria-describedby="describedBy(supportsFirmware)"
            color="primary"
            :disabled="!supportsFirmware"
            hide-details
            :label="t('controls.options.nonFreeFirmware')"
          />
        </fieldset>

        <fieldset>
          <legend>{{ t('controls.groups.additionalSuites') }}</legend>
          <v-checkbox
            v-model="includeSecurity"
            :aria-label="t('controls.options.security')"
            :aria-describedby="describedBy(supportsSecurity)"
            color="primary"
            :disabled="!supportsSecurity"
            hide-details
            :label="t('controls.options.security')"
          />
          <v-checkbox
            v-model="includeUpdates"
            :aria-label="t('controls.options.updates')"
            :aria-describedby="describedBy(supportsUpdates)"
            color="primary"
            :disabled="!supportsUpdates"
            hide-details
            :label="t('controls.options.updates')"
          />
          <v-checkbox
            v-model="includeBackports"
            :aria-label="t('controls.options.backports')"
            :aria-describedby="describedBy(supportsBackports)"
            color="primary"
            :disabled="!supportsBackports"
            hide-details
            :label="t('controls.options.backports')"
          />
        </fieldset>
      </div>
    </v-card-text>
  </v-card>
</template>
