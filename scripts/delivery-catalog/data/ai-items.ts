import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * AI-функции. Разработка стоит как обычная работа; дороже они только в продаже, поэтому здесь
 * units не завышены — коммерческая наценка задаётся ценой продажи карточки, а не юнитами.
 * Подписки на токены провайдера в units не входят: это отдельная линия расчётов с клиентом.
 */
export const AI_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'AI_SUPPORT_CHATBOT',
    category: 'ai',
    iconKey: 'Bot',
    title: 'AI-чат для клиентов',
    summary: 'Ответы на вопросы клиентов по базе знаний продукта.',
    scopeBoundaries:
      'Один провайдер модели, источник знаний, окно чата, передача оператору, ограничение тем и логирование. Токены оплачивает клиент отдельно.',
    units: { BACKEND: 26, FRONTEND: 14, PM: 4, DESIGNER: 4, QA: 6, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'AI_SEMANTIC_SEARCH',
    category: 'ai',
    iconKey: 'Sparkles',
    title: 'Умный поиск по смыслу',
    summary: 'Поиск, понимающий формулировки, а не только слова.',
    scopeBoundaries:
      'Индексация контента в векторное представление, поиск и ранжирование, обновление индекса, запасной обычный поиск.',
    units: { BACKEND: 24, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'AI_CONTENT_GENERATION',
    category: 'ai',
    iconKey: 'Sparkles',
    title: 'Генерация текстов и описаний',
    summary: 'Черновики описаний и текстов внутри админки.',
    scopeBoundaries:
      'Шаблоны запросов, генерация и правка перед сохранением, ограничение расхода, журнал использования.',
    units: { BACKEND: 16, FRONTEND: 10, PM: 3, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'AI_DOCUMENT_EXTRACTION',
    category: 'ai',
    iconKey: 'ScanLine',
    title: 'Распознавание документов',
    summary: 'Извлечение данных из счетов, накладных и паспортов.',
    scopeBoundaries:
      'Согласованные типы документов и поля, проверка человеком перед сохранением, точность на контрольном наборе, хранение исходников.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 4, QA: 7, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'AI_VOICE_TRANSCRIPTION',
    category: 'ai',
    iconKey: 'Mic',
    title: 'Транскрипция звонков и записей',
    summary: 'Текст разговора с краткой сводкой.',
    scopeBoundaries:
      'Источник записей, язык, транскрипт и сводка, привязка к клиенту, приватность и сроки хранения.',
    units: { BACKEND: 22, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'AI_RECOMMENDATIONS',
    category: 'ai',
    iconKey: 'BrainCircuit',
    title: 'Рекомендации товаров и контента',
    summary: 'Персональные подборки по поведению пользователя.',
    scopeBoundaries:
      'Источник поведения, алгоритм и места показа, запасная логика при недостатке данных, замер эффекта.',
    units: { BACKEND: 24, FRONTEND: 10, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'AI_ANALYTICS_ASSISTANT',
    category: 'ai',
    iconKey: 'BrainCircuit',
    title: 'AI-аналитик по данным',
    summary: 'Ответы на вопросы о данных обычным языком.',
    scopeBoundaries:
      'Согласованный набор данных и метрик, ограничение прав на данные, проверка ответов, журнал запросов.',
    units: { BACKEND: 30, FRONTEND: 14, PM: 4, DESIGNER: 3, QA: 7, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'AI_IMAGE_PROCESSING',
    category: 'ai',
    iconKey: 'Image',
    title: 'Автоматическая обработка изображений',
    summary: 'Удаление фона, обрезка и улучшение фото товаров.',
    scopeBoundaries:
      'Согласованные операции, пакетная обработка, ручная правка результата, ограничение расхода.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 3, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'AI_LEAD_SCORING',
    category: 'ai',
    iconKey: 'Gauge',
    title: 'Оценка заявок и лидов',
    summary: 'Приоритет заявок по вероятности сделки.',
    scopeBoundaries:
      'Признаки для оценки, расчёт приоритета, отображение в списке, проверка на истории, пересчёт.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'AI_TRANSLATION_ASSIST',
    category: 'ai',
    iconKey: 'Languages',
    title: 'Автоперевод контента',
    summary: 'Черновой перевод текстов на другие языки.',
    scopeBoundaries:
      'Языки, перевод по кнопке с правкой перед публикацией, ограничение расхода. Ответственность за финальный текст — на клиенте.',
    units: { BACKEND: 14, FRONTEND: 8, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
] as const;
