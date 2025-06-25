import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Package, ArrowDown, ArrowUp, AlertTriangle } from "lucide-react";

interface DashboardMetrics {
  totalMaterials: number;
  entriesToday: number;
  exitsToday: number;
  criticalItems: number;
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Alertas de Estoque</h2>
      </div>

      {/* Stock Alert Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="text-gray-400 text-2xl" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {metrics?.criticalItems === 0 
            ? "Nenhum alerta de estoque" 
            : `${metrics?.criticalItems} itens críticos`
          }
        </h3>
        <p className="text-gray-600">
          {metrics?.criticalItems === 0 
            ? "Todos os materiais estão com estoque adequado."
            : "Alguns materiais estão com estoque abaixo do mínimo."
          }
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="almox-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Materiais</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics?.totalMaterials || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="text-blue-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="almox-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Entradas Hoje</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics?.entriesToday || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <ArrowDown className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="almox-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saídas Hoje</p>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics?.exitsToday || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <ArrowUp className="text-orange-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="almox-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Itens Críticos</p>
                <p className="text-3xl font-bold text-red-600">
                  {metrics?.criticalItems || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
