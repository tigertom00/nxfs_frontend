import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'no'];

export default getRequestConfig(async ({ locale }) => {
  // Since we're using localePrefix: 'never', the locale will be 'en' by default
  // Our custom useIntl hook handles the actual language switching via UI store
  const resolvedLocale = locales.includes(locale as any) ? locale : 'en';

  return {
    messages: (await import(`../../messages/${resolvedLocale}.json`)).default
  };
});