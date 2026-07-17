import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Loader2, HelpCircle } from "lucide-react";

interface QuizQuestion {
  id?: string;
  question: string;
  options: string[];
  sort_order: number;
  is_published: boolean;
}

const QuizManagement = () => {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [appId, setAppId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: app } = await supabase
        .from("apps")
        .select("id")
        .eq("status", "published")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (app) {
        setAppId(app.id);
        const { data } = await supabase
          .from("quiz_questions")
          .select("*")
          .eq("app_id", app.id)
          .order("sort_order");

        if (data && data.length > 0) {
          setQuestions(data.map((q) => ({
            id: q.id,
            question: q.question,
            options: Array.isArray(q.options) ? q.options : [],
            sort_order: q.sort_order,
            is_published: q.is_published,
          })));
        } else {
          setQuestions([
            { question: "Qual é o seu principal problema nos pés?", options: ["Dor ao caminhar", "Calosidades e rachaduras", "Unha encravada", "Joanete ou deformidade", "Nenhum, quero prevenir"], sort_order: 0, is_published: true },
            { question: "Com que frequência sente desconforto nos pés?", options: ["Todos os dias", "Algumas vezes por semana", "Raramente", "Nunca, mas quero cuidar melhor"], sort_order: 1, is_published: true },
            { question: "Você já consultou um podólogo ou especialista?", options: ["Sim, faço acompanhamento regular", "Já consultei, mas não acompanho", "Nunca consultei"], sort_order: 2, is_published: true },
            { question: "O que você espera do app PéSaúde?", options: ["Exercícios e alongamentos", "Dicas de cuidados diários", "Conteúdos educativos em vídeo", "Comprar produtos para os pés", "Tudo isso!"], sort_order: 3, is_published: true },
          ]);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", ""], sort_order: questions.length, is_published: true }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = [...updated[qIndex].options, ""];
    setQuestions(updated);
  };

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions];
    updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== oIndex);
    setQuestions(updated);
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].options[oIndex] = value;
    setQuestions(updated);
  };

  const handleSave = async () => {
    if (!appId) return;
    setSaving(true);
    try {
      const { error: delError } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("app_id", appId);
      if (delError) throw delError;

      const rows = questions
        .filter((q) => q.question.trim())
        .map((q, i) => ({
          app_id: appId,
          question: q.question,
          options: q.options.filter((o) => o.trim()),
          sort_order: i,
          is_published: q.is_published,
        }));

      if (rows.length > 0) {
        const { error: insError } = await supabase
          .from("quiz_questions")
          .insert(rows);
        if (insError) throw insError;
      }

      toast({ title: "Quiz salvo com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Painel
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Quiz</h1>
            <p className="text-muted-foreground mt-1">Edite as perguntas e alternativas do quiz de entrada</p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, qIndex) => (
              <Card key={qIndex}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-sm">Pergunta {qIndex + 1}</CardTitle>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={q.is_published}
                        onCheckedChange={(checked) => updateQuestion(qIndex, "is_published", checked)}
                      />
                      <button onClick={() => removeQuestion(qIndex)} className="text-destructive hover:text-destructive/80">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Pergunta</Label>
                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                      placeholder="Digite a pergunta..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Alternativas</Label>
                    <div className="space-y-2 mt-1">
                      {q.options.map((opt, oIndex) => (
                        <div key={oIndex} className="flex items-center gap-2">
                          <Input
                            value={opt}
                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                            placeholder={`Alternativa ${oIndex + 1}`}
                          />
                          {q.options.length > 2 && (
                            <button onClick={() => removeOption(qIndex, oIndex)} className="text-destructive hover:text-destructive/80 flex-shrink-0">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addOption(qIndex)}>
                        <Plus className="h-4 w-4 mr-1" /> Adicionar alternativa
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Button variant="outline" onClick={addQuestion} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Adicionar pergunta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizManagement;
