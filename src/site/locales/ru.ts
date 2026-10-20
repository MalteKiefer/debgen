import type { LocaleCopy } from './en'

export const ru = {
  skipLink: 'Перейти к настройке',
  hero: { title: 'Настроим {release}.', lead: 'Выберите версию Debian и нужные программы. DebGen создаёт файлы источников и показывает каждую команду до её запуска.' },
  sections: { system: 'Ваша система', software: 'Ваши программы', files: 'Ваши файлы', install: 'Установка' },
  software: { selected: 'Выбрано: {count}' },
  files: { downloadAll: 'Скачать все файлы (.tar)' },
  install: { debian: 'Установите источники Debian', vendor: 'Добавьте репозитории производителей', packages: 'Обновите и установите' },
  footer: { notAffiliated: 'Создано для пользователей Debian. Не связано с проектом Debian.', catalog: 'Программ: {products}, репозиториев производителей: {sources}.', source: 'Исходный код на GitHub', report: 'Сообщить о проблеме' },
  actions: { copy: 'Копировать', download: 'Скачать', copied: 'Скопировано.', downloaded: 'Скачано.' },
  errors: { copyFailed: 'Не удалось скопировать. Скопируйте содержимое вручную.', downloadFailed: 'Не удалось скачать. Сохраните файл вручную.' },
  trust: { review: 'Проверяйте каждый источник, ключ и команду перед использованием.' },
  seo: { workbenchTitle: 'Рабочая среда DebGen', workbenchDescription: 'Создавайте прозрачные конфигурации источников пакетов Debian и проверяйте каждый репозиторий перед использованием.', repositoryDescription: 'Проверяйте происхождение, ключи подписи, пакеты и совместимость репозитория с Debian.', sourceDescription: 'Изучайте источник пакетов, его ключ подписи и поддерживаемые системы Debian.', categoryDescription: 'Изучайте проверенные источники пакетов Debian по категориям.' },
} satisfies LocaleCopy
