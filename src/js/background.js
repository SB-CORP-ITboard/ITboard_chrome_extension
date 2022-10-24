import { historyEvent } from "./common.js"
import { con } from "./const.js"

// インストール時のイベント
chrome.runtime.onInstalled.addListener(() => {

  // ユーザー情報取得
  chrome.identity.getProfileUserInfo((user) => {
    if(user.email) {
      const now = new Date()
      chrome.storage.local.set({'postTimestamp': now.getTime()});
      historyEvent(user.email)
    }
  })
});

// 定期間隔設定
chrome.alarms.create("start_batch", { "periodInMinutes": con.termExec });

// 定期実行
chrome.alarms.onAlarm.addListener((alarm) => {
  // ユーザー情報取得
  chrome.identity.getProfileUserInfo((user) => {

    if(user.email && alarm.name == "start_batch") {
      chrome.storage.local.get("postTimestamp", (storage) => {
        const now = new Date()
        const nowHour = now.getHours()
        const nowDate = formatDate(now)
        const localStorageDate = formatDate(new Date(storage.postTimestamp))

        // 本日分の履歴取得確認(取得済みの場合は処理を抜ける)
        if (localStorageDate !== nowDate) { return  }

        // 夜間バッチと重複しない時間帯で実行
        if (9 < nowHour && nowHour < 23) {
          chrome.storage.local.set({'postTimestamp': now.getTime()});
          historyEvent(user.email)
        }
      });
    }
  })
});

const formatDate = (date) => {
  if(date) {
    return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`
  }
  return null
}
