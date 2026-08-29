import type { SiteCopy } from './en'

export const ru = {
  steps: { system: 'Система', debian: 'Источники Debian', repositories: 'Репозитории', review: 'Проверка', export: 'Экспорт' },
  actions: { continue: 'Продолжить', back: 'Назад', copy: 'Копировать', download: 'Скачать', export: 'Экспортировать план' },
  errors: { invalidSelection: 'Выбранная конфигурация недействительна.', copyFailed: 'Не удалось скопировать. Скопируйте содержимое вручную.', downloadFailed: 'Не удалось скачать. Сохраните файл вручную.' },
  audit: { source: 'Источник', operator: 'Оператор', repository: 'Репозиторий', signingKey: 'Ключ подписи', fingerprint: 'Отпечаток', compatibility: 'Совместимость', lastVerified: 'Последняя проверка' },
  search: { label: 'Поиск репозиториев', placeholder: 'Поиск программ, пакетов или хостов репозиториев', empty: 'Нет репозиториев, соответствующих поиску.' },
  trust: { official: 'Официальный источник проекта или производителя', endorsed: 'Источник сообщества, явно рекомендованный проектом', review: 'Проверяйте каждый источник, ключ и команду перед использованием.' },
  seo: { workbenchTitle: 'Рабочая среда DebGen', workbenchDescription: 'Создавайте прозрачные конфигурации источников пакетов Debian и проверяйте каждый репозиторий перед использованием.', repositoryDescription: 'Проверяйте происхождение, ключи подписи, пакеты и совместимость репозитория с Debian.', sourceDescription: 'Изучайте источник пакетов, его ключ подписи и поддерживаемые системы Debian.', categoryDescription: 'Изучайте проверенные источники пакетов Debian по категориям.' },
} satisfies SiteCopy
