import { useEffect, useState } from "react";
import { Loader2, Calculator, History, Printer } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { getClientSession } from "@/lib/client-session";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { toast } from "sonner";

interface Record {
  id: string;
  weight_kg: number;
  height_cm: number;
  age: number | null;
  sex: string | null;
  goal: string | null;
  imc: number;
  category: string;
  meal_plan: string;
  created_at: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  "Magreza grave": "#ef4444",
  "Magreza moderada": "#f97316",
  "Magreza leve": "#f59e0b",
  "Peso normal": "#22c55e",
  Sobrepeso: "#f59e0b",
  "Obesidade grau I": "#f97316",
  "Obesidade grau II": "#ef4444",
  "Obesidade grau III (mórbida)": "#b91c1c",
};

const IMCPage = () => {
  const { app } = useAppConfig();
  const accent = app?.primary_color || "hsl(var(--vivabem-green))";
  const session = getClientSession();

  const [form, setForm] = useState({
    weight: "",
    height: "",
    age: "",
    sex: "feminino",
    goal: "manutenção",
    restrictions: "",
  });
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<Record | null>(null);
  const [history, setHistory] = useState<Record[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const loadHistory = async () => {
    if (!session?.id) {
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    try {
      const { data } = await supabase.functions.invoke("imc-history", {
        body: { clientId: session.id },
      });
      setHistory(((data as any)?.records || []) as Record[]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.id) {
      toast.error("Faça login novamente.");
      return;
    }
    const weight = parseFloat(form.weight.replace(",", "."));
    const height = parseFloat(form.height.replace(",", "."));
    if (!weight || !height) {
      toast.error("Informe peso e altura.");
      return;
    }
    setLoading(true);
    setCurrent(null);
    try {
      const { data, error } = await supabase.functions.invoke("imc-plan", {
        body: {
          clientId: session.id,
          weight,
          height,
          age: form.age ? parseInt(form.age) : null,
          sex: form.sex,
          goal: form.goal,
          restrictions: form.restrictions,
        },
      });
      if (error) throw error;
      const payload = data as any;
      if (payload?.error) throw new Error(payload.error);
      setCurrent(payload as Record);
      toast.success("Plano gerado!");
      loadHistory();
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar plano.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-3 mb-2">
        <Calculator className="h-7 w-7" style={{ color: accent }} />
        <h1 className="text-3xl font-bold text-foreground">Calculadora de IMC</h1>
      </div>
      <p className="text-muted-foreground mb-8">
        Descubra sua classificação segundo a OMS e receba um plano alimentar personalizado por IA.
      </p>

      {/* Form */}
      <form onSubmit={onSubmit} className="rounded-xl border bg-card p-6 mb-8 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Field label="Peso (kg) *">
            <input required type="number" step="0.1" min="20" max="400"
              value={form.weight} onChange={(e) => set("weight", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Altura (cm) *">
            <input required type="number" step="0.1" min="80" max="260"
              value={form.height} onChange={(e) => set("height", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Idade">
            <input type="number" min="1" max="120"
              value={form.age} onChange={(e) => set("age", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Sexo">
            <select value={form.sex} onChange={(e) => set("sex", e.target.value)} className={inputCls}>
              <option value="feminino">Feminino</option>
              <option value="masculino">Masculino</option>
              <option value="outro">Outro</option>
            </select>
          </Field>
        </div>

        <Field label="Objetivo">
          <select value={form.goal} onChange={(e) => set("goal", e.target.value)} className={inputCls}>
            <option value="perda de peso">Perda de peso</option>
            <option value="manutenção">Manutenção da saúde</option>
            <option value="ganho de massa">Ganho de massa</option>
            <option value="mais energia">Mais energia no dia a dia</option>
          </select>
        </Field>

        <Field label="Restrições ou preferências (opcional)">
          <textarea rows={2} value={form.restrictions} onChange={(e) => set("restrictions", e.target.value)}
            placeholder="Ex.: vegetariano, intolerância a lactose, sem glúten..." className={inputCls} maxLength={500} />
        </Field>

        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-full text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: accent }}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Calculando e gerando plano..." : "Calcular IMC e gerar plano alimentar"}
        </button>
      </form>

      {/* Current result */}
      {current && (
        <div className="rounded-xl border bg-card p-6 mb-8" id="imc-result">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <div className="text-sm text-muted-foreground">Seu IMC</div>
              <div className="text-5xl font-bold text-foreground">{current.imc.toFixed(2)}</div>
              <div
                className="inline-block mt-2 px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: CATEGORY_COLOR[current.category] || accent }}
              >
                {current.category}
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md border text-sm hover:bg-muted"
            >
              <Printer className="h-4 w-4" /> Imprimir
            </button>
          </div>

          <ClassificationTable currentCategory={current.category} />

          <div className="prose prose-sm dark:prose-invert max-w-none mt-6 border-t pt-6">
            <ReactMarkdown>{current.meal_plan}</ReactMarkdown>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            ⚠️ Este plano é uma sugestão gerada por IA e não substitui o acompanhamento de um profissional de saúde.
          </p>
        </div>
      )}

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Meu histórico</h2>
        </div>
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cálculo salvo ainda.</p>
        ) : (
          <div className="space-y-2">
            {history.map((r) => (
              <details key={r.id} className="rounded-lg border bg-card">
                <summary className="cursor-pointer p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">IMC {r.imc.toFixed(2)}</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-white text-xs"
                      style={{ backgroundColor: CATEGORY_COLOR[r.category] || accent }}
                    >
                      {r.category}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {r.weight_kg} kg · {r.height_cm} cm
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </span>
                </summary>
                <div className="prose prose-sm dark:prose-invert max-w-none px-4 pb-4 border-t pt-3">
                  <ReactMarkdown>{r.meal_plan}</ReactMarkdown>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="text-sm font-medium text-foreground mb-1.5 block">{label}</span>
    {children}
  </label>
);

const OMS_TABLE = [
  { range: "< 16", label: "Magreza grave" },
  { range: "16 – 16,9", label: "Magreza moderada" },
  { range: "17 – 18,4", label: "Magreza leve" },
  { range: "18,5 – 24,9", label: "Peso normal" },
  { range: "25 – 29,9", label: "Sobrepeso" },
  { range: "30 – 34,9", label: "Obesidade grau I" },
  { range: "35 – 39,9", label: "Obesidade grau II" },
  { range: "≥ 40", label: "Obesidade grau III (mórbida)" },
];

const ClassificationTable = ({ currentCategory }: { currentCategory: string }) => (
  <div className="rounded-lg border overflow-hidden">
    <table className="w-full text-sm">
      <thead className="bg-muted/50">
        <tr>
          <th className="text-left px-3 py-2 font-medium">IMC</th>
          <th className="text-left px-3 py-2 font-medium">Classificação (OMS)</th>
        </tr>
      </thead>
      <tbody>
        {OMS_TABLE.map((row) => (
          <tr
            key={row.label}
            className={row.label === currentCategory ? "bg-primary/10 font-semibold" : "border-t"}
          >
            <td className="px-3 py-2">{row.range}</td>
            <td className="px-3 py-2">{row.label}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default IMCPage;
