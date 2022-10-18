document.addEventListener('DOMContentLoaded', () => {
  // SEARCHイベントのクリックイベント設定
  let divs = document.querySelectorAll('#searchBotton')
  divs[0] = divs[0].addEventListener('click', searchClickEvent)

  // POSTイベントのクリックイベント設定
  divs = document.querySelectorAll('#postBotton')
  divs[0] = divs[0].addEventListener('click', postClickEvent)
})

const accessArray = []

// SEARCHクリックイベント
const searchClickEvent = () => {
  const ul = document.querySelector('#historyList')
  const searchText = document.querySelector('#searchText')

  // 60日間(2ヶ月前)
  const microsecondsPerDay = 1000 * 60 * 60 * 24
  const searchStartDate = (new Date).getTime() - microsecondsPerDay * 60

  const searchQuery = {
    text: searchText.value,
    startTime: searchStartDate,
    maxResults: 100000
  }

  // 履歴取得
  chrome.history.search(searchQuery, (accessItems) => {
    // 履歴の数だけループし、検索結果を表示する
    for (let i = 0; i < accessItems.length; i++) {
      const accessObj = {};
      accessObj[accessItems[i].url] = accessItems[i].lastVisitTime;

      const accessData = JSON.stringify(accessObj)
      accessArray.push(accessData)
    }

    ul.innerHTML = `target: ${accessArray}`
  })
}

// POSTクリックイベント
const postClickEvent = () =>  {
  const url = 'http://localhost:3000'
  // ここのサブディレクトリを変更でローカルで確認可
  const subdir = '/v1/hoge'
  const xhr = new XMLHttpRequest();

  xhr.open('POST', `${url}${subdir}`);
  xhr.setRequestHeader('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
  xhr.send(`urls=${accessArray}`);
}
