import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Botanique from './pages/Botanique';
import AdminActivity from './pages/AdminActivity';
import AdminGestes from './pages/AdminGestes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Redirection par défaut vers Botanique pour l'instant */}
          <Route index element={<Navigate to="/botanique" replace />} />
          <Route path="botanique" element={<Botanique />} />
          <Route path="admin/activity" element={<AdminActivity />} />
          <Route path="admin/gestes" element={<AdminGestes />} />
          {/* Catch all : redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
