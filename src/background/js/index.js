import {
  historyEvent,
  postBatchDataEvent,
  requestTimeData,
  formatDate
} from "./common.js";
import { con } from "./const.js";

// 各タイミングで処理を行う
// インストール時
// 定期間隔
export const backgroundEvent = () => {
  chrome.runtime.onInstalled.addListener(() => {
    installEvent();
  });

  chrome.alarms.create("start_batch", { periodInMinutes: con.termExec });
  chrome.alarms.onAlarm.addListener((alarm) => {
    batchEvent(alarm);
  });

  // リクエスト順序が取得できない場合の処置
  // ランダムなリクエストタイミングを保存
  chrome.storage.local.set({ randomIndex: con.randomIndex });
};

// 履歴情報取得(インストール時)
// ユーザーのリクエスト順序が割り振られていない場合は履歴取得をしない
const installEvent = () => {
  chrome.identity.getProfileUserInfo((user) => {
    if (user.email) {
      postBatchDataEvent(user.email).then(value => {

        if (value !== "undefined") {
          const now = new Date();
          chrome.storage.local.set({ postTimestamp: now.getTime() });
          historyEvent(user.email);
        }

      });
    }
  });
}

// 履歴情報取得(定期)
const batchEvent = (alarm) => {
  chrome.identity.getProfileUserInfo((user) => {
    if (user.email && alarm.name == "start_batch") {

      chrome.storage.local.get([
        "requestIndex", "postTimestamp", "randomIndex"
      ], (storage) => {
        const now = new Date();
        const nowHour = now.getHours();
        const nowDate = formatDate(now);
        const postHistoryDate = formatDate(new Date(storage.postTimestamp));

        // 本日分の履歴取得確認
        // 取得済みの場合は処理を抜ける
        if (postHistoryDate === nowDate) { return };

        // 夜間バッチと重複しない時間帯で実行
        // 重複する時間は処理を抜ける
        if (
          !(con.beginHistoryEventTime <= nowHour && nowHour <= con.endHistoryEventTime)
        ) { return };

        // ユーザーのリクエスト順序が割り振られていない場合
        // リクエスト順序を取得して処理を終了する
        if (typeof storage.requestIndex === "undefined") {
          getRequestIndex(user, storage, now);
          return;
        }

        // 各ユーザー割り振られた時間で実行
        const time = requestTimeData(storage.requestIndex, now);
        if (time.nowHours === time.requestHours && time.nowMinitue == time.requestMinutes) {
          historyEvent(user.email);
        }
      });
    }
  });
};

// ユーザーのリクエスト順序が割り振られていない場合
//  └ リクエストの順序を取得する
//  └ リクエスト順序の取得のリクエストタイミングはランダム
//  └ リクエストの順序を取得できない場合に１分おきに実行されてしまうため、1日1回のみ実行とする
//    └ postBatchDataEvent後にpostTimestampをローカルストレージに保存
const getRequestIndex = (user, storage, now) => {
  if (typeof storage.randomIndex === "undefined") {
    chrome.storage.local.set({ randomIndex: con.randomIndex });
  } else {
    const time = requestTimeData(storage.randomIndex, now);

    if (time.nowHour === time.requestHours && time.nowMinitue == time.requestMinutes) {
      postBatchDataEvent(user.email).then(value => {
        if (value === "undefined") {
          chrome.storage.local.set({ postTimestamp: now.getTime() });
        }
      });
    }
  }
};
