import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Settings } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Material, Category, User, Employee, Supplier } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

type SubTab = 'materials' | 'categories' | 'employees' | 'suppliers' | 'third-parties' | 'users';

export default function Cadastros() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('materials');
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { data: materials, isLoading } = useQuery<(Material & { category: Category | null })[]>({
    queryKey: ["/api/materials"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === 'super_admin',
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const filteredMaterials = materials?.filter(material => 
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (material: Material) => {
    const currentStock = material.currentStock || 0;
    const minimumStock = material.minimumStock || 0;

    if (currentStock <= minimumStock) {
      return <Badge variant="destructive">Crítico</Badge>;
    } else if (currentStock <= minimumStock * 1.2) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Baixo</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Adequado</Badge>;
    }
  };

  const createUserMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string; name: string; role: string }) => {
      const res = await apiRequest("POST", "/api/users", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowUserForm(false);
      setEditingUser(null);
      toast({
        title: "Usuário criado com sucesso",
        description: "O novo usuário foi adicionado ao sistema.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const subTabs = [
    { id: 'materials' as SubTab, label: 'Materiais' },
    { id: 'categories' as SubTab, label: 'Categorias' },
    { id: 'employees' as SubTab, label: 'Funcionários' },
    { id: 'suppliers' as SubTab, label: 'Fornecedores' },
    { id: 'third-parties' as SubTab, label: 'Terceiros' },
    ...(user?.role === 'super_admin' ? [{ id: 'users' as SubTab, label: 'Usuários' }] : []),
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Settings className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gestão de Cadastros</h2>
            <p className="text-gray-600">Gerencie materiais, categorias, funcionários e fornecedores</p>
          </div>
        </div>
        <Button className="almox-primary-btn flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Novo Material</span>
        </Button>
      </div>

      <Card className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {subTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeSubTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Materials Tab */}
        {activeSubTab === 'materials' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Buscar materiais..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>Todas as categorias</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredMaterials && filteredMaterials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="almox-table">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Material</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Categoria</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Estoque Atual</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Estoque Mínimo</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-700">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMaterials.map((material) => (
                      <tr key={material.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{material.name}</p>
                            <p className="text-sm text-gray-600">{material.description}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {material.category?.name || "Sem categoria"}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {material.currentStock || 0} {material.unit}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center text-gray-700">
                          {material.minimumStock || 0} {material.unit}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {getStatusBadge(material)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex justify-center space-x-2">
                            <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-800">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Settings className="text-gray-400 text-2xl" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? "Nenhum material encontrado" : "Nenhum material cadastrado"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? "Tente ajustar os filtros de busca."
                    : "Comece adicionando seu primeiro material ao sistema."
                  }
                </p>
                <Button className="almox-primary-btn">
                  Adicionar Material
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Other tabs placeholders */}
        {activeSubTab !== 'materials' && (
          <div className="p-6 text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="text-gray-400 text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {subTabs.find(tab => tab.id === activeSubTab)?.label}
            </h3>
            <p className="text-gray-600">Esta seção será implementada em breve.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
