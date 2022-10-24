document.addEventListener("DOMContentLoaded", () => {
  // GetHistoryイベントのクリックイベント設定
  let divs = document.querySelectorAll("#historyBotton")
  divs[0].addEventListener("click", historyEvent)
})

const historyEvent = () => {
  const ul = document.querySelector("#historyList")
  const searchText = document.querySelector("#searchText")

  const microsecondsPerDay = 1000 * 60 * 60 * 24
  const searchStartDate = (new Date).getTime() - microsecondsPerDay * 60

  const searchQuery = {
    text: searchText.value,
    startTime: searchStartDate,
    maxResults: 100000
  }

  // email取得
  chrome.identity.getProfileUserInfo((user) => {
    const accessArray = []
    // 履歴取得
    chrome.history.search(searchQuery, (accessItems) => {
      for (let i = 0; i < accessItems.length; i++) {
        const accessObj = {};
        const formatUrl = accessItems[i].url.replace(/\?.*$/,"");
        accessObj[formatUrl] = accessItems[i].lastVisitTime;

        const accessData = accessObj
        accessArray.push(accessData)
      }


      // 履歴データPOST
      const url = "http://localhost:3000"
      const subdir = "/v1/devices"
      const form = new FormData()
      form.append('urls', JSON.stringify(accessArray))
      form.append('email', user.email)

      fetch(`${url}${subdir}`, {
        method: 'POST',
        body: form
      });

      ul.innerHTML = `target: ${accessArray}`
    })

  })
}
