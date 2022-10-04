let historyArray = []

document.addEventListener('DOMContentLoaded', function () {

  // SEARCHイベントのクリックイベント設定
  let divs = document.querySelectorAll('#searchBotton')
  divs[0] = divs[0].addEventListener('click', searchClickEvent)

  // POSTイベントのクリックイベント設定
  divs = document.querySelectorAll('#postBotton')
  divs[0] = divs[0].addEventListener('click', postClickEvent)

})

// SEARCHクリックイベント
function searchClickEvent(e) {
  let ul = document.querySelector('#historyList')
  let searchText = document.querySelector('#searchText')
  let html = ''
  let microsecondsPerDay = 1000 * 60 * 60 * 24
  // とりあえず過去20年を対象
  let searchStartDate = (new Date).getTime() - microsecondsPerDay * 365 * 20

  // TODO:startTime, endTimeをテキストボックスから指定
  let searchQuery = {
    text: searchText.value,
    startTime: searchStartDate,
    maxResults: 10000
  }

  historyArray = []

  // 履歴取得
  chrome.history.search(searchQuery, function (historyItems) {
    let cnt = 0
    // 履歴の数だけループし、検索結果を表示する
    historyItems.forEach(function (historyItem) {
      cnt++
      historyArray.push(historyItem.url)
      html += '<li><a href="' + historyItem.url + '" target="_blank">' + cnt + ':' + historyItem.title + '<br>' + historyItem.url + '</a></li>'
    })
    ul.innerHTML = 'target:' + cnt + html
  })
}

// POSTクリックイベント
function postClickEvent(e) {
  historyArray.forEach(function (url) {
    // Json成形してPOST
  })
}