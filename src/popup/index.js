// 履歴取得可能時間(時)
const popupBeginHistoryEventTime = 6
const popupEndHistoryEventTime = 23

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
    } else if (await checkMasterUser(user.email)) {
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
const checkMasterUser = async (email) => {
  try {
    const url = new URL(checkMasterUserUrl);
    url.searchParams.append('email', email);

    const response = await fetch(url.href, {
      headers:{
        'Accept': 'application/json, */*',
      },
      method: "GET"
    });
    return !response.ok
  } catch(e) { console.log(`${e} from existsInUserMaster `) }
}

const popupEvent = () => {
  debugger
  chrome.storage.local.get("postTimestamp", (storage) => {
    const now = new Date();
    const nowHour = now.getHours();
    const nowDate = popupFormatDate(now);
    const postHistoryDate = popupFormatDate(new Date(storage.postTimestamp));

    // 本日分の履歴取得確認
    // 既に履歴を送信している場合は処理を行わない
    if (postHistoryDate == nowDate) { return };

    // 履歴取得の時間帯のみ実行する。それ以外は処理を抜ける
    if (popupBeginHistoryEventTime <= nowHour && nowHour <= popupEndHistoryEventTime) {
      chrome.identity.getProfileUserInfo((user) => {
        if (user.email) {
          chrome.storage.local.set({ postTimestamp: now.getTime() });
          popupHistoryEvent(user.email);
        }
      });
    }
  })
}

// YYYY/MM/DD形式に変換
const popupFormatDate = (date) => {
  if (date) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }
  return null;
};

// ブラウザ履歴取得
const popupHistoryEvent = async (email) => {
  try {
    const browser = popupHistoryByBrowser();
    chrome.history.search(popupSearchQuery, async (accessItems) => {
      // 履歴データ形成
      const data = await popupFormatHistoryData(accessItems)

      // TODO: 非同期処理をしてもdataになぜか値がはいらない
      // setTimeoutで遅延させると成功する
      // ポップアップ: 0.1秒間
      // ブラウザ起動時: 5秒間
      setTimeout(() => {
        fetch(postShadowItUrl, {
          headers:{
            'Accept': 'application/json, */*',
            'Content-type':'application/json'
          },
          method: "POST",
          body: JSON.stringify({
            email: email,
            browser: browser,
            data: data
          }),
        });
      }, "100")
    });
  } catch(e) { console.log(`${e} from popupHistoryEvent `) }
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


const popupFormatHistoryData = async (accessItems) => {
  const accessArray = []

  for (let i = 0; i < accessItems.length; i++) {
    const urlObj = { url: accessItems[i].url }

    // history.searchのvisitCountが指定期間(過去60日間)の範囲の利用回数ではないため、
    // getVisitsを使用し、指定期間の範囲ではないデータは除外したデータを形成する
    chrome.history.getVisits(urlObj, (gettingVisits) => {
      const accessObj = {};

      for (let n = 0; n < gettingVisits.length; n++) {
        const visitData = gettingVisits[n]
        const visitTime = new Date(visitData.visitTime)
        const now = new Date()
        const visitRange = new Date(now.setDate(now.getDate() - popupDateRange))

        // ログイン日時が指定期間(過去60日間)以内ではない場合は形成しない
        if (visitTime > visitRange) {
          accessObj["url"] = accessItems[i].url.replace(/\?.*$/, "");
          accessObj["title"] = accessItems[i].title;
          accessObj["lastAccessDate"] = visitTime;

          accessArray.push(accessObj);
        }
      }
    });
  }
  return accessArray
}

// ローカル確認用
const checkMasterUserUrl =
  "http://localhost:3000/v1/browser-extensions/check-master-user";
const postShadowItUrl =
  "http://localhost:3000/v1/browser-extensions/browsing-histories";

// STG確認用
// const checkMasterUserUrl =
//   "http://localhost:3000/v1/browser-extensions/check-master-user";
// const postShadowItUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/browsing-histories'

// 本番用
// const checkMasterUserUrl =
  // "http://localhost:3000/v1/browser-extensions/check-master-user";
// const postShadowItUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/browsing-histories'