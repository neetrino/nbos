import { getRequestConfig } from 'next-intl/server';
import { INTERFACE_TIME_ZONE } from './constants';
import { loadMessages } from './load-messages';
import { resolveRequestLocale } from './resolve-request-locale';

export default getRequestConfig(async () => {
  const locale = await resolveRequestLocale();
  return {
    locale,
    messages: await loadMessages(locale),
    timeZone: INTERFACE_TIME_ZONE,
    onError(error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(error);
      }
    },
    getMessageFallback() {
      return 'Unavailable';
    },
  };
});
