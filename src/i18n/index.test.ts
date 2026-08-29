import { afterEach, describe, expect, it } from 'vitest'
import vuetify from '../plugins/vuetify'
import {
  i18n,
  initializeLocale,
  locale,
  setLocale,
} from './index'

afterEach(() => {
  setLocale('en', { document, storage: null })
})

describe('i18n runtime', () => {
  it('initializes from safe storage and synchronizes the document', () => {
    const storage = {
      getItem: () => 'de',
      setItem: () => undefined,
    }

    expect(initializeLocale({ document, languages: ['fr'], storage })).toBe('de')
    expect(locale.value).toBe('de')
    expect(document.documentElement.lang).toBe('de')
    expect(document.title).toBe('DebGen - Debian-Paketquellen erstellen')
  })

  it('starts even when storage access throws', () => {
    const storage = {
      getItem: () => { throw new DOMException('blocked', 'SecurityError') },
      setItem: () => { throw new DOMException('blocked', 'SecurityError') },
    }

    expect(() => initializeLocale({ document, languages: ['pl-PL'], storage })).not.toThrow()
    expect(locale.value).toBe('pl')
    expect(document.documentElement.lang).toBe('pl')
  })

  it('uses the same reactive locale for Vue I18n and Vuetify', () => {
    const stored: string[] = []
    const storage = {
      getItem: () => null,
      setItem: (_key: string, value: string) => stored.push(value),
    }

    setLocale('zh-CN', { document, storage })

    expect(locale.value).toBe('zh-CN')
    expect(i18n.global.locale.value).toBe('zh-CN')
    expect(vuetify.locale.current.value).toBe('zh-CN')
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(document.title).toBe('DebGen - 创建 Debian 软件包源')
    expect(stored).toEqual(['zh-CN'])
  })
})
