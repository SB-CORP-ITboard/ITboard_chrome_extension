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

const popupHistoryEvent = async (email) => {
  try {
    const browser = popupHistoryByBrowser();
    chrome.history.search(popupSearchQuery, async (accessItems) => {
      try {
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
        })
        .catch(error => {
          sendErrorLog(
            'popupHistoryEvent_fetch',
            `Failed to send history data: ${error.message}`,
            error.stack
          );
        });

        popupHistoryLogEvent(email);
      } catch (searchError) {
        sendErrorLog(
          'popupHistoryEvent_searchCallback',
          `Error in popup history search callback: ${searchError.message}`,
          searchError.stack
        );
      }
    });
  } catch(e) {
    console.log(`${e} from popupHistoryEvent`);
    sendErrorLog('popupHistoryEvent', `Error in popupHistoryEvent: ${e.message}`, e.stack);
  }
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

// UUIDを生成する関数
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let osName = "Unknown";
  let osVersion = "";
  let browserVersion = "";

  if (ua.indexOf("Windows") !== -1) {
    osName = "Windows";
    const match = ua.match(/Windows NT (\d+\.\d+)/);
    if (match) osVersion = match[1];
  } else if (ua.indexOf("Mac") !== -1) {
    osName = "MacOS";
    const match = ua.match(/Mac OS X (\d+[._]\d+[._]?\d*)/);
    if (match) osVersion = match[1].replace(/_/g, '.');
  } else if (ua.indexOf("Linux") !== -1) {
    osName = "Linux";
  }

  if (ua.indexOf("Edg") !== -1) {
    const match = ua.match(/Edg\/(\d+\.\d+\.\d+\.\d+)/);
    if (match) browserVersion = match[1];
  } else if (ua.indexOf("Chrome") !== -1) {
    const match = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/);
    if (match) browserVersion = match[1];
  }

  return {
    os: osName,
    osVersion: osVersion,
    browserVersion: browserVersion,
    language: navigator.language,
    platform: navigator.platform
  };
};

const sendErrorLog = (functionName, errorMessage, errorStack, level = "error") => {
  try {
    chrome.identity.getProfileUserInfo((user) => {
      if (!user || !user.email) {
        console.error("[ITboard] ユーザー情報が取得できませんでした");
        return;
      }

      const browser = popupHistoryByBrowser();
      const timestamp = new Date().toISOString();

      // 送信データの作成
      const errorData = {
        email: user.email,
        browser: browser,
        data: {
          function: functionName,
          message: errorMessage,
          stack: errorStack || "",
          timestamp: timestamp
        },
        level: level
      };

      fetch(postErrorLogUrl, {
        headers: {
          'Accept': 'application/json, */*',
          'Content-type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify(errorData)
      })
      .then(response => {
        if (response.ok) {
          console.log(`[ITboard] エラーログ送信成功: ${functionName}`);
        } else {
          console.error(`[ITboard] エラーログ送信失敗: ${response.status}`);
        }
      })
      .catch(err => {
        console.error(`[ITboard] エラーログ送信中に例外が発生: ${err}`);
      });
    });
  } catch (e) {
    console.error(`[ITboard] sendErrorLog内で例外が発生: ${e}`);
  }
};

const popupHistoryLogEvent = async (email) => {
  try {
    const browser = popupHistoryByBrowser();
    const sendId = generateUUID();
    const timestamp = new Date().toISOString();
    const manifest = chrome.runtime.getManifest();
    const deviceInfo = getDeviceInfo();

    chrome.history.search(popupSearchQuery, async (accessItems) => {
      try {
        const data = await popupFormatHistoryData(accessItems);

        const sendData = {
          email: email,
          browser: browser,
          data: data,
          metadata: {
            sendId: sendId,
            timestamp: timestamp,
            clientVersion: manifest.version,
            extensionId: chrome.runtime.id,
            deviceInfo: deviceInfo
          },
          status: {
            sendStatus: "initial",
            dataCount: data.length,
            compressed: false
          }
        };

        fetch(postHistoryLogUrl, {
          headers: {
            'Accept': 'application/json, */*',
            'Content-type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify(sendData)
        })
        .then(response => {
          if (response.ok) {
            return response.text().then(text => {
              let result = {};
              try {
                if (text) result = JSON.parse(text);
              } catch (e) {
                console.log('Response is not JSON:', text);
              }
              return result;
            });
          } else {
            throw new Error(`HTTP error: ${response.status}`);
          }
        })
        .then(result => {
          console.log('History log success:', result);
        })
        .catch(error => {
          console.error('History log error:', error);

          sendErrorLog(
            'popupHistoryLogEvent_fetch',
            `Failed to send history log: ${error.message}`,
            error.stack
          );
        });
      } catch (searchError) {
        sendErrorLog(
          'popupHistoryLogEvent_searchCallback',
          `Error in popup history log search callback: ${searchError.message}`,
          searchError.stack
        );
      }
    });
  } catch (e) {
    console.error(`${e} from popupHistoryLogEvent`);
    sendErrorLog('popupHistoryLogEvent', `Error in popupHistoryLogEvent: ${e.message}`, e.stack);
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
const postHistoryLogUrl =
  "http://localhost:3000/v1/browser-extension-logs/history";
const postErrorLogUrl =
  "http://localhost:3000/v1/browser-extension-logs";

// STG確認用
// const postDistributeUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/distribute'
// const postShadowItUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/browsing-histories'
// const postHistoryLogUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extension-logs/history'
// const postErrorLogUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extension-logs'

// 本番用
// const postDistributeUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/distribute'
// const postShadowItUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/browsing-histories'
// const postHistoryLogUrl =
//   'https://www.itboard.jp/api/v1/browser-extension-logs/history'
// const postErrorLogUrl =
//   'https://www.itboard.jp/api/v1/browser-extension-logs'
