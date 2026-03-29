import { Smartphone, Share, MoreVertical, Download } from "lucide-react";

const InstallAppPage = () => (
  <div className="min-h-screen bg-background px-6 py-10 max-w-lg mx-auto">
    <div className="text-center mb-10">
      <Smartphone className="h-12 w-12 text-primary mx-auto mb-3" />
      <h1 className="text-2xl font-bold text-foreground">Instalar Aplicativo</h1>
      <p className="text-sm text-muted-foreground mt-2">Adicione o VivaBem à tela inicial do seu celular para acesso rápido.</p>
    </div>

    <div className="space-y-8">
      {/* iOS */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <span className="text-lg">🍎</span> iPhone (Safari)
        </h2>
        <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
          <li className="flex items-start gap-2">
            <span>1.</span>
            <span>Toque no ícone <Share className="inline h-4 w-4 text-primary" /> <strong>Compartilhar</strong> na barra inferior</span>
          </li>
          <li className="flex items-start gap-2">
            <span>2.</span>
            <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span>3.</span>
            <span>Toque em <strong>"Adicionar"</strong> no canto superior direito</span>
          </li>
        </ol>
      </section>

      {/* Android */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <span className="text-lg">🤖</span> Android (Chrome)
        </h2>
        <ol className="space-y-3 text-sm text-muted-foreground list-decimal list-inside">
          <li className="flex items-start gap-2">
            <span>1.</span>
            <span>Toque no ícone <MoreVertical className="inline h-4 w-4 text-primary" /> <strong>Menu</strong> (3 pontinhos) no canto superior</span>
          </li>
          <li className="flex items-start gap-2">
            <span>2.</span>
            <span>Toque em <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span>3.</span>
            <span>Confirme tocando em <strong>"Instalar"</strong></span>
          </li>
        </ol>
      </section>
    </div>

    <p className="text-center text-xs text-muted-foreground mt-8">
      Após instalar, o VivaBem aparecerá como um app na sua tela inicial.
    </p>
  </div>
);

export default InstallAppPage;
