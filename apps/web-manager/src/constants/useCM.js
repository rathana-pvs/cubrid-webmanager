import { useMemo } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { CM as CM_EN } from './cmLabels';
import { CM_KO } from './cmLabels.ko';

export const LOCALE_STORAGE_KEY = 'cwm-ui-locale';

const PACKS = {
  en: CM_EN,
  ko: CM_KO,
};

/** @returns {'en'|'ko'} */
export function getStoredLocale() {
  if (typeof window === 'undefined') return 'ko';
  try {
    const v = localStorage.getItem(LOCALE_STORAGE_KEY);
    // Default to Korean unless the user has explicitly picked English.
    return v === 'en' ? 'en' : 'ko';
  } catch {
    return 'ko';
  }
}

/** @param {'en'|'ko'} locale */
export function setStoredLocale(locale) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale === 'ko' ? 'ko' : 'en');
  } catch {
    // Storage may be blocked (private mode, embedded WebView policy, etc.)
  }
}

/** @param {'en'|'ko'} locale */
export function getCM(locale) {
  return PACKS[locale === 'ko' ? 'ko' : 'en'] ?? CM_EN;
}

/** Redux uiLocale + CM label pack for the active locale. */
export function useCM() {
  const locale = useSelector(
    (state) => state.user?.preferences?.uiLocale ?? getStoredLocale(),
    shallowEqual
  );
  return useMemo(() => getCM(locale), [locale]);
}
