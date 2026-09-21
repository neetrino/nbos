import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Десктоп. Сам продукт приближается к ближайшему стандартному типу и размеру — решение владельца;
 * здесь только работы, которых в вебе и в мобильном приложении не бывает.
 */
export const DESKTOP_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'DSK_APP_PACKAGING',
    category: 'desktop',
    iconKey: 'Monitor',
    title: 'Сборка десктоп-приложения',
    summary: 'Установщик для Windows или macOS.',
    scopeBoundaries:
      'Одна платформа, установщик и подпись, иконки и метаданные, проверка установки на чистой системе.',
    units: { BACKEND: 8, FRONTEND: 10, PM: 3, DESIGNER: 2, QA: 5, TECHNICAL_SPECIALIST: 8 },
  },
  {
    code: 'DSK_AUTO_UPDATE',
    category: 'desktop',
    iconKey: 'RefreshCw',
    title: 'Автообновление приложения',
    summary: 'Обновление версии без переустановки.',
    scopeBoundaries:
      'Канал обновлений, проверка подписи, откат при неудаче, поведение при отсутствии сети.',
    units: { BACKEND: 10, FRONTEND: 10, PM: 2, QA: 5, TECHNICAL_SPECIALIST: 6 },
  },
  {
    code: 'DSK_LOCAL_DATABASE',
    category: 'desktop',
    iconKey: 'Database',
    title: 'Локальная база и синхронизация',
    summary: 'Работа с локальными данными и обмен с сервером.',
    scopeBoundaries:
      'Локальное хранилище, синхронизация и конфликты, миграции локальной схемы, объём данных на машине.',
    units: { BACKEND: 20, FRONTEND: 22, PM: 4, QA: 8 },
  },
  {
    code: 'DSK_HARDWARE_PERIPHERALS',
    category: 'desktop',
    iconKey: 'Plug',
    title: 'Работа с оборудованием',
    summary: 'Сканеры, весы, принтеры и терминалы.',
    scopeBoundaries:
      'Согласованный перечень устройств и протоколов, обработка отключения, проверка на реальном оборудовании.',
    units: { BACKEND: 14, FRONTEND: 12, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 10 },
  },
  {
    code: 'DSK_OFFLINE_POS',
    category: 'desktop',
    iconKey: 'Store',
    title: 'Офлайн-касса',
    summary: 'Продажи при отсутствии связи с сервером.',
    scopeBoundaries:
      'Работа без сети, локальная очередь операций, отправка после восстановления связи, контроль дублей и расхождений.',
    units: { BACKEND: 22, FRONTEND: 24, PM: 4, QA: 10, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'DSK_SYSTEM_TRAY_AGENT',
    category: 'desktop',
    iconKey: 'CircuitBoard',
    title: 'Фоновый агент в системе',
    summary: 'Служба в трее с автозапуском.',
    scopeBoundaries:
      'Автозапуск, значок и меню в трее, фоновые задачи, журнал работы, корректное завершение.',
    units: { BACKEND: 12, FRONTEND: 10, PM: 2, QA: 5, TECHNICAL_SPECIALIST: 6 },
  },
  {
    code: 'DSK_MULTI_WINDOW',
    category: 'desktop',
    iconKey: 'Layout',
    title: 'Многооконный интерфейс',
    summary: 'Несколько окон и панелей одновременно.',
    scopeBoundaries:
      'Согласованные окна, сохранение размеров и положения, обмен данными между окнами, поведение на нескольких мониторах.',
    units: { FRONTEND: 20, BACKEND: 4, PM: 2, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'DSK_FILE_SYSTEM_ACCESS',
    category: 'desktop',
    iconKey: 'HardDrive',
    title: 'Работа с файлами на машине',
    summary: 'Чтение и запись локальных папок и документов.',
    scopeBoundaries:
      'Согласованные операции и каталоги, права доступа, обработка занятых файлов, безопасность путей.',
    units: { BACKEND: 10, FRONTEND: 12, PM: 2, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
] as const;
