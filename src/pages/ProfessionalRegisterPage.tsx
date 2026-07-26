import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePremiumGate } from "@/hooks/usePremiumGate";
import { useAppConfig } from "@/contexts/AppConfigContext";
import { useAuth } from "@/contexts/AuthContext";


const CATEGORIES = [
  { value: "fisica", label: "Saúde Física" },
  { value: "mental", label: "Saúde Mental" },
  { value: "espiritual", label: "Saúde Espiritual" },
] as const;

const ProfessionalRegisterPage = () => {
  const navigate = useNavigate();
  const { loading: gateLoading, isPremium } = usePremiumGate();
  const { app } = useAppConfig();
  const { user } = useAuth();
  const accent = app?.primary_color || "hsl(var(--vivabem-green))";


  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "fisica",
    activity: "",
    bio: "",
    whatsapp: "",
    address: "",
    city: "",
    state: "",
    instagram: "",
    website: "",
    email: "",
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handlePhoto = (f: File | null) => {
    setPhotoFile(f);
    if (f) setPhotoPreview(URL.createObjectURL(f));
    else setPhotoPreview(null);
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;
    const ext = photoFile.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("professionals").upload(path, photoFile, {
      contentType: photoFile.type,
      upsert: false,
    });
    if (error) throw error;
    const { data } = await supabase.storage
      .from("professionals")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    return data?.signedUrl || null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.activity.trim() || !form.whatsapp.trim()) {
      toast.error("Preencha nome, atividade e WhatsApp.");
      return;
    }
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) photoUrl = await uploadPhoto();
      const whatsappDigits = form.whatsapp.replace(/\D/g, "");
      const { error } = await supabase.from("professionals").insert({
        name: form.name.trim(),
        category: form.category as any,
        activity: form.activity.trim(),
        bio: form.bio.trim() || null,
        whatsapp: whatsappDigits,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        instagram: form.instagram.trim() || null,
        website: form.website.trim() || null,
        email: form.email.trim() || null,
        photo_url: photoUrl,
      });
      if (error) throw error;
      toast.success("Cadastro enviado! Você já aparece no diretório.");
      navigate("/profissionais");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar.");
    } finally {
      setSubmitting(false);
    }
  };

  if (gateLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">Área exclusiva</h1>
        <p className="text-muted-foreground mb-6">
          O cadastro de profissionais está disponível apenas para membros premium.
        </p>
        <button
          onClick={() => navigate("/home")}
          className="px-6 py-2.5 rounded-full text-white font-medium"
          style={{ backgroundColor: accent }}
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-foreground mb-2">Cadastre-se como profissional</h1>
      <p className="text-muted-foreground mb-8">
        Ofereça seus serviços de saúde física, mental ou espiritual à comunidade.
      </p>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Photo */}
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted overflow-hidden flex items-center justify-center border">
            {photoPreview ? (
              <img src={photoPreview} alt="Prévia" className="h-full w-full object-cover" />
            ) : (
              <Upload className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <label className="inline-flex items-center px-4 py-2 rounded-md border cursor-pointer text-sm hover:bg-muted">
            Escolher foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handlePhoto(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <Field label="Nome completo *">
          <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </Field>

        <Field label="Categoria *">
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Atividade / Especialidade *">
          <input required value={form.activity} onChange={(e) => set("activity", e.target.value)} placeholder="Ex.: Psicóloga, Fisioterapeuta, Reikiano" className={inputCls} />
        </Field>

        <Field label="Bio / Descrição">
          <textarea rows={3} value={form.bio} onChange={(e) => set("bio", e.target.value)} className={inputCls} maxLength={500} />
        </Field>

        <Field label="WhatsApp *">
          <input required value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="+55 11 99999-9999" className={inputCls} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cidade">
            <input value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Estado (UF)">
            <input value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2} className={inputCls} />
          </Field>
        </div>

        <Field label="Endereço">
          <input value={form.address} onChange={(e) => set("address", e.target.value)} className={inputCls} />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Instagram">
            <input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@usuario" className={inputCls} />
          </Field>
          <Field label="Site">
            <input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" className={inputCls} />
          </Field>
        </div>

        <Field label="E-mail de contato">
          <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-full text-white font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: accent }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Enviando..." : "Cadastrar"}
        </button>
      </form>
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

export default ProfessionalRegisterPage;
