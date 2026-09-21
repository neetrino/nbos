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
    title: 'Customer AI chat',
    summary: 'Customer answers based on the product knowledge base.',
    scopeBoundaries:
      'One model provider, one knowledge source of up to 200 documents in one language, chat window, operator handoff, topic restrictions, and logging. Knowledge-base updates, additional languages, and archive migration are estimated separately. The customer pays token costs separately.',
    units: { BACKEND: 26, FRONTEND: 14, PM: 4, DESIGNER: 4, QA: 6, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'AI_SEMANTIC_SEARCH',
    category: 'ai',
    iconKey: 'Sparkles',
    title: 'Semantic search',
    summary: 'Search that understands meaning rather than exact words.',
    scopeBoundaries:
      'Vector indexing, search and ranking, index updates, and conventional-search fallback.',
    units: { BACKEND: 24, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 3 },
  },
  {
    code: 'AI_CONTENT_GENERATION',
    category: 'ai',
    iconKey: 'Sparkles',
    title: 'Text and description generation',
    summary: 'Draft descriptions and copy inside the administration interface.',
    scopeBoundaries:
      'Prompt templates, generation and editing before save, usage limits, and usage log.',
    units: { BACKEND: 16, FRONTEND: 10, PM: 3, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'AI_DOCUMENT_EXTRACTION',
    category: 'ai',
    iconKey: 'ScanLine',
    title: 'Document data extraction',
    summary: 'Data extraction from invoices, waybills, and passports.',
    scopeBoundaries:
      'Agreed document types and fields, human review before save, accuracy on a validation set, and source-file storage.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 4, QA: 7, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'AI_VOICE_TRANSCRIPTION',
    category: 'ai',
    iconKey: 'Mic',
    title: 'Call and recording transcription',
    summary: 'Conversation text with a concise summary.',
    scopeBoundaries:
      'Recording source, language, transcript and summary, customer linkage, privacy, and retention period.',
    units: { BACKEND: 22, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'AI_RECOMMENDATIONS',
    category: 'ai',
    iconKey: 'BrainCircuit',
    title: 'Product and content recommendations',
    summary: 'Personalized selections based on user behavior.',
    scopeBoundaries:
      'Behavior source, algorithm and placements, fallback for insufficient data, and impact measurement.',
    units: { BACKEND: 24, FRONTEND: 10, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'AI_ANALYTICS_ASSISTANT',
    category: 'ai',
    iconKey: 'BrainCircuit',
    title: 'Data AI analyst',
    summary: 'Natural-language answers to questions about data.',
    scopeBoundaries:
      'Agreed data and metrics, data-permission enforcement, answer validation, and request log.',
    units: { BACKEND: 30, FRONTEND: 14, PM: 4, DESIGNER: 3, QA: 7, TECHNICAL_SPECIALIST: 4 },
  },
  {
    code: 'AI_IMAGE_PROCESSING',
    category: 'ai',
    iconKey: 'Image',
    title: 'Automated image processing',
    summary: 'Background removal, cropping, and product photo enhancement.',
    scopeBoundaries:
      'Agreed operations, batch processing, manual result adjustment, and usage limits.',
    units: { BACKEND: 18, FRONTEND: 8, PM: 3, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'AI_LEAD_SCORING',
    category: 'ai',
    iconKey: 'Gauge',
    title: 'Lead scoring',
    summary: 'Lead priority based on deal probability.',
    scopeBoundaries:
      'Scoring inputs, priority calculation, list display, historical validation, and recalculation.',
    units: { BACKEND: 20, FRONTEND: 8, PM: 3, QA: 5, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'AI_TRANSLATION_ASSIST',
    category: 'ai',
    iconKey: 'Languages',
    title: 'Automated content translation',
    summary: 'Draft translation of content into other languages.',
    scopeBoundaries:
      'Languages, on-demand translation with editing before publication, and usage limits. The customer is responsible for final copy.',
    units: { BACKEND: 14, FRONTEND: 8, PM: 2, QA: 4, TECHNICAL_SPECIALIST: 2 },
  },
] as const;
