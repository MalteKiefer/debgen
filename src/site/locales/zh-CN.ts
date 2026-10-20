import type { LocaleCopy } from './en'

export const zhCN = {
  skipLink: '跳到设置',
  hero: { title: '一起来配置 {release}。', lead: '选择你的 Debian 版本和需要的软件。DebGen 会生成源文件，并在你运行之前展示每一条命令。' },
  sections: { system: '你的系统', software: '你的软件', files: '你的文件', install: '如何安装' },
  software: { selected: '已选择 {count} 个' },
  files: { downloadAll: '下载全部文件（.tar）' },
  install: { debian: '安装 Debian 软件源', vendor: '添加厂商软件仓库', packages: '更新并安装' },
  footer: { notAffiliated: '为 Debian 用户打造，与 Debian 项目无关。', catalog: '来自 {sources} 个厂商仓库的 {products} 个软件。', source: 'GitHub 上的源代码', report: '报告问题' },
  actions: { copy: '复制', download: '下载', copied: '已复制。', downloaded: '已下载。' },
  errors: { copyFailed: '复制失败。请手动复制内容。', downloadFailed: '下载失败。请手动保存文件。' },
  trust: { review: '使用前请审查每个来源、密钥和命令。' },
  seo: { workbenchTitle: 'DebGen 工作台', workbenchDescription: '创建透明的 Debian 软件源配置，并在使用前审查每个软件仓库。', repositoryDescription: '审查软件仓库的来源、签名密钥、软件包及 Debian 兼容性。', sourceDescription: '检查软件包来源、其签名密钥和受支持的 Debian 系统。', categoryDescription: '按类别浏览已验证的 Debian 软件包来源。' },
} satisfies LocaleCopy
