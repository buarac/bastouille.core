import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Botanique from './pages/Botanique';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Redirection par défaut vers Botanique pour l'instant */}
          <Route index element={<Navigate to="/botanique" replace />} />
          <Route path="botanique" element={<Botanique />} />
          {/* Catch all : redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
