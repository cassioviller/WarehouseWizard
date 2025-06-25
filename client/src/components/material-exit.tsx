import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Minus, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Employee, Material } from "@shared/schema";

interface ExitItem {
  materialId: number;
  quantity: number;
  purpose: string;
}

export default function MaterialExit() {
  const { toast } = useToast();
  const [exitForm, setExitForm] = useState({
    date: new Date().toISOString().split('T')[0],
    destination: "",
    employeeId: "",
  });
  const [items, setItems] = useState<ExitItem[]>([{ materialId: 0, quantity: 1, purpose: "" }]);

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: materials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const exitMutation = useMutation({
    mutationFn: async (data: { exit: any; items: any[] }) => {
      const res = await apiRequest("POST", "/api/stock-exits", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Saída registrada",
        description: "Saída de material registrada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      // Reset form
      setExitForm({
        date: new Date().toISOString().split('T')[0],
        destination: "",
        employeeId: "",
      });
      setItems([{ materialId: 0, quantity: 1, purpose: "" }]);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar saída",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    setItems([...items, { materialId: 0, quantity: 1, purpose: "" }]);
  };

  const updateItem = (index: number, field: keyof ExitItem, value: number | string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(item => item.materialId > 0 && item.quantity > 0 && item.purpose.trim());
    if (validItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item válido com finalidade",
        variant: "destructive",
      });
      return;
    }

    const exitData = {
      exit: {
        date: new Date(exitForm.date),
        destination: exitForm.destination,
        employeeId: exitForm.employeeId ? parseInt(exitForm.employeeId) : null,
      },
      items: validItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        purpose: item.purpose,
      })),
    };

    exitMutation.mutate(exitData);
  };

  const getMaterialStock = (materialId: number) => {
    const material = materials?.find(m => m.id === materialId);
    return material?.currentStock || 0;
  };

  return (
    <div>
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Minus className="text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Saída de Material</h2>
              <p className="text-gray-600">Registre a saída de múltiplos materiais em uma única operação</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={exitForm.date}
                onChange={(e) => setExitForm({ ...exitForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="destination">Destino *</Label>
              <Select value={exitForm.destination} onValueChange={(value) => setExitForm({ ...exitForm, destination: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Funcionário</SelectItem>
                  <SelectItem value="third_party">Terceiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="employee">Funcionário *</Label>
            <Select value={exitForm.employeeId} onValueChange={(value) => setExitForm({ ...exitForm, employeeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees?.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id.toString()}>
                    {employee.name} - {employee.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Adicionar Materiais</h3>
            
            {items.map((item, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label>Material</Label>
                  <Select value={item.materialId.toString()} onValueChange={(value) => updateItem(index, 'materialId', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials?.map((material) => (
                        <SelectItem key={material.id} value={material.id.toString()}>
                          {material.name} ({getMaterialStock(material.id)} disponíveis)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    min="1"
                    max={getMaterialStock(item.materialId)}
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Finalidade</Label>
                  <Input
                    type="text"
                    placeholder="Para que será usado..."
                    value={item.purpose}
                    onChange={(e) => updateItem(index, 'purpose', e.target.value)}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              onClick={addItem}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700"
            >
              <Minus className="h-4 w-4" />
              <span>Adicionar à Lista</span>
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="almox-red-btn"
              disabled={exitMutation.isPending}
            >
              {exitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Confirmar Saída"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
