import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Warehouse, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      username: formData.username,
      password: formData.password,
    });
  };

  const isPending = loginMutation.isPending;

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Warehouse className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Almoxarifado</h1>
            <p className="text-gray-600 mt-2">Sistema de Gerenciamento</p>
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="mb-6 text-center">
                <h2 className="text-xl font-semibold text-gray-900">Entrar no Sistema</h2>
                <p className="text-sm text-gray-600 mt-1">Faça login para acessar o almoxarifado</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <Label htmlFor="username">Usuário</Label>
                  <Input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="Digite seu usuário"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Digite sua senha"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full almox-primary-btn"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero */}
      <div className="flex-1 bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Warehouse className="text-white text-4xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Gerencie seu Almoxarifado
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed">
            Sistema completo para controle de estoque, movimentações e relatórios financeiros.
            Tenha total controle sobre seus materiais e equipamentos.
          </p>
        </div>
      </div>
    </div>
  );
}
