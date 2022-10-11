
document.addEventListener('DOMContentLoaded', () => {
  // SEARCHイベントのクリックイベント設定
  let divs = document.querySelectorAll('#searchBotton')
  divs[0] = divs[0].addEventListener('click', searchClickEvent)

  // POSTイベントのクリックイベント設定
  divs = document.querySelectorAll('#postBotton')
  divs[0] = divs[0].addEventListener('click', postClickEvent)
})

let accessData = ''

// SEARCHクリックイベント
const searchClickEvent = () =>  {
  const ul = document.querySelector('#historyList')
  const searchText = document.querySelector('#searchText')
  const microsecondsPerDay = 1000 * 60 * 60 * 24
  // とりあえず過去20年を対象
  const searchStartDate = (new Date).getTime() - microsecondsPerDay * 365 * 20

  // TODO:startTime, endTimeをテキストボックスから指定
  const searchQuery = {
    text: searchText.value,
    startTime: searchStartDate,
    maxResults: 10000
  }
  const hoge = chrome.extension.getURL('src/js/gmail.js');
  console.log(hoge)


  const accessArray = []
  const regDomain = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img

  // 履歴取得
  chrome.history.search(searchQuery, function (accessItems) {
    // 履歴の数だけループし、検索結果を表示する
    for (let i = 0; i < accessItems.length; i++) {
      const domain = accessItems[i].url.match(regDomain)
      accessArray.push(domain)
    }

    var accessObj = {};
    for (let i = 0; i < accessArray.length; i++) {
      var domain = accessArray[i];
      accessObj[domain] = (accessObj[domain] || 0) + 1;
    }
    accessData = JSON.stringify(Object.entries(accessObj).map(([key, value]) => ({[key]: value})))
    ul.innerHTML = `target: ${accessData}`
  })
}

// POSTクリックイベント
const postClickEvent = () =>  {
  // accessArray.forEach(function (url) {
  //   // Json成形してPOST
  // })
}