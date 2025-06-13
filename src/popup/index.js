// 履歴取得範囲(過去60日間)
const popupMicrosecondsPerDay = 1000 * 60 * 60 * 24; // １日
const popupDateRange = 60;
const popupSearchStartTime = new Date().getTime() - popupMicrosecondsPerDay * popupDateRange;
const popupSearchCount = 1000000

// 履歴取得条件
const popupSearchQuery = {
  text: "",
  startTime: popupSearchStartTime,
  maxResults: popupSearchCount,
};

// ポップアップ表示
document.addEventListener('DOMContentLoaded', () => {
  chrome.identity.getProfileUserInfo(async (user) => {
    const el = document.createElement('div');

    if (user.email.length === 0) {
      addPopupByBrowser(el)
    } else if (await existsInUserMaster(user)) {
      el.innerText = `ユーザマスタに${user.email}が存在しません。\n 管理者に問い合わせてください。`
      el.style.width = '340px'
    } else {
      el.innerText = '正常に動作しています。'
      el.style.width = '140px'
      popupEvent();
    }

    document.body.appendChild(el);
  })
})

// ブラウザ別に注記を変更
const addPopupByBrowser = (el) => {
  const agent = window.navigator.userAgent.toLowerCase()

  if (agent.indexOf("edg") != -1) {
    el.innerText = 'Microsoftアカウントでサインインし、同期を有効にしてください。'
    el.style.width = '220px'
  } else {
    el.innerText = 'Google Workspaceアカウントでログインし、同期を有効にしてください。'
    el.style.width = '260px'
  }
}

// ユーザーマスタの確認
const existsInUserMaster = async (user) => {
  try {
    const response = await fetch(postDistributeUrl, {
      headers:{
        'Accept': 'application/json, */*',
        'Content-type':'application/json'
      },
      method: "POST",
      body: JSON.stringify({ email: user.email }),
    })
    return !response.ok
  } catch(e) { console.log(`${e} from existsInUserMaster `) }
}

const popupEvent = async () => {
  try {
    const storage = await chrome.storage.local.get(["postTimestamp"]);

    const now = new Date();
    const nowDate = popupFormatDate(now);
    const postHistoryDate = popupFormatDate(new Date(storage.postTimestamp));

    if (postHistoryDate === nowDate) { return }

    const user = await chrome.identity.getProfileUserInfo();

    if (!user || !user.email) { return }

    const deviceId = await popupPostDeviceEvent(user.email);
    if (!deviceId) {
      throw new Error("device_idの取得に失敗しました。");
    }

    const response = await chrome.runtime.sendMessage({
      action: "updateTimestampAndHistoryEvent",
      payload: {
        email: user.email,
        deviceId: deviceId,
        timestamp: now.getTime()
      }
    });

    console.log('Service Workerからの応答:', response?.status);

  } catch (error) {
    console.error(`Popup処理中にエラーが発生: ${error.message}`);
  }
};

// YYYY/MM/DD形式に変換
const popupFormatDate = (date) => {
  if (date) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }
  return null;
};

// 履歴取得したブラウザを判別
const popupHistoryByBrowser = () => {
  const agent = navigator.userAgent.toLowerCase()
  if (agent.indexOf("edg") != -1) {
    return 'edge'
  } else {
    return 'chrome'
  }
};

const popupPostDeviceEvent = async (email) => {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getOrCreateDeviceId",
      payload: { email }
    });
    if (!response || !response.deviceId) {
      throw new Error("Service Workerから有効なdeviceIdが返されませんでした。");
    }

    return response.deviceId;

  } catch (error) {
    console.error(`[ITboard] device_idの取得に失敗しました: ${error.message}`);
    return null;
  }
};

// ローカル確認用
const postDistributeUrl =
  "http://localhost:3000/v1/browser-extensions/distribute";

// STG確認用
// const postDistributeUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/distribute'

// 本番用
// const postDistributeUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/distribute'
