// ========================================
// 環境設定
// ========================================
const CONFIG = {
    // ★★★ ここを切り替えるだけで本番/開発モードを変更 ★★★
    DEV_MODE: false,
    
    // 本番APIのURL
    API_BASE_URL: 'https://5moouwqlbi.execute-api.ap-northeast-1.amazonaws.com/prod',
    
    // ログイン画面をスキップするか（DEV_MODE時のみ有効）
    SKIP_LOGIN: false,
    
    // モック遅延（ms）- APIのレスポンス遅延をシミュレート（DEV_MODE時のみ有効）
    MOCK_DELAY: 300
};