import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/shared/ui/bottom-nav';

export function AppLayout() {
  return (
    <div className="flex min-h-screen items-stretch justify-center bg-app-deep sm:items-center sm:px-16 sm:py-14 lg:px-32 lg:py-20">
      <div
        className="
          relative flex w-full flex-col overflow-hidden bg-app
          min-h-screen
          sm:min-h-0 sm:max-w-2xl
          sm:h-[min(640px,calc(100vh-7rem))]
          sm:rounded-2xl sm:border sm:border-line/60
          sm:shadow-2xl sm:shadow-black/50
          sm:ring-1 sm:ring-white/5
        "
      >
        <main className="flex-1 overflow-y-auto px-5 pb-4 pt-0 min-h-0 sm:px-8">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
