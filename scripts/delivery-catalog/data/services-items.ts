import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Разовые услуги. Это не разработка, а работа руками: заливка, перенос, обработка, настройка.
 * Units здесь почти целиком у PM и технического специалиста, а объём задаёт градация в карточке.
 * Цена продажи у услуг своя и обычно ниже множителя разработки — задаётся на карточке.
 */
export const SERVICES_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'SRV_CATALOG_IMPORT_SMALL',
    category: 'services',
    iconKey: 'Upload',
    title: 'Заливка каталога до 1000 позиций',
    summary: 'Разовая загрузка товаров из файла клиента.',
    scopeBoundaries:
      'Источник и сопоставление полей, изображения, дубли, пробная загрузка и сверка. До 1000 позиций.',
    units: { PM: 3, TECHNICAL_SPECIALIST: 10, QA: 2 },
  },
  {
    code: 'SRV_CATALOG_IMPORT_MEDIUM',
    category: 'services',
    iconKey: 'Upload',
    title: 'Заливка каталога до 10 000 позиций',
    summary: 'Разовая загрузка среднего каталога.',
    scopeBoundaries:
      'То же, что в малой градации, плюс пакетная обработка изображений и контроль качества выборкой. До 10 000 позиций.',
    units: { PM: 5, TECHNICAL_SPECIALIST: 26, QA: 4, BACKEND: 4 },
  },
  {
    code: 'SRV_CATALOG_IMPORT_LARGE',
    category: 'services',
    iconKey: 'Upload',
    title: 'Заливка каталога свыше 10 000 позиций',
    summary: 'Разовая загрузка большого каталога.',
    scopeBoundaries:
      'Подготовка данных, пакетная загрузка с проверками, обработка медиа, повторные прогоны. Свыше 10 000 позиций — объём уточняется до старта.',
    units: { PM: 8, TECHNICAL_SPECIALIST: 50, QA: 6, BACKEND: 8 },
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
      'Аудит, исправления, sitemap и robots, индексация, отчёт. Ежемесячное продвижение не входит.',
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
    code: 'SRV_CONTENT_TRANSLATION',
    category: 'services',
    iconKey: 'Languages',
    title: 'Перевод контента',
    summary: 'Перевод согласованного объёма текстов.',
    scopeBoundaries:
      'Согласованный объём и языки, размещение переводов в продукте, вычитка носителем при согласовании.',
    units: { PM: 3, TECHNICAL_SPECIALIST: 10 },
  },
  {
    code: 'SRV_ACCEPTANCE_SUPPORT',
    category: 'services',
    iconKey: 'LifeBuoy',
    title: 'Сопровождение при запуске',
    summary: 'Помощь в первые дни после старта.',
    scopeBoundaries:
      'Согласованный период сопровождения, приоритетные ответы, мелкие правки в рамках согласованного объёма. Новые функции не входят.',
    units: { PM: 6, TECHNICAL_SPECIALIST: 10, QA: 3 },
  },
  {
    code: 'SRV_TEST_DATA_SETUP',
    category: 'services',
    iconKey: 'ClipboardList',
    title: 'Подготовка демо-данных',
    summary: 'Заполнение продукта данными для показа и обучения.',
    scopeBoundaries:
      'Согласованный объём демо-данных, сценарии показа, сброс данных перед запуском.',
    units: { PM: 2, TECHNICAL_SPECIALIST: 6 },
  },
] as const;
