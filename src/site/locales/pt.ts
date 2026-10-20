import type { LocaleCopy } from './en'

export const pt = {
  skipLink: 'Ir para a configuração',
  hero: { title: 'Vamos configurar o {release}.', lead: 'Escolha sua versão do Debian e o software que deseja. O DebGen escreve os arquivos de fontes e mostra cada comando antes de você executá-lo.' },
  sections: { system: 'Seu sistema', software: 'Seu software', files: 'Seus arquivos', install: 'Como instalar' },
  software: { selected: '{count} selecionados' },
  files: { downloadAll: 'Baixar todos os arquivos (.tar)' },
  install: { debian: 'Instalar as fontes do Debian', vendor: 'Adicionar os repositórios dos fabricantes', packages: 'Atualizar e instalar' },
  footer: { notAffiliated: 'Feito para usuários do Debian. Sem vínculo com o projeto Debian.', catalog: '{products} aplicativos de {sources} repositórios de fabricantes.', source: 'Código-fonte no GitHub', report: 'Relatar um problema' },
  actions: { copy: 'Copiar', download: 'Transferir', copied: 'Copiado.', downloaded: 'Transferido.' },
  errors: { copyFailed: 'Falha ao copiar. Copie o conteúdo manualmente.', downloadFailed: 'Falha na transferência. Guarde o ficheiro manualmente.' },
  trust: { review: 'Reveja cada fonte, chave e comando antes de utilizar.' },
  seo: { workbenchTitle: 'Bancada DebGen', workbenchDescription: 'Crie configurações transparentes de fontes de pacotes Debian e reveja cada repositório antes de o utilizar.', repositoryDescription: 'Reveja a proveniência, chaves de assinatura, pacotes e compatibilidade Debian de um repositório.', sourceDescription: 'Inspecione uma fonte de pacotes, a respetiva chave de assinatura e os sistemas Debian suportados.', categoryDescription: 'Explore fontes de pacotes Debian verificadas por categoria.' },
} satisfies LocaleCopy
