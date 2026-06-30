// Registry de sons customizáveis pelo usuário.
// Estrutura de pastas em /public/sounds/<event>/<arquivo>.mp3
// Pra adicionar um som novo:
//   1. Coloca o arquivo em /public/sounds/<event>/<nome>.mp3
//   2. Adiciona uma entrada no array do evento correspondente abaixo
// O ID precisa ser único dentro do evento (vai pro localStorage).

export type SoundEvent = 'restDone' | 'pr';

export type SoundOption = {
  readonly id: string;
  readonly label: string;
  readonly file: string;
};

export const DEFAULT_SOUND_ID = 'default';

// Mapa de evento -> pasta dentro de /public/sounds/
export const EVENT_FOLDERS: Record<SoundEvent, string> = {
  restDone: 'rest-done',
  pr: 'pr',
};

// Sons disponíveis por evento. Vazio = só usa o sintetizado padrão.
export const SOUND_OPTIONS: Record<SoundEvent, readonly SoundOption[]> = {
  restDone: [
    { id: 'baile-franky', label: 'Baile do Franky', file: 'baile-franky.mp3' },
    { id: 'bom-dia-guerreiros', label: 'Bom dia, guerreiros! Vamos que vamos!', file: 'bom-dia-gueirros-vamos-que-vamos.mp3' },
    { id: 'jessica', label: 'Já acabou, Jéssica?', file: 'jessic-mp3cut.mp3' },
    { id: 'shrek-manda-mais', label: 'Vamo lá! Manda mais! (Burro)', file: 'shrek-burro-vamo-la-manda-mais-quero-mais.mp3' },
    { id: 'antes-que-esfrie', label: 'Vamos começar antes que esfrie', file: 'vamos-comecar-antes-que-esfrie.mp3' },
    { id: 'vamos-jogar', label: 'Vamos jogar', file: '1_5028499615113019597-online-audio-converter.mp3' },
  ],
  pr: [
    { id: 'bueno-manito', label: 'Bueno, manito!', file: 'bueno-manito.mp3' },
    { id: 'casimiro-maneirinho', label: 'Maneirinho! (Casimiro)', file: 'casimiro-maneirinho.mp3' },
    { id: 'casimiro-do-nada-mane', label: 'Do nada, Mané! (Casimiro)', file: 'do-nada-mane-casimiro-reacts.mp3' },
    { id: 'casimiro-elite', label: 'Falando da elite! (Casimiro)', file: 'falando-da-elite-casimiro.mp3' },
    { id: 'casimiro-gigante', label: 'Gigante! (Casimiro)', file: 'gigante-casimiro.mp3' },
    { id: 'casimiro-mais-ou-menos', label: 'Mais ou menos, mas vai (Casimiro)', file: 'mais-ou-menos-mas-vai-casimiro.mp3' },
  ],
};

export const EVENTS: readonly { id: SoundEvent; label: string; defaultLabel: string }[] = [
  {
    id: 'restDone',
    label: 'Fim do descanso',
    defaultLabel: 'Sino (padrão)',
  },
  {
    id: 'pr',
    label: 'Novo recorde',
    defaultLabel: 'Fanfarra (padrão)',
  },
];
