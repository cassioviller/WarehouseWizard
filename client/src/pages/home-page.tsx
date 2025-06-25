import { useState } from "react";
import Header from "@/components/layout/header";
import Navigation from "@/components/layout/navigation";
import Dashboard from "@/components/dashboard";
import MaterialEntry from "@/components/material-entry";
import MaterialExit from "@/components/material-exit";
import Cadastros from "@/components/cadastros";
import Reports from "@/components/reports";
import FinancialReport from "@/components/financial-report";

export type TabType = 'dashboard' | 'entrada' | 'saida' | 'cadastros' | 'relatorios' | 'financeiro';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'entrada':
        return <MaterialEntry />;
      case 'saida':
        return <MaterialExit />;
      case 'cadastros':
        return <Cadastros />;
      case 'relatorios':
        return <Reports />;
      case 'financeiro':
        return <FinancialReport />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="p-6">
        {renderTabContent()}
      </main>
    </div>
  );
}
