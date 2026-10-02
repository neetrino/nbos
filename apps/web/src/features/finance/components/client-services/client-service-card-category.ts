import { Globe, KeyRound, Server, UserRound, Wrench } from 'lucide-react';

const CATEGORY_STYLES = {
  DOMAIN: {
    icon: Globe,
    surface:
      'border-teal-200 border-l-teal-500 bg-teal-50 dark:border-teal-900 dark:border-l-teal-400 dark:bg-teal-950',
    label:
      'border-teal-200 bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-900 dark:text-teal-200',
  },
  HOSTING: {
    icon: Server,
    surface:
      'border-indigo-200 border-l-indigo-500 bg-indigo-50 dark:border-indigo-900 dark:border-l-indigo-400 dark:bg-indigo-950',
    label:
      'border-indigo-200 bg-indigo-100 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  },
  SERVICE: {
    icon: Wrench,
    surface:
      'border-rose-200 border-l-rose-500 bg-rose-50 dark:border-rose-900 dark:border-l-rose-400 dark:bg-rose-950',
    label:
      'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-800 dark:bg-rose-900 dark:text-rose-200',
  },
  ACCOUNT: {
    icon: UserRound,
    surface:
      'border-lime-200 border-l-lime-500 bg-lime-50 dark:border-lime-900 dark:border-l-lime-400 dark:bg-lime-950',
    label:
      'border-lime-200 bg-lime-100 text-lime-800 dark:border-lime-800 dark:bg-lime-900 dark:text-lime-200',
  },
  LICENSE: {
    icon: KeyRound,
    surface:
      'border-orange-200 border-l-orange-500 bg-orange-50 dark:border-orange-900 dark:border-l-orange-400 dark:bg-orange-950',
    label:
      'border-orange-200 bg-orange-100 text-orange-800 dark:border-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
};

const FALLBACK_STYLE = {
  icon: Wrench,
  surface:
    'border-slate-200 border-l-slate-400 bg-slate-50 dark:border-slate-700 dark:border-l-slate-400 dark:bg-slate-900',
  label:
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

export function getClientServiceCardCategory(type: string) {
  return Object.hasOwn(CATEGORY_STYLES, type)
    ? CATEGORY_STYLES[type as keyof typeof CATEGORY_STYLES]
    : FALLBACK_STYLE;
}
