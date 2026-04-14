import { useState, useRef, useCallback } from "react";
import '../styles/globals.css';

type ConversionSettings = {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  stripMetadata: boolean;
  progressive: boolean;
};

type ConvertedImage = {
  blob: Blob;
  url: string;
  originalSize: number;
  convertedSize: number;
  width: number;
  height: number;
  filename: string;
};

const DEFAULT_SETTINGS: ConversionSettings = {
  quality: 82,
  maxWidth: 1920,
  maxHeight: 1080,
  stripMetadata: true,
  progressive: true,
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getSavingsColor(pct: number): string {
  if (pct >= 50) return "text-emerald-400";
  if (pct >= 25) return "text-lime-400";
  if (pct >= 10) return "text-yellow-400";
  return "text-zinc-400";
}

export default function WebpConverter() {
  const [settings, setSettings] = useState<ConversionSettings>(DEFAULT_SETTINGS);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<ConvertedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customName, setCustomName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const convertToWebP = useCallback(
    async (file: File) => {
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp|gif|bmp|tiff)$/i)) {
        setError("Formato no soportado. Usa JPG, PNG, WebP, GIF, BMP o TIFF.");
        return;
      }

      setIsConverting(true);
      setError(null);
      setResult(null);

      try {
        const originalSize = file.size;
        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("No se pudo cargar la imagen."));
          img.src = objectUrl;
        });

        URL.revokeObjectURL(objectUrl);

        let { width, height } = img;
        const maxW = settings.maxWidth;
        const maxH = settings.maxHeight;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = canvasRef.current!;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;

        ctx.clearRect(0, 0, width, height);
        // Fondo blanco para imágenes con transparencia (PNG)
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const quality = settings.quality / 100;
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else reject(new Error("Error al generar el blob WebP."));
            },
            "image/webp",
            quality
          );
        });

        const baseName = file.name.replace(/\.[^/.]+$/, "");
        const filename = `${baseName}.webp`;
        const url = URL.createObjectURL(blob);

        setCustomName(baseName);
        setResult({
          blob,
          url,
          originalSize,
          convertedSize: blob.size,
          width,
          height,
          filename,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido.");
      } finally {
        setIsConverting(false);
      }
    },
    [settings]
  );

  const handleFile = (file: File) => {
    convertToWebP(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDownload = () => {
    if (!result) return;
    const name = customName.trim() || result.filename.replace(/\.webp$/, "");
    const safeName = name.replace(/[^a-zA-Z0-9_\-\.áéíóúñÁÉÍÓÚÑüÜ ]/g, "_");
    const a = document.createElement("a");
    a.href = result.url;
    a.download = `${safeName}.webp`;
    a.click();
  };

  const savingsPct =
    result
      ? Math.round(((result.originalSize - result.convertedSize) / result.originalSize) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-mono flex flex-col items-center justify-start py-12 px-4">
      {/* Canvas oculto para procesamiento */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="w-full max-w-2xl mb-10">
        <div className="flex items-baseline gap-3 mb-1">
          <span className="text-xs tracking-[0.3em] text-zinc-500 uppercase">herramienta</span>
          <span className="text-zinc-700 text-xs">—</span>
          <span className="text-xs tracking-[0.3em] text-zinc-500 uppercase">local</span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white leading-none">
          WebP<span className="text-emerald-400">_</span>converter
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Conversión 100% local · sin servidores · sin publicidad
        </p>
      </div>

      {/* Drop Zone */}
      <div className="w-full max-w-2xl">
        <div
          className={`relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer
            ${isDragging
              ? "border-emerald-400 bg-emerald-950/30"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800/50"
            }
            ${isConverting ? "pointer-events-none opacity-60" : ""}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/tiff,image/webp"
            className="hidden"
            onChange={handleInputChange}
          />

          <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-4">
            {isConverting ? (
              <>
                <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-zinc-400">Procesando imagen...</p>
              </>
            ) : (
              <>
                <div className={`transition-transform duration-200 ${isDragging ? "scale-110" : ""}`}>
                  <svg className="w-12 h-12 text-zinc-600" fill="none" viewBox="0 0 48 48" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="6" y="10" width="36" height="28" rx="4" />
                    <circle cx="17" cy="20" r="4" />
                    <path d="M6 32l9-9 7 7 5-5 8 8" strokeLinejoin="round" />
                    <path d="M30 6v10M26 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-zinc-300 text-sm font-medium">
                    {isDragging ? "Suelta aquí" : "Arrastra tu imagen o haz clic"}
                  </p>
                  <p className="text-zinc-600 text-xs mt-1">JPG · PNG · GIF · BMP · TIFF · WebP</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 bg-red-950/50 border border-red-800 rounded-lg px-4 py-3 text-sm text-red-400">
            ⚠ {error}
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Preview */}
            <div className="bg-zinc-800/50 p-4 flex justify-center">
              <img
                src={result.url}
                alt="Vista previa"
                className="max-h-56 max-w-full rounded-lg object-contain"
              />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-zinc-800 border-t border-zinc-800">
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Original</p>
                <p className="text-base font-bold text-zinc-300">{formatBytes(result.originalSize)}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">WebP</p>
                <p className="text-base font-bold text-emerald-400">{formatBytes(result.convertedSize)}</p>
              </div>
              <div className="px-4 py-4 text-center">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Ahorro</p>
                <p className={`text-base font-bold ${getSavingsColor(savingsPct)}`}>
                  {savingsPct > 0 ? `−${savingsPct}%` : `+${Math.abs(savingsPct)}%`}
                </p>
              </div>
            </div>

            {/* Dimensiones */}
            <div className="px-4 py-3 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {result.width} × {result.height}px · calidad {settings.quality}% · {result.filename}
            </div>

            {/* Nombre del archivo */}
            <div className="px-4 pt-3 pb-2 border-t border-zinc-800">
              <label className="text-[11px] text-zinc-500 uppercase tracking-wider block mb-1.5">
                Nombre del archivo
              </label>
              <div className="flex items-center gap-0">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="nombre-de-la-imagen"
                  className="flex-1 bg-zinc-800 border border-zinc-700 border-r-0 rounded-l-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="bg-zinc-700 border border-zinc-700 border-l-0 rounded-r-lg px-3 py-2 text-sm text-zinc-400 select-none">
                  .webp
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="px-4 pb-4 pt-2 flex gap-3">
              <button
                onClick={handleDownload}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm py-2.5 px-4 rounded-lg transition-colors duration-150"
              >
                ↓ Descargar {(customName.trim() || result.filename.replace(/\.webp$/, ""))}.webp
              </button>
              <button
                onClick={() => { setResult(null); setError(null); }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm py-2.5 px-4 rounded-lg transition-colors duration-150"
              >
                Nueva
              </button>
            </div>
          </div>
        )}

        {/* Settings Toggle */}
        <div className="mt-6">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-2"
          >
            <span className="inline-block w-3 h-0.5 bg-current" />
            {showSettings ? "Ocultar" : "Mostrar"} configuración avanzada
            <span className={`inline-block transition-transform duration-200 ${showSettings ? "rotate-180" : ""}`}>▾</span>
          </button>

          {showSettings && (
            <div className="mt-4 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-5">

              {/* Calidad */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">
                    Calidad WebP
                  </label>
                  <span className="text-xs font-bold text-emerald-400">{settings.quality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={settings.quality}
                  onChange={(e) => setSettings((s) => ({ ...s, quality: +e.target.value }))}
                  className="w-full accent-emerald-400 bg-zinc-800 h-1 rounded-full"
                />
                <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                  <span>10 — máx. compresión</span>
                  <span>100 — sin pérdida</span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-2">
                  82% es el estándar recomendado para web 2026 (mejor relación calidad/peso).
                </p>
              </div>

              {/* Dimensiones máximas */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider block mb-2">
                  Dimensiones máximas
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-zinc-600 block mb-1">Ancho (px)</label>
                    <input
                      type="number"
                      min={100}
                      max={8000}
                      value={settings.maxWidth}
                      onChange={(e) => setSettings((s) => ({ ...s, maxWidth: +e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-600 block mb-1">Alto (px)</label>
                    <input
                      type="number"
                      min={100}
                      max={8000}
                      value={settings.maxHeight}
                      onChange={(e) => setSettings((s) => ({ ...s, maxHeight: +e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-zinc-600 mt-2">
                  La imagen se escala proporcionalmente si supera estos límites. 1920×1080 es el estándar Full HD.
                </p>
              </div>

              {/* Presets rápidos */}
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider block mb-2">
                  Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "OG / Social", w: 1200, h: 630, q: 85 },
                    { label: "Full HD", w: 1920, h: 1080, q: 82 },
                    { label: "Thumbnail", w: 400, h: 300, q: 75 },
                    { label: "4K", w: 3840, h: 2160, q: 80 },
                    { label: "Máx. calidad", w: 1920, h: 1080, q: 95 },
                    { label: "Máx. compresión", w: 1280, h: 720, q: 60 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          maxWidth: p.w,
                          maxHeight: p.h,
                          quality: p.q,
                        }))
                      }
                      className="text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => setSettings(DEFAULT_SETTINGS)}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                ↺ Restaurar valores por defecto
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="mt-8 pt-6 border-t border-zinc-900 text-[11px] text-zinc-700 space-y-1">
          <p>✓ Procesamiento 100% en el navegador — ningún archivo sale de tu máquina</p>
          <p>✓ WebP reduce el peso un 25–35% vs JPEG y hasta 80% vs PNG sin pérdida visual</p>
          <p>✓ Soportado en todos los navegadores modernos desde 2020 (Chrome, Firefox, Safari, Edge)</p>
        </div>
      </div>
    </div>
  );
}