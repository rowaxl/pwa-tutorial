# Numbers

PWA用ServiceWorker管理ライブラリー、Workboxの動作確認のためのアプリケーションです。

## Installation

1. Supbaseのアカウントを作成する(任意。別APIを仕様する場合、`supabase.ts`内を修正してください)

2. `.env.local` ファイルを作成し、値を設定する

```
REACT_APP_API_URL= <default: SupabaseのProject URL>
REACT_APP_API_KEY= <default: SupabaseのAPI anon Key>
```

3. プロジェクトルートで`yarn install`コマンドでモジュールをインストール

4. プロジェクトルートで`yarn serve`コマンドでproductionモードを実行

5. (モバイルで試すには、vercel等にデプロイ)

## Feature

- Caching
  - Numbers一覧を取得後、ブラウザーのDevTool → Application → Service Workersでofflineにする
  - リロードし、以下を確認
    - ページが表示されること
    - GET リクエストが一度失敗して、`from service worker`でキャッシュされたレスポンスが取得されること
- Background Sync
  - Numbers一覧を取得後、ブラウザーのDevTool → Application → Service Workersでofflineにする（モバイルは、WIFIとモバイルデータをオフにする）
  - 新しい数字を入力し、Addボタンを押下する
  - PC
    - offline状態を解除し、リロードする
    - Applicationタブ → IndexedDB → workbox-background-syncテーブルができていること
    - workbox-background-syncテーブルに、リクエストのレコードがあること
    - Applicationタブ → Service Workersで、Syncタブに`workbox-background-sync:PATCH-que`を入力し、Syncボタンを押下する
    - Networkタブで、PATCHリクエストが実行されること
  - モバイル
    - WIFIとモバイルデータをオンにする
    - `Refresh`ボタンでリロードを実行する
    - 上記手順で入力した数字が表示されること
- インストールプロンプト(PC / Androidのみ)
  - `Install` ボタンを押下する
  - PWAをインストールするプロンプトが表示されること
- ローカルNotification(PC / Android)
  - ページ表示時、通知表示の許可が求められる
  - `許可する`を押下すると、画面に`Local Notification`ボタンが表示されること
  - `Local Notification`ボタンを押下すると、通知が表示されること
