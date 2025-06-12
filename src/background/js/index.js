import {
  postDeviceEvent,
  changeStorageEvent,
  historyEvent,
  formatDate,
  historyByBrowser
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

  chrome.storage.onChanged.addListener((changes, areaName) => {
    changeStorageEvent(changes, areaName)
  });
};

// 履歴情報取得(インストール時)
const installEvent = () => {
  chrome.identity.getProfileUserInfo(async (user) => {
    if (user.email) {
      setUninstallUrl(user.email);

      const deviceId = await postDeviceEvent(user.email);

      if (!deviceId) {
        console.error("[ITboard] device_id 取得処理失敗");
        return;
      }

      const now = new Date();
      chrome.storage.local.set({ postTimestamp: now.getTime() });
      historyEvent(user.email, deviceId);
    }
  });
}

// タブ内で遷移した時の処理
const tabNavigationEvent = () => {
  shouldSendHistory(async (shouldSend, user, beforePostTimestamp) => {
    if (shouldSend && user && user.email && beforePostTimestamp) {
      const deviceId = await postDeviceEvent(user.email);

      if (!deviceId) {
        console.error("[ITboard] device_id 取得処理失敗");
        return;
      }

      const now = new Date();
      chrome.storage.local.set({ postTimestamp: now.getTime() });
      historyEvent(user.email, deviceId, beforePostTimestamp);
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
        callback(false, user, undefined);
        return;
      }

      // postTimestamp が「存在しない」or「値が null か undefined」の場合は送信しない
      if (storage.postTimestamp == null) {
        callback(false, user, undefined);
        return;
      }

      callback(true, user, storage.postTimestamp);
    });
  });
};

// 拡張機能アンインストール時、GETリクエストでシャドーIT拡張機能に関連するデータを削除する。
const setUninstallUrl = (email) => {
  const uninstallUrl = `${con.getUninstallUrl}?${new URLSearchParams({
    email,
    browser: historyByBrowser()
  }).toString()}`;

  chrome.runtime.setUninstallURL(uninstallUrl);
};
