import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Разовые услуги. Это не разработка, а работа руками: заливка, перенос, обработка, настройка.
 * Units здесь почти целиком у PM и технического специалиста, а объём задаёт градация в карточке.
 * Цена продажи у услуг своя и обычно ниже множителя разработки — задаётся на карточке.
 */
export const SERVICES_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'SRV_CATALOG_IMPORT',
    category: 'services',
    iconKey: 'Upload',
    title: 'Заливка каталога',
    summary: 'Разовая загрузка товаров из файла или источника клиента.',
    scopeBoundaries:
      'Один источник: сопоставление полей, изображения, дубли, пробная загрузка и сверка. Объём выбирается вариантом по числу позиций и определяется данными клиента, а не видом продукта. Свыше 50 000 позиций — отдельная оценка.',
    tiers: [
      {
        code: 'S_TO_1K',
        label: 'До 1000 позиций',
        productTypes: [],
        units: { PM: 3, TECHNICAL_SPECIALIST: 10, QA: 2 },
      },
      {
        code: 'M_TO_10K',
        label: 'От 1000 до 10 000 позиций',
        productTypes: [],
        units: { PM: 5, TECHNICAL_SPECIALIST: 30, QA: 4 },
      },
      {
        code: 'L_TO_50K',
        label: 'От 10 000 до 50 000 позиций',
        productTypes: [],
        units: { PM: 8, TECHNICAL_SPECIALIST: 58, QA: 6 },
      },
    ],
  },
  {
    code: 'SRV_CONTENT_FILL',
    category: 'services',
    iconKey: 'FileText',
    title: 'Наполнение сайта контентом',
    summary: 'Заполнение страниц текстами и изображениями клиента.',
    scopeBoundaries:
      'Согласованный перечень страниц, размещение готовых текстов и изображений, базовая вёрстка блоков. Написание текстов не входит.',
    units: { PM: 3, TECHNICAL_SPECIALIST: 14, QA: 2 },
  },
  {
    code: 'SRV_PHOTO_PROCESSING',
    category: 'services',
    iconKey: 'Image',
    title: 'Обработка фотографий',
    summary: 'Подготовка изображений товаров к публикации.',
    scopeBoundaries:
      'Согласованный объём, кадрирование, фон, размеры и сжатие, переименование и привязка к товарам.',
    units: { PM: 2, DESIGNER: 10, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'SRV_DATA_MIGRATION',
    category: 'services',
    iconKey: 'Database',
    title: 'Миграция данных со старой системы',
    summary: 'Перенос согласованного набора данных.',
    scopeBoundaries:
      'Согласованный набор данных, очистка и сопоставление, пробный прогон, сохранность связей, план переключения.',
    units: { BACKEND: 16, PM: 5, TECHNICAL_SPECIALIST: 16, QA: 5 },
  },
  {
    code: 'SRV_SEO_TECH_SETUP',
    category: 'services',
    iconKey: 'TrendingUp',
    title: 'Разовая техническая SEO-настройка',
    summary: 'Аудит и исправление технических ошибок.',
    scopeBoundaries:
      'Аудит уже работающего сайта и исправление найденных технических ошибок, sitemap и robots, индексация, отчёт. Построение SEO-структуры нового продукта — это функция каталога, а не эта услуга. Ежемесячное продвижение не входит.',
    units: { PM: 3, TECHNICAL_SPECIALIST: 12, FRONTEND: 4, QA: 2 },
  },
  {
    code: 'SRV_DOMAIN_HOSTING_SETUP',
    category: 'services',
    iconKey: 'Globe',
    title: 'Настройка домена и хостинга',
    summary: 'Перенос и настройка домена, почты и сертификата.',
    scopeBoundaries:
      'DNS-записи, сертификат, почтовые записи, перенос с прежнего хостинга, проверка доступности.',
    units: { PM: 2, TECHNICAL_SPECIALIST: 8, QA: 1 },
  },
  {
    code: 'SRV_EMAIL_DELIVERABILITY',
    category: 'services',
    iconKey: 'Mail',
    title: 'Настройка доставляемости почты',
    summary: 'SPF, DKIM и DMARC для писем клиента.',
    scopeBoundaries:
      'Записи аутентификации, прогрев при необходимости, проверка попадания в папку входящих.',
    units: { PM: 2, TECHNICAL_SPECIALIST: 8, QA: 1 },
  },
  {
    code: 'SRV_TEAM_TRAINING',
    category: 'services',
    iconKey: 'GraduationCap',
    title: 'Обучение команды клиента',
    summary: 'Занятия по работе с продуктом.',
    scopeBoundaries:
      'Согласованное число занятий и участников, сценарий обучения, запись при согласии, ответы на вопросы после.',
    units: { PM: 6, TECHNICAL_SPECIALIST: 8 },
  },
  {
    code: 'SRV_USER_MANUAL',
    category: 'services',
    iconKey: 'BookOpen',
    title: 'Инструкция пользователя',
    summary: 'Документ или база знаний по работе с продуктом.',
    scopeBoundaries:
      'Согласованные разделы, скриншоты, формат передачи. Перевод на другие языки — отдельная услуга.',
    units: { PM: 5, TECHNICAL_SPECIALIST: 8, DESIGNER: 2 },
  },
  {
    code: 'SRV_ACCEPTANCE_SUPPORT',
    category: 'services',
    iconKey: 'LifeBuoy',
    title: 'Сопровождение при запуске',
    summary: 'Помощь в первые дни после старта.',
    scopeBoundaries:
      'Согласованный период сопровождения, приоритетные ответы, мелкие правки в рамках согласованного объёма, подготовка демонстрационных данных и их сброс перед запуском. Новые функции не входят.',
    units: { PM: 6, TECHNICAL_SPECIALIST: 10, QA: 3 },
  },
] as const;
