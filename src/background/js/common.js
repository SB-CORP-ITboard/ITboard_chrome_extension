import { con } from "./const.js";

// ユーザーのリクエストの順序を取得
export const postBatchDataEvent = async (email) => {
  try {
    const response = await fetch(con.postDistributeUrl, {
      headers:{
        'Accept': 'application/json, */*',
        'Content-type':'application/json'
      },
      method: "POST",
      body: JSON.stringify({ email: email }),
    });

    if (response.ok) {
      const data = await response.json();

      const calcDistribute = (data.endHistoryEventTime - data.beginHistoryEventTime) * 60;
      let requestIndex = data.requestIndex;

      // calcDistributeの値に応じてユーザーのリクエスト時間を配分
      //
      // case1
      //   requestIndex: 10, calcDistribute: 60
      //    └ 9:10にリクエスト
      // case2
      //   requestIndex: 90, calcDistribute: 60
      //    └ 9:30にリクエスト
      // case3
      //   requestIndex: 90, calcDistribute: 120
      //    └ 10:30にリクエスト
      // case4
      //   requestIndex: 280, calcDistribute: 120
      //    └ 9:40にリクエスト

      // requestIndexがcalcDistributeより少ない場合 (case1とcase3)
      // そのままrequestIndexを保存
      let num = requestIndex / calcDistribute;

      if (num < 1) {
        chrome.storage.local.set({
          requestIndex: requestIndex,
          beginHistoryEventTime: data.beginHistoryEventTime,
          endHistoryEventTime: data.endHistoryEventTime
        });
        return requestIndex;
      }

      // requestIndexがcalcDistributeより多い場合 (case2とcase4)
      // requestIndex値を減算し、calcDistributeとの徐算結果が1以下の場合に保存
      // 下記case4の場合
      //  1回目の処理:
      //   └ 280 - 120 = 160
      //   └ 160 / 120 = 1.3
      //  2回目の処理:
      //   └ 160 - 120 = 40
      //   └ 40 / 120 = 0.3 → 40を保存
      while (num < 1) {
        requestIndex -= calcDistribute;
        num = requestIndex / calcDistribute;
        if (num < 1) {
          chrome.storage.local.set({
            requestIndex: requestIndex,
            beginHistoryEventTime: data.beginHistoryEventTime,
            endHistoryEventTime: data.endHistoryEventTime
          });
          return requestIndex;
        }
      }
    };
  } catch(e) { console.log(`${e} from postBatchDataEvent `) }
};

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