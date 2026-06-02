import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { KanbanPage } from './pages/KanbanPage';
import { StagesPage } from './pages/StagesPage';
import { TeamPage } from './pages/TeamPage';
import { BillingPage } from './pages/BillingPage';
import { ReportsPage } from './pages/ReportsPage';
import { CeoPage } from './pages/CeoPage';

function AnimatedRoute({ children }) {
  return (
    <motion.div
      className="min-h-full"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/dashboard"
          element={
            <AnimatePresence mode="wait">
              <AnimatedRoute key={location.pathname}>
                <DashboardPage />
              </AnimatedRoute>
            </AnimatePresence>
          }
        />
        <Route
          path="/projects"
          element={
            <AnimatePresence mode="wait">
              <AnimatedRoute key={location.pathname}>
                <ProjectsPage />
              </AnimatedRoute>
            </AnimatePresence>
          }
        />
        <Route
          path="/kanban"
          element={
            <AnimatePresence mode="wait">
              <AnimatedRoute key={location.pathname}>
                <KanbanPage />
              </AnimatedRoute>
            </AnimatePresence>
          }
        />
        <Route
          path="/stages"
          element={
            <AnimatePresence mode="wait">
              <AnimatedRoute key={location.pathname}>
                <StagesPage />
              </AnimatedRoute>
            </AnimatePresence>
          }
        />
        <Route
          path="/ceo"
          element={
            <AnimatePresence mode="wait">
              <AnimatedRoute key={location.pathname}>
                <CeoPage />
              </AnimatedRoute>
            </AnimatePresence>
          }
        />
        <Route
          path="/team"
          element={
            <AnimatePresence mode="wait">
              <AnimatedRoute key={location.pathname}>
                <TeamPage />
              </AnimatedRoute>
            </AnimatePresence>
          }
        />
        <Route
          path="/billing"
          element={
            <AnimatePresence mode="wait">
              <AnimatedRoute key={location.pathname}>
                <BillingPage />
              </AnimatedRoute>
            </AnimatePresence>
          }
        />
        <Route
          path="/reports"
          element={
            <AnimatePresence mode="wait">
              <AnimatedRoute key={location.pathname}>
                <ReportsPage />
              </AnimatedRoute>
            </AnimatePresence>
          }
        />
      </Route>
    </Routes>
  );
}
