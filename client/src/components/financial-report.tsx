import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Printer, DollarSign, Package, Star, Loader2 } from "lucide-react";
import type { Material, Category } from "@shared/schema";

interface FinancialReport {
  totalStockValue: number;
  totalItems: number;
  highValueItems: number;
  stockItems: (Material & { category: Category | null; totalValue: number })[];
}

export default function FinancialReport() {
  const { data: report, isLoading } = useQuery<FinancialReport>({
    queryKey: ["/api/reports/financial"],
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleExport = (format: 'pdf' | 'excel') => {
    // TODO: Implement export functionality
    console.log(`Exporting financial report as ${format}`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatório Financeiro do Estoque</h2>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleExport('pdf')}
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>PDF</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => handleExport('excel')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Excel</span>
          </Button>
          <Button 
            variant="outline" 
            onClick={handlePrint}
            className="flex items-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </Button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="almox-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total do Estoque</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(report?.totalStockValue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="almox-metric-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Itens</p>
                <p className="text-2xl font-bold text-blue-600">
                  {report?.totalItems || 0}
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
                <p className="text-sm font-medium text-gray-600">Itens de Alto Valor</p>
                <p className="text-2xl font-bold text-orange-600">
                  {report?.highValueItems || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Star className="text-orange-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Report Table */}
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detalhamento por Material</h3>
        </div>

        {report?.stockItems && report.stockItems.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="almox-table">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Material</th>
                    <th className="text-left py-3 px-6 font-medium text-gray-700">Categoria</th>
                    <th className="text-center py-3 px-6 font-medium text-gray-700">Unidade</th>
                    <th className="text-center py-3 px-6 font-medium text-gray-700">Estoque</th>
                    <th className="text-right py-3 px-6 font-medium text-gray-700">Valor Unitário</th>
                    <th className="text-right py-3 px-6 font-medium text-gray-700">Valor Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {report.stockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-700">
                        {item.category?.name || "Sem categoria"}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-700">
                        {item.unit}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-700">
                        {item.currentStock || 0}
                      </td>
                      <td className="py-4 px-6 text-right text-gray-700">
                        {formatCurrency(parseFloat(item.unitPrice || '0'))}
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">
                        {formatCurrency(item.totalValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Total Summary */}
            <div className="p-6 bg-green-50 border-t border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Valor Total do Estoque:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(report.totalStockValue)}
                </span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-6 text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum item no estoque</h3>
            <p className="text-gray-600">Adicione materiais ao sistema para visualizar o relatório financeiro.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
