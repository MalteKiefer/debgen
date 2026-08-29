import type { SiteCopy } from './en'

export const pt = {
  steps: { system: 'Sistema', debian: 'Fontes Debian', repositories: 'Repositórios', review: 'Rever', export: 'Exportar' },
  actions: { continue: 'Continuar', back: 'Voltar', copy: 'Copiar', download: 'Transferir', export: 'Exportar plano' },
  errors: { invalidSelection: 'A configuração selecionada não é válida.', copyFailed: 'Falha ao copiar. Copie o conteúdo manualmente.', downloadFailed: 'Falha na transferência. Guarde o ficheiro manualmente.' },
  audit: { source: 'Fonte', operator: 'Operador', repository: 'Repositório', signingKey: 'Chave de assinatura', fingerprint: 'Impressão digital', compatibility: 'Compatibilidade', lastVerified: 'Última verificação' },
  search: { label: 'Pesquisar repositórios', placeholder: 'Pesquisar software, pacotes ou anfitriões de repositórios', empty: 'Nenhum repositório corresponde à pesquisa.' },
  trust: { official: 'Fonte oficial do projeto ou fabricante', endorsed: 'Fonte comunitária recomendada explicitamente pelo projeto', review: 'Reveja cada fonte, chave e comando antes de utilizar.' },
  seo: { workbenchTitle: 'Bancada DebGen', workbenchDescription: 'Crie configurações transparentes de fontes de pacotes Debian e reveja cada repositório antes de o utilizar.', repositoryDescription: 'Reveja a proveniência, chaves de assinatura, pacotes e compatibilidade Debian de um repositório.', sourceDescription: 'Inspecione uma fonte de pacotes, a respetiva chave de assinatura e os sistemas Debian suportados.', categoryDescription: 'Explore fontes de pacotes Debian verificadas por categoria.' },
} satisfies SiteCopy
