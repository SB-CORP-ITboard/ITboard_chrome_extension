// ポップアップ表示
document.addEventListener('DOMContentLoaded', () => {
  chrome.identity.getProfileUserInfo(async (user) => {
    const el = document.createElement('div');

    if (user.email.length === 0) {
      patternBrowser(el)
    } else if (await checkMasterServiceUser(user)) {
      el.innerText = `ユーザマスタに${user.email}が存在しません。\n 管理者に問い合わせてください。`
      el.style.width = '370px'
    } else {
      el.innerText = '正常に動作しています。'
      el.style.width = '140px'
    }

    document.body.appendChild(el);
  })
})

// ブラウザ別に注記を変更
const patternBrowser = (el) => {
  const agent = window.navigator.userAgent.toLowerCase()

  if (agent.indexOf("edg") != -1) {
    el.innerText = 'Microsoft アカウントでサインインしてください。'
    el.style.width = '280px'
  } else {
    el.innerText = 'Google アカウントでログインしてください。'
    el.style.width = '260px'
  }
}

// ユーザーマスタの確認
const checkMasterServiceUser = async (user) => {
  const response = await fetch(postDistributeUrl, {
    headers:{
      'Accept': 'application/json, */*',
      'Content-type':'application/json'
    },
    method: "POST",
    body: JSON.stringify({ email: user.email }),
  });

  return !response.ok
}

// ローカル確認用
const postDistributeUrl =
  "http://localhost:3000/v1/browser-extensions/distribute";

// STG確認用
// const postDistributeUrl =
//   'https://stg-01.itboard.jp/v1/browser-extensions/distribute'

// 本番用
// const postDistributeUrl =
//   'https://www.itboard.jp/v1/browser-extensions/distribute'