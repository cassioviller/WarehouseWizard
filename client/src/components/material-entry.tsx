import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Supplier, Material } from "@shared/schema";

interface EntryItem {
  materialId: number;
  quantity: number;
  unitPrice: number;
}

export default function MaterialEntry() {
  const { toast } = useToast();
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    origin: "",
    supplierId: "",
  });
  const [items, setItems] = useState<EntryItem[]>([{ materialId: 0, quantity: 1, unitPrice: 0 }]);

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const { data: materials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
  });

  const entryMutation = useMutation({
    mutationFn: async (data: { entry: any; items: any[] }) => {
      const res = await apiRequest("POST", "/api/stock-entries", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Entrada registrada",
        description: "Entrada de material registrada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/materials"] });
      // Reset form
      setEntryForm({
        date: new Date().toISOString().split('T')[0],
        origin: "",
        supplierId: "",
      });
      setItems([{ materialId: 0, quantity: 1, unitPrice: 0 }]);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao registrar entrada",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    setItems([...items, { materialId: 0, quantity: 1, unitPrice: 0 }]);
  };

  const updateItem = (index: number, field: keyof EntryItem, value: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validItems = items.filter(item => item.materialId > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item válido",
        variant: "destructive",
      });
      return;
    }

    const entryData = {
      entry: {
        date: new Date(entryForm.date),
        origin: entryForm.origin,
        supplierId: entryForm.supplierId ? parseInt(entryForm.supplierId) : null,
      },
      items: validItems.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toString(),
        totalPrice: (item.quantity * item.unitPrice).toString(),
      })),
    };

    entryMutation.mutate(entryData);
  };

  return (
    <div>
      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Plus className="text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Entrada de Material</h2>
              <p className="text-gray-600">Adicione múltiplos materiais em uma única entrada</p>
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
                value={entryForm.date}
                onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="origin">Origem *</Label>
              <Select value={entryForm.origin} onValueChange={(value) => setEntryForm({ ...entryForm, origin: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supplier">Fornecedor</SelectItem>
                  <SelectItem value="employee_return">Devolução de Funcionário</SelectItem>
                  <SelectItem value="third_party_return">Devolução de Terceiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="supplier">Fornecedor *</Label>
            <Select value={entryForm.supplierId} onValueChange={(value) => setEntryForm({ ...entryForm, supplierId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um fornecedor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
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
                          {material.name}
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
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Valor Unitário (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="ghost"
              onClick={addItem}
              className="flex items-center space-x-2 text-green-600 hover:text-green-700"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar à Lista</span>
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="almox-green-btn"
              disabled={entryMutation.isPending}
            >
              {entryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Confirmar Entrada"
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
