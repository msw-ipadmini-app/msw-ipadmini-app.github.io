# MSW 分割暗号化バックアップ統合候補（未公開・本番未反映）

作業日: 2026-10-30
ブランチ: `integration-kana-split-backup-prep-20261030`
起点: `integration-furigana-kana01-20261029`（承認済みフリガナ5列候補）
現在の公開 `main` と本番IndexedDB `mswdb_mvp01_clinical_v1` は変更禁止。

## 組み込み候補
- `split-format.js`: 既存MSWDB-BACKUP v2暗号化レコードを48MiB以下のパートへ分割。SHA-256・写真ID・順序・件数を照合。
- `split-export-bridge.js`: 患者索引・写真参照の検査、保存済み暗号レコードを一件ずつ読み出す。
- `split-export-ui.js`: 手動でパートごとにダウンロードし、最後に管理ファイルを保存。保存完了はiPad「ファイル」で実在確認する。
- `split-import-bridge.js`: 整合性・PIN・AES-GCM・写真を復号検証し、一時ステージの後に一括IndexedDBトランザクションで置換する。既存復元関数と同様、不要な住所・連絡先等の構造化項目を除外する。
- `split-import-ui.js`: 全ファイル選択と最終置換確認。

**注意:** これらのファイルは、あえて `index.html` には読み込ませていない。未検証の組み込み候補であり、本番動作・本番導入完了ではない。

## 実機で合格した範囲
- 2026-10-30 架空患者専用の別オリジンで、架空写真1枚を含む分割書出・3ファイル保存・PIN照合・復元・再ログイン・画像閲覧が合格。
- v03〜v07 の架空データ技術検証は合格。
- 136MiBの大容量架空データ分割試験v08を別テストリポジトリに実装。iPad miniでの実行結果は未確認。

## 導入前に必ず解決する点
1. iPad miniでの >120MiB 架空分割ハッシュ生成の実動作確認。
2. iPad miniでの >120MiB 架空写真レコードを対象とする **完全な保存・復元・写真表示** の検証（分割だけでは不十分）。
3. 復元中断/途中失敗で既存の保存済みデータが変わらないことと、ローカル空き容量・トランザクション限界の検証。
4. `index.html`、静的アセットSRI、`sw.js` キャッシュ・更新手順の整合。現行単体.mswdbバックアップも継続して使えること。
5. 分割バックアップの「保存確認済み」UIを旧.mswdbと区別し、実ファイルと管理ファイルの現物を必ず確認する運用。
6. 本番更新前に実患者情報を外部送信せず、iPad内の既存105.2MBバックアップを保護し、最新の完全バックアップを取得・検証する。

## 安全ルール
- 実患者情報・写真・PINのGitHub/チャット送信は禁止。
- 写真を削除・初期化・暗証を再設定しない。
- 本番公開 `main` に未検証ファイルを追加しない。
- 架空データで合格しても、そのまま本番導入合格とは見なさない。


## 2026-10-30 復元ファイル選択の共通検証部品（未公開）
- `split-file-selection.js` を新設し、`split-import-ui.js` のファイル選択判定を `MSWSplitFileSelection.add(files,selected)` に統一した。GitHubコミット: `3052e71e32534c6e0885041d80fdeddf954c21e1` / `2bb53538c4ed9e278ed7b7eb50d682abb98e77fd`。
- 同名ファイル、別run ID混在、ファイル形式不正、パート・管理ファイルのサイズ上限、不正なパート番号、空ファイルを拒否。拒否時は選択済みのMapを全消去（不完全セットで誤復元を進めない）。
- 実際の独立試験は `piimanbokumetsu-code/msw-v1010-test/split-selection-regression-20261030/` に共通部品そのものをコピー。Git blob SHAが同一であることを確認済み。iPad実行結果は未確認。
- **重要な読み込み依存:** 導入候補 `index.html` に配線する前に、`split-file-selection.js` を `split-import-ui.js` より先に読み込ませる。SRI/版パラメータと `sw.js` のキャッシュリストも同時更新する。このブランチの `index.html` と `sw.js` は現時点で未変更。
- ファイル名チェックは復元成功を保証しない。PIN認証・パートSHA-256・写真照合・安全な一括DBコミットは引き続き別段階で検証する。


## 2026-10-30 大容量実保存・読戻し合格を反映（本番統合は未実施）
- iPad mini Safariの独立架空試験 `piimanbokumetsu-code/msw-v1010-test/split-file-roundtrip-stage-20261030/?v=01` で約13MiB 4ファイル、約136MiB 14ファイルをそれぞれ「ファイル」アプリで実在確認。
- いずれも保存した全パートとmanifestを再選択し、SHA-256照合・架空写真ID照合・FAKE TESTのAES-GCM復号と画像表示をユーザーが合格確認。
- 約136MiBの13分割パートは**ダミー暗号文形式**を含み、実際に認証付き復号・画像表示したのは架空JPEG 1枚のみ。全130件のAES-GCM写真復号や既存患者DBへの完全復元は未検証。この点を合格基準と混同しない。
- 引き続き必要：本番候補の同一復元実装を用いた架空DBの全写真復号と一括トランザクション復元、保存容量・中断耐性、既存単体.mswdbとの両立、`index.html`/SRI/`sw.js` 配線とiPad実機確認。承認まで本番mainと実患者データを変更しない。


## 2026-10-30 安全修正と公開前の固定ゲート
- 未公開候補の `split-import-bridge.js` では **IndexedDBの置き換えコミット完了後** に画面更新／通知が失敗しても「元データは無変更」と誤案内しないよう、旧復号状態を先に破棄し `restored:true` と必要な `uiWarning` を返す設計に変更した（commit `3780ec268f57354149b2710e58c5af0633f0fbbf`）。
- `split-import-ui.js` は失敗時に無条件で「既存患者は変更なし」と表示しない（commit `26bafa960b9de968577a41e9b3c516805ccda631`）。実機試験はまだ。
- 独立架空試験v02 `https://piimanbokumetsu-code.github.io/msw-v1010-test/split-full-restore-isolated-20261030/?v=02` は候補の復元処理JSと同じblob SHAで7項目（正常復元・間違ったPIN・改ざん・写真AES-GCM・取り消し・コミット中断・コミット後画面エラー）を検証する。GitHub配置とJS構文は確認済みだが、iPad mini実行結果は未確認。
- **導入の残工程を固定**：①この実コードの独立安全試験合格→②未公開統合（`index.html`に形式／書出／選択／読込UIのJS配線、各SRIと`sw.js`キャッシュを正確に更新、旧単体`.mswdb`の動作を維持）→③iPad miniで統合候補の最終確認、ユーザー承認後に初めて本番公開を検討。必要性のない新試験を増やさない。
- 現時点でこのブランチの`index.html`と`sw.js`は変更していない。現行本番`main`と既存患者・写真・PIN・105.2MBバックアップは保護する。


## 2026-10-30 iPad 7/7合格後：未公開統合コードの配線完了
- 架空患者とAES-GCM写真2枚を用いた独立復元安全試験v03で、ユーザーがiPad mini実機 **7/7合格** を確認（2026-10-30）。正常復元、誤PIN・SHA改ざん・写真認証失敗、取り消し、トランザクション中断、復元後UI例外の全項目。既に合格した項目を繰り返さない。
- **未公開ブランチ上のみ** `index.html` に新JS6件を順番に接続：`split-format.js`→`split-export-bridge.js`→`split-import-bridge.js`→`split-file-selection.js`→`split-export-ui.js`→`split-import-ui.js`。全件SHA-384 SRIと固定版パラメータ `split-prep-20261030-integrated-v01` を付与（commit `3072596c48610a4eb8dde094d75ec752b3e709a8`）。
- 同ブランチ `sw.js` のオフラインキャッシュ一覧に6件を同じ固定版パラメータで追加し、キャッシュ名を改訂（commit `03c0207b9a30d2838b3beb49bd844bac4b542778`）。従来の単一`.mswdb`の書出・復元関連処理および既存RX/JOURNAL/印刷JSを変更せず残した。
- 静的再取得でJS構文、6件のindex/SRI/キャッシュ対応、各JSの読み込み順、旧単一バックアップの操作UI残存を確認。**ここまでの確認はGitHubコードの整合性であり、統合後アプリの起動・復元をiPad実機で検証したことにはならない。**
- 現行本番 `main` の `index.html` SHA `24aacb61e0f10c30db8099069b760a97af0d8fb8`、`sw.js` SHA `d9cb1596772118e3e6fb138724e574822344b1f9` を再取得し、未公開側と別であることを確認。**本番mainには変更を書き込んでいない。**
- 残る唯一の大工程：本番と別URL・別IndexedDBの統合候補をiPad miniで検証する。元アプリ約198KBを独立テスト環境へコピーするGitHub操作が接続の安全性チェックによりブロックされたため、独立統合テストURLは未完成。未検証のまま本番mainへ反映しない。GitHubで安全なテスト配置手段が整うまで、ユーザーに新たな試験操作は求めない。
- 本番患者データ・写真・暗証番号・既存105.2MBの`.mswdb`バックアップは未変更。既存の実機合格済み13MiB/136MiBファイルと7/7の検証は再度実施させない。


## 2026-10-30 最終安全点検：書出・復元UI相互排他 v02（**未公開**）
- iPad miniの独立架空統合UIでv03による分割復元完了・再ロック解除、v04による **FAKE A / FAKE B 2枚のAES-GCM復号画像表示**まで実機合格。これは別保存領域の小規模試験であり、本番統合後の全機能実機合格とは区別する。
- 本番組込候補の `split-export-ui.js` と `split-import-ui.js` の画面上の相互排他を修正。パート書出が開始されてから最後の管理ファイルの保存操作が完了するまで、新しい復元・旧単体書出/復元ボタンを無効化。復元実行（暗証入力・中止を含む）中は分割書出・旧単体書出/復元ボタンを無効化し、処理終了時に復帰。実データ保護の最終ゲートは既存の `beginMaintenance/endMaintenance` のまま維持。
- GitHubコミット: 書出UI `acfdeef3ca5a4cdd4a015efecb17934bcebcb1af`、復元UI `74a31af5787c0d89b5bf75e305e3ddf8457fd84e`。既存 `app.js` のsha `d47702a132ca2c8f1d609166cda4d72b2d3872fc` は変更前後同一。元の旧単体 `.mswdb` バックアップ/復元関数と設定画面のボタンは維持。
- `index.html` の新UI2件SHA-384 SRIを再計算（標準テストベクトルと既存split-format SRI照合済み）し、6件すべて `split-prep-20261030-integrated-v02` に更新。 `sw.js` の6件のキャッシュ参照を同名にそろえ、キャッシュ版を `20261030-kana01-split-prep-v02` へ更新。コミット `b2f71984ea740e63508c6ae8f86d67d20711a8f9`、`167b185d1f101c50e3bfd345e4c69636bed30f57`。
- 配線6/6と順序、全JS構文、旧単体画面/関数残存、PINを自動入力する架空診断コードが本番候補に無いことを確認。さらに実コードを模擬DOMと仮の処理に接続した動作テスト **7/7合格**（書出途中の排他・管理ファイル保留中の排他・完了後解除・復元途中の排他・中止後解除・PINダイアログ中止後解除など）。
- **未完了:** 実際の本番統合候補アプリのiPad mini実機起動・旧バックアップ共存の確認、iPadの本番データ保全を含む最終リリース承認。模擬テスト合格のみで本番反映してはいけない。mainは更新禁止。


## 2026-10-30 未公開候補：Safari強制終了後の復元一時データ整理（統合v03）
- 実患者の写真とは別キー `splitstage:<run>:<photoid>` に復元の検証済み暗号写真を一時保存する仕組み。従来は正常終了・通常エラー時の後始末しかなく、Safari強制終了時に古い `splitstage:` データが残ると次回復元で保存容量を圧迫する問題を確認した。
- **未公開** `split-import-bridge.js` を変更。新しい復元の開始時、従来の「今回run IDだけ削除」から、`splitstage:` に厳密に一致する前回の未完了一時レコードを全削除する方式へ変更。患者 `meta`、`data`、`photo:`、他の保存キーは削除対象外。通常の `finally` で今回の一時レコードを削除する既存処理と、写真復元の単一トランザクションは維持。commit `43abaeadc08a254f1ec868b91f0400c1ec95397a`。
- 本来の復元コードを、独立したメモリ上の模擬IndexedDB/暗号関数で実行して **4/4合格**：①確認中止時に前回の残留一時データを削除し元患者維持、②検証失敗時に削除し元患者維持、③2件目ステージ保存でQuotaExceededを模擬して新旧ステージのみ削除・元患者維持、④似た名前だが別キー `splitstage2:` は保護。**模擬試験でありiPadの実容量限界を保証しない。**
- 変更JSのSHA-384 SRIは標準テストベクトル `abc` と照合して再計算。新 `split-import-bridge.js` SRI `sha384-QDNehZFIICErWCZkzI7S3gXFKgGzxsL4McDKFuPfRYeSZjknc1YqJh7CoH/EP4OM`。index 6 JS参照/オフラインSW 6資産をともに `split-prep-20261030-integrated-v03` に更新、SWキャッシュ `20261030-kana01-split-prep-v03`。commits `b4cc5c8c0009734e64383412f2d2a2969856f8c9`、`755ef576cc99cbe5e70f80a17afdee40e257a840`。
- GitHub再取得で全6 JavaScript構文・参照順・SRI/キャッシュ対応6/6、旧 .mswdb ボタンと関数の残存、app.js SHA `d47702a132ca2c8f1d609166cda4d72b2d3872fc` 不変、本番 main の index SHA `24aacb61e0f10c30db8099069b760a97af0d8fb8` および SW SHA `d9cb1596772118e3e6fb138724e574822344b1f9` 不変を再確認。
- 未解決の公開条件：独立したURLとDBで**本番アプリ全体を動かす実機統合確認**を行えていない。元 app.js を隔離テストリポジトリへ複写する操作はGitHubコネクタ安全チェックにより以前ブロックされたため迂回しない。架空ミニUI試験の合格だけで、フル本番候補の起動・既存 .mswdb 共存・大容量完全復元・実患者データ保持が実機合格したとは扱わない。ユーザーの明示的な本番反映承認まで main/実患者保存領域に触れない。


## 2026-10-30 未公開候補：iPad自動ロックと分割書出し保留のデッドロック防止（統合v04）
- 問題発見：全アプリ `app.js` の `secureBackground()` はSafariの `visibilitychange:hidden` 時にプライバシー画面を表示し `lock(true)` を開始。 `lock()` は `maintenanceDone` を待つ。一方、分割書出UIは写真パートの手動保存操作待ちで `MSWExportBridge.run()` の `beginMaintenance` によるロックを保持するため、iPadの画面遷移によって**画面が隠れたまま書出し操作を続行できず、維持処理も終わらない**可能性があった。
- 対応：未公開 `split-export-ui.js` に `visibilitychange:hidden` と `pagehide` での明示的中断を追加。保留中の手動パート保存Promiseをrejectし、`MSWExportBridge.run` の `finally:endMaintenance()` を通るようにした。暗号処理中の非表示は `cancelRequested` フラグで次の書出段階を中断する。すでにiPadに保存した部分ファイルは削除しないが、不完全なので復元に使わないと明示する。患者を隠す既存の自動ロック設定と `app.js` は変更していない。commit `9e679646a87b44bd7790ff636ff08d7284bda2e9`。
- 現物 `split-export-ui.js` を模擬DOM/イベント/書出しブリッジへ接続した回帰試験 **6/6合格**（パート保留中hide、pagehide、manifest保留中hide、正常2ファイル書出、キャンセル後の新規開始、ダウンロードクリック中hideの中断扱い）。さらに既存 `app.js` から `beginMaintenance/endMaintenance` をそのまま抽出し、maintenanceDoneがactive中ロック待ち・end後に解除されることを確認。**実機でのvisibilitychangeとSafari保存UIの振る舞いは未確認**。
- 新JSのSHA-384 SRIは独立ハッシュ計算を標準 `abc` ベクトルおよび変更していない `split-format.js` の既存SRIと比較して検証。`split-export-ui.js` 新SRI `sha384-e/URJOYeYYni1wEuOm28e0dNflpTgFONcTSDx3ziQsiYIgxWDxeiq4h4AiMJ5d64`。index.htmlの6 JSとSWの6キャッシュ対象を `split-prep-20261030-integrated-v04` に統一、キャッシュ版 `20261030-kana01-split-prep-v04`。index commit `ce82c86ed4a4d21ca7ab7372f7a41d5f9fb05961`、SW commit `031cb1590141ea16ac9403f26b34ba7ece1a1797`。
- すべての6部品の参照/SRI/読み込み順/構文/キャッシュ対応が合格。既存の単体 `.mswdb` 書出/復元関数・UIは残存、`app.js` SHA `d47702a132ca2c8f1d609166cda4d72b2d3872fc` を維持。本番 `main` のindex SHA `24aacb61e0f10c30db8099069b760a97af0d8fb8`、SW SHA `d9cb1596772118e3e6fb138724e574822344b1f9` とも不変。
- **リリース禁止は継続。** 独立URL/独立DBのフル統合実機検証をまだ実施できず、原app.jsを外部テストリポジトリへ複写する操作は以前GitHubの安全チェックでブロックされた。迂回しない。本番main・実患者データ・PIN・既存105.2MBバックアップに触れない。前回までの合格試験を繰り返さない。
