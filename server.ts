import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: "25mb" }));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "x-sakana-api-key"],
}));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString(), service: "Auto Photo Namer - Sakana AI" });
});

// Sakana AI client initialization
const getSakanaClient = (apiKey: string) => {
  if (!apiKey || !apiKey.trim()) return null;
  return new OpenAI({
    apiKey,
    baseURL: "https://api.sakana.ai/v1",
  });
};

// Current JST date helpers
const getJSTDate = () => {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return {
    YYYYMMDD: `${y}${m}${d}`,
    "YYYY-MM-DD": `${y}-${m}-${d}`,
    year: y,
    month: m,
    day: d,
  };
};

// Analyze photo endpoint
app.post("/api/analyze-photo", async (req, res) => {
  try {
    const {
      imageBase64,
      mimeType = "image/jpeg",
      petProfiles = [],
      namingConfig,
      focusPoint,
      location,
      customApiKey,
    } = req.body;

    const headerKey = req.headers["x-sakana-api-key"] as string | undefined;
    const userApiKey = customApiKey || headerKey;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    const client = getSakanaClient(userApiKey);
    if (!client) {
      return res.status(400).json({
        error: "API_KEY_REQUIRED",
        message: "Sakana AI APIキーが設定されていません。右上の鍵アイコンからAPIキーを登録してください。",
      });
    }

    const cleanBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const today = getJSTDate();

    const petsContext = petProfiles.length > 0
      ? `登録済みのペット一覧:\n` +
        petProfiles
          .map((p: any) => `- ID: ${p.id}, 名前: ${p.name}, 種類: ${p.species}, 特徴: ${p.breedOrDescription}`)
          .join("\n")
      : "登録されたペットはありません。";

    const namingRulesText = namingConfig
      ? `命名ルール: 日付=${namingConfig.dateFormat}, 区切り="${namingConfig.separator}", カテゴリ含む=${namingConfig.includeCategory}, 金額含む=${namingConfig.includeAmount}`
      : `日付=${today.YYYYMMDD}`;

    const focusInstruction = focusPoint?.x !== undefined && focusPoint?.y !== undefined
      ? `\n\n【タップ指定位置への注目】\nユーザーは画像内の位置「左から${Math.round(focusPoint.x)}%、上から${Math.round(focusPoint.y)}%」をタップしました。この座標付近の被写体にフォーカスして命名してください。`
      : "";

    const locationInstruction = location?.latitude !== undefined
      ? `\n\n【位置情報】緯度=${location.latitude}, 経度=${location.longitude}` +
        (location.address ? `, 住所=${location.address}` : "") +
        (location.placeName ? `, 近隣店舗=${location.placeName}` : "")
      : "";

    const prompt = `あなたは高精度写真自動命名AIです。画像を解析し、最適なファイル名をJSONで出力してください。

本日日付(JST): ${today.YYYYMMDD} (${today.year}年${today.month}月${today.day}日)
領収書に日付がない場合は本日日付を使用してください。
${focusInstruction}${locationInstruction}
${namingRulesText}

【分類ルール】
1. food: 料理・グルメ・外食 → 「店舗名_料理名_日付.jpg」
2. receipt: 領収書・レシート → 「日付_店店舗名_領収書_金額.jpg」
3. pet: ペット・動物 → 登録済みなら名前を使用
4. product: 商品・物品 → 「ブランド_品名_色.jpg」
5. document: 書類・メモ → 「書類種別_日付.jpg」
6. other: 風景・その他 → 「場所_被写体.jpg」

${petsContext}

【命名要件】
- OS安全な文字のみ（記号は _ か - のみ）
- 拡張子は .jpg
- suggestedFilename（最推奨）+ alternativeNames（候補2つ以上）

【必須JSON形式】
{
  "category": "food|receipt|pet|product|document|other",
  "categoryLabel": "日本語カテゴリ",
  "detectedTitle": "主な対象名",
  "suggestedFilename": "ファイル名.jpg",
  "confidence": 0.0~1.0,
  "details": {
    "receiptStore": "",
    "receiptDate": "",
    "receiptAmount": "",
    "receiptTax": "",
    "receiptItems": [],
    "petName": "",
    "petBreed": "",
    "isKnownPet": false,
    "matchedPetId": "",
    "productCategory": "",
    "productBrand": "",
    "documentType": "",
    "documentSummary": "",
    "restaurantName": "",
    "foodDishName": "",
    "locationAddress": "",
    "summary": ""
  },
  "alternativeNames": ["候補1.jpg", "候補2.jpg"],
  "explanation": "判断理由"
}

余計な説明は不要。JSONのみ返してください。`;

    const response = await client.chat.completions.create({
      model: "fugu-ultra",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${cleanBase64}`,
              },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
      max_tokens: 2048,
    });

    const jsonText = response.choices[0]?.message?.content || "";
    if (!jsonText) {
      throw new Error("Empty AI response");
    }

    // Extract JSON from markdown code block if present
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    const cleanJson = jsonMatch ? jsonMatch[0] : jsonText;

    const result = JSON.parse(cleanJson);
    res.json(result);
  } catch (err: any) {
    console.error("Error analyzing photo:", err);
    res.status(500).json({
      error: "ANALYSIS_FAILED",
      message: `AI画像分析エラー: ${err.message || "モデル通信エラー"}`,
    });
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
