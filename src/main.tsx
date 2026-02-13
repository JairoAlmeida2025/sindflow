import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./styles/theme.css";
import AppShell from "./shell/AppShell";
import MasterShell from "./shell/MasterShell";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedRouteMaster from "./components/ProtectedRouteMaster";
import Landing from "./pages/public/Landing";
import Payment from "./pages/public/Payment";
import EnvNav from "./pages/public/EnvNav";
import Login from "./pages/client/Login";
import Conversations from "./pages/client/Conversations";
import Kanban from "./pages/client/Kanban";
import AgentConfig from "./pages/client/AgentConfig";
import Knowledge from "./pages/client/Knowledge";
import Contacts from "./pages/client/Contacts";
import Notes from "./pages/client/Notes";
import AccountSettings from "./pages/client/AccountSettings";
import WhatsappConnect from "./pages/client/WhatsappConnect";
import MasterLogin from "./pages/master/MasterLogin";
import MasterDashboard from "./pages/master/MasterDashboard";
import MasterApis from "./pages/master/MasterApis";
import MasterClients from "./pages/master/MasterClients";
import MasterUsage from "./pages/master/MasterUsage";
import MasterPayments from "./pages/master/MasterPayments";

import MasterProfile from "./pages/master/MasterProfile";

const root = createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/pagamento" element={<Payment />} />
        <Route path="/ambientes" element={<EnvNav />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="conversas" element={<Conversations />} />
          <Route path="kanban" element={<Kanban />} />
          <Route path="agente" element={<AgentConfig />} />
          <Route path="conhecimento" element={<Knowledge />} />
          <Route path="contatos" element={<Contacts />} />
          <Route path="anotacoes" element={<Notes />} />
          <Route path="configuracoes" element={<AccountSettings />} />
          <Route path="whatsapp" element={<WhatsappConnect />} />
          <Route index element={<Navigate to="conversas" replace />} />
        </Route>
        
        {/* Rotas Master Protegidas */}
        <Route
          path="/master"
          element={
            <ProtectedRouteMaster>
              <MasterShell />
            </ProtectedRouteMaster>
          }
        >
           <Route path="dashboard" element={<MasterDashboard />} />
           <Route path="clientes" element={<MasterClients />} />
           <Route path="uso" element={<MasterUsage />} />
           <Route path="pagamentos" element={<MasterPayments />} />
           <Route path="apis" element={<MasterApis />} />
           <Route path="perfil" element={<MasterProfile />} />
           <Route index element={<Navigate to="dashboard" replace />} />
        </Route>
        
        <Route path="/master/login" element={<Login />} /> 
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
