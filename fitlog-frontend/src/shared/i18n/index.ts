import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ptBR } from './pt-br';

void i18n.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: { escapeValue: false },
  returnNull: false,
});

export { i18n };
