import type { SiteCopy } from './en'

export const es = {
  steps: { system: 'Sistema y fuentes', repositories: 'Repositorios', review: 'Revisar', export: 'Exportar' },
  actions: { continue: 'Continuar', back: 'Atrás', copy: 'Copiar', download: 'Descargar', export: 'Exportar plan' },
  errors: { invalidSelection: 'La configuración seleccionada no es válida.', copyFailed: 'Error al copiar. Copia el contenido manualmente.', downloadFailed: 'Error al descargar. Guarda el archivo manualmente.' },
  audit: { source: 'Fuente', operator: 'Operador', repository: 'Repositorio', signingKey: 'Clave de firma', fingerprint: 'Huella digital', compatibility: 'Compatibilidad', lastVerified: 'Última verificación' },
  search: { label: 'Buscar repositorios', placeholder: 'Buscar software, paquetes o hosts de repositorios', empty: 'Ningún repositorio coincide con tu búsqueda.' },
  trust: { official: 'Fuente oficial del fabricante o proyecto', endorsed: 'Fuente comunitaria recomendada expresamente por el proyecto', review: 'Revisa cada fuente, clave y comando antes de usarlos.' },
  seo: { workbenchTitle: 'Mesa de trabajo DebGen', workbenchDescription: 'Crea configuraciones transparentes de fuentes de paquetes Debian y revisa cada repositorio antes de usarlo.', repositoryDescription: 'Revisa procedencia, claves de firma, paquetes y compatibilidad Debian de un repositorio.', sourceDescription: 'Inspecciona una fuente de paquetes, su clave de firma y los sistemas Debian compatibles.', categoryDescription: 'Explora fuentes de paquetes Debian verificadas por categoría.' },
} satisfies SiteCopy
