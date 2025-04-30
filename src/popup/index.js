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

const popupEvent = () => {
  chrome.storage.local.get(["postTimestamp"], (storage) => {
    const now = new Date();
    const nowDate = popupFormatDate(now);
    const postHistoryDate = popupFormatDate(new Date(storage.postTimestamp));

    // 既に履歴を送信している場合は処理を行わない
    if (postHistoryDate !== nowDate) {
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
      // 履歴データ形成（Promiseで確実にデータを取得）
      const data = await popupFormatHistoryData(accessItems);

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
  const accessArray = [];

  const promises = accessItems.map(item => {
    return new Promise(resolve => {
      const urlObj = { url: item.url };

      chrome.history.getVisits(urlObj, (gettingVisits) => {
        let latestVisit = null;
        let latestTime = new Date(0);

        for (let n = 0; n < gettingVisits.length; n++) {
          const visitData = gettingVisits[n];
          const visitTime = new Date(visitData.visitTime);
          const now = new Date();
          const visitRange = new Date(now.setDate(now.getDate() - popupDateRange));

          // 指定期間(過去60日間)以内のデータのみ処理
          if (visitTime > visitRange) {
            if (visitTime > latestTime) {
              latestTime = visitTime;
              latestVisit = {
                url: item.url.replace(/\?.*$/, ""),
                title: item.title,
                lastAccessDate: visitTime
              };
            }
          }
        }

        if (latestVisit) {
          accessArray.push(latestVisit);
        }

        resolve();
      });
    });
  });

  await Promise.all(promises);

  return accessArray;
};

// ローカル確認用
const postDistributeUrl =
  "http://localhost:3000/v1/browser-extensions/distribute";
const postShadowItUrl =
  "http://localhost:3000/v1/browser-extensions/browsing-histories";

// STG確認用
// const postDistributeUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/distribute'
// const postShadowItUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/browsing-histories'

// 本番用
// const postDistributeUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/distribute'
// const postShadowItUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/browsing-histories'
