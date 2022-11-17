# ITboard Chrome Extension

Chrome 閲覧履歴取得のブラウザ拡張機能

# ローカル環境確認手順

1. Google Chrome の設定をクリック(ブラウザ右上)
2. その他のツールをクリック
3. 拡張機能をクリック
4. デベロッパーモードを ON
5. パッケージ化されていない拡張機能を読み込むをクリック
6. ITboard_chrome_extension ディレクトリを選択

# リリース前に以下実行し難読化

```npm install terser -g```

```terser -c -m -o src/js/background.js -- src/js/background.js && terser -c -m -o src/js/background-wrapper.js -- src/js/background-wrapper.js && terser -c -m -o src/js/common.js -- src/js/common.js && terser -c -m -o src/js/const.js -- src/js/const.js```