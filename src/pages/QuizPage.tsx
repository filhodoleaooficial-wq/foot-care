import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Footprints, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Question {
  question: string;
  options: string[];
}

const fallbackQuestions: Question[] = [
  {
    question: "Qual é o seu principal problema nos pés?",
    options: ["Dor ao caminhar", "Calosidades e rachaduras", "Unha encravada", "Joanete ou deformidade", "Nenhum, quero prevenir"],
  },
  {
    question: "Com que frequência sente desconforto nos pés?",
    options: ["Todos os dias", "Algumas vezes por semana", "Raramente", "Nunca, mas quero cuidar melhor"],
  },
  {
    question: "Você já consultou um podólogo ou especialista?",
    options: ["Sim, faço acompanhamento regular", "Já consultei, mas não acompanho", "Nunca consultei"],
  },
  {
    question: "O que você espera do app PéSaúde?",
    options: ["Exercícios e alongamentos", "Dicas de cuidados diários", "Conteúdos educativos em vídeo", "Comprar produtos para os pés", "Tudo isso!"],
  },
];

const QuizPage = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>(fallbackQuestions);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const fetchQuiz = async () => {
      const { data: app } = await supabase
        .from("apps")
        .select("id")
        .eq("status", "published")
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      if (app) {
        const { data } = await supabase
          .from("quiz_questions")
          .select("question, options")
          .eq("app_id", app.id)
          .eq("is_published", true)
          .order("sort_order");

        if (data && data.length > 0) {
          setQuestions(data.map((q) => ({
            question: q.question,
            options: Array.isArray(q.options) ? q.options : [],
          })));
        }
      }
    };
    fetchQuiz();
  }, []);

  const handleNext = () => {
    if (!selected) return;
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
    setSelected(null);

    if (current + 1 >= questions.length) {
      localStorage.setItem("pesaude_quiz", JSON.stringify(newAnswers));
      setFinished(true);
    } else {
      setCurrent(current + 1);
    }
  };

  const handleBack = () => {
    if (current > 0) {
      setSelected(answers[current - 1] || null);
      setAnswers(answers.slice(0, -1));
      setCurrent(current - 1);
    }
  };

  if (finished) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
        <div className="absolute top-[-80px] right-[-60px] w-40 sm:w-64 h-40 sm:h-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-80px] w-48 sm:w-80 h-48 sm:h-80 rounded-full bg-accent blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 text-center max-w-md"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">
            Perfeito!
          </h1>
          <p className="text-muted-foreground mb-8">
            Com base nas suas respostas, preparamos conteúdos personalizados para a saúde dos seus pés.
          </p>
          <Button
            onClick={() => navigate("/login")}
            className="gradient-primary text-primary-foreground font-bold text-base px-8 py-6 rounded-xl shadow-glow"
          >
            Criar minha conta
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    );
  }

  const q = questions[current];
  const progress = ((current) / questions.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="absolute top-[-80px] right-[-60px] w-40 sm:w-64 h-40 sm:h-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-80px] w-48 sm:w-80 h-48 sm:h-80 rounded-full bg-accent blur-3xl" />

      {/* Header */}
      <div className="relative z-10 px-6 pt-8">
        <div className="flex items-center gap-2 mb-6">
          <Footprints className="h-7 w-7 text-primary" />
          <span className="text-lg font-bold text-foreground">PéSaúde</span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: "hsl(var(--primary))" }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Pergunta {current + 1} de {questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-foreground mb-6">
              {q.question}
            </h2>
            <div className="space-y-3">
              {q.options.map((option) => (
                <button
                  key={option}
                  onClick={() => setSelected(option)}
                  className={`w-full text-left rounded-xl p-4 border-2 transition-all text-sm font-medium ${
                    selected === option
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="relative z-10 px-6 pb-8 flex justify-between items-center">
        <button
          onClick={handleBack}
          disabled={current === 0}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <Button
          onClick={handleNext}
          disabled={!selected}
          className="gradient-primary text-primary-foreground font-bold px-6 py-5 rounded-xl shadow-glow"
        >
          {current + 1 === questions.length ? "Ver resultado" : "Próxima"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default QuizPage;
