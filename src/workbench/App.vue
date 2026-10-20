<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ReleaseCodename, SourceFormat } from '../features/sources/model'
import type { SystemArchitecture } from '../features/vendors/model'
import FilesPanel from './components/FilesPanel.vue'
import SoftwarePicker from './components/SoftwarePicker.vue'
import { reduceWorkbenchState, type WorkbenchAction, type WorkbenchState } from './state'
import { camelKey, fill } from './text'
import type { WorkbenchHydrationPayload } from './types'

const props = defineProps<{
  initialState: WorkbenchHydrationPayload
}>()

const copy = computed(() => props.initialState.copy)
const ui = computed(() => props.initialState.copy.ui)

const ARCHITECTURES: readonly SystemArchitecture[] = ['amd64', 'arm64', 'armhf', 'i386']

const RELEASE_STATUS_KEYS: Readonly<Record<string, keyof WorkbenchHydrationPayload['copy']['ui']['controls']['releaseStatus']>> = {
  'stable': 'stable',
  'oldstable / LTS': 'oldstableLts',
  'oldoldstable / LTS': 'oldoldstableLts',
  'testing': 'testing',
  'unstable': 'unstable',
}

const state = ref<WorkbenchState>({
  ...props.initialState.state,
  components: [...props.initialState.state.components],
  repositories: [...props.initialState.state.repositories],
})

const currentRelease = computed(() => props.initialState.manifest.releases.find(
  release => release.codename === state.value.release,
) ?? props.initialState.manifest.releases[0]!)

const heroParts = computed(() => copy.value.hero.title.split('{release}'))

const statusLabel = (status: string): string => {
  const key = RELEASE_STATUS_KEYS[status]
  return key ? ui.value.controls.releaseStatus[key] : status
}

const availabilityNote = computed(() => {
  const { availability } = ui.value.controls
  const release = currentRelease.value
  if (release.codename === 'bullseye') return availability.bullseye
  if (release.codename === 'bookworm') return availability.bookworm
  if (!release.capabilities.security) return fill(availability.baseOnly, { release: release.codename })
  return null
})

const componentLabel = (component: string): string => {
  const options = ui.value.controls.options as Readonly<Record<string, string>>
  return options[camelKey(component)] ?? component
}

const removalNotice = ref<string | null>(null)

const dispatch = (action: WorkbenchAction): void => {
  const result = reduceWorkbenchState(state.value, action)
  state.value = {
    ...result.state,
    components: [...result.state.components],
    repositories: [...result.state.repositories],
  }
  // Each system change replaces the notice so it never describes an older release or architecture.
  if (action.type !== 'set-system') return
  const removed = new Set(result.removed.map(removal => removal.id))
  const names = props.initialState.manifest.products.filter(product => removed.has(product.id)).map(product => product.name)
  removalNotice.value = names.length === 0
    ? null
    : fill(names.length === 1 ? ui.value.selection.incompatibleRemoved : ui.value.selection.incompatibleRemovedMany, { products: names.join(', ') })
}

const checkedOf = (event: Event): boolean => (event.currentTarget as unknown as { checked: boolean }).checked

const setSystem = (changes: { release?: ReleaseCodename, architecture?: SystemArchitecture, format?: SourceFormat }): void => dispatch({
  type: 'set-system',
  release: changes.release ?? state.value.release,
  architecture: changes.architecture ?? state.value.architecture,
  format: changes.format ?? state.value.format,
})

const setOfficialSources = (changes: Partial<Pick<WorkbenchState, 'includeSource' | 'includeSecurity' | 'includeUpdates' | 'includeBackports' | 'components'>>): void => dispatch({
  type: 'set-official-sources',
  includeSource: changes.includeSource ?? state.value.includeSource,
  includeSecurity: changes.includeSecurity ?? state.value.includeSecurity,
  includeUpdates: changes.includeUpdates ?? state.value.includeUpdates,
  includeBackports: changes.includeBackports ?? state.value.includeBackports,
  components: changes.components ?? state.value.components,
})

const setComponent = (component: string, event: Event): void => setOfficialSources({
  components: checkedOf(event)
    ? [...state.value.components, component]
    : state.value.components.filter(value => value !== component),
})

const toggleRepository = (id: string, checked: boolean): void => {
  removalNotice.value = null
  dispatch({
    type: 'set-repositories',
    repositories: checked
      ? [...state.value.repositories, id]
      : state.value.repositories.filter(repository => repository !== id),
  })
}
</script>

<template>
  <main class="workbench" tabindex="-1">
    <section class="hero">
      <h1>{{ heroParts[0] }}<span class="hero__release">{{ state.release }}</span>{{ heroParts.slice(1).join(state.release) }}</h1>
      <p class="hero__lead">{{ copy.hero.lead }}</p>
    </section>

    <form
      id="setup"
      class="setup"
      :action="initialState.path"
      method="get"
      @submit.prevent
    >
      <section class="card system" aria-labelledby="system-title">
        <div class="system__choices">
          <h2 id="system-title">{{ copy.sections.system }}</h2>
          <fieldset class="chips">
            <legend>{{ ui.controls.fields.release }}</legend>
            <label v-for="release in initialState.manifest.releases" :key="release.codename" class="chip">
              <input
                type="radio"
                name="release"
                :value="release.codename"
                :checked="state.release === release.codename"
                @change="setSystem({ release: release.codename })"
              >
              <span>{{ release.codename }} <small>{{ statusLabel(release.status) }}</small></span>
            </label>
          </fieldset>
          <fieldset class="chips">
            <legend>{{ ui.controls.fields.architecture }}</legend>
            <label v-for="architecture in ARCHITECTURES" :key="architecture" class="chip">
              <input
                type="radio"
                name="architecture"
                :value="architecture"
                :checked="state.architecture === architecture"
                @change="setSystem({ architecture })"
              >
              <span>{{ ui.controls.architectures[architecture] }}</span>
            </label>
          </fieldset>
          <fieldset v-if="currentRelease.formats.length > 1" class="chips">
            <legend>{{ ui.controls.fields.format }}</legend>
            <label v-for="format in currentRelease.formats" :key="format" class="chip">
              <input
                type="radio"
                name="format"
                :value="format"
                :checked="state.format === format"
                @change="setSystem({ format })"
              >
              <span>{{ ui.controls.formats[format] }}</span>
            </label>
          </fieldset>
        </div>

        <div class="system__debian">
          <fieldset class="switches">
            <legend>{{ ui.controls.groups.additionalSuites }}</legend>
            <label class="switch">
              <input type="checkbox" role="switch" name="suite" value="security" :checked="state.includeSecurity" :disabled="!currentRelease.capabilities.security" @change="setOfficialSources({ includeSecurity: checkedOf($event) })">
              {{ ui.controls.options.security }}
            </label>
            <label class="switch">
              <input type="checkbox" role="switch" name="suite" value="updates" :checked="state.includeUpdates" :disabled="!currentRelease.capabilities.updates" @change="setOfficialSources({ includeUpdates: checkedOf($event) })">
              {{ ui.controls.options.updates }}
            </label>
            <label class="switch">
              <input type="checkbox" role="switch" name="suite" value="backports" :checked="state.includeBackports" :disabled="!currentRelease.capabilities.backports" @change="setOfficialSources({ includeBackports: checkedOf($event) })">
              {{ ui.controls.options.backports }}
            </label>
          </fieldset>
          <p v-if="availabilityNote" class="hint">{{ availabilityNote }}</p>
          <fieldset class="switches">
            <legend>{{ ui.controls.groups.repositoryComponents }}</legend>
            <label v-for="component in currentRelease.components" :key="component" class="switch">
              <input
                type="checkbox"
                role="switch"
                name="component"
                :value="component"
                :checked="state.components.includes(component)"
                :disabled="component === 'main'"
                @change="setComponent(component, $event)"
              >
              {{ componentLabel(component) }}
            </label>
          </fieldset>
          <fieldset class="switches">
            <legend>{{ ui.controls.groups.packageIndexes }}</legend>
            <label class="switch">
              <input type="checkbox" role="switch" name="source" value="1" :checked="state.includeSource" @change="setOfficialSources({ includeSource: checkedOf($event) })">
              {{ ui.controls.options.sourcePackages }}
            </label>
          </fieldset>
        </div>
      </section>

      <div class="notice-region" role="status" aria-live="polite">
        <p v-if="removalNotice" class="notice">{{ removalNotice }}</p>
      </div>

      <div class="workspace">
        <SoftwarePicker
          :copy="copy"
          :locale="initialState.locale"
          :products="initialState.manifest.products"
          :state="state"
          @toggle="toggleRepository"
        />
        <FilesPanel
          :copy="copy"
          :locale="initialState.locale"
          :state="state"
        />
      </div>
    </form>
  </main>
</template>
