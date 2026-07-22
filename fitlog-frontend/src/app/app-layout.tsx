import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/ui/sidebar';
import { BottomNav } from '@/shared/ui/bottom-nav';
import { CelebrationOverlay } from '@/shared/ui/celebration-overlay';
import { RestTimerBar } from '@/shared/ui/rest-timer-bar';
import { UpdatePrompt } from '@/shared/ui/update-prompt';

export function AppLayout() {
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
        <BottomNav />
      </div>

      <CelebrationOverlay />
      <UpdatePrompt />
    </div>
  );
}
