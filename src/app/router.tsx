import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AppLayout } from './app-layout';
import { ProtectedRoute } from './protected-route';
import { HomePage } from '@/modules/home/pages/home-page';
import { LoginPage } from '@/modules/auth/pages/login-page';
import { SignupPage } from '@/modules/auth/pages/signup-page';
import { MeasurementsListPage } from '@/modules/measurements/pages/measurements-list-page';
import { MeasurementFormPage } from '@/modules/measurements/pages/measurement-form-page';
import { MeasurementEvolutionPage } from '@/modules/measurements/pages/measurement-evolution-page';
import { RoutinesListPage } from '@/modules/workouts/pages/routines-list-page';
import { RoutineFormPage } from '@/modules/workouts/pages/routine-form-page';
import { RoutineDetailPage } from '@/modules/workouts/pages/routine-detail-page';
import { SessionPage } from '@/modules/workouts/pages/session-page';
import { SessionsHistoryPage } from '@/modules/workouts/pages/sessions-history-page';
import { SessionDetailPage } from '@/modules/workouts/pages/session-detail-page';
import { ProfilePage } from '@/modules/profile/pages/profile-page';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/cadastro', element: <SignupPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },

          { path: 'treino', element: <RoutinesListPage /> },
          { path: 'treino/novo', element: <RoutineFormPage /> },
          { path: 'treino/:routineId/editar', element: <RoutineFormPage /> },
          { path: 'treino/:routineId', element: <RoutineDetailPage /> },
          { path: 'treino/sessao/:sessionId', element: <SessionPage /> },
          { path: 'treino/historico', element: <SessionsHistoryPage /> },
          { path: 'treino/historico/:sessionId', element: <SessionDetailPage /> },

          { path: 'medidas', element: <MeasurementsListPage /> },
          { path: 'medidas/nova', element: <MeasurementFormPage /> },
          { path: 'medidas/:measurementId/editar', element: <MeasurementFormPage /> },
          { path: 'medidas/evolucao', element: <MeasurementEvolutionPage /> },

          { path: 'perfil', element: <ProfilePage /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
