// 履歴取得実行定期間隔(分)
const TermExec = 1;

// 履歴取得可能時間(時)
const BeginHistoryEventTime = 6
const EndHistoryEventTime = 23

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
const PostShadowItUrl =
  "http://localhost:3000/v1/browser-extensions/browsing-histories";
const GetUninstallUrl =
  "http://localhost:3000/v1/browser-extensions/uninstall"

// STG確認用
// const PostShadowItUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/browsing-histories'
// const GetUninstallUrl =
//   'https://stg-01.itboard.jp/api/v1/browser-extensions/uninstall'

// 本番用
// const PostShadowItUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/browsing-histories'
// const GetUninstallUrl =
//   'https://www.itboard.jp/api/v1/browser-extensions/uninstall'

const con = {
  termExec: TermExec,
  beginHistoryEventTime: BeginHistoryEventTime,
  endHistoryEventTime: EndHistoryEventTime,
  dateRage: DateRange,
  searchQuery: SearchQuery,
  postShadowItUrl: PostShadowItUrl,
  getUninstallUrl: GetUninstallUrl,
};

Object.freeze(con);

export { con };
