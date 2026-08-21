# Auto Photo Namer - Sakana AI Edition

Sakana AI Fugu Ultra を活用した、写真の自動命名 Web/PWA アプリケーションです。

## 機能概要

- 写真をアップロードすると AI が内容を解析し、最適なファイル名を自動生成
- レシート OCR（店名・日付・金額抽出）
- ペット個体識別・名前学習
- 商品・食品・書類のテゴリ自動判定
- タップ位置で被写体指定命名
- 命名ルールのカスタマイズ（日付形式・区切り文字）
- 4種類のテーマ切り替え
- PWA 対応（スマホホーム画面に追加可能）

## 技術スタック

- フロントエンド: React 18, Vite, TypeScript, Tailwind CSS, Lucide React
- バックエンド: Node.js, Express
- AI エンジン: Sakana AI Fugu Ultra (OpenAI互換API)
- デプロイ: Render (推奨)

## ローカル開発

```bash
git clone <repository>
cd auto-photo-namer-sakana
npm install
npm run dev
```

ブラウザで `http://localhost:3000` を開き、Sakana AI API キーを登録してください。

## Render へのデプロイ

1. [Render](https://render.com) にログイン
2. New + → Web Service → 本リポジトリを選択
3. 設定:
   - Language: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Instance Type: Free
4. Create Web Service

## API キーの取得

[Sakana AI Console](https://console.sakana.ai) で API キーを取得してくださ。

## 注意事項

- Sakana AI API は有料サービスです。利用料金はご自身で管理してください。
- 写真の分析には画像データが API に送信されます。

## ライセンス

MIT
