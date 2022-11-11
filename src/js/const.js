// 履歴取得実行定期間隔(分)
const TermExec = 1

// 履歴取得範囲(過去60日間)
const microsecondsPerDay = 1000 * 60 * 60 * 24 // １日
const date = 60
const searchStartTime = (new Date).getTime() - microsecondsPerDay * date

// 履歴取得条件
const SearchQuery = {
  text: '',
  startTime: searchStartTime,
  maxResults: 1000000
}

const BeginHistoryEventTime = 9
const EndHistoryEventTime = 23

// ローカル確認用
const PostBatchDataUrl =  'http://localhost:3000/v1/browser-extensions/distribute'
const PostShadowItUrl =  'http://localhost:3000/v1/browser-extensions/browsing_histories'

// STG確認用
// const PostBatchDataUrl =  'https://stg-01.itboard.jp/v1/browser-extensions/distribute'
// const PostShadowItUrl =  'https://stg-01.itboard.jp/v1/browser-extensions/browsing_histories'

// 本番用
// const PostBatchDataUrl =  'https://www.itboard.jp/v1/browser-extensions/distribute'
// const PostShadowItUrl =  'https://www.itboard.jp/v1/browser-extensions/browsing_histories'

const con = {
  termExec: TermExec,
  searchQuery: SearchQuery,
  beginHistoryEventTime: BeginHistoryEventTime,
  endHistoryEventTime: EndHistoryEventTime,
  postBatchDataUrl: PostBatchDataUrl,
  postShadowItUrl: PostShadowItUrl
}

Object.freeze(con);

export { con };