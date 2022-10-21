import { con } from "./const.js"

// 履歴取得
export const historyEvent = (email) => {
  const accessArray = []

  chrome.history.search(con.searchQuery, (accessItems) => {
    for (let i = 0; i < accessItems.length; i++) {
      const accessObj = {};

      // クエリパラメータ除外
      const formatUrl = accessItems[i].url.replace(/\?.*$/,"");
      accessObj[formatUrl] = accessItems[i].lastVisitTime;

      const accessData = JSON.stringify(accessObj)
      accessArray.push(accessData)
    }

    // 履歴データPOST
    const form = new FormData()
    form.append('urls', JSON.stringify(accessArray))
    form.append('email', email)

    fetch(con.postUrl, {
      method: 'POST',
      body: form
    });
  })
}