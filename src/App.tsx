import { useState, useRef, useCallback, useEffect } from "react";
import {
  Camera, Image as ImageIcon, Settings, Key, X, Check,
  ChevronRight, Download, Trash2, Heart, Dog, Receipt,
  ShoppingBag, FileText, Utensils, MapPin, Sparkles,
  Moon, Sun, Monitor, RotateCcw, Share2, Info
} from "lucide-react";
import { AnalysisResult, NamingConfig, PetProfile, Theme, FocusPoint, LocationInfo } from "./types";
import { storage } from "./utils/storage";
import { analyzePhoto, checkHealth } from "./utils/api";

const DEFAULT_CONFIG: NamingConfig = {
  dateFormat: "YYYYMMDD",
  separator: "_",
  includeCategory: true,
  includeAmount: true,
};

const THEME_COLORS: Record<Theme, string> = {
  ocean: "#0ea5e9",
  forest: "#22c55e",
  sunset: "#f97316",
  monochrome: "#6b7280",
};

const THEME_BG: Record<Theme, string> = {
  ocean: "bg-gradient-to-br from-sky-50 to-blue-100",
  forest: "bg-gradient-to-br from-green-50 to-emerald-100",
  sunset: "bg-gradient-to-br from-orange-50 to-amber-100",
  monochrome: "bg-gradient-to-br from-gray-50 to-gray-200",
};

export default function App() {
  const [apiKey, setApiKey] = useState(storage.get("api_key", ""));
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPets, setShowPets] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [theme, setTheme] = useState<Theme>(storage.get("theme", "ocean"));
  const [config, setConfig] = useState<NamingConfig>(storage.get("config", DEFAULT_CONFIG));
  const [pets, setPets] = useState<PetProfile[]>(storage.get("pets", []));
  const [history, setHistory] = useState<AnalysisResult[]>(storage.get("history", []));
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [serverOk, setServerOk] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [tapMode, setTapMode] = useState(false);
  const [focusPoint, setFocusPoint] = useState<FocusPoint | undefined>();
  const [location, setLocation] = useState<LocationInfo | undefined>();

  useEffect(() => {
    checkHealth().then(() => setServerOk(true)).catch(() => setServerOk(false));
  }, []);

  useEffect(() => {
    storage.set("theme", theme);
    storage.set("config", config);
    storage.set("pets", pets);
    storage.set("history", history);
    storage.set("api_key", apiKey);
    document.documentElement.style.setProperty("--theme-color", THEME_COLORS[theme]);
  }, [theme, config, pets, history, apiKey]);

  const handleImage = async (file: File) => {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    setError("");
    setResult(null);
    setFocusPoint(undefined);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setPreviewUrl(base64);
      setAnalyzing(true);
      try {
        const res = await analyzePhoto({
          imageBase64: base64,
          mimeType: file.type,
          petProfiles: pets,
          namingConfig: config,
          focusPoint,
          location,
          apiKey,
        });
        setResult(res);
        setHistory((prev) => [res, ...prev].slice(0, 100));
      } catch (err: any) {
        setError(err.message || "分析に失敗しました");
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImage(file);
  };

  const onImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!tapMode || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocusPoint({ x, y });
    setTapMode(false);
  };

  const getLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => {}
    );
  };

  const downloadFile = (filename: string, dataUrl: string) => {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    a.click();
  };

  const sep = config.separator === "space" ? " " : config.separator;

  return (
    <div className={`min-h-screen ${THEME_BG[theme]} transition-colors`}>
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/70 border-b border-white/20">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6" style={{ color: THEME_COLORS[theme] }} />
            <h1 className="text-lg font-bold tracking-tight">Auto Photo Namer</h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-white font-medium">Sakana AI</span>
          </div>
          <div className="flex items-center gap-1">
            {!serverOk && <span className="text-[10px] text-red-500 font-medium">サーバー未接続</span>}
            <button onClick={() => setShowKeyModal(true)} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
              <Key className="w-5 h-5" />
            </button>
            <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* API Key Alert */}
        {!apiKey && (
          <div className="card p-4 bg-amber-50 border-amber-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber900">Sakana AI APIキーを設定してください</p>
                <p className="text-xs text-amber700 mt-1">console.sakana.ai で取得したキーを右上の鍵アイコンから登録できます。</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Area */}
        {!result && !analyzing && (
          <div className="card p-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ backgroundColor: THEME_COLORS[theme] + "20" }}>
                <Camera className="w-8 h-8" style={{ color: THEME_COLORS[theme] }} />
              </div>
              <h2 className="text-xl font-bold">写真をアップロード</h2>
              <p className="text-sm text-gray-500">AIが自動で最適なファイル名を付けます</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="btn-primary py-4 rounded-2xl text-white font-semibold shadow-lg shadow-black/10"
                style={{ backgroundColor: THEME_COLORS[theme] }}
              >
                <Camera className="w-5 h-5 mr-2" />
                カメラ
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary py-4 rounded-2xl bg-white border-2 font-semibold"
                style={{ borderColor: THEME_COLORS[theme], color: THEME_COLORS[theme] }}
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                ギャラリー
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setTapMode(!tapMode)}
                className={`flex-1 btn-primary py-2 text-sm border-2 rounded-xl ${tapMode ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"}`}
              >
                {tapMode ? "タップ指定モードON" : "タップで被写体指定"}
              </button>
              <button
                onClick={getLocation}
                className="flex-1 btn-primary py-2 text-sm bg-white border-2 border-gray-200 text-gray-700 rounded-xl"
              >
                <MapPin className="w-4 h-4 mr-1" />
                位置情報
              </button>
            </div>
            {focusPoint && (
              <p className="text-xs text-center text-gray-500">指定位置: 左{Math.round(focusPoint.x)}% 上{Math.round(focusPoint.y)}%</p>
            )}
            {location && (
              <p className="text-xs text-center text-gray-500">位置: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</p>
            )}
          </div>
        )}

        {/* Preview & Analyzing */}
        {previewUrl && (
          <div className="card p-3">
            <img
              ref={imageRef}
              src={previewUrl}
              alt="preview"
              className={`w-full rounded-xl object-contain max-h-80 ${tapMode ? "cursor-crosshair" : ""}`}
              onClick={onImageClick}
            />
            {analyzing && (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-gray-500">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                Sakana AI Fugu Ultraで解析中...
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="card p-4 bg-red-50 border-red-200">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="card p-5 space-y-4">
            <div className="flex items-center gap-2">
              {result.category === "receipt" && <Receipt className="w-5 h-5 text-emerald-600" />}
              {result.category === "pet" && <Dog className="w-5 h-5 text-amber-600" />}
              {result.category === "product" && <ShoppingBag className="w-5 h-5 text-blue-600" />}
              {result.category === "document" && <FileText className="w-5 h-5 text-purple-600" />}
              {result.category === "food" && <Utensils className="w-5 h-5 text-rose-600" />}
              {result.category === "other" && <ImageIcon className="w-5 h-5 text-gray-600" />}
              <span className="text-sm font-semibold text-gray-700">{result.categoryLabel}</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                確信度 {Math.round(result.confidence * 100)}%
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs text-gray-500 mb-1">推奨ファイル名</p>
              <p className="text-lg font-bold text-gray-900 break-all">{result.suggestedFilename}</p>
            </div>

            {result.details.receiptAmount && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-xs text-emerald-600">金額</p>
                  <p className="font-bold text-emerald-900">{result.details.receiptAmount}</p>
                </div>
                {result.details.receiptStore && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600">店舗</p>
                    <p className="font-bold text-blue-900">{result.details.receiptStore}</p>
                  </div>
                )}
              </div>
            )}

            {result.details.petName && (
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-xs text-amber-600">ペット名</p>
                <p className="font-bold text-amber-900">{result.details.petName} {result.details.isKnownPet ? "(登録済み)" : "(未登録)"}</p>
              </div>
            )}

            {result.details.restaurantName && (
              <div className="bg-rose-50 rounded-lg p-3">
                <p className="text-xs text-rose-600">店舗</p>
                <p className="font-bold text-rose-900">{result.details.restaurantName}</p>
                {result.details.foodDishName && <p className="text-sm text-rose700">{result.details.foodDishName}</p>}
              </div>
            )}

            {result.details.productBrand && (
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-blue-600">ブランド</p>
                <p className="font-bold text-blue-900">{result.details.productBrand}</p>
                {result.details.productCategory && <p className="text-sm text-blue-700">{result.details.productCategory}</p>}
              </div>
            )}

            {result.alternativeNames.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500">その他の候補</p>
                <div className="flex flex-wrap gap-2">
                  {result.alternativeNames.map((name, i) => (
                    <button
                      key={i}
                      onClick={() => downloadFile(name, previewUrl)}
                      className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 leading-relaxed bg-gray-50 rounded-lg p-3">
              {result.explanation}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => downloadFile(result.suggestedFilename, previewUrl)}
                className="btn-primary py-3 rounded-xl text-white font-semibold"
                style={{ backgroundColor: THEME_COLORS[theme] }}
              >
                <Download className="w-4 h-4 mr-2" />
                保存
              </button>
              <button
                onClick={() => { setResult(null); setPreviewUrl(""); setFocusPoint(undefined); setLocation(undefined); }}
                className="btn-primary py-3 rounded-xl bg-white border-2 border-gray-200 text-gray-700 font-semibold"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                次の写真
              </button>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <button onClick={() => setShowPets(true)} className="card p-3 text-center hover:shadow-md transition-shadow">
            <Heart className="w-5 h-5 mx-auto mb-1 text-rose-500" />
            <span className="text-xs font-medium">ペット管理</span>
          </button>
          <button onClick={() => setShowHistory(true)} className="card p-3 text-center hover:shadow-md transition-shadow">
            <Monitor className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <span className="text-xs font-medium">履歴</span>
          </button>
          <button onClick={() => setShowSettings(true)} className="card p-3 text-center hover:shadow-md transition-shadow">
            <Settings className="w-5 h-5 mx-auto mb-1 text-gray-500" />
            <span className="text-xs font-medium">設定</span>
          </button>
        </div>
      </main>

      {/* Hidden Inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFileChange} />

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">APIキー設定</h3>
              <button onClick={() => setShowKeyModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-sakana-..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-xs text-gray-500">console.sakana.ai でAPIキーを取得できます。</p>
            <button
              onClick={() => { storage.set("api_key", apiKey); setShowKeyModal(false); }}
              className="w-full btn-primary py-3 rounded-xl text-white font-semibold"
              style={{ backgroundColor: THEME_COLORS[theme] }}
            >
              <Check className="w-4 h-4 mr-2" />保存
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">設定</h3>
              <button onClick={() => setShowSettings(false)}><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">テーマ</label>
              <div className="grid grid-cols-4 gap-2">
                {(["ocean", "forest", "sunset", "monochrome"] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`py-2 rounded-xl text-xs font-medium border-2 ${theme === t ? "border-gray-900" : "border-transparent"}`}
                    style={{ backgroundColor: THEME_COLORS[t] + "20", color: THEME_COLORS[t] }}
                  >
                    {t === "ocean" ? "Ocean" : t === "forest" ? "Forest" : t === "sunset" ? "Sunset" : "Mono"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">日付フォーマット</label>
              <select
                value={config.dateFormat}
                onChange={(e) => setConfig({ ...config, dateFormat: e.target.value as NamingConfig["dateFormat"] })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm"
              >
                <option value="YYYYMMDD">20260820</option>
                <option value="YYYY-MM-DD">2026-08-20</option>
                <option value="none">日付なし</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">区切り文字</label>
              <div className="grid grid-cols-3 gap-2">
                {(["_", "-", "space"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setConfig({ ...config, separator: s })}
                    className={`py-2 rounded-xl text-sm border-2 ${config.separator === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200"}`}
                  >
                    {s === "_" ? "下線 _" : s === "-" ? "ハイフン -" : "スペース"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">カテゴリ名を含める</span>
              <button
                onClick={() => setConfig({ ...config, includeCategory: !config.includeCategory })}
                className={`w-11 h-6 rounded-full transition-colors ${config.includeCategory ? "bg-gray-900" : "bg-gray-300"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${config.includeCategory ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm">金額を含める</span>
              <button
                onClick={() => setConfig({ ...config, includeAmount: !config.includeAmount })}
                className={`w-11 h-6 rounded-full transition-colors ${config.includeAmount ? "bg-gray-900" : "bg-gray-300"}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${config.includeAmount ? "translate-x-5" : "translate-x-0.5"}`} />
              </button>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full btn-primary py-3 rounded-xl text-white font-semibold"
              style={{ backgroundColor: THEME_COLORS[theme] }}
            >
              完了
            </button>
          </div>
        </div>
      )}

      {/* Pets Modal */}
      {showPets && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">ペット管理</h3>
              <button onClick={() => setShowPets(false)}><X className="w-5 h-5" /></button>
            </div>
            <PetManager pets={pets} setPets={setPets} theme={theme} />
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">履歴</h3>
              <button onClick={() => setShowHistory(false)}><X className="w-5 h-5" /></button>
            </div>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">まだ履歴がありません</p>
            ) : (
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    <span className="text-xl">
                      {h.category === "receipt" ? "🧾" : h.category === "pet" ? "🐕" : h.category === "food" ? "🍜" : h.category === "product" ? "👟" : h.category === "document" ? "📄" : "🖼️"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{h.suggestedFilename}</p>
                      <p className="text-xs text-gray-500">{h.categoryLabel} · 確信度{Math.round(h.confidence * 100)}%</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => { setHistory([]); storage.set("history", []); }}
                  className="w-full btn-primary py-2 text-sm text-red-600 bg-red-50 rounded-xl"
                >
                  <Trash2 className="w-4 h-4 mr-2" />履歴を削除
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// PetManager component
function PetManager({ pets, setPets, theme }: { pets: PetProfile[]; setPets: React.Dispatch<React.SetStateAction<PetProfile[]>>; theme: Theme }) {
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [desc, setDesc] = useState("");

  const addPet = () => {
    if (!name.trim()) return;
    const newPet: PetProfile = {
      id: crypto.randomUUID(),
      name: name.trim(),
      species: species.trim() || "不明",
      breedOrDescription: desc.trim(),
      registeredAt: new Date().toISOString(),
    };
    setPets((prev) => [...prev, newPet]);
    setName(""); setSpecies(""); setDesc("");
  };

  const removePet = (id: string) => setPets((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="名前（例: ポチ）" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        <input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="種類（例: 犬・柴犬）" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="特徴（例: 茶色の毛、小柄）" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" />
        <button onClick={addPet} className="w-full btn-primary py-2 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: THEME_COLORS[theme] }}>
          <Heart className="w-4 h-4 mr-2" />追加
        </button>
      </div>
      {pets.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">登録されたペットはありません</p>
      ) : (
        <div className="space-y-2">
          {pets.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-gray-500">{p.species} · {p.breedOrDescription}</p>
              </div>
              <button onClick={() => removePet(p.id)} className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
