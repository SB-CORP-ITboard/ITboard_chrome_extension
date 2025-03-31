import { con } from "./const.js";

// ブラウザ履歴取得
export const historyEvent = async (email) => {
  try {
    const browser = historyByBrowser();
    chrome.history.search(con.searchQuery, async (accessItems) => {
      // 履歴データ形成
      const data = await formatHistoryData(accessItems)

      // TODO: 非同期処理をしてもdataになぜか値がはいらない
      // setTimeoutで遅延させると成功する
      // ブラウザ起動時にsetTimeoutの秒数が短いとデータ形成ができずにエラーになるため5秒間とする
      setTimeout(() => {
        fetch(con.postShadowItUrl, {
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
      }, "5000")
    });
  } catch(e) { console.log(`${e} from historyEvent `) }
};

const formatHistoryData = async (accessItems) => {
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
        const visitRange = new Date(now.setDate(now.getDate() - con.dateRage))

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

// 履歴取得したブラウザを判別
const historyByBrowser = () => {
  const agent = navigator.userAgent.toLowerCase()
  if (agent.indexOf("edg") != -1) {
    return 'edge'
  } else {
    return 'chrome'
  }
};

// YYYY/MM/DD形式に変換
export const formatDate = (date) => {
  if (date) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }
  return null;
};

export const requestTimeData = (
  requestIndex,
  beginHistoryEventTime,
  now
) => {
  const requestTime = new Date();
  const nowHours = now.getHours();
  const nowMinitue = now.getMinutes();
  const setRequestTime = requestTime.setHours(
    beginHistoryEventTime,
    requestIndex,
    0
  );
  const fomatRequestTime = new Date(setRequestTime)
  const requestHours = fomatRequestTime.getHours();
  const requestMinutes = fomatRequestTime.getMinutes();

  return {
    nowHours,
    nowMinitue,
    requestHours,
    requestMinutes
  }
};