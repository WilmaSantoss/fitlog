import { Outlet, useMatches } from 'react-router-dom';
import { Sidebar } from '@/shared/ui/sidebar';
import { BottomNav } from '@/shared/ui/bottom-nav';
import { CelebrationOverlay } from '@/shared/ui/celebration-overlay';
import { RestTimerBar } from '@/shared/ui/rest-timer-bar';
import { UpdatePrompt } from '@/shared/ui/update-prompt';
import { useVirtualKeyboardOpen } from '@/shared/hooks/use-virtual-keyboard';

export function AppLayout() {
  // Com o teclado aberto a barra de navegação só atrapalha (fica em cima do
  // teclado tampando o que está sendo digitado).
  const keyboardOpen = useVirtualKeyboardOpen();
  // Rotas de edição marcam handle.hideBottomNav: têm barra própria embaixo.
  const editorRoute = useMatches().some(
    (m) => (m.handle as { hideBottomNav?: boolean } | undefined)?.hideBottomNav,
  );
  return (
    <div className="flex h-[100dvh] bg-app-deep">
      <Sidebar />

      <div className="flex h-full min-w-0 flex-1 flex-col bg-app pt-[env(safe-area-inset-top)]">
        <main className="flex-1 overflow-y-auto overscroll-none scroll-hide px-5 pb-6 md:px-10 md:py-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
        <RestTimerBar />
        {!keyboardOpen && !editorRoute && <BottomNav />}
      </div>

      <CelebrationOverlay />
      <UpdatePrompt />
    </div>
  );
}
