import type { LocaleCopy } from './en'

export const es = {
  skipLink: 'Saltar a la configuración',
  hero: { title: 'Configuremos {release}.', lead: 'Elige tu versión de Debian y el software que quieres. DebGen escribe los archivos de fuentes y muestra cada comando antes de que lo ejecutes.' },
  sections: { system: 'Tu sistema', software: 'Tu software', files: 'Tus archivos', install: 'Cómo instalar' },
  software: { selected: '{count} seleccionados' },
  files: { downloadAll: 'Descargar todos los archivos (.tar)' },
  install: { debian: 'Instalar las fuentes de Debian', vendor: 'Añadir los repositorios de los fabricantes', packages: 'Actualizar e instalar' },
  footer: { notAffiliated: 'Hecho para usuarios de Debian. Sin relación con el proyecto Debian.', catalog: '{products} aplicaciones de {sources} repositorios de fabricantes.', source: 'Código fuente en GitHub', report: 'Informar de un problema' },
  actions: { copy: 'Copiar', download: 'Descargar', copied: 'Copiado.', downloaded: 'Descargado.' },
  errors: { copyFailed: 'Error al copiar. Copia el contenido manualmente.', downloadFailed: 'Error al descargar. Guarda el archivo manualmente.' },
  trust: { review: 'Revisa cada fuente, clave y comando antes de usarlos.' },
  seo: { workbenchTitle: 'Mesa de trabajo DebGen', workbenchDescription: 'Crea configuraciones transparentes de fuentes de paquetes Debian y revisa cada repositorio antes de usarlo.', repositoryDescription: 'Revisa procedencia, claves de firma, paquetes y compatibilidad Debian de un repositorio.', sourceDescription: 'Inspecciona una fuente de paquetes, su clave de firma y los sistemas Debian compatibles.', categoryDescription: 'Explora fuentes de paquetes Debian verificadas por categoría.' },
} satisfies LocaleCopy
