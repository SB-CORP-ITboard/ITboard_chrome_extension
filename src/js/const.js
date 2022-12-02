// 履歴取得実行定期間隔(分)
const TermExec = 1;

// 履歴取得範囲(過去60日間)
const microsecondsPerDay = 1000 * 60 * 60 * 24; // １日
const date = 60;
const searchStartTime = new Date().getTime() - microsecondsPerDay * date;
const searchCount = 1000000

// 履歴取得条件
const SearchQuery = {
  text: "",
  startTime: searchStartTime,
  maxResults: searchCount,
};

// 業務時間内の範囲
const BeginHistoryEventTime = 9;
const EndHistoryEventTime = 18;

// ユーザリクエスト順序ができない場合のランダム値
const randomHour = 8;
const RandomIndex = Math.floor(Math.random()*((randomHour * 60)-0)+0);

// リクエスト先
// ローカル確認用
const PostDevelopmentBatchDataUrl =
  "http://localhost:3000/v1/browser-extensions/distribute";
const PostDevelopmentShadowItUrl =
  "http://localhost:3000/v1/browser-extensions/browsing-histories";

// STG確認用
// const PostStagingBatchDataUrl =
//   'https://stg-01.itboard.jp/v1/browser-extensions/distribute'
// const PostStagingShadowItUrl =
//   'https://stg-01.itboard.jp/v1/browser-extensions/browsing_histories'

// 本番用
// const PostProductionBatchDataUrl =
//   'https://www.itboard.jp/v1/browser-extensions/distribute'
// const PostProductionShadowItUrl =
//   'https://www.itboard.jp/v1/browser-extensions/browsing_histories'

const con = {
  termExec: TermExec,
  searchQuery: SearchQuery,
  beginHistoryEventTime: BeginHistoryEventTime,
  endHistoryEventTime: EndHistoryEventTime,
  randomIndex: RandomIndex,
  postBatchDataUrl: PostDevelopmentBatchDataUrl,
  postShadowItUrl: PostDevelopmentShadowItUrl,
};

Object.freeze(con);

export { con };
