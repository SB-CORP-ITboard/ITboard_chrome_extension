import { con } from "./const.js";

let isStorageUpdate = false;
export const setStorageUpdateFlag = (value) => {
  isInternalUpdate = value;
};

export const historyEvent = async (email, deviceId, beforePostTimestamp = undefined) => {
  try {
    const browser = historyByBrowser();
    const searchQuery = {
      ...con.searchQuery,
      startTime: beforePostTimestamp || con.searchQuery.startTime
    };
    chrome.history.search(searchQuery, async (accessItems) => {
      try {
        // 履歴データ形成（Promiseで確実にデータを取得）
        const data = await formatHistoryData(accessItems);

        fetch(con.postShadowItUrl, {
          headers:{
            'Accept': 'application/json, */*',
            'Content-type':'application/json'
          },
          method: "POST",
          body: JSON.stringify({
            email: email,
            browser: browser,
            deviceId: deviceId,
            data: data
          }),
        })
        .catch(error => {
          sendErrorLog(
            'historyEvent_fetch',
            `Failed to send history data: ${error.message}`,
            error.stack
          );
        });

        historyLogEvent(email, data);
      } catch (searchError) {
        sendErrorLog(
          'historyEvent_searchCallback',
          `Error in historyEvent search callback: ${searchError.message}`,
          searchError.stack
        );
      }
    });
  } catch(e) {
    console.log(`${e} from historyEvent`);
    sendErrorLog('historyEvent', `Error in historyEvent: ${e.message}`, e.stack);
  }
};

const formatHistoryData = async (accessItems) => {
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
          const visitRange = new Date(now.setDate(now.getDate() - con.dateRange));

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

// 履歴取得したブラウザを判別
export const historyByBrowser = () => {
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

// YYYY/MM/DD形式に変換
export const formatDate = (date) => {
  if (date) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
  }
  return null;
};

export const sendErrorLog = (functionName, errorMessage, errorStack, level = "error") => {
  try {
    chrome.identity.getProfileUserInfo((user) => {
      if (!user || !user.email) {
        console.error("[ITboard] ユーザー情報が取得できませんでした");
        return;
      }

      const browser = historyByBrowser();
      const timestamp = new Date().toISOString();

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

      fetch(con.postErrorLogUrl, {
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

export const historyLogEvent = async (email, preloadedData) => {
  try {
    const browser = historyByBrowser();
    const sendId = generateUUID();
    const timestamp = new Date().toISOString();
    const manifest = chrome.runtime.getManifest();
    const deviceInfo = getDeviceInfo();

    const data = preloadedData;
    sendHistoryLogData(email, browser, data, sendId, timestamp, manifest, deviceInfo);
  } catch (e) {
    console.log(`${e} from historyLogEvent`);
    sendErrorLog('historyLogEvent', `Error in historyLogEvent: ${e.message}`, e.stack);
  }
};

const sendHistoryLogData = (email, browser, data, sendId, timestamp, manifest, deviceInfo) => {
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

  chrome.storage.local.set({
    historyLogSending: {
      sendId: sendId,
      timestamp: timestamp,
      itemCount: data.length
    }
  });

  fetch(con.postHistoryLogUrl, {
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
    chrome.storage.local.set({
      historyLogResult: {
        sendId: sendId,
        timestamp: timestamp,
        status: "success",
        fileId: result.fileId || sendId,
        responseTime: new Date().toISOString()
      }
    });
  })
  .catch(error => {
    chrome.storage.local.set({
      historyLogError: {
        sendId: sendId,
        timestamp: timestamp,
        error: error.toString(),
        errorTime: new Date().toISOString()
      }
    });

    sendErrorLog(
      'historyLogEvent_fetch',
      `Failed to send history log: ${error.message}`,
      error.stack
    );
  });
};

export const postDeviceEvent = async (email) => {
  try {
    const storage = await chrome.storage.local.get('device_id');

    if (storage.device_id) {
      return storage.device_id;
    }

    const browser = historyByBrowser();

    const data = await postDevice(email, browser);
    const deviceId = data.device_id;

    if (!deviceId) {
      throw new Error(`[ITboard] device_id がレスポンスに含まれていません`);
    }

    setStorageUpdateFlag(true);
    await chrome.storage.local.set({ device_id: deviceId });

    return deviceId;

  } catch (e) {
    setStorageUpdateFlag(false);
    console.error(`[ITboard] postDeviceEventでエラーが発生: ${e.message}`);
    return null;
  }
};

const postDevice = async (email, browser) => {
  const response = await fetch(con.deviceUrl, {
    headers:{
      'Accept': 'application/json, */*',
      'Content-type':'application/json'
    },
    method: 'POST',
    body: JSON.stringify({ email, browser }),
  });

  if (!response.ok) {
    throw new Error(`[ITboard] device 作成リクエスト失敗: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

export const changeStorageEvent = (changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }

  if (!changes.device_id && !changes.postTimestamp) {
    return;
  }

  chrome.identity.getProfileUserInfo(async (user) => {
    try {
      if (user.email) {
        const browser = historyByBrowser();
        // device_id が変更された場合の処理
        if (changes.device_id) {
          const { oldValue, newValue } = changes.device_id;

          if (oldValue !== newValue) {
            const device = await getDevice(oldValue, user.email, browser);

            if (device && device.device_id) {
              setStorageUpdateFlag(true);
              await chrome.storage.local.set({ device_id: device.device_id });
              console.log(`[ITboard] device_id を再設定: ${device.device_id}`);
            } else {
              throw new Error('[ITboard] レスポンスから device_id を取得失敗');
            }
          }
        }

        // postTimestamp が変更された場合の処理
        if (changes.postTimestamp) {
          const { oldValue, newValue } = changes.postTimestamp;

          if (oldValue !== newValue) {
            const storage = await chrome.storage.local.get('device_id');
            const deviceId = storage.device_id;

            if (!deviceId) {
              throw new Error('[ITboard] ローカルストレージからdevice_id 取得失敗');
            }

            const device = await getDevice(deviceId, user.email, browser);

            if (device && device.last_request_at) {
              setStorageUpdateFlag(true);
              await chrome.storage.local.set({ postTimestamp: device.last_request_at });
              console.log(`[ITboard] postTimestamp を再設定: ${device.last_request_at}`);
            } else {
              throw new Error('[ITboard] レスポンスから last_request_at を取得失敗');
            }
          }
        }
      }
    } catch (e) {
      setStorageUpdateFlag(false);
      console.error(e.message);
    }
  });
};

const getDevice = async (deviceId, email, browser) => {
  debugger
  try {
    const params = new URLSearchParams({
      device_id: deviceId,
      email: email,
      browser: browser,
    });

    const url = `${con.deviceUrl}?${params.toString()}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
    });

    if (!response.ok) {
      throw new Error(`[ITboard] device 取得リクエスト失敗: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (e) {
    console.error(e.message);
    return null;
  }
};