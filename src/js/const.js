// 履歴取得定期間隔(分)
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

const GetBatchDataUrl =  "http://localhost:3000/v1/browsing_histories"
const PostShadowItUrl =  "http://localhost:3000/v1/browsing_histories"
// const PostUrl =  "http://localhost:3000/v1/devices"

const con = {
  termExec: TermExec,
  searchQuery: SearchQuery,
  beginHistoryEventTime: BeginHistoryEventTime,
  endHistoryEventTime: EndHistoryEventTime,
  getBatchDataUrl: GetBatchDataUrl,
  postShadowItUrl: PostShadowItUrl
}

Object.freeze(con);

export { con };