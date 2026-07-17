import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, DollarSign, TrendingUp, ShoppingBag, CheckCircle, Clock, XCircle } from "lucide-react";

interface Sale {
  id: string;
  client_id: string;
  product_id: string;
  status: string;
  amount: number | null;
  created_at: string;
  client_email?: string;
  product_name?: string;
}

const SalesPage = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchSales = async () => {
      const { data: purchases, error } = await supabase
        .from("product_purchases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !purchases) {
        setLoading(false);
        return;
      }

      const clientIds = [...new Set(purchases.map((p) => p.client_id))];
      const productIds = [...new Set(purchases.map((p) => p.product_id))];

      const [clientsRes, productsRes] = await Promise.all([
        clientIds.length > 0
          ? supabase.from("app_clients").select("id, email").in("id", clientIds)
          : { data: [] },
        productIds.length > 0
          ? supabase.from("products").select("id, name").in("id", productIds)
          : { data: [] },
      ]);

      const clientMap = new Map((clientsRes.data || []).map((c: any) => [c.id, c.email]));
      const productMap = new Map((productsRes.data || []).map((p: any) => [p.id, p.name]));

      const enriched = purchases.map((s) => ({
        ...s,
        client_email: clientMap.get(s.client_id) || "—",
        product_name: productMap.get(s.product_id) || "—",
      }));

      setSales(enriched);
      setTotalRevenue(enriched.filter((s) => s.status === "paid").reduce((acc, s) => acc + (s.amount || 0), 0));
      setPaidCount(enriched.filter((s) => s.status === "paid").length);
      setPendingCount(enriched.filter((s) => s.status === "pending").length);
      setLoading(false);
    };
    fetchSales();
  }, []);

  const statusBadge = (status: string) => {
    if (status === "paid") return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
    if (status === "pending") return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Falhou</Badge>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-2">Vendas</h1>
        <p className="text-muted-foreground mb-8">Acompanhe as vendas e receitas dos seus produtos</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center"><DollarSign className="h-6 w-6 text-green-600" /></div>
              <div><p className="text-sm text-muted-foreground">Receita Total</p><p className="text-2xl font-bold">R$ {totalRevenue.toFixed(2).replace(".", ",")}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-primary" /></div>
              <div><p className="text-sm text-muted-foreground">Pagamentos</p><p className="text-2xl font-bold">{paidCount}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center"><Clock className="h-6 w-6 text-yellow-600" /></div>
              <div><p className="text-sm text-muted-foreground">Pendentes</p><p className="text-2xl font-bold">{pendingCount}</p></div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : sales.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-16"><ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">Nenhuma venda registrada ainda.</p></CardContent></Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 font-medium text-muted-foreground">Cliente</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Produto</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => (
                    <tr key={sale.id} className="border-b border-border last:border-0">
                      <td className="p-4">{sale.client_email}</td>
                      <td className="p-4">{sale.product_name}</td>
                      <td className="p-4 font-medium">{sale.amount ? `R$ ${sale.amount.toFixed(2).replace(".", ",")}` : "—"}</td>
                      <td className="p-4">{statusBadge(sale.status)}</td>
                      <td className="p-4 text-muted-foreground">{new Date(sale.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SalesPage;
