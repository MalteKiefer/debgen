import type { LocaleCopy } from './en'

export const ja = {
  skipLink: '設定へ移動',
  hero: { title: '{release} をセットアップしましょう。', lead: 'Debian のバージョンと使いたいソフトウェアを選んでください。DebGen がソースファイルを作成し、実行前にすべてのコマンドを表示します。' },
  sections: { system: 'あなたのシステム', software: 'あなたのソフトウェア', files: 'あなたのファイル', install: 'インストール方法' },
  software: { selected: '{count} 件選択中' },
  files: { downloadAll: 'すべてのファイルをダウンロード（.tar）' },
  install: { debian: 'Debian のソースをインストール', vendor: 'ベンダーのリポジトリを追加', packages: '更新してインストール' },
  footer: { notAffiliated: 'Debian ユーザーのために作成。Debian プロジェクトとは無関係です。', catalog: '{sources} のベンダーリポジトリから {products} 個のソフトウェア。', source: 'GitHub のソースコード', report: '問題を報告' },
  actions: { copy: 'コピー', download: 'ダウンロード', copied: 'コピーしました。', downloaded: 'ダウンロードしました。' },
  errors: { copyFailed: 'コピーに失敗しました。内容を手動でコピーしてください。', downloadFailed: 'ダウンロードに失敗しました。ファイルを手動で保存してください。' },
  trust: { review: '使用前にすべてのソース、鍵、コマンドを確認してください。' },
  seo: { workbenchTitle: 'DebGen ワークベンチ', workbenchDescription: '透明な Debian パッケージソース構成を作成し、使用前に各リポジトリを確認します。', repositoryDescription: 'リポジトリの出所、署名鍵、パッケージ、Debian 互換性を確認します。', sourceDescription: 'パッケージソース、署名鍵、対応する Debian システムを確認します。', categoryDescription: 'カテゴリ別に検証済みの Debian パッケージソースを調べます。' },
} satisfies LocaleCopy
