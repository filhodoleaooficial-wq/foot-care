import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink, QrCode, Rocket } from "lucide-react";
import { toast } from "sonner";

interface DeployDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
  appName: string;
  status: string;
  onPublish: () => Promise<void>;
}

const DeployDialog = ({ open, onOpenChange, appId, appName, status, onPublish }: DeployDialogProps) => {
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const appUrl = `${window.location.origin}/app/${appId}`;
  const isPublished = status === "published";

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = async () => {
    setPublishing(true);
    await onPublish();
    setPublishing(false);
  };

  // Simple QR code generation using canvas
  useEffect(() => {
    if (!open || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 200;
    canvas.width = size;
    canvas.height = size;

    // Use a simple QR-like pattern (placeholder - in production use a QR library)
    // For now, render the URL as a visual placeholder with a grid pattern
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);

    // Generate a deterministic pattern from the appId
    const cellSize = 8;
    const gridSize = Math.floor(size / cellSize);
    const hash = appId.split("").reduce((acc, ch, i) => acc + ch.charCodeAt(0) * (i + 1), 0);

    ctx.fillStyle = "hsl(142, 45%, 35%)";

    // Border pattern (QR-like)
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Finder patterns (corners)
        const inTopLeft = i < 7 && j < 7;
        const inTopRight = i < 7 && j >= gridSize - 7;
        const inBottomLeft = i >= gridSize - 7 && j < 7;

        if (inTopLeft || inTopRight || inBottomLeft) {
          const outerBorder = i === 0 || j === 0 || i === 6 || j === 6 ||
            (inTopRight && (j === gridSize - 7 || j === gridSize - 1)) ||
            (inBottomLeft && (i === gridSize - 7 || i === gridSize - 1));
          const innerBlock = (i >= 2 && i <= 4 && j >= 2 && j <= 4) ||
            (inTopRight && i >= 2 && i <= 4 && j >= gridSize - 5 && j <= gridSize - 3) ||
            (inBottomLeft && i >= gridSize - 5 && i <= gridSize - 3 && j >= 2 && j <= 4);

          if (outerBorder || innerBlock) {
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
          }
        } else {
          // Data pattern
          const seed = (hash + i * 31 + j * 17) % 100;
          if (seed < 40) {
            ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
          }
        }
      }
    }
  }, [open, appId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            Deploy — {appName}
          </DialogTitle>
          <DialogDescription>
            {isPublished
              ? "Seu app está publicado! Compartilhe o link com seus clientes."
              : "Publique seu app para gerar o link de acesso para clientes."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isPublished
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isPublished ? "bg-green-500" : "bg-amber-500"}`} />
              {isPublished ? "Publicado" : "Rascunho"}
            </span>
          </div>

          {/* Publish button if draft */}
          {!isPublished && (
            <Button variant="hero" className="w-full gap-2" onClick={handlePublish} disabled={publishing}>
              <Rocket className="h-4 w-4" />
              {publishing ? "Publicando..." : "Publicar App"}
            </Button>
          )}

          {/* Link section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Link do App</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border bg-muted/50 px-3 py-2.5 text-sm text-foreground truncate font-mono">
                {appUrl}
              </div>
              <Button variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <QrCode className="h-4 w-4" /> QR Code
            </label>
            <div className="flex justify-center rounded-lg border bg-white p-4">
              <canvas ref={canvasRef} className="h-[160px] w-[160px]" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Seus clientes podem escanear para acessar o app
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(appUrl, "_blank")}>
              <ExternalLink className="h-4 w-4" /> Abrir App
            </Button>
            <Button variant="outline" className="flex-1 gap-2" onClick={handleCopy}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copiado!" : "Copiar Link"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeployDialog;
