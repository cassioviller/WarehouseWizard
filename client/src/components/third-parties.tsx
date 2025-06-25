import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, User, Building } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ThirdParty, InsertThirdParty } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const thirdPartySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  document: z.string().optional(),
  document_type: z.string().default("CPF"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  is_active: z.boolean().default(true),
});

type ThirdPartyFormData = z.infer<typeof thirdPartySchema>;

export default function ThirdParties() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingThirdParty, setEditingThirdParty] = useState<ThirdParty | null>(null);

  const { data: thirdParties, isLoading } = useQuery<ThirdParty[]>({
    queryKey: ["/api/third-parties"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertThirdParty) => {
      const res = await apiRequest("POST", "/api/third-parties", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/third-parties"] });
      setShowForm(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Terceiro cadastrado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertThirdParty> }) => {
      const res = await apiRequest("PUT", `/api/third-parties/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/third-parties"] });
      setShowForm(false);
      setEditingThirdParty(null);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Terceiro atualizado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/third-parties/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/third-parties"] });
      toast({
        title: "Sucesso",
        description: "Terceiro removido com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<ThirdPartyFormData>({
    resolver: zodResolver(thirdPartySchema),
    defaultValues: {
      name: "",
      document: "",
      document_type: "CPF",
      email: "",
      phone: "",
      address: "",
      is_active: true,
    },
  });

  const onSubmit = (data: ThirdPartyFormData) => {
    if (editingThirdParty) {
      updateMutation.mutate({ id: editingThirdParty.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (thirdParty: ThirdParty) => {
    setEditingThirdParty(thirdParty);
    form.reset({
      name: thirdParty.name,
      document: thirdParty.document || "",
      document_type: thirdParty.document_type || "CPF",
      email: thirdParty.email || "",
      phone: thirdParty.phone || "",
      address: thirdParty.address || "",
      is_active: thirdParty.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este terceiro?")) {
      deleteMutation.mutate(id);
    }
  };

  const filteredThirdParties = thirdParties?.filter((thirdParty) =>
    thirdParty.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thirdParty.document?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Terceiros</h2>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingThirdParty(null);
              form.reset();
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Terceiro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingThirdParty ? "Editar Terceiro" : "Novo Terceiro"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Nome do terceiro"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">Tipo Documento</Label>
                  <Select
                    value={form.watch("document_type")}
                    onValueChange={(value) => form.setValue("document_type", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CPF">CPF</SelectItem>
                      <SelectItem value="CNPJ">CNPJ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document">Documento</Label>
                  <Input
                    id="document"
                    {...form.register("document")}
                    placeholder="CPF/CNPJ"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  placeholder="email@exemplo.com"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...form.register("phone")}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  {...form.register("address")}
                  placeholder="Endereço completo"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingThirdParty ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar terceiros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Terceiros</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : filteredThirdParties.length === 0 ? (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nenhum terceiro encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "Tente ajustar os filtros de busca." : "Comece criando um novo terceiro."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nome</th>
                    <th className="text-left py-2">Documento</th>
                    <th className="text-left py-2">Email</th>
                    <th className="text-left py-2">Telefone</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredThirdParties.map((thirdParty) => (
                    <tr key={thirdParty.id} className="border-b">
                      <td className="py-2 font-medium">{thirdParty.name}</td>
                      <td className="py-2">
                        {thirdParty.document && (
                          <div className="flex items-center space-x-1">
                            {thirdParty.document_type === "CNPJ" ? (
                              <Building className="h-3 w-3" />
                            ) : (
                              <User className="h-3 w-3" />
                            )}
                            <span className="text-sm">{thirdParty.document}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-sm">{thirdParty.email}</td>
                      <td className="py-2 text-sm">{thirdParty.phone}</td>
                      <td className="py-2">
                        <Badge variant={thirdParty.is_active ? "default" : "secondary"}>
                          {thirdParty.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                      <td className="py-2">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(thirdParty)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(thirdParty.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}