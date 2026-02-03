# tmux-parallel-core

Claude Codeのためのサッカーチームスタイルのマルチエージェントオーケストレーションシステム。

## アーキテクチャ

```
ユーザー（ボス）
    │
    ▼ 指示
┌──────────────┐
│   ディレクター  │  ← 戦略的計画者（タスク分解、役割割り当て）
└──────┬───────┘
       │ YAML + send-keys
       ▼
┌──────────────┐
│   キャプテン   │  ← 調整者（指示の中継、進捗監視）
└──────┬───────┘
       │ YAML + send-keys
       ▼
┌───────┬───────┬───────┐
│プレイヤー1│プレイヤー2│プレイヤー3│  ← 実行者（実際の作業）
└───┬───┴───┬───┴───┬───┘
    │       │       │
    ▼       ▼       ▼
  タスク    タスク    タスク     ← サブエージェント（必要に応じてTaskツール経由）
  ツール    ツール    ツール
```

## クイックスタート

```bash
# 初期セットアップ
chmod +x init.sh start.sh
./init.sh

# 全エージェントの起動
./start.sh

# セッションへのアタッチ
tmux attach-session -t director   # 戦略的計画
tmux attach-session -t captain    # 調整
tmux attach-session -t players    # 実行
```

**📖 詳細なセットアップ手順については、[SETUP.md](SETUP.md)を参照してください**

## 通信フロー

1. **ユーザー → ディレクター**: ディレクターセッションでの直接入力
2. **ディレクター → キャプテン**: `queue/director_to_captain.yaml`に書き込み、その後send-keys
3. **キャプテン → プレイヤー**: `queue/captain_to_players/player{N}.yaml`に書き込み、その後send-keys
4. **プレイヤー → キャプテン**: タスク完了後にsend-keysで通知
5. **キャプテン → ディレクター**: `dashboard.md`を更新

### 重要：send-keysは2つの別々の呼び出しである必要があります！

```bash
# 間違い：結合（Enterが正しく解析されない）
tmux send-keys -t captain:0.0 'message' Enter

# 正しい：別々の呼び出し
tmux send-keys -t captain:0.0 'message'
tmux send-keys -t captain:0.0 Enter
```

## ディレクトリ構造

```
tmux-parallel-core/
├── start.sh                           # メイン起動スクリプト
├── init.sh                            # 初期セットアップ
├── SETUP.md                           # セットアップガイド
├── CODEOWNERS                         # コードレビュー責任範囲
├── dashboard.md                       # 進捗ダッシュボード
├── project/                           # 共有プロジェクトファイル
│
├── docs/                              # 包括的なドキュメント
│   ├── adr/                           # Architecture Decision Records
│   │   ├── ADR-000.md                 # ADR導入の決定
│   │   ├── ADR-001.md                 # マルチエージェントアーキテクチャ
│   │   ├── ADR-002.md                 # 9フェーズAI駆動開発フロー
│   │   ├── ADR-003.md                 # 品質ゲートとテストピラミッド
│   │   └── ADR_TEMPLATE.md            # ADRテンプレート
│   │
│   ├── PHASE_01_IDEA.md               # Phase 1: アイデア
│   ├── PHASE_02_INVESTIGATION.md       # Phase 2: 調査
│   ├── PHASE_03_DESIGN.md              # Phase 3: 設計
│   ├── PHASE_04_DESIGN_REVIEW.md       # Phase 4: 設計レビュー
│   ├── PHASE_05_TASK_BREAKDOWN.md      # Phase 5: タスク分解
│   ├── PHASE_06_DETAILED_DESIGN.md     # Phase 6: 詳細設計
│   ├── PHASE_07_DETAILED_DESIGN_REVIEW.md # Phase 7: 詳細設計レビュー
│   ├── PHASE_08_IMPLEMENTATION.md      # Phase 8: 実装
│   ├── PHASE_09_CODE_REVIEW.md         # Phase 9: コードレビュー
│   │
│   ├── AI_WORKFLOW.md                 # TDDワークフローガイド
│   ├── PROMPTING_GUIDE.md             # プロンプトデザインガイド
│   ├── QUALITY_GATES.md               # 品質基準
│   └── IMPLEMENTATION_ROADMAP.md      # 開発計画
│
├── director/
│   └── agents.md                      # ディレクターの指示
│
├── captain/
│   └── agents.md                      # キャプテンの指示
│
├── player1/
│   ├── agents.md                      # プレイヤー1の指示
│   ├── project -> ../project          # 共有プロジェクトへのシンボリックリンク
│   └── specs/                         # 設計ドキュメント
│
├── player2/
│   └── ...
│
├── player3/
│   └── ...
│
├── player4/
│   └── ...
│
├── player5/
│   └── ...
│
└── queue/
    ├── director_to_captain.yaml       # ディレクター → キャプテンへのコマンド
    └── captain_to_players/
        ├── player1.yaml               # キャプテン → プレイヤー1へのタスク
        ├── player2.yaml               # キャプテン → プレイヤー2へのタスク
        ├── player3.yaml               # キャプテン → プレイヤー3へのタスク
        ├── player4.yaml               # キャプテン → プレイヤー4へのタスク
        └── player5.yaml               # キャプテン → プレイヤー5へのタスク
```

## カスタマイズ

### プレイヤー数の変更

```bash
./start.sh -n 5   # 3の代わりに5人のプレイヤーを使用
```

### セットアップのみ（Claude Codeなし）

```bash
./start.sh -s     # セッションを作成、Claudeを手動で起動
```

### 指示の変更

各役割のディレクトリ内の`agents.md`ファイルを編集して、エージェントの動作をカスタマイズします。

## セッション参照

| 役割 | セッション | ペイン |
|------|-----------|-------|
| ディレクター | director | 0 |
| キャプテン | captain | 0 |
| プレイヤー1 | players | 0 |
| プレイヤー2 | players | 1 |
| プレイヤー3 | players | 2 |

## 重要な概念

### イベント駆動（ポーリングなし）

- 応答を待つためにループを使用しない
- 常にYAMLファイル + send-keys通知を使用する
- これによりAPIクレジットを節約

### 階層構造

- **ディレクター**: ユーザーのコマンドを受け取り、タスクを分解し、役割を割り当てる
- **キャプテン**: プレイヤーに指示を中継し、進捗を監視する
- **プレイヤー**: タスクを実行し、Taskツール経由でサブエージェントを生成できる

### サブエージェント（Taskツール）

プレイヤーはClaude CodeのTaskツールを使用して、以下のためにサブエージェントを生成できます：
- 複雑なサブタスク
- 並列独立作業
- コードレビュー
- テスト実行

### 競合状態の防止

- 各プレイヤーは専用のタスクファイルを持つ
- 2つのプレイヤーが同じファイルに書き込むことはない

## ドキュメント

AI駆動開発のための包括的なガイド：

### 9フェーズAI駆動開発フロー

- **[Phase 1: アイデア](docs/PHASE_01_IDEA.md)** - ユーザー要求の明確化と可視化
- **[Phase 2: 調査](docs/PHASE_02_INVESTIGATION.md)** - 外部依存の制約確認
- **[Phase 3: 設計](docs/PHASE_03_DESIGN.md)** - システム全体の設計決定
- **[Phase 4: 設計レビュー](docs/PHASE_04_DESIGN_REVIEW.md)** - 設計の妥当性検証
- **[Phase 5: タスク分解](docs/PHASE_05_TASK_BREAKDOWN.md)** - 並列作業可能な粒度に分割
- **[Phase 6: 詳細設計](docs/PHASE_06_DETAILED_DESIGN.md)** - 実装詳細の決定
- **[Phase 7: 詳細設計レビュー](docs/PHASE_07_DETAILED_DESIGN_REVIEW.md)** - ロジックの妥当性検証
- **[Phase 8: 実装](docs/PHASE_08_IMPLEMENTATION.md)** - コードの実装とテスト
- **[Phase 9: コードレビュー](docs/PHASE_09_CODE_REVIEW.md)** - コードの品質保証

### Architecture Decision Records (ADR)

- **[ADR-000: ADR導入の決定](docs/adr/ADR-000.md)** - ADRの採用
- **[ADR-001: マルチエージェントアーキテクチャ](docs/adr/ADR-001.md)** - 階層型マルチエージェントシステム
- **[ADR-002: 9フェーズAI駆動開発フロー](docs/adr/ADR-002.md)** - 開発プロセスの標準化
- **[ADR-003: 品質ゲートとテストピラミッド](docs/adr/ADR-003.md)** - 自動品質担保

### 開発ガイド

- **[セットアップガイド](SETUP.md)** - 完全なインストールとセットアップ手順
  - 前提条件とインストール
  - システムの起動と停止
  - 設定とカスタマイズ
  - トラブルシューティング
  - 最初のタスクの例

- **[AIワークフロー](docs/AI_WORKFLOW.md)** - 完全なAI駆動開発ワークフロー
  - TDDプロセス（RED-GREEN-REFACTOR）
  - 小規模PRの原則（<200行）
  - 品質検証手順
  - 通信プロトコル
  - ベストプラクティスとアンチパターン

- **[プロンプティングガイド](docs/PROMPTING_GUIDE.md)** - 効果的なプロンプトデザイン
  - 豊富なコンテキストの提供方法
  - 成功基準の指定
  - 例駆動のプロンプティング
  - 一般的な落とし穴と修正
  - 役割別プロンプトテンプレート

- **[品質ゲート](docs/QUALITY_GATES.md)** - コード品質基準
  - 必須の品質チェック（カバレッジ、リント、型）
  - コード品質基準（不変性、エラー処理）
  - テスト品質要件（AAAパターン、不安定なテストなし）
  - モニタリングとメトリクス
  - しきい値定義（Green/Yellow/Red）

- **[実装ロードマップ](docs/IMPLEMENTATION_ROADMAP.md)** - 今後の開発計画
  - フェーズごとの実装戦略
  - コア機能の自動化
  - テストインフラストラクチャ
  - CI/CD統合
  - 高度な機能（学習、自己修復）
  - 成功指標とタイムライン

- **[CODEOWNERS](CODEOWNERS)** - コードレビュー責任範囲
  - 各ファイル・ディレクトリのレビュー担当者
  - セキュリティ関連の承認プロセス
  - 緊急修正の手順
