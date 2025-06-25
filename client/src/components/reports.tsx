import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RotateCcw, User, Package, TrendingUp, BarChart3, Truck, Filter } from "lucide-react";

export default function Reports() {
  const [filters, setFilters] = useState({
    employee: "",
    category: "",
    startDate: "",
    endDate: "",
    type: "",
  });

  const reports = [
    {
      id: "employee-movements",
      title: "Movimentação por Funcionário",
      description: "Relatório detalhado das movimentações por funcionário",
      icon: User,
      color: "blue",
    },
    {
      id: "stock-report",
      title: "Relatório de Estoque",
      description: "Status atual do estoque e itens críticos",
      icon: Package,
      color: "green",
    },
    {
      id: "general-movements",
      title: "Movimentações Gerais",
      description: "Histórico completo de entradas e saídas",
      icon: TrendingUp,
      color: "orange",
    },
    {
      id: "material-consumption",
      title: "Consumo de Materiais",
      description: "Análise de consumo por período e categoria",
      icon: BarChart3,
      color: "purple",
    },
    {
      id: "supplier-tracking",
      title: "Rastreamento de Fornecedores",
      description: "Histórico de compras e desempenho",
      icon: Truck,
      color: "indigo",
    },
  ];

  const getIconColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      orange: "bg-orange-100 text-orange-600",
      purple: "bg-purple-100 text-purple-600",
      indigo: "bg-indigo-100 text-indigo-600",
    };
    return colorMap[color as keyof typeof colorMap] || "bg-gray-100 text-gray-600";
  };

  const handleGenerateReport = (reportId: string) => {
    // TODO: Implement report generation
    console.log("Generating report:", reportId, "with filters:", filters);
  };

  const clearFilters = () => {
    setFilters({
      employee: "",
      category: "",
      startDate: "",
      endDate: "",
      type: "",
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios</h2>
        </div>
        <Button 
          variant="outline" 
          onClick={clearFilters}
          className="flex items-center space-x-2"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Limpar</span>
        </Button>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} className="almox-metric-card">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getIconColorClasses(report.color)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">{report.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{report.description}</p>
                <Button 
                  className="w-full almox-primary-btn"
                  onClick={() => handleGenerateReport(report.id)}
                >
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters Section */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filtros
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="employee">Funcionário</Label>
              <Select value={filters.employee} onValueChange={(value) => setFilters({ ...filters, employee: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os funcionários" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os funcionários</SelectItem>
                  <SelectItem value="joao">João Silva</SelectItem>
                  <SelectItem value="maria">Maria Santos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  <SelectItem value="escritorio">Escritório</SelectItem>
                  <SelectItem value="limpeza">Limpeza</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos os tipos</SelectItem>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
