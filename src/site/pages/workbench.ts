import { SUPPORTED_LOCALES, type SupportedLocale } from '../../i18n/locales'
import { RELEASES } from '../../features/sources/releases'
import { renderIcon } from '../icons'
import type { SiteCopy } from '../locales'
import type { SitePage } from '../model'
import { escapeHtml } from '../render'
import { sitePath } from '../routes'
import { buildSeoMetadata, buildWebsiteJsonLd } from '../seo'

export type WorkbenchStep = keyof SiteCopy['steps']

export interface WorkbenchPageContext {
  locale: SupportedLocale
  copy: SiteCopy
  activeStep?: WorkbenchStep
}

const steps: readonly WorkbenchStep[] = ['system', 'debian', 'repositories', 'review', 'export']

const renderWorkflow = (copy: SiteCopy, activeStep: WorkbenchStep): string => {
  const links = steps.map((step, index) => {
    const current = step === activeStep ? ' aria-current="step"' : ''
    return `<li><a href="#${step}"${current}><span class="step-number">${index + 1}</span><span>${escapeHtml(copy.steps[step])}</span></a></li>`
  }).join('')

  return `<nav aria-label="Workflow"><ol class="workflow-list">${links}</ol></nav>`
}

const renderReleaseOptions = (): string => RELEASES.map((release, index) => {
  const selected = index === 0 ? ' selected' : ''
  return `<option value="${escapeHtml(release.codename)}"${selected}>${escapeHtml(release.codename)} — ${escapeHtml(release.status)}</option>`
}).join('')

const renderLanguageControl = (locale: SupportedLocale): string => {
  const links = SUPPORTED_LOCALES.map((supportedLocale) => {
    const current = supportedLocale === locale ? ' aria-current="page"' : ''
    return `<li><a href="${escapeHtml(sitePath(supportedLocale))}" hreflang="${supportedLocale}" lang="${supportedLocale}"${current}>${supportedLocale}</a></li>`
  }).join('')

  return `<details class="language-control"><summary>Language <strong>${escapeHtml(locale)}</strong></summary><nav aria-label="Language"><ul>${links}</ul></nav></details>`
}

const renderThemeControl = (): string => `<details class="theme-control"><summary>${renderIcon('theme')}<span>Theme</span></summary><fieldset class="theme-options"><legend>Color theme</legend><label><input type="radio" id="theme-system" name="theme" value="system" checked>System</label><label><input type="radio" id="theme-light" name="theme" value="light">Light</label><label><input type="radio" id="theme-dark" name="theme" value="dark">Dark</label></fieldset></details>`

const renderSystemStep = (copy: SiteCopy): string => `<section id="system" class="workbench-step" data-step="system" aria-labelledby="system-title">
<header class="step-heading"><p class="eyebrow">01 / 05</p><h2 id="system-title">${escapeHtml(copy.steps.system)}</h2></header>
<div class="control-grid">
<label for="release">Debian release<select id="release" name="release">${renderReleaseOptions()}</select></label>
<label for="architecture">Architecture<select id="architecture" name="architecture"><option value="amd64" selected>amd64</option><option value="arm64">arm64</option><option value="armhf">armhf</option><option value="i386">i386</option></select></label>
<label for="format">Source format<select id="format" name="format"><option value="deb822" selected>deb822 (.sources)</option><option value="legacy">legacy (.list)</option></select></label>
</div>
<p class="support-note"><span class="status-icon">${renderIcon('check')}</span>Compatibility is checked before repository selection.</p>
<div class="step-actions"><a href="#debian">${escapeHtml(copy.actions.continue)}</a></div>
</section>`

const renderDebianStep = (copy: SiteCopy): string => `<section id="debian" class="workbench-step" data-step="debian" aria-labelledby="debian-title">
<header class="step-heading"><p class="eyebrow">02 / 05</p><h2 id="debian-title">${escapeHtml(copy.steps.debian)}</h2></header>
<div class="choice-grid">
<fieldset><legend>Suites</legend><label><input type="checkbox" name="suite" value="base" checked> Base release</label><label><input type="checkbox" name="suite" value="security" checked> Security updates</label><label><input type="checkbox" name="suite" value="updates" checked> Stable updates</label><label><input type="checkbox" name="suite" value="backports"> Backports</label></fieldset>
<fieldset><legend>Components</legend><label><input type="checkbox" name="component" value="main" checked> main</label><label><input type="checkbox" name="component" value="contrib"> contrib</label><label><input type="checkbox" name="component" value="non-free"> non-free</label><label><input type="checkbox" name="component" value="non-free-firmware" checked> non-free-firmware</label></fieldset>
</div>
<div class="step-actions"><a href="#system">${escapeHtml(copy.actions.back)}</a><a href="#repositories">${escapeHtml(copy.actions.continue)}</a></div>
</section>`

const renderRepositoriesStep = (copy: SiteCopy): string => `<section id="repositories" class="workbench-step" data-step="repositories" aria-labelledby="repositories-title">
<header class="step-heading"><p class="eyebrow">03 / 05</p><h2 id="repositories-title">${escapeHtml(copy.steps.repositories)}</h2></header>
<label for="repository-search">${escapeHtml(copy.search.label)}<input type="search" id="repository-search" name="q" placeholder="${escapeHtml(copy.search.placeholder)}" autocomplete="off"></label>
<div class="table-scroll" tabindex="0" role="region" aria-label="Repository results">
<table><thead><tr><th scope="col">${escapeHtml(copy.audit.repository)}</th><th scope="col">${escapeHtml(copy.audit.operator)}</th><th scope="col">${escapeHtml(copy.audit.compatibility)}</th><th scope="col">Select</th></tr></thead><tbody><tr><th scope="row">Debian archive</th><td>Debian Project</td><td>Selected release</td><td><label class="compact-choice"><input type="checkbox" name="repository" value="debian" checked> Include</label></td></tr></tbody></table>
</div>
<p class="audit-note">${escapeHtml(copy.trust.review)}</p>
<div class="step-actions"><a href="#debian">${escapeHtml(copy.actions.back)}</a><a href="#review">${escapeHtml(copy.actions.continue)}</a></div>
</section>`

const renderReviewStep = (copy: SiteCopy): string => `<section id="review" class="workbench-step" data-step="review" aria-labelledby="review-title">
<header class="step-heading"><p class="eyebrow">04 / 05</p><h2 id="review-title">${escapeHtml(copy.steps.review)}</h2></header>
<dl class="change-plan"><div><dt>${escapeHtml(copy.audit.source)}</dt><dd>deb.debian.org/debian</dd></div><div><dt>${escapeHtml(copy.audit.operator)}</dt><dd>Debian Project</dd></div><div><dt>${escapeHtml(copy.audit.signingKey)}</dt><dd><code>/usr/share/keyrings/debian-archive-keyring.pgp</code></dd></div><div><dt>${escapeHtml(copy.audit.compatibility)}</dt><dd>Checked against the selected release and architecture</dd></div></dl>
<div class="step-actions"><a href="#repositories">${escapeHtml(copy.actions.back)}</a><a href="#export">${escapeHtml(copy.actions.continue)}</a></div>
</section>`

const renderExportStep = (copy: SiteCopy): string => `<section id="export" class="workbench-step" data-step="export" aria-labelledby="export-title">
<header class="step-heading"><p class="eyebrow">05 / 05</p><h2 id="export-title">${escapeHtml(copy.steps.export)}</h2></header>
<p>${escapeHtml(copy.trust.review)}</p>
<pre aria-label="Source file preview"><code>Types: deb\nURIs: https://deb.debian.org/debian\nSuites: trixie\nComponents: main non-free-firmware</code></pre>
<div class="step-actions"><a href="#review">${escapeHtml(copy.actions.back)}</a><button type="submit" class="primary-action">${escapeHtml(copy.actions.export)}</button></div>
</section>`

export const renderWorkbenchPage = ({ locale, copy, activeStep = 'system' }: WorkbenchPageContext): SitePage => {
  const currentStep = steps.includes(activeStep) ? activeStep : 'system'
  const path = sitePath(locale)
  const metadata = buildSeoMetadata({
    locale,
    title: copy.seo.workbenchTitle,
    description: copy.seo.workbenchDescription,
    structuredData: buildWebsiteJsonLd(locale, copy),
  })

  const body = `<a class="skip-link" href="#workbench">Skip to Workbench</a>
<header class="site-header">
<a class="brand" href="${escapeHtml(path)}" aria-label="DebGen home"><strong>DebGen</strong><span>Workbench</span></a>
<p class="current-step"><span>Current step</span><strong>${escapeHtml(copy.steps[currentStep])}</strong></p>
<nav class="utility-nav" aria-label="Utilities"><a href="https://github.com/MalteKiefer/debgen#readme">Docs</a><a href="/api/v1/catalog.json">API</a><a href="https://github.com/MalteKiefer/debgen">GitHub ${renderIcon('external')}</a></nav>
${renderLanguageControl(locale)}
${renderThemeControl()}
</header>
<div class="workbench-layout">
${renderWorkflow(copy, currentStep)}
<main id="workbench" tabindex="-1">
<h1>${escapeHtml(copy.seo.workbenchTitle)}</h1>
<p class="lede">${escapeHtml(copy.seo.workbenchDescription)}</p>
<form class="workbench-form" id="workbench-form" action="${escapeHtml(path)}" method="get">
${renderSystemStep(copy)}
${renderDebianStep(copy)}
${renderRepositoriesStep(copy)}
${renderReviewStep(copy)}
${renderExportStep(copy)}
</form>
</main>
</div>`

  return { ...metadata, lang: locale, path, body, scripts: [] }
}
