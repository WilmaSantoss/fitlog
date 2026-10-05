import { useEffect, useState } from 'react';

// Tipos de input que não abrem teclado.
const NO_KEYBOARD_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'file',
  'radio',
  'range',
  'reset',
  'submit',
]);

function opensKeyboard(el: Element | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLInputElement) return !NO_KEYBOARD_TYPES.has(el.type);
  return false;
}

// true enquanto o teclado virtual está aberto (só em tela de toque).
// O iOS não encolhe o layout com o teclado — barras fixas embaixo ficam
// grudadas em cima dele e tampam o que está sendo digitado. Usamos o foco
// num campo de texto como sinal: é imediato (o resize do visualViewport só
// chega depois da animação do teclado).
export function useVirtualKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(pointer: coarse)').matches) return;
    const update = () => setOpen(opensKeyboard(document.activeElement));
    // focusout dispara antes do próximo elemento receber foco — espera um
    // tique pra não piscar ao pular de um campo pro outro.
    const onFocusOut = () => window.setTimeout(update, 0);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', onFocusOut);
    update();
    return () => {
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return open;
}
