import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Контент и медиа. Мультиязычность разделена на две карточки: на сайте это в основном тексты и
 * маршруты, в системе — ещё и данные, справочники и документы, работа принципиально больше.
 */
export const CONTENT_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'CNT_MULTILINGUAL',
    category: 'content',
    iconKey: 'Languages',
    title: 'Мультиязычность',
    summary: 'Языковая архитектура продукта: ключи, переключение, системные тексты.',
    scopeBoundaries:
      'Платим за факт мультиязычности, а не за каждый язык: второй язык — это вся архитектура, следующие почти бесплатны, потому что переводит ИИ. Объём берётся по виду продукта. Языки с другим направлением письма или алфавитом сюда не входят и оцениваются отдельно.',
    tiers: [
      {
        code: 'T1_SITE',
        label: 'Лендинг, визитка, сайт компании',
        productTypes: ['LANDING', 'BUSINESS_CARD_WEBSITE', 'COMPANY_WEBSITE'],
        units: { FRONTEND: 2, PM: 1 },
      },
      {
        code: 'T2_CONTENT',
        label: 'Магазин и контентный сайт',
        productTypes: ['ECOMMERCE'],
        units: { BACKEND: 4, FRONTEND: 4, PM: 1, QA: 2 },
      },
      {
        code: 'T3_SYSTEM',
        label: 'CRM, ERP, платформа',
        productTypes: ['CRM', 'ERP', 'SAAS', 'WEB_APP'],
        units: { BACKEND: 26, FRONTEND: 18, PM: 4, QA: 7 },
      },
    ],
  },
  {
    code: 'CNT_BLOG',
    category: 'content',
    iconKey: 'Newspaper',
    title: 'Блог',
    summary: 'Раздел статей с рубриками и админкой.',
    scopeBoundaries:
      'Статьи, рубрики и теги, страница статьи и списка, SEO-поля, редактор. Наполнение статьями не входит.',
    units: { BACKEND: 12, FRONTEND: 12, PM: 2, DESIGNER: 4, QA: 4 },
  },
  {
    code: 'CNT_PAGE_BUILDER',
    category: 'content',
    iconKey: 'Layout',
    title: 'Конструктор страниц',
    summary: 'Сборка страниц из блоков без разработчика.',
    scopeBoundaries:
      'Согласованный набор блоков, порядок и настройки блока, предпросмотр, публикация. Свободная вёрстка не входит.',
    units: { BACKEND: 24, FRONTEND: 26, PM: 4, DESIGNER: 6, QA: 7 },
  },
  {
    code: 'CNT_MEDIA_GALLERY',
    category: 'content',
    iconKey: 'Image',
    title: 'Галерея и медиатека',
    summary: 'Загрузка и хранение изображений с обработкой.',
    scopeBoundaries:
      'Загрузка, размеры и сжатие, альтернативные тексты, порядок и удаление, ограничения по весу и формату.',
    units: { BACKEND: 14, FRONTEND: 10, PM: 2, DESIGNER: 2, QA: 4 },
  },
  {
    code: 'CNT_VIDEO_HOSTING',
    category: 'content',
    iconKey: 'Video',
    title: 'Видео в продукте',
    summary: 'Загрузка или встраивание видео с плеером.',
    scopeBoundaries:
      'Один способ размещения, плеер, превью, поведение на мобильном. Транскодирование — только при согласованном провайдере.',
    units: { BACKEND: 12, FRONTEND: 8, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'CNT_DOCUMENT_LIBRARY',
    category: 'content',
    iconKey: 'Library',
    title: 'Библиотека документов',
    summary: 'Файлы с категориями, поиском и правами доступа.',
    scopeBoundaries:
      'Загрузка и категории, поиск, права на просмотр и скачивание, версии файла, журнал доступа.',
    units: { BACKEND: 18, FRONTEND: 10, PM: 3, QA: 4 },
  },
  {
    code: 'CNT_SEO_STRUCTURE',
    category: 'content',
    iconKey: 'TrendingUp',
    title: 'SEO-структура сайта',
    summary: 'Метаданные, карта сайта и микроразметка.',
    scopeBoundaries:
      'Управление meta и canonical, sitemap и robots, микроразметка согласованных типов, редиректы, проверка индексации.',
    units: { BACKEND: 10, FRONTEND: 8, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'CNT_FAQ_KNOWLEDGE_BASE',
    category: 'content',
    iconKey: 'BookOpen',
    title: 'База знаний и FAQ',
    summary: 'Раздел вопросов и инструкций с поиском.',
    scopeBoundaries: 'Разделы и статьи, поиск, оценка полезности, админка. Наполнение не входит.',
    units: { BACKEND: 10, FRONTEND: 10, PM: 2, DESIGNER: 3, QA: 3 },
  },
  {
    code: 'CNT_FORMS_BUILDER',
    category: 'content',
    iconKey: 'ClipboardList',
    title: 'Конструктор форм',
    summary: 'Формы обратной связи и заявок без разработчика.',
    scopeBoundaries:
      'Типы полей, валидация, получатели заявок, защита от спама, хранение и выгрузка ответов.',
    units: { BACKEND: 18, FRONTEND: 16, PM: 3, DESIGNER: 4, QA: 5 },
  },
  {
    code: 'CNT_BANNERS_PROMO',
    category: 'content',
    iconKey: 'Image',
    title: 'Баннеры и промо-блоки',
    summary: 'Управляемые баннеры с расписанием показа.',
    scopeBoundaries:
      'Места размещения, расписание, ссылки, поведение на мобильном, приоритет показа.',
    units: { BACKEND: 8, FRONTEND: 8, PM: 2, DESIGNER: 3, QA: 3 },
  },
  {
    code: 'CNT_PRINT_TEMPLATES',
    category: 'content',
    iconKey: 'Printer',
    title: 'Печатные шаблоны документов',
    summary: 'Договоры, акты и счёта в печатном виде.',
    scopeBoundaries:
      'Согласованные шаблоны, подстановка данных, нумерация, печать и PDF, проверка на реальном принтере.',
    units: { BACKEND: 14, FRONTEND: 6, PM: 2, DESIGNER: 3, QA: 3 },
  },
  {
    code: 'CNT_COMMENTS_MODERATION',
    category: 'content',
    iconKey: 'MessageSquare',
    title: 'Комментарии с модерацией',
    summary: 'Комментарии пользователей и их проверка.',
    scopeBoundaries: 'Форма, модерация и жалобы, уведомления, защита от спама, права на удаление.',
    units: { BACKEND: 12, FRONTEND: 8, PM: 2, QA: 3 },
  },
] as const;
