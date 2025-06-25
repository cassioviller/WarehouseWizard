import { TabType } from "@/pages/home-page";
import { 
  Gauge, 
  ArrowDown, 
  ArrowUp, 
  Settings, 
  BarChart3, 
  DollarSign 
} from "lucide-react";

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function Navigation({ activeTab, setActiveTab }: NavigationProps) {
  const tabs = [
    { 
      id: 'dashboard' as TabType, 
      label: 'Dashboard', 
      icon: Gauge 
    },
    { 
      id: 'entrada' as TabType, 
      label: 'Entrada de Material', 
      icon: ArrowDown,
      iconClass: "text-green-600"
    },
    { 
      id: 'saida' as TabType, 
      label: 'Saída de Material', 
      icon: ArrowUp,
      iconClass: "text-red-600"
    },
    { 
      id: 'cadastros' as TabType, 
      label: 'Cadastros', 
      icon: Settings 
    },
    { 
      id: 'relatorios' as TabType, 
      label: 'Relatórios', 
      icon: BarChart3 
    },
    { 
      id: 'financeiro' as TabType, 
      label: 'Relatório Financeiro', 
      icon: DollarSign 
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="px-6">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`almox-nav-tab ${isActive ? 'active' : ''}`}
              >
                <Icon className={`h-4 w-4 ${tab.iconClass || ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
