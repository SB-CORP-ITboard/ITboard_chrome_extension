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
### Microsoft Edge(Chromiumベースのみ対応)
1. Microsoft Edge の設定をクリック(ブラウザ右上)
2. 拡張機能をクリック
3. 拡張機能の管理をクリック
4. 開発者モードを ON
5. 展開して読み込みでITboard_chrome_extension ディレクトリを選択

---
## 難読化
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