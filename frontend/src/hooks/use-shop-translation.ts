import translations from "@/locales/shop-translations.json";
import { ShopLanguage, useShopLanguageStore } from "@/store/shop-language-store";

type TranslationParams = Record<string, string | number>;

type TranslationDictionary = typeof translations.en;

export type ShopTranslationKey = keyof TranslationDictionary;

function interpolate(template: string, params?: TranslationParams) {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce(
    (value, [key, replacement]) => value.replaceAll(`{{${key}}}`, String(replacement)),
    template,
  );
}

function getDictionary(language: ShopLanguage) {
  return translations[language] as TranslationDictionary;
}

export function translateShopText(language: ShopLanguage, key: ShopTranslationKey, params?: TranslationParams) {
  const dictionary = getDictionary(language);
  const fallbackDictionary = translations.en as TranslationDictionary;
  const template = dictionary[key] ?? fallbackDictionary[key] ?? String(key);

  return interpolate(template, params);
}

export function translateShopItemName(language: ShopLanguage, itemName: string) {
  const dictionary = getDictionary(language) as Record<string, string>;
  const fallbackDictionary = translations.en as Record<string, string>;
  const translationKey = `item.${itemName}`;

  return dictionary[translationKey] ?? fallbackDictionary[translationKey] ?? itemName;
}

export function useShopTranslation() {
  const language = useShopLanguageStore((state) => state.language);
  const setLanguage = useShopLanguageStore((state) => state.setLanguage);
  const toggleLanguage = useShopLanguageStore((state) => state.toggleLanguage);
  const isTamil = language === "ta";

  return {
    language,
    isTamil,
    setLanguage,
    toggleLanguage,
    t: (key: ShopTranslationKey, params?: TranslationParams) => translateShopText(language, key, params),
    translateItemName: (itemName: string) => translateShopItemName(language, itemName),
  };
}
