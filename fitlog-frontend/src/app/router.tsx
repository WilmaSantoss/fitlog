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
import { SessionDetailPage } from '@/modules/workouts/pages/session-detail-page';
import { ProfilePage } from '@/modules/profile/pages/profile-page';
import { ProgressPage } from '@/modules/progress/pages/progress-page';
import { SettingsPage } from '@/modules/settings/pages/settings-page';
import { ExerciseDetailPage } from '@/modules/exercises/pages/exercise-detail-page';

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
          { path: 'treino/historico/:sessionId', element: <SessionDetailPage /> },

          { path: 'exercicios/:exerciseId', element: <ExerciseDetailPage /> },

          { path: 'medidas', element: <MeasurementsListPage /> },
          { path: 'medidas/nova', element: <MeasurementFormPage /> },
          { path: 'medidas/:measurementId/editar', element: <MeasurementFormPage /> },
          { path: 'medidas/evolucao', element: <MeasurementEvolutionPage /> },

          { path: 'progresso', element: <ProgressPage /> },

          { path: 'perfil', element: <ProfilePage /> },
          { path: 'ajustes', element: <SettingsPage /> },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
