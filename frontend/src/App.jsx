import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import PlantsList from './pages/PlantsList';
import BotaniqueSearch from './pages/BotaniqueSearch';
import AdminActivity from './pages/AdminActivity';
import AdminGestes from './pages/AdminGestes';
import AgentChat from './pages/AgentChat';
import Sujets from './pages/Sujets';
import Evenements from './pages/Evenements';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          {/* Redirection par défaut vers la liste des plants */}
          <Route index element={<Navigate to="/plants" replace />} />
          <Route path="plants" element={<PlantsList />} />
          <Route path="agent-botanique" element={<BotaniqueSearch />} />
          <Route path="sujets" element={<Sujets />} />
          <Route path="evenements" element={<Evenements />} />
          <Route path="chat" element={<AgentChat />} />
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
