import { historyEvent } from './common.js'
import { batchDataEvent } from './common.js'
import { con } from './const.js'

// インストール時実行
chrome.runtime.onInstalled.addListener(() => {

  // ユーザー情報取得
  chrome.identity.getProfileUserInfo((user) => {
    if(user.email) {
      const now = new Date()
      chrome.storage.local.set({'postTimestamp': now.getTime()});
      batchDataEvent(user.email)
      historyEvent(user.email)
    }
  })
});

// 定期間隔設定
chrome.alarms.create('start_batch', { 'periodInMinutes': con.termExec });

// 定期実行
chrome.alarms.onAlarm.addListener((alarm) => {
  // ユーザー情報取得
  chrome.identity.getProfileUserInfo((user) => {

    if(user.email && alarm.name == 'start_batch') {
      chrome.storage.local.get(
        ['requestIndex', 'postTimestamp'], (storage) => {

        const now = new Date()
        const nowHour = now.getHours()
        const nowDate = formatDate(now)
        const localStorageDate = formatDate(new Date(storage.postTimestamp))

        // 本日分の履歴取得確認
        // 取得済みの場合は処理を抜ける
        if (localStorageDate !== nowDate) { return  }

        // 夜間バッチと重複しない時間帯で実行
        // 重複する時間は処理を抜ける
        if (!(con.beginHistoryEventTime < nowHour && nowHour < con.endHistoryEventTime)) {
          return
        }

        const requestTime = new Date()
        const nowMinitue = now.Minutes()
        const setRequestTime = requestTime.setHours(
          con.beginHistoryEventTime,
          storage.requestIndex,
          0
        )
        const requestHours = setRequestTime.Hours()
        const requestMinutes = setRequestTime.Minutes()

        // 各ユーザー割り振られた時間で実行
        if (nowHour === requestHours && nowMinitue == requestMinutes) {
          batchDataEvent(user.email)
          historyEvent(user.email)
        }
      });
    }
  })
});

// YYYY/MM/DD形式に変換
const formatDate = (date) => {
  if(date) {
    return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`
  }
  return null
}