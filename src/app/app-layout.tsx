import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/shared/ui/sidebar';
import { BottomNav } from '@/shared/ui/bottom-nav';
import { CelebrationOverlay } from '@/shared/ui/celebration-overlay';
import { RestTimerBar } from '@/shared/ui/rest-timer-bar';

export function AppLayout() {
  return (
    <div className="flex min-h-screen bg-app-deep">
      <Sidebar />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-app">
        <main className="flex-1 overflow-y-auto px-5 pb-6 md:px-10 md:py-8">
          <div className="mx-auto w-full max-w-5xl">
            <Outlet />
          </div>
        </main>
        <BottomNav />
      </div>

      <CelebrationOverlay />
      <RestTimerBar />
    </div>
  );
}
