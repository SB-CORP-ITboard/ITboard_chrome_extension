document.addEventListener('DOMContentLoaded', () => {

  chrome.identity.getProfileUserInfo((user) => {
    const el = document.createElement('div');

    chrome.storage.local.get("isMasterServiceUser", (storage) => {
      if([user.email.length] === 0){
        el.innerText = 'Chrome にログインしてください。'
        el.style.width = '190px'
      } else if(!(storage.isMasterServiceUser)) {
        el.innerText = `ユーザマスタに${user.email}が存在しません。\n 管理者に問い合わせてください。`
        el.style.width = '370px'
      } else{
        el.innerText = '正常に動作しています。'
        el.style.width = '140px'
      }
    })

    document.body.appendChild(el);
  })
})
