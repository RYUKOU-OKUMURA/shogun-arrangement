# セットアップガイド

tmux-parallel-coreマルチエージェントシステムの完全なセットアップ手順。

## 前提条件

tmux-parallel-coreをインストールする前に、以下のものがあることを確認してください。

### 必須

- **tmux** 3.0以降
  ```bash
  # macOS
  brew install tmux

  # Ubuntu/Debian
  sudo apt-get install tmux

  # バージョン確認
  tmux -V
  ```

- **Claude Code CLI**
  ```bash
  # npm経由でインストール
  npm install -g @anthropic-ai/claude-code

  # またはhomebrew経由（macOS）
  brew install anthropic-ai/tap/claude-code

  # インストール確認
  claude --version
  ```

- **Git**（バージョン管理用）
  ```bash
  git --version
  ```

### 推奨（必須ではない）

- **Node.js** 18以上（サンプルプロジェクトの実行用）
- **TypeScript**（型チェック用）
- **ESLint**（リント用）
- **Jest** または **Vitest**（テスト用）

## インストール

### ステップ1：クローンまたはダウンロード

```bash
# リポジトリがある場合
cd /path/to/shogun-arrangement/tmux-parallel-core

# またはゼロから作成
mkdir -p ~/projects/tmux-parallel-core
cd ~/projects/tmux-parallel-core
```

### ステップ2：スクリプトに実行権限を付与

```bash
chmod +x init.sh start.sh
```

### ステップ3：ディレクトリ構造を初期化

```bash
./init.sh
```

これにより以下が作成されます：
```
tmux-parallel-core/
├── queue/
│   ├── director_to_captain.yaml
│   └── captain_to_players/
│       ├── player1.yaml
│       ├── player2.yaml
│       └── player3.yaml
├── director/specs/
├── captain/specs/
├── player1/
│   ├── project -> ../project
│   └── specs/
├── player2/
│   ├── project -> ../project
│   └── specs/
├── player3/
│   ├── project -> ../project
│   └── specs/
└── project/
```

### ステップ4：Claude Codeを設定

Claude Codeが認証されていることを確認してください：

```bash
# Claudeにログイン
claude login

# 認証を確認
claude auth status
```

## システムの起動

### 基本的な起動

```bash
./start.sh
```

これにより3つのtmuxセッションが作成されます：
- **director** - 戦略的計画
- **captain** - 調整と監視
- **players** - 実行（3つのペイン：player1, player2, player3）

### カスタムプレイヤー数で起動

```bash```bash
_
```
./start.sh -n 5  # 3の代わりに5人のプレイヤーを使用
```

### セットアップのみモード（Claudeの手動起動）

```bash
./start.sh -s  # Claudeを起動せずにセッションを作成
```

その後、各ペインで手動でClaudeを起動します：
```bash
# 各tmuxペインで
claude
```

## セッションへのアタッチ

### 全セッションの表示

```bash
tmux list-sessions
```

期待される出力：
```
director: 1 windows (created Fri Jan 31 10:00:00 2026)
captain: 1 windows (created Fri Jan 31 10:00:00 2026)
players: 1 windows (created Fri Jan 31 10:00:00 2026)
```

### 特定のセッションにアタッチ

```bash
# ディレクターにアタッチ（戦略的計画）
tmux attach-session -t director

# キャプテンにアタッチ（調整）
tmux attach-session -t captain

# プレイヤーにアタッチ（実行）
tmux attach-session -t players
```

### セッションからのデタッチ

tmuxセッション内で、以下を押します：
```
Ctrl+b、その後d
```

## 設定

### プレイヤー数のカスタマイズ

`start.sh`を編集します：
```bash
# この行を見つける
NUM_PLAYERS=${1:-3}

# デフォルトを3から希望の数に変更
NUM_PLAYERS=${1:-5}
```

### エージェント指示のカスタマイズ

`agents.md`ファイルを編集します：

- **ディレクター**: `director/agents.md`
- **キャプテン**: `captain/agents.md`
- **プレイヤー**: `player1/agents.md`、`player2/agents.md`、`player3/agents.md`

### プロジェクトファイルの追加

実際のプロジェクトを`project/`ディレクトリに配置します：

```bash
cd project/

# 例：Node.jsプロジェクトを初期化
npm init -y
npm install --save-dev typescript jest @types/jest

# ソースディレクトリの作成
mkdir -p src/__tests__
```

すべてのプレイヤーはシンボリックリンク経由でこの共有プロジェクトにアクセスします：
- `player1/project` → `../project`
- `player2/project` → `../project`
- `player3/project` → `../project`

## 最初のタスクの例

### 1. ディレクターにアタッチ

```bash
tmux attach-session -t director
```

### 2. ディレクターにタスクを与える

ディレクターセッションで入力：
```
TypeScriptでシンプルな計算機関数を実装してください

要件：
- 関数：add(a: number, b: number): number
- テストファースト（TDD）
- 80%のテストカバレッジ
- Jestを使用してテスト
```

### 3. ディレクターがタスクを分解して割り当て

ディレクターがタスクを作成し、`queue/director_to_captain.yaml`に書き込みます：
```yaml
command:
  id: cmd_001
  description: "計算機関数を実装"
  type: feature
  tdd_required: true

  subtasks:
    - id: subtask_001
      description: "add関数のテストを書く"
      assigned_to: player1
      type: test

    - id: subtask_002
      description: "add関数を実装"
      assigned_to: player2
      type: feature
      depends_on: subtask_001
```

### 4. ディレクターがキャプテンに通知

ディレクターが実行：
```bash
tmux send-keys -t captain:0.0 'queue/director_to_captain.yamlに新しい指示があります。実行してください。'
tmux send-keys -t captain:0.0 Enter
```

### 5. 進捗の監視

ディレクターからデタッチしてキャプテンにアタッチ：
```bash
# デタッチ：Ctrl+b、その後d
tmux attach-session -t captain
```

キャプテンがプレイヤーにタスクを中継し、`dashboard.md`を更新する様子を見てください。

### 6. 結果の確認

進捗を確認するために`dashboard.md`をチェック：
```bash
cat dashboard.md
```

## トラブルシューティング

### セッションが作成されない

**問題**: `./start.sh`は実行されるが、セッションが表示されない

**解決策**:
```bash
# 既存のセッションを終了
tmux kill-session -t director
tmux kill-session -t captain
tmux kill-session -t players

# 再試行
./start.sh
```

### Claudeが認証されていない

**問題**: "ログインしていません"エラー

**解決策**:
```bash
claude login
# 認証プロンプトに従う
```

### スクリプトで権限が拒否される

**問題**: `./start.sh: Permission denied`

**解決策**:
```bash
chmod +x init.sh start.sh
```

### シンボリックリンクが動作しない

**問題**: `player1/project`シンボリックリンクが壊れている

**解決策**:
```bash
# 壊れたシンボリックリンクを削除
rm player1/project

# 再作成
ln -s ../project player1/project

# 確認
ls -la player1/project
```

### tmux send-keysが動作しない

**問題**: キャプテン/プレイヤーがメッセージを受け取らない

**解決策**: 常に2つの別々の呼び出しを使用：
```bash
# 間違い
tmux send-keys -t captain:0.0 'message' Enter

# 正しい
tmux send-keys -t captain:0.0 'message'
tmux send-keys -t captain:0.0 Enter
```

### キューファイルが見つからない

**問題**: "ファイルが見つかりません：queue/director_to_captain.yaml"

**解決策**:
```bash
# 初期化を再実行
./init.sh

# または手動で作成
mkdir -p queue/captain_to_players
touch queue/director_to_captain.yaml
touch queue/captain_to_players/player{1,2,3}.yaml
```

## 高度な使用方法

### バックグラウンド実行

tmuxセッションをバックグラウンドで実行し続ける：
```bash
# システムを起動
./start.sh

# すべてのセッションからデタッチ
# 各セッションでCtrl+b、その後dを押す

# セッションはバックグラウンドで実行し続ける
# いつでも再アタッチ可能：
tmux attach-session -t director
```

### 複数のプロジェクト

異なるプロジェクトで別々のインスタンスを実行：
```bash
# プロジェクトA
cd ~/projects/project-a/tmux-parallel-core
./start.sh

# プロジェクトB（異なるセッション名を使用）
cd ~/projects/project-b/tmux-parallel-core
# start.shを編集して異なるセッション名を使用する
./start.sh
```

### 全セッションの監視

すべてのアクティビティを一度に表示：
```bash
# ターミナルを3つのペインに分割
tmux new-session \; \
  split-window -h \; \
  split-window -v \; \
  select-pane -t 0 \; \
  send-keys 'tmux attach-session -t director' C-m \; \
  select-pane -t 1 \; \
  send-keys 'tmux attach-session -t captain' C-m \; \
  select-pane -t 2 \; \
  send-keys 'tmux attach-session -t players' C-m
```

### ロギング

セッション出力をファイルにキャプチャ：
```bash
# セッションのロギングを有効化
tmux pipe-pane -o -t director 'cat >> director.log'
tmux pipe-pane -o -t captain 'cat >> captain.log'
tmux pipe-pane -o -t players 'cat >> players.log'

# ロギングを無効化
tmux pipe-pane -t director
```

## システムの停止

### 通常のシャットダウン

```bash
# すべてのセッションを終了
tmux kill-session -t director
tmux kill-session -t captain
tmux kill-session -t players
```

### 強制終了

```bash
# すべてのtmuxセッションを終了
tmux kill-server
```

## 次のステップ

セットアップ後、以下を参照してください：

1. **[README.md](README.md)** - アーキテクチャの概要とクイックリファレンス
2. **[docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md)** - 完全な開発ワークフロー
3. **[docs/PROMPTING_GUIDE.md](docs/PROMPTING_GUIDE.md)** - 効果的なプロンプトの書き方
4. **[docs/QUALITY_GATES.md](docs/QUALITY_GATES.md)** - コード品質基準

## ヘルプの入手

- **問題**: GitHubでバグを報告したり、機能をリクエストしたりしてください
- **ドキュメント**: 詳細なガイドについてはdocs/ディレクトリを読んでください
- **例**: 実装例については`project/`をチェックしてください

## まとめ

**開始するための最小手順：**

1. 前提条件をインストール（tmux、Claude Code）
2. `./init.sh`を実行
3. `./start.sh`を実行
4. ディレクターにアタッチ：`tmux attach-session -t director`
5. ディレクターにタスクを与える
6. キャプテンとプレイヤーセッションで進捗を監視

**以上です！AI駆動の並列開発を使用する準備ができました。**
