import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import PlantsList from './pages/PlantsList';
import BotaniqueSearch from './pages/BotaniqueSearch';
import AdminActivity from './pages/AdminActivity';
import AdminGestes from './pages/AdminGestes';
import AdminLLMLogs from './pages/AdminLLMLogs';
import AgentChat from './pages/AgentChat';
import BastouilleChef from './pages/BastouilleChef';
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
          <Route path="bastouille-chef" element={<BastouilleChef />} />
          <Route path="admin/activity" element={<AdminActivity />} />
          <Route path="admin/llm-logs" element={<AdminLLMLogs />} />
          <Route path="admin/gestes" element={<AdminGestes />} />
          {/* Catch all : redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
