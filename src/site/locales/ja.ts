import type { SiteCopy } from './en'

export const ja = {
  steps: { system: 'システム', debian: 'Debian ソース', repositories: 'リポジトリ', review: '確認', export: 'エクスポート' },
  actions: { continue: '続ける', back: '戻る', copy: 'コピー', download: 'ダウンロード', export: 'プランをエクスポート' },
  errors: { invalidSelection: '選択した構成は有効ではありません。', copyFailed: 'コピーに失敗しました。内容を手動でコピーしてください。', downloadFailed: 'ダウンロードに失敗しました。ファイルを手動で保存してください。' },
  audit: { source: 'ソース', operator: '運営者', repository: 'リポジトリ', signingKey: '署名鍵', fingerprint: 'フィンガープリント', compatibility: '互換性', lastVerified: '最終確認' },
  search: { label: 'リポジトリを検索', placeholder: 'ソフトウェア、パッケージ、またはリポジトリホストを検索', empty: '検索に一致するリポジトリはありません。' },
  trust: { official: '公式のアップストリームまたは製造元のソース', endorsed: 'アップストリームが明示的に推奨するコミュニティソース', review: '使用前にすべてのソース、鍵、コマンドを確認してください。' },
  seo: { workbenchTitle: 'DebGen ワークベンチ', workbenchDescription: '透明な Debian パッケージソース構成を作成し、使用前に各リポジトリを確認します。', repositoryDescription: 'リポジトリの出所、署名鍵、パッケージ、Debian 互換性を確認します。', sourceDescription: 'パッケージソース、署名鍵、対応する Debian システムを確認します。', categoryDescription: 'カテゴリ別に検証済みの Debian パッケージソースを調べます。' },
} satisfies SiteCopy
