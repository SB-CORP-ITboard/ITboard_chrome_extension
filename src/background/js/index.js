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

  // 定期間隔
  chrome.alarms.create("start_batch", { periodInMinutes: con.termExec });
  chrome.alarms.onAlarm.addListener((alarm) => {
    batchEvent(alarm);
  });

  // ブラウザ起動時
  chrome.runtime.onStartup.addListener(() => {
    startUpEvent();
  })
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

// 履歴情報取得(定期)
const batchEvent = (alarm) => {
  chrome.identity.getProfileUserInfo((user) => {
    if (user.email) {
      setUninstallUrl(user.email);
    }

    if (user.email && alarm.name == "start_batch") {

      chrome.storage.local.get("postTimestamp", (storage) => {
        const now = new Date();
        const nowHour = now.getHours();
        const nowDate = formatDate(now);
        const postHistoryDate = formatDate(new Date(storage.postTimestamp));

        // 本日分の履歴取得確認
        // 既に履歴を送信している場合は処理を行わない
        if (postHistoryDate == nowDate) { return };

        // 取得した時間範囲内に実行する。それ以外は処理を抜ける
        if (con.beginHistoryEventTime <= nowHour && nowHour <= con.endHistoryEventTime) {
          chrome.storage.local.set({ postTimestamp: now.getTime() });
          historyEvent(user.email);
        }
      });
    }
  });
};

// 履歴情報取得(ブラウザ起動時)
const startUpEvent = () => {
  chrome.storage.local.get("postTimestamp", (storage) => {
    const now = new Date();
    const nowHour = now.getHours();
    const nowDate = formatDate(now);
    const postHistoryDate = formatDate(new Date(storage.postTimestamp));

    // 本日分の履歴取得確認
    // 既に履歴を送信している場合は処理を行わない
    if (postHistoryDate == nowDate) { return };

    // 取得した時間範囲内に実行する。それ以外は処理を抜ける
    if (con.beginHistoryEventTime <= nowHour && nowHour <= con.endHistoryEventTime) {
      chrome.identity.getProfileUserInfo((user) => {
        if (user.email) {
          setUninstallUrl(user.email);

          chrome.storage.local.set({ postTimestamp: now.getTime() });
          historyEvent(user.email);
        }
      });
    }
  })
}

// 拡張機能アンインストール時、GETリクエストでシャドーIT拡張機能に関連するデータを削除する。
const setUninstallUrl = (userEmail) => {
  chrome.runtime.setUninstallURL(
    con.getUninstallUrl + '?email=' + userEmail
  )
};
