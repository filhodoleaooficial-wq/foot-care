import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Pencil, Trash2, Layers, GripVertical, Eye, EyeOff,
  FileText, Video, Music, Download, Code, Link2, Globe, ChevronDown, ChevronUp,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ModuleModal from "@/components/ModuleModal";
import LessonModal from "@/components/LessonModal";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Module {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  is_published: boolean;
  sort_order: number;
  cover_url: string | null;
  content_url: string | null;
  content_html: string | null;
  release_type: string;
  release_value: string | null;
  open_directly: boolean;
  product_id: string;
  user_id: string;
}

interface Lesson {
  id: string;
  title: string;
  content_type: string;
  content_url: string | null;
  content_text: string | null;
  sort_order: number;
  is_published: boolean;
  duration_minutes: number | null;
  module_id: string;
  user_id: string;
}

const contentTypeIcons: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  pdf: <FileText className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
  html: <Code className="h-4 w-4" />,
  vturb: <Video className="h-4 w-4" />,
  text: <FileText className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
  iframe: <Globe className="h-4 w-4" />,
  pdf_drive: <FileText className="h-4 w-4" />,
};

/* ─── Sortable Lesson Card ─── */
const SortableLessonCard = ({
  lesson,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  lesson: Lesson;
  onEdit: (l: Lesson) => void;
  onDelete: (id: string) => void;
  onTogglePublish: (l: Lesson) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.7 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 rounded-lg border bg-background p-3 shadow-sm">
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-primary">
        {contentTypeIcons[lesson.content_type] || <FileText className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
        <p className="text-xs text-muted-foreground">
          {lesson.content_type} {lesson.duration_minutes ? `· ${lesson.duration_minutes}min` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => onTogglePublish(lesson)} className="rounded p-1.5 text-muted-foreground hover:bg-accent" title={lesson.is_published ? "Despublicar" : "Publicar"}>
          {lesson.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
        <button onClick={() => onEdit(lesson)} className="rounded p-1.5 text-muted-foreground hover:bg-accent"><Pencil className="h-3.5 w-3.5" /></button>
        <button onClick={() => onDelete(lesson.id)} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
      </div>
    </div>
  );
};

/* ─── Sortable Module Card ─── */
const SortableModuleCard = ({
  module,
  lessons,
  onTogglePublish,
  onEdit,
  onDelete,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onToggleLessonPublish,
  onReorderLessons,
}: {
  module: Module;
  lessons: Lesson[];
  onTogglePublish: (m: Module) => void;
  onEdit: (m: Module) => void;
  onDelete: (id: string) => void;
  onAddLesson: (moduleId: string) => void;
  onEditLesson: (l: Lesson) => void;
  onDeleteLesson: (id: string) => void;
  onToggleLessonPublish: (l: Lesson) => void;
  onReorderLessons: (moduleId: string, lessons: Lesson[]) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });
  const style = { transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 50 : undefined, opacity: isDragging ? 0.85 : 1 };

  const lessonSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleLessonDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = lessons.findIndex((l) => l.id === active.id);
    const newIdx = lessons.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lessons, oldIdx, newIdx).map((l, i) => ({ ...l, sort_order: i }));
    onReorderLessons(module.id, reordered);
  };

  return (
    <div ref={setNodeRef} style={style} className={`rounded-xl border bg-card shadow-card ${isDragging ? "ring-2 ring-primary/40" : ""}`}>
      <div className="flex items-start gap-4 p-5">
        <button {...attributes} {...listeners} className="mt-1 cursor-grab text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing">
          <GripVertical className="h-5 w-5" />
        </button>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent text-primary overflow-hidden">
          {module.cover_url ? <img src={module.cover_url} alt="" className="h-full w-full object-cover" /> : <Layers className="h-6 w-6" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground truncate">{module.title}</h3>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              {module.content_type}
            </span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${module.is_published ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {module.is_published ? "Publicado" : "Rascunho"}
            </span>
          </div>
          {module.description && <p className="mt-1 text-sm text-muted-foreground truncate">{module.description}</p>}
          <p className="mt-1 text-xs text-muted-foreground">
            Ordem: {module.sort_order} · {lessons.length} aula{lessons.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setExpanded(!expanded)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors" title="Ver aulas">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <button onClick={() => onTogglePublish(module)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors">
            {module.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          <button onClick={() => onEdit(module)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent transition-colors"><Pencil className="h-4 w-4" /></button>
          <button onClick={() => onDelete(module.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      {expanded && (
        <div className="border-t px-5 py-4 space-y-3">
          {lessons.length > 0 ? (
            <DndContext sensors={lessonSensors} collisionDetection={closestCenter} onDragEnd={handleLessonDragEnd}>
              <SortableContext items={lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {lessons.map((lesson) => (
                    <SortableLessonCard
                      key={lesson.id}
                      lesson={lesson}
                      onEdit={onEditLesson}
                      onDelete={onDeleteLesson}
                      onTogglePublish={onToggleLessonPublish}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma aula ainda</p>
          )}
          <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => onAddLesson(module.id)}>
            <Plus className="h-3.5 w-3.5" /> Adicionar Aula
          </Button>
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─── */
const ModulesManagement = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsMap, setLessonsMap] = useState<Record<string, Lesson[]>>({});
  const [loading, setLoading] = useState(true);
  const [productName, setProductName] = useState("");
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonModuleId, setLessonModuleId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"module" | "lesson">("module");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchModules();
    }
  }, [productId]);

  const fetchProduct = async () => {
    const { data } = await supabase.from("products").select("name").eq("id", productId!).single();
    if (data) setProductName(data.name);
  };

  const fetchModules = async () => {
    setLoading(true);
    const { data: mods } = await supabase
      .from("modules")
      .select("*")
      .eq("product_id", productId!)
      .order("sort_order", { ascending: true });
    setModules(mods || []);

    if (mods && mods.length > 0) {
      const { data: allLessons } = await supabase
        .from("lessons")
        .select("*")
        .in("module_id", mods.map((m) => m.id))
        .order("sort_order", { ascending: true });

      const map: Record<string, Lesson[]> = {};
      mods.forEach((m) => { map[m.id] = []; });
      (allLessons || []).forEach((l) => {
        if (map[l.module_id]) map[l.module_id].push(l as Lesson);
      });
      setLessonsMap(map);
    } else {
      setLessonsMap({});
    }
    setLoading(false);
  };

  const toggleModulePublish = async (mod: Module) => {
    await supabase.from("modules").update({ is_published: !mod.is_published }).eq("id", mod.id);
    setModules((prev) => prev.map((m) => m.id === mod.id ? { ...m, is_published: !m.is_published } : m));
  };

  const toggleLessonPublish = async (lesson: Lesson) => {
    await supabase.from("lessons").update({ is_published: !lesson.is_published }).eq("id", lesson.id);
    setLessonsMap((prev) => {
      const updated = { ...prev };
      updated[lesson.module_id] = updated[lesson.module_id].map((l) =>
        l.id === lesson.id ? { ...l, is_published: !l.is_published } : l
      );
      return updated;
    });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    if (deleteType === "module") {
      const { error } = await supabase.from("modules").delete().eq("id", deleteId);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else {
        setModules((prev) => prev.filter((m) => m.id !== deleteId));
        toast({ title: "Módulo excluído" });
      }
    } else {
      const { error } = await supabase.from("lessons").delete().eq("id", deleteId);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else {
        setLessonsMap((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((k) => { updated[k] = updated[k].filter((l) => l.id !== deleteId); });
          return updated;
        });
        toast({ title: "Aula excluída" });
      }
    }
    setDeleteId(null);
  };

  const handleModuleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = modules.findIndex((m) => m.id === active.id);
    const newIdx = modules.findIndex((m) => m.id === over.id);
    const reordered = arrayMove(modules, oldIdx, newIdx).map((m, i) => ({ ...m, sort_order: i }));
    setModules(reordered);
    await Promise.all(reordered.map((m) => supabase.from("modules").update({ sort_order: m.sort_order }).eq("id", m.id)));
  };

  const handleReorderLessons = async (moduleId: string, reordered: Lesson[]) => {
    setLessonsMap((prev) => ({ ...prev, [moduleId]: reordered }));
    await Promise.all(reordered.map((l) => supabase.from("lessons").update({ sort_order: l.sort_order }).eq("id", l.id)));
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-foreground truncate">
              Módulos — {productName}
            </h1>
          </div>
          <Button variant="hero" className="gap-2" onClick={() => { setEditingModule(null); setModuleModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Novo Módulo
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : modules.length === 0 ? (
          <motion.div className="flex flex-col items-center justify-center py-20 text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">Nenhum módulo ainda</h2>
            <p className="mt-2 text-muted-foreground">Crie módulos e adicione aulas com PDFs, vídeos, áudios e mais.</p>
            <Button variant="hero" className="mt-6 gap-2" onClick={() => { setEditingModule(null); setModuleModalOpen(true); }}>
              <Plus className="h-4 w-4" /> Criar Módulo
            </Button>
          </motion.div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleModuleDragEnd}>
            <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {modules.map((mod) => (
                  <SortableModuleCard
                    key={mod.id}
                    module={mod}
                    lessons={lessonsMap[mod.id] || []}
                    onTogglePublish={toggleModulePublish}
                    onEdit={(m) => { setEditingModule(m); setModuleModalOpen(true); }}
                    onDelete={(id) => { setDeleteId(id); setDeleteType("module"); }}
                    onAddLesson={(moduleId) => { setLessonModuleId(moduleId); setEditingLesson(null); setLessonModalOpen(true); }}
                    onEditLesson={(l) => { setLessonModuleId(l.module_id); setEditingLesson(l); setLessonModalOpen(true); }}
                    onDeleteLesson={(id) => { setDeleteId(id); setDeleteType("lesson"); }}
                    onToggleLessonPublish={toggleLessonPublish}
                    onReorderLessons={handleReorderLessons}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      {user && productId && (
        <ModuleModal
          open={moduleModalOpen}
          onOpenChange={(open) => { setModuleModalOpen(open); if (!open) setEditingModule(null); }}
          productId={productId}
          userId={user.id}
          onModuleCreated={fetchModules}
          existingModule={editingModule}
        />
      )}

      {user && lessonModuleId && (
        <LessonModal
          open={lessonModalOpen}
          onOpenChange={(open) => { setLessonModalOpen(open); if (!open) { setEditingLesson(null); setLessonModuleId(null); } }}
          moduleId={lessonModuleId}
          userId={user.id}
          onLessonCreated={fetchModules}
          existingLesson={editingLesson}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {deleteType === "module" ? "módulo" : "aula"}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
              {deleteType === "module" && " Todas as aulas deste módulo também serão removidas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ModulesManagement;
