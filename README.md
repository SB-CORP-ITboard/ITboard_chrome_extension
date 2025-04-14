# ITboard Chrome Extension
Chrome 閲覧履歴取得のブラウザ拡張機能

---
## 対象ブラウザ
```
・Google Chrome
・Chromiumベース Microsoft Edge
```
---

## ローカル環境確認手順
### Google Chrome
1. Google Chrome の設定をクリック(ブラウザ右上)
2. その他のツールをクリック
3. 拡張機能をクリック
4. デベロッパーモードを ON
5. パッケージ化されていない拡張機能を読み込むをクリック
6. ITboard_chrome_extension ディレクトリを選択
7. Chromeの右上に拡張機能のアイコンが存在するので、クリックしてITboaedを固定する
  * https://www.mochiya.ad.jp/blog/system-dev/detail/chrome_extensions_useful_of_2023#%E6%8B%A1%E5%BC%B5%E6%A9%9F%E8%83%BD%E3%81%AE%E7%AE%A1%E7%90%86
8. 固定したITboardのアイコンをクリックして動作を確認、エラーが出ていたら対応
  * 以下例
    1. ユーザマスタにhoge@gmail.comが存在しません。
    * 対応方法
      * hoge@gmail.comのユーザーが存在するサービスをユーザーマスタに設定する
    2. Google Workspaceアカウントでログインし、同期を有効にしてください。
    * 対応方法
      * https://support.google.com/chrome/answer/185277?hl=ja&co=GENIE.Platform%3DDesktop#zippy=%2C%E3%83%AD%E3%82%B0%E3%82%A4%E3%83%B3%E3%81%97%E3%81%A6%E5%90%8C%E6%9C%9F%E3%82%92%E3%82%AA%E3%83%B3%E3%81%AB%E3%81%99%E3%82%8B
9. jobディレクトリにてシャドーITのバッチを実行
  * 実行コマンド
```
$ docker compose run job rails daily_batch:shadow_it_detector
```
10. ITboardのシャドーIT一覧を確認する

### Microsoft Edge(Chromiumベースのみ対応)
1. Microsoft Edge の設定をクリック(ブラウザ右上)
2. 拡張機能をクリック
3. 拡張機能の管理をクリック
4. 開発者モードを ON
5. 展開して読み込みでITboard_chrome_extension ディレクトリを選択

## STG環境確認手順
1. ITboard_chrome_extensionソースコードの[STG確認用]の定数をすべてアンコメント
2. ITboard_chrome_extensionソースコードの[ローカル確認用]の定数をすべてコメントアウト
  * 手順1,2の対象ファイル
    * src/background/js/const.js
    * src/popup/index.js
3. ローカルの手順を行う
---
## 難読化(リリース時のみ実行)
### パッケージのインストール
```
npm install terser -g
```

### 対象ファイルの難読化コマンド
```bash
$ terser -c -m -o src/background/js/common.js -- src/background/js/common.js
$ terser -c -m -o src/background/js/const.js -- src/background/js/const.js
$ terser -c -m -o src/background/js/index.js -- src/background/js/index.js
$ terser -c -m -o src/background/js/wrapper.js -- src/background/js/wrapper.js
$ terser -c -m -o src/background/js/wrapper.js -- src/background/js/wrapper.js
$ terser -c -m -o src/popup/index.js -- src/popup/index.js
```

### 以下上記を全てまとめた難読化のコマンド
```
terser -c -m -o src/background/js/common.js -- src/background/js/common.js && terser -c -m -o src/background/js/const.js -- src/background/js/const.js && terser -c -m -o src/background/js/index.js -- src/background/js/index.js && terser -c -m -o src/background/js/wrapper.js -- src/background/js/wrapper.js && terser -c -m -o src/background/js/wrapper.js -- src/background/js/wrapper.js && terser -c -m -o src/popup/index.js -- src/popup/index.js
```

---
## リリース準備

### 以下の順序でリリース(zipファイル化)
1. manifest.jsonの versionを更新
  * 例: "0.0.1" → "0.0.2"
  * ※ 上記 manifest_versionではないです
2. versionを更新したのでgithubにあげる
3. manifest.json、host_permissions内の 「"http://localhost:3000/","https://stg-01.itboard.jp/"」を削除
4. リクエスト先を本番用に変更
  * background/js/const.jsの[PostDistributeUrl, PostShadowItUrl, GetUninstallUrl]
  * popup/index.jsの「postDistributeUrl, postShadowItUrl」
5. 難読化コマンドを実行
6. ITboard_chrome_extensionを圧縮(zip化)