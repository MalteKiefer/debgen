import { describe, expect, it } from 'vitest'
import type { GeneratedArtifact } from './model'
import * as presentation from './presentation'

interface PresentationSubject {
  categoryMessageKey(category: string): string
  presentWarning(key: string): unknown
  presentCompatibility(reason: {
    readonly code: 'unsupported-release'
    readonly productId: string
    readonly release: 'trixie'
    readonly supportedReleases: readonly ['bookworm']
  }, productName: string): unknown
  presentArtifact(artifact: GeneratedArtifact): unknown
}

const subject = presentation as unknown as PresentationSubject

describe('vendor presentation descriptors', () => {
  it('maps every catalog category to one stable translation key', () => {
    expect(subject.categoryMessageKey('web-browsers')).toBe('categories.webBrowsers')
    expect(subject.categoryMessageKey('containers-kubernetes')).toBe('categories.containersKubernetes')
    expect(subject.categoryMessageKey('desktop-productivity')).toBe('categories.desktopProductivity')
  })

  it('maps stable warning keys to translation descriptors without localized domain prose', () => {
    expect(subject.presentWarning('docker-firewall')).toEqual({
      key: 'warnings.docker-firewall',
      values: {},
    })
    expect(subject.presentWarning('future-warning')).toEqual({
      key: 'warnings.unknown',
      values: { warningKey: 'future-warning' },
    })
  })

  it('presents compatibility reasons as structured translation descriptors', () => {
    expect(subject.presentCompatibility({
      code: 'unsupported-release',
      productId: 'brave-browser',
      release: 'trixie',
      supportedReleases: ['bookworm'],
    }, 'Brave Browser')).toEqual({
      key: 'compatibility.unsupportedRelease',
      values: {
        product: 'Brave Browser',
        release: 'trixie',
        supported: 'bookworm',
      },
    })
  })

  it('derives localized artifact presentation from stable artifact metadata', () => {
    expect(subject.presentArtifact({
      filename: 'brave-browser.sources',
      mediaType: 'text/plain',
      description: 'domain text must not be rendered',
      content: 'Types: deb\n',
      category: 'browser',
      productId: 'brave-browser',
      productName: 'Brave Browser',
    })).toEqual({
      key: 'artifacts.descriptions.repositorySource',
      values: { product: 'Brave Browser' },
    })

    expect(subject.presentArtifact({
      filename: 'debian.sources',
      mediaType: 'text/plain',
      description: 'domain text must not be rendered',
      content: 'Types: deb\n',
    })).toEqual({
      key: 'artifacts.descriptions.debianSource',
      values: {},
    })
  })
})
