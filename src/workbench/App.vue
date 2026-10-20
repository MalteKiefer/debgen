<script setup lang="ts">
import {
  defineAsyncComponent,
  computed,
  nextTick,
  ref,
} from 'vue'
import type { SourceFormat } from '../features/sources/model'
import type { SystemArchitecture } from '../features/vendors/model'
import { trackEvent } from './analytics'
import StepperNavigation from './components/StepperNavigation.vue'
import StepperSection from './components/StepperSection.vue'
import { reduceWorkbenchState, type WorkbenchAction, type WorkbenchState, type WorkbenchStep } from './state'
import type { WorkbenchHydrationPayload } from './types'

const props = defineProps<{
  initialState: WorkbenchHydrationPayload
}>()

const RepositoryInterior = defineAsyncComponent(() => import('./components/RepositoryInterior.vue'))
const ExportInterior = defineAsyncComponent(() => import('./components/ExportInterior.vue'))

const state = ref<WorkbenchState>({
  ...props.initialState.state,
  components: [...props.initialState.state.components],
  repositories: [...props.initialState.state.repositories],
})

const currentRelease = computed(() => props.initialState.manifest.releases.find(
  release => release.codename === state.value.release,
) ?? props.initialState.manifest.releases[0]!)

const compareCodePoints = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0

const selectedProducts = computed(() => props.initialState.manifest.products
  .filter(product => state.value.repositories.includes(product.id))
  .sort((left, right) => compareCodePoints(left.name, right.name)))

const updateState = (nextState: WorkbenchState): void => {
  state.value = {
    ...nextState,
    components: [...nextState.components],
    repositories: [...nextState.repositories],
  }
}

interface RemovalNotice {
  readonly names: readonly string[]
  readonly release: string
  readonly architecture: string
}

const removalNotice = ref<RemovalNotice | null>(null)
const exportInterior = ref<{ downloadPlan: () => void } | null>(null)

const dispatch = (action: WorkbenchAction): void => {
  const result = reduceWorkbenchState(state.value, action)
  updateState(result.state)
  // Each system change replaces the notice so it never describes an older release or architecture.
  if (action.type !== 'set-system') return
  const removed = new Set(result.removed.map(removal => removal.id))
  removalNotice.value = removed.size === 0
    ? null
    : {
        names: props.initialState.manifest.products.filter(product => removed.has(product.id)).map(product => product.name),
        release: result.state.release,
        architecture: result.state.architecture,
      }
}

const exportPlan = (): void => {
  exportInterior.value?.downloadPlan()
  trackEvent('Config Exported', { release: state.value.release, repositories: state.value.repositories.length })
}

const navigate = async (step: WorkbenchStep): Promise<void> => {
  dispatch({ type: 'set-active-step', activeStep: step })
  const browser = globalThis as typeof globalThis & {
    history?: { replaceState: (data: unknown, unused: string, url?: string) => void }
    document?: { getElementById: (id: string) => { focus: () => void } | null }
  }
  browser.history?.replaceState(null, '', `#${step}`)
  await nextTick()
  browser.document?.getElementById(`${step}-title`)?.focus()
}

const setSystem = (field: 'release' | 'architecture' | 'format', value: string): void => dispatch({
  type: 'set-system',
  release: field === 'release' ? value as typeof state.value.release : state.value.release,
  architecture: field === 'architecture' ? value as SystemArchitecture : state.value.architecture,
  format: field === 'format' ? value as SourceFormat : state.value.format,
})

const setOfficialBoolean = (
  field: 'includeSource' | 'includeSecurity' | 'includeUpdates' | 'includeBackports',
  event: Event,
): void => {
  const checked = (event.currentTarget as unknown as { checked: boolean }).checked
  dispatch({
    type: 'set-official-sources',
    includeSource: field === 'includeSource' ? checked : state.value.includeSource,
    includeSecurity: field === 'includeSecurity' ? checked : state.value.includeSecurity,
    includeUpdates: field === 'includeUpdates' ? checked : state.value.includeUpdates,
    includeBackports: field === 'includeBackports' ? checked : state.value.includeBackports,
    components: state.value.components,
  })
}

const setComponent = (component: string, event: Event): void => {
  const checked = (event.currentTarget as unknown as { checked: boolean }).checked
  dispatch({
    type: 'set-official-sources',
    includeSource: state.value.includeSource,
    includeSecurity: state.value.includeSecurity,
    includeUpdates: state.value.includeUpdates,
    includeBackports: state.value.includeBackports,
    components: checked
      ? [...state.value.components, component]
      : state.value.components.filter(value => value !== component),
  })
}

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
  <div class="workbench-layout">
    <StepperNavigation
      :active-step="state.activeStep"
      :copy="initialState.copy"
      @navigate="navigate"
    />
    <main tabindex="-1">
      <h1>{{ initialState.copy.seo.workbenchTitle }}</h1>
      <p class="lede">{{ initialState.copy.seo.workbenchDescription }}</p>
      <form
        id="workbench-form"
        class="workbench-form"
        :action="initialState.path"
        method="get"
        @submit.prevent
      >
        <StepperSection
          step="system"
          :title="initialState.copy.steps.system"
          :number="1"
          :active="state.activeStep === 'system'"
        >
          <div class="control-grid">
            <label for="release">
              Debian release
              <select
                id="release"
                name="release"
                :value="state.release"
                @change="setSystem('release', ($event.currentTarget as unknown as { value: string }).value)"
              >
                <option
                  v-for="release in initialState.manifest.releases"
                  :key="release.codename"
                  :value="release.codename"
                >
                  {{ release.codename }} — {{ release.status }}
                </option>
              </select>
            </label>
            <label for="architecture">
              Architecture
              <select
                id="architecture"
                name="architecture"
                :value="state.architecture"
                @change="setSystem('architecture', ($event.currentTarget as unknown as { value: string }).value)"
              >
                <option value="amd64">amd64</option>
                <option value="arm64">arm64</option>
                <option value="armhf">armhf</option>
                <option value="i386">i386</option>
              </select>
            </label>
            <label for="format">
              Source format
              <select
                id="format"
                name="format"
                :value="state.format"
                @change="setSystem('format', ($event.currentTarget as unknown as { value: string }).value)"
              >
                <option
                  v-for="format in currentRelease.formats"
                  :key="format"
                  :value="format"
                >
                  {{ format === 'deb822' ? 'deb822 (.sources)' : 'legacy (.list)' }}
                </option>
              </select>
            </label>
          </div>
          <p class="support-note">Compatibility is checked before repository selection.</p>
          <div role="status" aria-live="polite">
            <p v-if="removalNotice" class="audit-note">
              Removed because they are not compatible with {{ removalNotice.release }}/{{ removalNotice.architecture }}: {{ removalNotice.names.join(', ') }}
            </p>
          </div>
          <div class="choice-grid">
            <fieldset>
              <legend>Suites</legend>
              <label><input type="checkbox" name="suite" value="base" checked disabled> Base release</label>
              <label><input type="checkbox" name="suite" value="security" :checked="state.includeSecurity" :disabled="!currentRelease.capabilities.security" @change="setOfficialBoolean('includeSecurity', $event)"> Security updates</label>
              <label><input type="checkbox" name="suite" value="updates" :checked="state.includeUpdates" :disabled="!currentRelease.capabilities.updates" @change="setOfficialBoolean('includeUpdates', $event)"> Stable updates</label>
              <label><input type="checkbox" name="suite" value="backports" :checked="state.includeBackports" :disabled="!currentRelease.capabilities.backports" @change="setOfficialBoolean('includeBackports', $event)"> Backports</label>
              <label><input type="checkbox" name="source" value="1" :checked="state.includeSource" @change="setOfficialBoolean('includeSource', $event)"> Source packages</label>
            </fieldset>
            <fieldset>
              <legend>Components</legend>
              <label
                v-for="component in currentRelease.components"
                :key="component"
              >
                <input
                  type="checkbox"
                  name="component"
                  :value="component"
                  :checked="state.components.includes(component)"
                  :disabled="component === 'main'"
                  @change="setComponent(component, $event)"
                >
                {{ component }}
              </label>
            </fieldset>
          </div>
          <div class="step-actions"><a href="#repositories" @click.prevent="navigate('repositories')">{{ initialState.copy.actions.continue }}</a></div>
        </StepperSection>

        <StepperSection
          step="repositories"
          :title="initialState.copy.steps.repositories"
          :number="2"
          :active="state.activeStep === 'repositories'"
        >
          <RepositoryInterior
            :copy="initialState.copy"
            :products="initialState.manifest.products"
            :state="state"
            @toggle="toggleRepository"
          />
          <div class="step-actions"><a href="#system" @click.prevent="navigate('system')">{{ initialState.copy.actions.back }}</a><a href="#review" @click.prevent="navigate('review')">{{ initialState.copy.actions.continue }}</a></div>
        </StepperSection>

        <StepperSection
          step="review"
          :title="initialState.copy.steps.review"
          :number="3"
          :active="state.activeStep === 'review'"
        >
          <h3 class="review-subheading">Debian base</h3>
          <dl class="change-plan">
            <div><dt>{{ initialState.copy.audit.source }}</dt><dd>deb.debian.org/debian</dd></div>
            <div><dt>{{ initialState.copy.audit.operator }}</dt><dd>Debian Project</dd></div>
            <div><dt>{{ initialState.copy.audit.signingKey }}</dt><dd><code>{{ currentRelease.keyring }}</code></dd></div>
            <div><dt>{{ initialState.copy.audit.compatibility }}</dt><dd>Checked against {{ state.release }} and {{ state.architecture }}</dd></div>
          </dl>

          <h3 class="review-subheading">Third-party repositories ({{ selectedProducts.length }})</h3>
          <p v-if="selectedProducts.length === 0" class="audit-note">
            No third-party repositories selected. Add software in the Repositories step to include it here.
          </p>
          <dl v-else class="change-plan">
            <div v-for="product in selectedProducts" :key="product.id">
              <dt>{{ product.name }}</dt>
              <dd>
                <code>{{ product.packages.join(' ') }}</code>
                <span class="cell-sub">{{ product.provenance }} &middot; {{ product.supportLevel }}</span>
              </dd>
            </div>
          </dl>
          <div class="step-actions"><a href="#repositories" @click.prevent="navigate('repositories')">{{ initialState.copy.actions.back }}</a><a href="#export" @click.prevent="navigate('export')">{{ initialState.copy.actions.continue }}</a></div>
        </StepperSection>

        <StepperSection
          step="export"
          :title="initialState.copy.steps.export"
          :number="4"
          :active="state.activeStep === 'export'"
        >
          <p>{{ initialState.copy.trust.review }}</p>
          <ExportInterior
            ref="exportInterior"
            :base-path="initialState.basePath"
            :copy="initialState.copy"
            :products="initialState.manifest.products"
            :site-origin="initialState.siteOrigin"
            :state="state"
          />
          <div class="step-actions"><a href="#review" @click.prevent="navigate('review')">{{ initialState.copy.actions.back }}</a><button type="button" class="primary-action" @click="exportPlan">{{ initialState.copy.actions.export }}</button></div>
        </StepperSection>
      </form>
    </main>
  </div>
</template>
