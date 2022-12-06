import { con } from "./const.js";

// ユーザーのリクエストの順序を取得
export const postBatchDataEvent = async (email) => {
  const response = await fetch(con.postBatchDataUrl, {
    headers:{
      'Accept': 'application/json, */*',
      'Content-type':'application/json'
    },
    method: "POST",
    body: JSON.stringify({ email: email }),
  });

  if(response.ok){
    chrome.storage.local.set({ isMasterServiceUser: true });

    const data = await response.json();
    // 分割(distributeHour)
    //  1の場合: calcDistribute == 60分
    //  2の場合: calcDistribute == 120分
    const calcDistribute = data.distributeHour * 60;
    let requestIndex = data.requestIndex;

    // ９時に履歴取得開始
    // calcDistributeの値に応じてユーザーのリクエスト時間を配分
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
      chrome.storage.local.set({ requestIndex: requestIndex });
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
        chrome.storage.local.set({ requestIndex: requestIndex });
        return requestIndex;
      }
    }
  } else {
    chrome.storage.local.set({ isMasterServiceUser: false });
    return;
  }
};

// ブラウザ履歴取得
export const historyEvent = (email) => {
  const accessArray = [];

  chrome.history.search(con.searchQuery, (accessItems) => {
    for (let i = 0; i < accessItems.length; i++) {
      const accessObj = {};

      // クエリパラメータ除外
      accessObj["url"] = accessItems[i].url.replace(/\?.*$/, "");
      accessObj["title"] = accessItems[i].title;
      accessObj["accessCount"] = accessItems[i].visitCount;
      accessObj["lastAccessDate"] = accessItems[i].lastVisitTime;

      const accessData = accessObj;
      accessArray.push(accessData);
    }

    // 履歴データPOST
    fetch(con.postShadowItUrl, {
      headers:{
        'Accept': 'application/json, */*',
        'Content-type':'application/json'
      },
      method: "POST",
      body: JSON.stringify({email: email, data: accessArray}),
    });
  });
};


// YYYY/MM/DD形式に変換
export const formatDate = (date) => {
  if (date) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }
  return null;
};

export const requestTimeData = (requestIndex, now) => {
  const requestTime = new Date();
  const nowHours = now.getHours();
  const nowMinitue = now.getMinutes();
  const setRequestTime = requestTime.setHours(
    con.beginHistoryEventTime,
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