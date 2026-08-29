<script setup lang="ts">
import { computed, reactive } from 'vue'
import { copyText, downloadText } from '../../features/sources/download'
import { generateSources, getOutputFilename } from '../../features/sources/generate'
import {
  generateInstallScript,
  generatePackageInstallCommand,
  generateRepositoryArtifacts,
  type GeneratedRepositoryArtifact,
} from '../../features/vendors/generate'
import type { SiteCopy } from '../../site/locales'
import type { WorkbenchState } from '../state'
import type { WorkbenchHydrationProduct } from '../types'

const props = defineProps<{
  copy: SiteCopy
  state: WorkbenchState
  products: readonly WorkbenchHydrationProduct[]
  basePath: string
  siteOrigin: string
}>()

interface Feedback {
  kind: 'success' | 'error'
  message: string
}

const feedback = reactive<Record<string, Feedback | undefined>>({})

const compareCodePoints = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0

const selectedProducts = computed(() => props.products
  .filter(product => props.state.repositories.includes(product.id))
  .sort((left, right) => compareCodePoints(left.name, right.name)))

const apiRoot = computed(() => `${props.siteOrigin}${props.basePath}api/v1`)

const debianFilename = computed(() => getOutputFilename(props.state.format))

const debianContent = computed<{ content: string } | { error: string }>(() => {
  try {
    return {
      content: generateSources({
        release: props.state.release,
        format: props.state.format,
        includeSource: props.state.includeSource,
        includeSecurity: props.state.includeSecurity,
        includeUpdates: props.state.includeUpdates,
        includeBackports: props.state.includeBackports,
        components: props.state.components,
      }),
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
})

const debianCurl = computed(() => (
  `curl -fsSLo /tmp/${debianFilename.value} "${apiRoot.value}/${props.state.release}/${debianFilename.value}"`
))

interface RepositoryPlan {
  sourceId: string
  productNames: string[]
  sourceArtifact?: GeneratedRepositoryArtifact
  preferenceArtifacts: GeneratedRepositoryArtifact[]
}

const vendorConfig = computed(() => ({
  release: props.state.release,
  architecture: props.state.architecture,
  productIds: [...props.state.repositories],
}))

const repositoryArtifacts = computed<{ artifacts: GeneratedRepositoryArtifact[] } | { error: string }>(() => {
  if (props.state.repositories.length === 0) return { artifacts: [] }
  try {
    return { artifacts: generateRepositoryArtifacts(vendorConfig.value) }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
})

const repositoryPlans = computed<RepositoryPlan[]>(() => {
  if (!('artifacts' in repositoryArtifacts.value)) return []
  const plans = new Map<string, RepositoryPlan>()
  for (const artifact of repositoryArtifacts.value.artifacts) {
    const plan = plans.get(artifact.sourceId) ?? {
      sourceId: artifact.sourceId,
      productNames: [],
      preferenceArtifacts: [],
    }
    if (artifact.filename.endsWith('.sources')) {
      plan.sourceArtifact = artifact
    } else {
      plan.preferenceArtifacts.push(artifact)
    }
    plans.set(artifact.sourceId, plan)
  }
  for (const product of selectedProducts.value) {
    if (product.sourceId && plans.has(product.sourceId)) {
      plans.get(product.sourceId)?.productNames.push(product.name)
    }
  }
  return [...plans.values()].sort((left, right) => compareCodePoints(left.sourceId, right.sourceId))
})

const sourceCurl = (sourceId: string): string => (
  `curl -fsSLo /tmp/${sourceId}.sources "${apiRoot.value}/sources/${sourceId}/${props.state.release}/${props.state.architecture}/${sourceId}.sources"`
)
const sourceInstallCurl = (sourceId: string): string => (
  `curl -fsSLo /tmp/${sourceId}-install.sh "${apiRoot.value}/sources/${sourceId}/${props.state.release}/${props.state.architecture}/install.sh"`
)

const installScript = computed<{ content: string } | { error: string } | null>(() => {
  if (props.state.repositories.length === 0 || !('artifacts' in repositoryArtifacts.value)) return null
  try {
    return { content: generateInstallScript(vendorConfig.value, repositoryArtifacts.value.artifacts).content }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
})

const packageCommand = computed<string>(() => {
  if (props.state.repositories.length === 0) return ''
  try {
    return generatePackageInstallCommand(vendorConfig.value)
  } catch {
    return ''
  }
})

async function copyContent(key: string, content: string): Promise<void> {
  try {
    await copyText(content)
    feedback[key] = { kind: 'success', message: props.copy.actions.copy }
  } catch {
    feedback[key] = { kind: 'error', message: props.copy.errors.copyFailed }
  }
}

function download(key: string, filename: string, content: string, mediaType = 'text/plain'): void {
  try {
    downloadText(filename, content, undefined, mediaType)
    feedback[key] = { kind: 'success', message: props.copy.actions.download }
  } catch {
    feedback[key] = { kind: 'error', message: props.copy.errors.downloadFailed }
  }
}
</script>

<template>
  <div class="export-plan">
    <section class="export-block" aria-labelledby="export-selection-heading">
      <h3 id="export-selection-heading">Selected software ({{ selectedProducts.length }})</h3>
      <p v-if="selectedProducts.length === 0" class="audit-note">
        No repositories selected. The export contains only the Debian base configuration.
      </p>
      <ul v-else class="selection-list">
        <li v-for="product in selectedProducts" :key="product.id">
          <strong>{{ product.name }}</strong>
          <span class="cell-sub"><code>{{ product.id }}</code> &middot; <code>{{ product.packages.join(' ') }}</code></span>
        </li>
      </ul>
    </section>

    <section class="export-block" aria-labelledby="export-debian-heading">
      <h3 id="export-debian-heading">Debian base &mdash; <code>{{ debianFilename }}</code></h3>
      <template v-if="'content' in debianContent">
        <pre :aria-label="`${debianFilename} content`" tabindex="0"><code>{{ debianContent.content }}</code></pre>
        <div class="export-actions" role="group" aria-label="Debian source actions">
          <button type="button" @click="copyContent('debian', debianContent.content)">{{ copy.actions.copy }}</button>
          <button type="button" @click="download('debian', debianFilename, debianContent.content)">{{ copy.actions.download }}</button>
        </div>
        <p v-if="feedback.debian" :role="feedback.debian.kind === 'error' ? 'alert' : 'status'">
          {{ feedback.debian.message }}
        </p>
        <p class="curl-label">Safe retrieval &mdash; save, inspect, then apply:</p>
        <pre><code>{{ debianCurl }}</code></pre>
      </template>
      <p v-else class="audit-note" role="alert">{{ debianContent.error }}</p>
    </section>

    <section
      v-for="plan in repositoryPlans"
      :key="plan.sourceId"
      class="export-block"
      :aria-labelledby="`export-source-${plan.sourceId}-heading`"
    >
      <h3 :id="`export-source-${plan.sourceId}-heading`">
        <code>{{ plan.sourceId }}</code> &mdash; {{ plan.productNames.join(', ') }}
      </h3>
      <template v-if="plan.sourceArtifact">
        <pre tabindex="0"><code>{{ plan.sourceArtifact.content }}</code></pre>
        <div class="export-actions" role="group" :aria-label="`${plan.sourceId} source actions`">
          <button type="button" @click="copyContent(plan.sourceId, plan.sourceArtifact.content)">{{ copy.actions.copy }}</button>
          <button type="button" @click="download(plan.sourceId, plan.sourceArtifact.filename, plan.sourceArtifact.content)">{{ copy.actions.download }}</button>
        </div>
        <p v-if="feedback[plan.sourceId]" :role="feedback[plan.sourceId]?.kind === 'error' ? 'alert' : 'status'">
          {{ feedback[plan.sourceId]?.message }}
        </p>
        <p v-if="plan.sourceArtifact.riskNotes?.length" class="audit-note" role="alert">
          {{ plan.sourceArtifact.riskNotes.join(' ') }}
        </p>
        <p class="curl-label">Safe retrieval &mdash; save, inspect, then apply:</p>
        <pre><code>{{ sourceCurl(plan.sourceId) }}
{{ sourceInstallCurl(plan.sourceId) }}</code></pre>
      </template>
    </section>

    <section v-if="installScript" class="export-block" aria-labelledby="export-install-heading">
      <h3 id="export-install-heading">Reviewed installation script</h3>
      <template v-if="'content' in installScript">
        <pre tabindex="0"><code>{{ installScript.content }}</code></pre>
        <div class="export-actions" role="group" aria-label="Install script actions">
          <button type="button" @click="copyContent('install', installScript.content)">{{ copy.actions.copy }}</button>
          <button
            type="button"
            @click="download('install', 'install-vendor-repositories.sh', installScript.content, 'text/x-shellscript')"
          >
            {{ copy.actions.download }}
          </button>
        </div>
        <p v-if="feedback.install" :role="feedback.install.kind === 'error' ? 'alert' : 'status'">
          {{ feedback.install.message }}
        </p>
        <p class="audit-note">
          Save this script, read it, then run it explicitly &mdash; never pipe a remote script into a privileged shell.
        </p>
      </template>
      <p v-else class="audit-note" role="alert">{{ installScript.error }}</p>
    </section>

    <section v-if="packageCommand" class="export-block" aria-labelledby="export-packages-heading">
      <h3 id="export-packages-heading">Package installation</h3>
      <pre tabindex="0"><code>{{ packageCommand }}</code></pre>
      <div class="export-actions" role="group" aria-label="Package command actions">
        <button type="button" @click="copyContent('packages', packageCommand)">{{ copy.actions.copy }}</button>
      </div>
      <p v-if="feedback.packages" :role="feedback.packages.kind === 'error' ? 'alert' : 'status'">
        {{ feedback.packages.message }}
      </p>
    </section>
  </div>
</template>
