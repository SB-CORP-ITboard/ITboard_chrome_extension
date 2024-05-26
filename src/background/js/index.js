import {
  historyEvent,
  postBatchDataEvent,
  requestTimeData,
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

  // リクエスト順序が取得できない場合の処置
  // ランダムなリクエストタイミングを保存
  chrome.storage.local.set({ randomIndex: con.randomIndex });
};

// 履歴情報取得(インストール時)
// ユーザーのリクエスト順序が割り振られていない場合は履歴取得をしない
const installEvent = () => {
  chrome.identity.getProfileUserInfo((user) => {
    if (user.email) {
      setUninstallUrl(user.email);
      chrome.storage.local.set({ randomIndex: con.randomIndex });

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
    if (user.email) {
      setUninstallUrl(user.email);
    }

    if (user.email && alarm.name == "start_batch") {

      chrome.storage.local.get([
        "requestIndex", "postTimestamp", "randomIndex",
        "beginHistoryEventTime", "endHistoryEventTime"
      ], (storage) => {
        const now = new Date();
        const nowHour = now.getHours();
        const nowDate = formatDate(now);
        const postHistoryDate = formatDate(new Date(storage.postTimestamp));

        // 本日分の履歴取得確認
        // 取得済みの場合は処理を抜ける
        if (postHistoryDate === nowDate) { return };

        // ユーザーのリクエスト順序が割り振られていない場合
        // リクエスト順序を取得して処理を終了する
        if (
          typeof storage.requestIndex === "undefined" ||
          typeof storage.beginHistoryEventTime === "undefined" ||
          typeof storage.endHistoryEventTime === "undefined"
        ) {
          getRequestIndex(user, storage, now);
          return;
        }

        // 取得した時間範囲内に実行する。それ以外は処理を抜ける
        if (
          !(storage.beginHistoryEventTime <= nowHour && nowHour <= storage.endHistoryEventTime)
        ) { return };

        // 各ユーザー割り振られた時間で実行
        const time = requestTimeData(
          storage.requestIndex,
          storage.beginHistoryEventTime,
          now
        );

        if (time.nowHours === time.requestHours && time.nowMinitue == time.requestMinutes) {
          // 月初に1回だけリクエスト時間を再設定する
          // 理由
          //   1. 各ユーザーのブラウザローカルストレージに時間配分の設定が保存されており、ローカルストレージデータから履歴送信タイミングをみている
          //   2. バックエンド側で履歴送信時間変更の反映をさせたい
          //   3. 毎日バックエンド側にデータを履歴送信時間のデータを取得するロジックだと、ユーザーの数だけリクエストしてしまい負荷が大きい
          //   4. 頻繁に履歴送信時間を変更することがない
          if (now.getDate() === 1) {
            postBatchDataEvent(user.email);
          };

          historyEvent(user.email);
        }
      });
    }
  });
};

// 履歴情報取得(ブラウザ起動時)
const startUpEvent = () => {
  chrome.storage.local.get([
    "postTimestamp", "beginHistoryEventTime", "endHistoryEventTime"
  ], (storage) => {
    // 履歴取得の時間帯がローカルストレージに存在しない場合は取得する
    if (
      typeof storage.beginHistoryEventTime === "undefined" ||
      typeof storage.endHistoryEventTime === "undefined"
    ) {
      postBatchDataEvent(user.email);
    }

    const now = new Date();
    const nowHour = now.getHours();

    // 履歴取得の時間帯のみ実行する。それ以外は処理を抜ける
    if (
      !(storage.beginHistoryEventTime <= nowHour && nowHour <= storage.endHistoryEventTime)
    ) { return };

    // 本日分の履歴取得確認
    // 既に履歴を送信している場合は処理を行わない
    const nowDate = formatDate(now);
    const postHistoryDate = formatDate(new Date(storage.postTimestamp));
    if (postHistoryDate !== nowDate) {
      chrome.identity.getProfileUserInfo((user) => {
        if (user.email) {
          const now = new Date();
          chrome.storage.local.set({ postTimestamp: now.getTime() });
          historyEvent(user.email);
        }
      });
    }
  })
}

// ユーザーのリクエスト順序が割り振られていない場合
//  └ リクエストの順序を取得する
//  └ リクエスト順序の取得のリクエストタイミングはランダム
//  └ リクエストの順序を取得できない場合に１分おきに実行されてしまうため、1日1回のみ実行とする
//    └ postBatchDataEvent後にpostTimestampをローカルストレージに保存
const getRequestIndex = (user, storage, now) => {
  if (typeof storage.randomIndex === "undefined") {
    chrome.storage.local.set({ randomIndex: con.randomIndex });
  } else {
    // ランダムな時間
    const beginHistoryEventTime = 9
    const time = requestTimeData(
      storage.randomIndex,
      beginHistoryEventTime,
      now
    );

    if (time.nowHours === time.requestHours && time.nowMinitue == time.requestMinutes) {
      postBatchDataEvent(user.email).then(value => {
        if (value === "undefined") {
          chrome.storage.local.set({ postTimestamp: now.getTime() });
        }
      });
    }
  }
};

// 拡張機能アンインストール時、GETリクエストでシャドーIT拡張機能に関連するデータを削除する。
const setUninstallUrl = (userEmail) => {
  chrome.runtime.setUninstallURL(
    con.getUninstallUrl + '?email=' + userEmail
  )
};
