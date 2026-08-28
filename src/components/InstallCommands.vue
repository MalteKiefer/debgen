<script setup lang="ts">
import { ref } from 'vue'
import { copyText } from '../features/sources/download'

defineProps<{
  setupScript: string
  packageCommand: string
}>()

const feedback = ref<{ kind: 'success' | 'error', message: string } | null>(null)
let feedbackVersion = 0

async function copyCommand(label: string, content: string): Promise<void> {
  const version = ++feedbackVersion
  feedback.value = null
  try {
    await copyText(content)
    if (version !== feedbackVersion) return
    feedback.value = { kind: 'success', message: `${label} wurde kopiert.` }
  } catch {
    if (version !== feedbackVersion) return
    feedback.value = {
      kind: 'error',
      message: `Kopieren fehlgeschlagen. Bitte kopiere ${label.toLowerCase()} manuell.`,
    }
  }
}
</script>

<template>
  <section aria-label="Installationsbefehle" class="install-commands">
    <header class="install-commands__heading">
      <div>
        <p class="review-step__eyebrow">Installation</p>
        <h3>Geprüfte Befehle</h3>
      </div>
      <v-icon aria-hidden="true" color="primary" icon="mdi-console-line" size="30" />
    </header>

    <v-alert icon="mdi-shield-alert-outline" type="warning" variant="tonal">
      Prüfe Dateien und Befehle vor der Ausführung. Führe sie nur auf einem System aus, das du verwaltest.
    </v-alert>

    <article aria-label="Repository-Einrichtung" class="install-commands__block">
      <div class="install-commands__block-heading">
        <div>
          <h4>1. Repositorys einrichten</h4>
          <p>Installiert Schlüssel und Quelldateien und aktualisiert den Paketindex.</p>
        </div>
        <v-btn
          aria-label="Repository-Einrichtung kopieren"
          class="studio-touch-target"
          prepend-icon="mdi-content-copy"
          variant="tonal"
          @click="copyCommand('Repository-Einrichtung', setupScript)"
        >
          Kopieren
        </v-btn>
      </div>
      <pre tabindex="0"><code>{{ setupScript }}</code></pre>
    </article>

    <article aria-label="Paketinstallation" class="install-commands__block">
      <div class="install-commands__block-heading">
        <div>
          <h4>2. Gewählte Pakete installieren</h4>
          <p>Diesen Befehl erst nach Prüfung der neuen Paketquellen ausführen.</p>
        </div>
        <v-btn
          aria-label="Paketinstallation kopieren"
          class="studio-touch-target"
          prepend-icon="mdi-content-copy"
          variant="tonal"
          @click="copyCommand('Paketinstallation', packageCommand)"
        >
          Kopieren
        </v-btn>
      </div>
      <pre tabindex="0"><code>{{ packageCommand }}</code></pre>
    </article>

    <div aria-live="polite" class="install-commands__feedback">
      <p v-if="feedback?.kind === 'success'" role="status">{{ feedback.message }}</p>
      <p v-else-if="feedback?.kind === 'error'" role="alert">{{ feedback.message }}</p>
    </div>
  </section>
</template>
