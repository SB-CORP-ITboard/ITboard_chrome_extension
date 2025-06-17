import {
  postDeviceEvent,
  changeStorageEvent,
  historyEvent,
  formatDate,
  historyByBrowser,
  setStorageUpdateFlag
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

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "getOrCreateDeviceId") {
      (async () => {
        const deviceId = await postDeviceEvent(message.payload.email);
        sendResponse({ deviceId: deviceId });
      })();
      return true;
    }
    if (message.action === "updateTimestampAndHistoryEvent") {
      (async () => {
        try {
          setStorageUpdateFlag(true);
          await chrome.storage.local.set({ postTimestamp: message.payload.timestamp });
          await historyEvent(message.payload.email, message.payload.deviceId);
          sendResponse({ status: "success" });
        } catch (error) {
          setStorageUpdateFlag(false);
          sendResponse({ status: "error", message: error.message });
        }
      })();
      return true;
    }
  });
};

const installEvent = () => {
  chrome.identity.getProfileUserInfo(async (user) => {
    try {
      const now = new Date();

      setStorageUpdateFlag(true);
      await chrome.storage.local.set({ postTimestamp: now.getTime() });

      if (!user || !user.email) {
        throw new Error("[ITboard] email取得失敗");
      }

      const deviceId = await postDeviceEvent(user.email);

      if (!deviceId) {
        throw new Error("[ITboard] device_id 取得処理に失敗");
      }

      setUninstallUrl(user.email, deviceId);

      await historyEvent(user.email, deviceId);

      console.log("[ITboard] インストール時の履歴保存処理が完了");
    } catch (e) {
      setStorageUpdateFlag(false);
      console.error(`[ITboard] installEventの処理中にエラーが発生: ${e.message}`);
    }
  });
};

// タブ内で遷移した時の処理
const tabNavigationEvent = () => {
  shouldSendHistory(async (shouldSend, user, beforePostTimestamp) => {
    try {
      if (shouldSend && user && user.email && beforePostTimestamp) {

        const deviceId = await postDeviceEvent(user.email);
        if (!deviceId) {
          throw new Error("[ITboard] device_id 取得処理失敗");
        }

        setUninstallUrl(user.email, deviceId);

        const now = new Date();
        setStorageUpdateFlag(true);
        await chrome.storage.local.set({ postTimestamp: now.getTime() });

        await historyEvent(user.email, deviceId, beforePostTimestamp);

        console.log("[ITboard] タブ新規作成・画面遷移時の履歴保存処理が完了");
      }
    } catch (e) {
      setStorageUpdateFlag(false);
      console.error(`[ITboard] tabNavigationEventの処理中にエラーが発生: ${e.message}`);
    }
  });
};

// 履歴を送信すべきかどうかを判断する共通ロジック
const shouldSendHistory = (callback) => {
  chrome.identity.getProfileUserInfo((user) => {
    if (!user.email) {
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
const setUninstallUrl = async (email, deviceId) => {
  const params = {
    email,
    browser: historyByBrowser(),
    device_id: deviceId
  };

  const uninstallUrl = `${con.getUninstallUrl}?${new URLSearchParams(
    params,
  ).toString()}`;

  chrome.runtime.setUninstallURL(uninstallUrl);
};
