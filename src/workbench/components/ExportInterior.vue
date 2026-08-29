<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { copyText, downloadText } from '../../features/sources/download'
import { renderIcon } from '../../site/icons'
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
import CodeBlock from './CodeBlock.vue'

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

const view = ref<'structured' | 'raw'>('structured')

const fileCount = computed(() => (
  1
  + repositoryPlans.value.filter(plan => plan.sourceArtifact).length
  + (installScript.value && 'content' in installScript.value ? 1 : 0)
))

const rawDump = computed(() => {
  const sections: string[] = []
  const divider = (label: string): string => `# ===== ${label} =====`

  sections.push(divider(debianFilename.value))
  if ('content' in debianContent.value) sections.push(debianContent.value.content.trimEnd())
  sections.push('')
  sections.push(divider('curl'))
  sections.push(debianCurl.value)

  for (const plan of repositoryPlans.value) {
    if (!plan.sourceArtifact) continue
    sections.push('')
    sections.push(divider(plan.sourceArtifact.filename))
    sections.push(plan.sourceArtifact.content.trimEnd())
    sections.push('')
    sections.push(divider('curl'))
    sections.push(sourceCurl(plan.sourceId))
    sections.push(sourceInstallCurl(plan.sourceId))
  }

  if (installScript.value && 'content' in installScript.value) {
    sections.push('')
    sections.push(divider('install-vendor-repositories.sh'))
    sections.push(installScript.value.content.trimEnd())
  }

  if (packageCommand.value) {
    sections.push('')
    sections.push(divider('apt-get'))
    sections.push(packageCommand.value.trimEnd())
  }

  return sections.join('\n')
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
    <section class="export-summary" aria-label="Export summary">
      <dl class="export-summary__grid">
        <div><dt>Release</dt><dd>{{ state.release }}</dd></div>
        <div><dt>Architecture</dt><dd>{{ state.architecture }}</dd></div>
        <div><dt>Format</dt><dd>{{ state.format }}</dd></div>
        <div><dt>Selected software</dt><dd>{{ selectedProducts.length }}</dd></div>
        <div><dt>Unique sources</dt><dd>{{ repositoryPlans.length }}</dd></div>
        <div><dt>Files</dt><dd>{{ fileCount }}</dd></div>
      </dl>
      <div class="export-view-toggle" role="radiogroup" aria-label="Export view">
        <label :class="{ 'export-view-toggle__option--active': view === 'structured' }">
          <input type="radio" name="export-view" value="structured" :checked="view === 'structured'" @change="view = 'structured'">
          Structured
        </label>
        <label :class="{ 'export-view-toggle__option--active': view === 'raw' }">
          <input type="radio" name="export-view" value="raw" :checked="view === 'raw'" @change="view = 'raw'">
          Raw
        </label>
      </div>
    </section>

    <section v-if="view === 'raw'" class="export-block" aria-labelledby="export-raw-heading">
      <h3 id="export-raw-heading">Combined output</h3>
      <div class="code-panel">
        <div class="code-panel__bar">
          <span class="code-panel__filename">cat *</span>
          <div class="code-panel__actions" role="group" aria-label="Combined output actions">
            <button class="btn" type="button" @click="copyContent('raw', rawDump)"><span v-html="renderIcon('copy')" />{{ copy.actions.copy }}</button>
            <button class="btn" type="button" @click="download('raw', 'debgen-export.txt', rawDump)"><span v-html="renderIcon('download')" />{{ copy.actions.download }}</button>
          </div>
        </div>
        <pre tabindex="0"><code>{{ rawDump }}</code></pre>
      </div>
      <p v-if="feedback.raw" class="feedback-note" :role="feedback.raw.kind === 'error' ? 'alert' : 'status'">
        {{ feedback.raw.message }}
      </p>
    </section>

    <template v-else>
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
        <div class="code-panel">
          <div class="code-panel__bar">
            <span class="code-panel__filename">{{ debianFilename }}</span>
            <div class="code-panel__actions" role="group" aria-label="Debian source actions">
              <button class="btn" type="button" @click="copyContent('debian', debianContent.content)"><span v-html="renderIcon('copy')" />{{ copy.actions.copy }}</button>
              <button class="btn" type="button" @click="download('debian', debianFilename, debianContent.content)"><span v-html="renderIcon('download')" />{{ copy.actions.download }}</button>
            </div>
          </div>
          <pre :aria-label="`${debianFilename} content`" tabindex="0"><code>{{ debianContent.content }}</code></pre>
        </div>
        <p v-if="feedback.debian" class="feedback-note" :role="feedback.debian.kind === 'error' ? 'alert' : 'status'">
          {{ feedback.debian.message }}
        </p>
        <p class="curl-label">Safe retrieval &mdash; save, inspect, then apply:</p>
        <div class="code-panel">
          <div class="code-panel__bar">
            <span class="code-panel__filename">curl</span>
            <div class="code-panel__actions" role="group" aria-label="Debian curl command actions">
              <button class="btn" type="button" @click="copyContent('debian-curl', debianCurl)"><span v-html="renderIcon('copy')" />{{ copy.actions.copy }}</button>
            </div>
          </div>
          <CodeBlock :code="debianCurl" lang="bash" aria-label="Debian curl command" />
        </div>
        <p v-if="feedback['debian-curl']" class="feedback-note" :role="feedback['debian-curl']?.kind === 'error' ? 'alert' : 'status'">
          {{ feedback['debian-curl']?.message }}
        </p>
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
        <div class="code-panel">
          <div class="code-panel__bar">
            <span class="code-panel__filename">{{ plan.sourceArtifact.filename }}</span>
            <div class="code-panel__actions" role="group" :aria-label="`${plan.sourceId} source actions`">
              <button class="btn" type="button" @click="copyContent(plan.sourceId, plan.sourceArtifact.content)"><span v-html="renderIcon('copy')" />{{ copy.actions.copy }}</button>
              <button class="btn" type="button" @click="download(plan.sourceId, plan.sourceArtifact.filename, plan.sourceArtifact.content)"><span v-html="renderIcon('download')" />{{ copy.actions.download }}</button>
            </div>
          </div>
          <pre tabindex="0"><code>{{ plan.sourceArtifact.content }}</code></pre>
        </div>
        <p v-if="feedback[plan.sourceId]" class="feedback-note" :role="feedback[plan.sourceId]?.kind === 'error' ? 'alert' : 'status'">
          {{ feedback[plan.sourceId]?.message }}
        </p>
        <p v-if="plan.sourceArtifact.riskNotes?.length" class="audit-note" role="alert">
          {{ plan.sourceArtifact.riskNotes.join(' ') }}
        </p>
        <p class="curl-label">Safe retrieval &mdash; save, inspect, then apply:</p>
        <div class="code-panel">
          <div class="code-panel__bar">
            <span class="code-panel__filename">curl</span>
            <div class="code-panel__actions" role="group" :aria-label="`${plan.sourceId} curl actions`">
              <button class="btn" type="button" @click="copyContent(`${plan.sourceId}-curl`, `${sourceCurl(plan.sourceId)}\n${sourceInstallCurl(plan.sourceId)}`)"><span v-html="renderIcon('copy')" />{{ copy.actions.copy }}</button>
            </div>
          </div>
          <CodeBlock
            :code="`${sourceCurl(plan.sourceId)}\n${sourceInstallCurl(plan.sourceId)}`"
            lang="bash"
            :aria-label="`${plan.sourceId} curl commands`"
          />
        </div>
        <p v-if="feedback[`${plan.sourceId}-curl`]" class="feedback-note" :role="feedback[`${plan.sourceId}-curl`]?.kind === 'error' ? 'alert' : 'status'">
          {{ feedback[`${plan.sourceId}-curl`]?.message }}
        </p>
      </template>
    </section>

    <section v-if="installScript" class="export-block" aria-labelledby="export-install-heading">
      <h3 id="export-install-heading">Reviewed installation script</h3>
      <template v-if="'content' in installScript">
        <div class="code-panel">
          <div class="code-panel__bar">
            <span class="code-panel__filename">install-vendor-repositories.sh</span>
            <div class="code-panel__actions" role="group" aria-label="Install script actions">
              <button class="btn" type="button" @click="copyContent('install', installScript.content)"><span v-html="renderIcon('copy')" />{{ copy.actions.copy }}</button>
              <button
                class="btn"
                type="button"
                @click="download('install', 'install-vendor-repositories.sh', installScript.content, 'text/x-shellscript')"
              >
                <span v-html="renderIcon('download')" />{{ copy.actions.download }}
              </button>
            </div>
          </div>
          <CodeBlock :code="installScript.content" lang="bash" aria-label="Install script content" />
        </div>
        <p v-if="feedback.install" class="feedback-note" :role="feedback.install.kind === 'error' ? 'alert' : 'status'">
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
      <div class="code-panel">
        <div class="code-panel__bar">
          <span class="code-panel__filename">apt-get</span>
          <div class="code-panel__actions" role="group" aria-label="Package command actions">
            <button class="btn" type="button" @click="copyContent('packages', packageCommand)"><span v-html="renderIcon('copy')" />{{ copy.actions.copy }}</button>
          </div>
        </div>
        <CodeBlock :code="packageCommand" lang="bash" aria-label="Package installation command" />
      </div>
      <p v-if="feedback.packages" class="feedback-note" :role="feedback.packages.kind === 'error' ? 'alert' : 'status'">
        {{ feedback.packages.message }}
      </p>
    </section>
    </template>
  </div>
</template>
