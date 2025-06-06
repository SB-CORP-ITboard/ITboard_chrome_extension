import {
  historyEvent,
  formatDate
} from "./common.js";
import { con } from "./const.js";

// 各タイミングで処理を行う
export const backgroundEvent = () => {
  // インストール時
  chrome.runtime.onInstalled.addListener(() => {
    installEvent();
  });

  // 新しいタブが開かれた時 or タブ内で画面遷移した時
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.active) {
      tabNavigationEvent();
    }
  });
};

// 履歴情報取得(インストール時)
const installEvent = () => {
  chrome.identity.getProfileUserInfo((user) => {
    if (user.email) {
      setUninstallUrl(user.email);
      const now = new Date();
      chrome.storage.local.set({ postTimestamp: now.getTime() });
      historyEvent(user.email);
    }
  });
}

// タブ内で遷移した時の処理
const tabNavigationEvent = () => {
  shouldSendHistory((shouldSend, user) => {
    if (shouldSend && user && user.email) {
      chrome.storage.local.get(["postTimestamp"], (storage) => {
        const now = new Date();
        chrome.storage.local.set({ postTimestamp: now.getTime() });
        // postTimestamp の値の型が null か undefined の場合は履歴を送信しない
        if (postTimestamp != null) {
          historyEvent(user.email, storage.postTimestamp);
        }
      })
    }
  });
};

// 履歴を送信すべきかどうかを判断する共通ロジック
const shouldSendHistory = (callback) => {
  chrome.identity.getProfileUserInfo((user) => {
    if (user.email) {
      setUninstallUrl(user.email);
    } else {
      callback(false, null);
      return;
    }

    chrome.storage.local.get(["postTimestamp"], (storage) => {
      const now = new Date();
      const nowDate = formatDate(now);
      const postHistoryDate = formatDate(new Date(storage.postTimestamp));

      // 本日分の履歴取得確認
      // 取得済みの場合は送信しない
      if (postHistoryDate === nowDate) {
        callback(false, user);
        return;
      }

      callback(true, user);
    });
  });
};

// 拡張機能アンインストール時、GETリクエストでシャドーIT拡張機能に関連するデータを削除する。
const setUninstallUrl = (userEmail) => {
  chrome.runtime.setUninstallURL(
    con.getUninstallUrl + '?email=' + userEmail
  )
};
