// 履歴取得範囲(過去60日間)
const MicrosecondsPerDay = 1000 * 60 * 60 * 24; // １日
const DateRange = 60;
const SearchStartTime = new Date().getTime() - MicrosecondsPerDay * DateRange;
const SearchCount = 1000000

// 履歴取得条件
const SearchQuery = {
  text: "",
  startTime: SearchStartTime,
  maxResults: SearchCount,
};

// リクエスト先
// ローカル確認用
const PostDistributeUrl =
  "http://localhost:3000/v1/browser-extensions/distribute";
const PostShadowItUrl =
  "http://localhost:3000/v1/browser-extensions/browsing-histories";
const PostHistoryLogUrl =
  "http://localhost:3000/v1/browser-extension-logs/history";
const PostErrorLogUrl =
  "http://localhost:3000/v1/browser-extension-logs";
const GetUninstallUrl =
  "http://localhost:3000/v1/browser-extensions/uninstall"

// STG確認用
// const PostDistributeUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/distribute'
// const PostShadowItUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/browsing-histories'
// const PostHistoryLogUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extension-logs/history'
// const PostErrorLogUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extension-logs'
// const GetUninstallUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/uninstall'

// 本番用
// const PostDistributeUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/distribute'
// const PostShadowItUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/browsing-histories'
// const PostHistoryLogUrl =
//   'https://www.itboard.jp/api/v1/browser-extension-logs/history'
// const PostErrorLogUrl =
//   'https://www.itboard.jp/api/v1/browser-extension-logs'
// const GetUninstallUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/uninstall'

const con = {
  dateRage: DateRange,
  searchQuery: SearchQuery,
  postShadowItUrl: PostShadowItUrl,
  postHistoryLogUrl: PostHistoryLogUrl,
  postErrorLogUrl: PostErrorLogUrl,
  getUninstallUrl: GetUninstallUrl,
};

Object.freeze(con);

export { con };
