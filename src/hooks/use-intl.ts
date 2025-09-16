import { useUIStore } from '@/stores/ui';
import { useMemo } from 'react';
import en from '@/messages/en.json';
import no from '@/messages/no.json';

type Messages = typeof en;
type MessageKey = keyof Messages;

// Helper type to get nested keys
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

type TranslationKey = NestedKeyOf<Messages>;

const messages = {
  en,
  no,
} as const;

// Helper function to get nested value from object using dot notation
function getValue(obj: any, path: string): string {
  return path.split('.').reduce((current, key) => current?.[key], obj) || path;
}

export function useIntl() {
  const { language } = useUIStore();

  const t = useMemo(() => {
    return (key: TranslationKey, values?: Record<string, any>): string => {
      const currentMessages = messages[language] || messages.en;
      let message = getValue(currentMessages, key);

      // Simple interpolation for values
      if (values && typeof message === 'string') {
        Object.keys(values).forEach((valueKey) => {
          message = message.replace(
            new RegExp(`{${valueKey}}`, 'g'),
            values[valueKey]
          );
        });
      }

      return message;
    };
  }, [language]);

  return { t, locale: language };
}
