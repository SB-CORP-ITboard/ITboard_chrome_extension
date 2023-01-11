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

// ローカル確認用
const postDistributeUrl =
  "http://localhost:3000/v1/browser-extensions/distribute";

// STG確認用
// const postDistributeUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/distribute'

// 本番用
// const postDistributeUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/distribute'