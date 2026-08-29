import type { SiteCopy } from './en'

export const zhCN = {
  steps: { system: '系统', debian: 'Debian 软件源', repositories: '软件仓库', review: '审查', export: '导出' },
  actions: { continue: '继续', back: '返回', copy: '复制', download: '下载', export: '导出计划' },
  errors: { invalidSelection: '所选配置无效。', copyFailed: '复制失败。请手动复制内容。', downloadFailed: '下载失败。请手动保存文件。' },
  audit: { source: '来源', operator: '运营方', repository: '软件仓库', signingKey: '签名密钥', fingerprint: '指纹', compatibility: '兼容性', lastVerified: '最后验证' },
  search: { label: '搜索软件仓库', placeholder: '搜索软件、软件包或仓库主机', empty: '没有符合搜索条件的软件仓库。' },
  trust: { official: '官方上游或制造商来源', endorsed: '由上游明确推荐的社区来源', review: '使用前请审查每个来源、密钥和命令。' },
  seo: { workbenchTitle: 'DebGen 工作台', workbenchDescription: '创建透明的 Debian 软件源配置，并在使用前审查每个软件仓库。', repositoryDescription: '审查软件仓库的来源、签名密钥、软件包及 Debian 兼容性。', sourceDescription: '检查软件包来源、其签名密钥和受支持的 Debian 系统。', categoryDescription: '按类别浏览已验证的 Debian 软件包来源。' },
} satisfies SiteCopy
