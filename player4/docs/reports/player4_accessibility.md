# ウェブアクセシビリティ調査レポート

**作成日:** 2025-02-01
**タスクID:** TASK-2025-0201-104
**担当:** Player 4

---

## 目次

1. [WCAG 2.1 の4原則（POUR）](#wcag-21-の4原則pour)
2. [重要な成功基準（AAレベル）](#重要な成功基準aaレベル)
3. [ARIA の活用](#aria-の活用)
4. [キーボードナビゲーション](#キーボードナビゲーション)
5. [スクリーンリーダー対応](#スクリーンリーダー対応)
6. [フォームのアクセシビリティ](#フォームのアクセシビリティ)
7. [アクセシビリティテスト](#アクセシビリティテスト)
8. [よくある間違いと対策](#よくある間違いと対策)
9. [参考リソース](#参考リソース)

---

## WCAG 2.1 の4原則（POUR）

WCAG 2.1 は、ウェブコンテンツをアクセシブルにするための4つの基本原則（POUR）で構成されています。

### 1. Perceivable（知覚可能）

情報とUIコンポーネントは、ユーザーが知覚できる方法で提示されなければなりません。

**主な要件:**
- テキストの代替：非テキストコンテンツには説明を提供
- 時間ベースのメディア：音声・動画の代替コンテンツを提供
- 適応可能：コンテンツを異なる方法で提示可能に
- 判別可能：前景と背景を明確に区別

### 2. Operable（操作可能）

UIコンポーネントとナビゲーションは操作可能でなければなりません。

**主な要件:**
- キーボード操作可能：すべての機能をキーボードで操作
- 十分な時間：ユーザーがコンテンツを読んで操作する時間を提供
- 発作を引き起こさない：コンテンツが光過敏性発作を引き起こさない
- ナビゲーション可能：ユーザーがナビゲート、コンテンツを見つけ、どこにいるかを把握

### 3. Understandable（理解可能）

情報とUI操作は理解可能でなければなりません。

**主な要件:**
- 読みやすさ：テキストコンテンツが読みやすく理解可能
- 予測可能：Webページの見た目や動作を予測可能
- 入力支援：ユーザーのミスを回避・修正

### 4. Robust（堅牢性）

コンテンツは、支援技術を含む様々なユーザーエージェントで確実に解釈できなければなりません。

**主な要件:**
- 互換性：支援技術を含む、現在および将来のユーザーエージェントとの互換性

---

## 重要な成功基準（AAレベル）

### 色のコントラスト比

**要件:**
- 通常のテキスト：4.5:1 以上のコントラスト比
- 大きなテキスト（18pt以上、または14pt以上の太字）：3:1 以上のコントラスト比
- グラフィカルオブジェクトとUIコンポーネント：3:1 以上

**良い例:**
```html
<!-- 良いコントラスト -->
<style>
  .good-contrast {
    background-color: #1a1a1a;
    color: #f5f5f5; /* コントラスト比: 15.6:1 */
  }
</style>

<p class="good-contrast">十分なコントラストを持つテキスト</p>
```

**悪い例:**
```html
<!-- 悪いコントラスト -->
<style>
  .poor-contrast {
    background-color: #808080;
    color: #a0a0a0; /* コントラスト比: 1.5:1 - 不十分 */
  }
</style>

<p class="poor-contrast">コントラストが不足しているテキスト</p>
```

### キーボード操作の可能性

**要件:**
- すべての機能がキーボードのみで操作可能
- キーボードフォーカスが見える
- フォーカス順序が論理的

**良い例:**
```html
<!-- カスタムボタン - キーボード操作可能 -->
<button class="custom-button" onclick="handleSubmit()">
  送信
</button>

<!-- フォーカススタイル -->
<style>
  .custom-button:focus {
    outline: 3px solid #005fcc;
    outline-offset: 2px;
  }
</style>
```

**悪い例:**
```html
<!-- キーボード操作不可能なdiv要素 -->
<div class="button" onclick="handleSubmit()">
  送信
</div>

<script>
  // キーボードイベントがないため、キーボード操作不可
</script>
```

### フォームのラベル付け

**要件:**
- すべてのフォームコントロールにラベルが関連付けられている

**良い例:**
```html
<form>
  <label for="email">メールアドレス</label>
  <input type="email" id="email" name="email" required>
</form>
```

**悪い例:**
```html
<!-- ラベルが存在しない -->
<form>
  <input type="email" id="email" name="email" placeholder="メールアドレス">
</form>
```

---

## ARIA の活用

### ランドマークロール

ARIA ランドマークは、スクリーンリーダーユーザーがページ内を素早く移動するための「目印」として機能します。

**主なランドマークロール:**

| ロール | 説明 | HTML要素 |
|--------|------|----------|
| `banner` | ページヘッダー | `<header>` |
| `main` | メインコンテンツ | `<main>` |
| `navigation` | ナビゲーションリンク | `<nav>` |
| `complementary` | 補足情報 | `<aside>` |
| `contentinfo` | フッター情報 | `<footer>` |
| `search` | 検索機能 | `<form role="search">` |
| `region` | 独立したセクション | `<section>` |

**良い例:**
```html
<body>
  <header role="banner">
    <h1>サイトタイトル</h1>
  </header>

  <nav role="navigation" aria-label="メインナビゲーション">
    <ul>
      <li><a href="/">ホーム</a></li>
      <li><a href="/about">について</a></li>
    </ul>
  </nav>

  <main role="main">
    <article>
      <h2>記事タイトル</h2>
      <p>メインコンテンツ...</p>
    </article>
  </main>

  <aside role="complementary">
    <h3>関連情報</h3>
  </aside>

  <footer role="contentinfo">
    <p>&copy; 2025 サイト名</p>
  </footer>
</body>
```

**注意:** セマンティックHTML要素（`<header>`, `<main>`, `<nav>`など）を使用すれば、暗黙的にランドマークロールが適用されるため、追加のARIA属性は通常不要です。

### スクリーンリーダー向けの説明

**aria-label の使用:**
```html
<!-- アイコンボタンにラベルを追加 -->
<button aria-label="設定を開く">
  <svg><!-- ギアアイコン --></svg>
</button>
```

**aria-labelledby の使用:**
```html
<div id="form-title">お問い合わせフォーム</div>
<form aria-labelledby="form-title">
  <!-- フォーム内容 -->
</form>
```

**aria-describedby の使用:**
```html
<label for="password">パスワード</label>
<input
  type="password"
  id="password"
  aria-describedby="password-hint"
>
<p id="password-hint">8文字以上で入力してください</p>
```

### ライブリージョン（動的コンテンツの通知）

動的に更新されるコンテンツをスクリーンリーダーユーザーに通知します。

```html
<!-- ステータスメッセージ -->
<div role="status" aria-live="polite">
  <p>データを保存しました</p>
</div>

<!-- 緊急メッセージ -->
<div role="alert" aria-live="assertive">
  <p>エラーが発生しました</p>
</div>
```

**aria-live の値:**
- `off`: デフォルト、変更を通知しない
- `polite`: ユーザーの操作が終わってから通知
- `assertive`: 即座に通知（緊急メッセージ用）

### 適切なARIA属性の使い分け

**良い例:**
```html
<!-- 開閉パネル -->
<button
  aria-expanded="false"
  aria-controls="panel1"
  onclick="togglePanel()"
>
  セクションを開く
</button>
<div id="panel1" hidden>
  パネルの内容
</div>

<!-- タブインターフェース -->
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel1">
    タブ1
  </button>
  <button role="tab" aria-selected="false" aria-controls="panel2">
    タブ2
  </button>
</div>
<div role="tabpanel" id="panel1">コンテンツ1</div>
<div role="tabpanel" id="panel2" hidden>コンテンツ2</div>
```

**悪い例:**
```html
<!-- セマンティックHTMLを無視した悪いARIAの使用 -->
<div role="button">送信</div>

<!-- 代わりにネイティブ要素を使用 -->
<button>送信</button>
```

---

## キーボードナビゲーション

### Tabキーの順序

Tabキーのフォーカス順序は、DOMの順序と一致すべきです。

**良い例:**
```html
<!-- 論理的な順序 -->
<form>
  <label for="name">名前</label>
  <input type="text" id="name" tabindex="0">

  <label for="email">メール</label>
  <input type="email" id="email" tabindex="0">

  <button type="submit" tabindex="0">送信</button>
</form>
```

**注意:** `tabindex="0"` はデフォルトのTab順序を維持します。`tabindex` の正の値は避けるべきです。

### スキップリンク

スクリーンリーダーユーザーやキーボードユーザーが、繰り返しのナビゲーションをスキップしてメインコンテンツに直接移動できるリンクを提供します。

**良い例:**
```html
<body>
  <a href="#main-content" class="skip-link">
    メインコンテンツへスキップ
  </a>

  <header>
    <!-- ナビゲーション -->
  </header>

  <main id="main-content">
    <!-- メインコンテンツ -->
  </main>
</body>

<style>
  /* フォーカス時のみ表示 */
  .skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  }

  .skip-link:focus {
    top: 0;
  }
</style>
```

### フォーカストラップ（モーダル等）

モーダルダイアログでは、キーボードフォーカスをダイアログ内に制限する必要があります。

**良い例:**
```html
<!-- モーダル構造 -->
<div
  id="modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  class="modal"
>
  <h2 id="modal-title">確認</h2>
  <p>この操作を実行しますか？</p>
  <button id="confirm-btn">はい</button>
  <button id="cancel-btn">いいえ</button>
</div>

<script>
// フォーカストラップの実装例
const modal = document.getElementById('modal');
const focusableElements = modal.querySelectorAll(
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
);
const firstElement = focusableElements[0];
const lastElement = focusableElements[focusableElements.length - 1];

modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }
});
</script>
```

---

## スクリーンリーダー対応

### セマンティックHTMLの重要性

セマンティックHTMLを使用することで、スクリーンリーダーはコンテンツの構造と意味を正しく理解できます。

**良い例:**
```html
<!-- セマンティックHTML -->
<header>
  <nav>
    <ul>
      <li><a href="/">ホーム</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>記事タイトル</h1>
    <p>本文...</p>
  </article>
</main>

<aside>
  <section>
    <h2>関連記事</h2>
  </section>
</aside>

<footer>
  <small>&copy; 2025</small>
</footer>
```

**悪い例:**
```html
<!-- 非セマンティックHTML -->
<div class="header">
  <div class="nav">
    <div class="nav-item"><a href="/">ホーム</a></div>
  </div>
</div>

<div class="content">
  <div class="article">
    <div class="title">記事タイトル</div>
    <div class="body">本文...</div>
  </div>
</div>
```

### altテキストの書き方

画像には適切な alt テキストを提供する必要があります。

**良い例:**
```html
<!-- 情報を持つ画像 - 詳細な説明 -->
<img
  src="graph.jpg"
  alt="2025年の売上推移を示す棒グラフ。第1四半期が最も高く、以降減少傾向"
>

<!-- 装飾的な画像 - 空 alt -->
<img src="decorative-pattern.png" alt="" role="presentation">

<!-- 機能を持つ画像 - 機能を説明 -->
<img src="search-icon.png" alt="検索">

<!-- 複雑な画像 - 詳細な説明へのリンク -->
<img
  src="complex-chart.jpg"
  alt="詳細な説明はテキスト版をご覧ください"
>
<a href="#chart-description" aria-label="グラフの詳細説明">グラフの詳細を読む</a>
```

**悪い例:**
```html
<!-- 過剰な説明 -->
<img src="logo.png" alt="青い背景に白い文字で書かれたロゴマーク">

<!-- 不十分な説明 -->
<img src="team-photo.jpg" alt="写真">

<!-- ファイル名そのまま -->
<img src="img001.jpg" alt="img001">
```

### 見出し構造（h1-h6の正しい使用）

見出しは論理的な階層構造を持つべきです。

**良い例:**
```html
<h1>ページタイトル</h1>

<section>
  <h2>セクション1</h2>
  <p>本文...</p>

  <article>
    <h3>サブセクション1-1</h3>
    <p>本文...</p>
  </article>
</section>

<section>
  <h2>セクション2</h2>
  <p>本文...</p>
</section>
```

**悪い例:**
```html
<!-- 見出しレベルの飛び -->
<h1>タイトル</h1>
<h4>サブタイトル</h4>

<!-- 見出しの誤用（スタイル目的） -->
<h3>段落テキスト</h3>
<p>通常のテキスト</p>
```

---

## フォームのアクセシビリティ

### ラベルと入力欄の関連付け

**良い例:**
```html
<!-- 暗黙的な関連付け -->
<label>
  名前
  <input type="text" name="name">
</label>

<!-- 明示的な関連付け（推奨） -->
<label for="email">メールアドレス</label>
<input type="email" id="email" name="email">

<!-- aria-label（ラベルが視覚的に存在しない場合）-->
<input
  type="search"
  aria-label="サイト内検索"
  placeholder="検索..."
>

<!-- aria-labelledby（複数の要素を参照）-->
<span id="lbl-first">名</span>
<input id="first" aria-labelledby="lbl-first">

<span id="lbl-last">姓</span>
<input id="last" aria-labelledby="lbl-last">
```

**悪い例:**
```html
<!-- ラベルの欠如 -->
<input type="text" placeholder="名前">

<!-- placeholderのみ（補助的でしかない）-->
<label for="email">Email</label>
<input type="email" id="email" placeholder="user@example.com">
```

### エラーメッセージの通知方法

**良い例:**
```html
<form>
  <label for="email">メールアドレス</label>
  <input
    type="email"
    id="email"
    name="email"
    aria-invalid="false"
    aria-describedby="email-error"
  >
  <span id="email-error" class="error-message" role="alert">
    有効なメールアドレスを入力してください
  </span>

  <button type="submit">送信</button>
</form>

<style>
  .error-message {
    color: #d93025;
    font-size: 0.875rem;
    display: none;
  }

  [aria-invalid="true"] + .error-message {
    display: block;
  }
</style>

<script>
// エラー時のARIA属性更新
function showError(input) {
  input.setAttribute('aria-invalid', 'true');
}

function clearError(input) {
  input.setAttribute('aria-invalid', 'false');
}
</script>
```

### 必須項目の明示

**良い例:**
```html
<form>
  <label for="email">
    メールアドレス
    <span class="required" aria-label="必須項目">*</span>
  </label>
  <input
    type="email"
    id="email"
    name="email"
    required
    aria-required="true"
  >
</form>

<style>
  .required {
    color: #d93025;
  }
</style>
```

**悪い例:**
```html
<!-- 色のみで必須を示す -->
<label for="email">メールアドレス</label>
<input type="email" id="email" name="email" style="border: 2px solid red;">
```

---

## アクセシビリティテスト

### 自動テストツール

#### axe-core / axe DevTools

Dequeが提供するアクセシビリティテストツール。

**主な機能:**
- ページ全体または特定の要素のスキャン
- WCAG違反の検出
- 修正提案の提供
- CI/CD統合が可能

**使用例:**
```javascript
// axe-core の使用例
import axe from 'axe-core';

// ページ全体をスキャン
axe.run().then(results => {
  if (results.violations.length) {
    console.log('アクセシビリティ違反が見つかりました:', results.violations);
  }
});

// 特定の要素をスキャン
const element = document.getElementById('my-component');
axe.run(element).then(results => {
  console.log('コンポーネントの結果:', results);
});
```

**注意:** Lighthouse は axe-core をエンジンとして使用していますが、専用ツールである axe DevTools の方が詳細な検出が可能です。

#### Lighthouse

Googleが提供するウェブページ監査ツール。アクセシビリティ監査を含んでいます。

**使用方法:**
- Chrome DevTools の Lighthouse タブ
- コマンドライン: `npx lighthouse <url> --view`
- Node.js プログラム

**主な項目:**
- 画像の alt 属性
- フォームのラベル
- 色のコントラスト
- リンクテキスト
- ドキュメントの言語

#### WAVE（Web Accessibility Evaluation Tool）

WebAIMが提供するブラウザ拡張機能。

**主な機能:**
- 視覚的なフィードバック（アイコン、インジケーター）
- エラー、警告、注意の分類
- 構造の視覚化

### スクリーンリーダーでのテスト

**主なスクリーンリーダー:**

| プラットフォーム | スクリーンリーダー |
|------------------|-------------------|
| Windows | NVDA（無料）、JAWS（有料）、Narrator |
| macOS | VoiceOver（標準搭載） |
| iOS | VoiceOver（標準搭載） |
| Android | TalkBack（標準搭載） |

**VoiceOver（macOS）の基本的な操作:**
- コマンド + F5: VoiceOver のオン/オフ
- Control + Option + 右矢印: 次の項目へ移動
- Control + Option + 左矢印: 前の項目へ移動
- Control + Option + Shift + 下矢印: 要素との対話を開始
- Control + Option + Shift + 上矢印: 要素との対話を終了

### キーボードのみでの操作テスト

**テスト手順:**
1. マウスを取り外すか、使用しない
2. Tab キーでフォーカスを移動
3. Enter/Space キーでボタンやリンクを操作
4. 矢印キーでメニュー内を移動
5. Esc キーでモーダルやメニューを閉じる

**確認項目:**
- すべてのインタラクティブ要素にフォーカスが当たるか
- フォーカスの順序は論理的か
- フォーカスインジケーターは見やすいか
- キーボードだけで完了できる操作があるか

---

## よくある間違いと対策

### 1. カラーのみの依存

**間違い:**
```html
<span style="color: red;">必須項目</span>
```

**対策:**
```html
<span class="required">必須項目 <span aria-label="必須">*</span></span>
```

### 2. 小さすぎるクリック領域

**間違い:**
```html
<a href="/page">クリック</a>
<!-- 小さなテキストリンクのみ -->
```

**対策:**
```html
<a href="/page" class="large-click-area">
  <span>クリック</span>
</a>

<style>
  .large-click-area {
    display: inline-block;
    padding: 12px 16px;
    min-height: 44px;
    min-width: 44px;
  }
</style>
```

### 3. 動画の自動再生

**間違い:**
```html
<video autoplay src="video.mp4"></video>
```

**対策:**
```html
<video controls>
  <source src="video.mp4" type="video/mp4">
  <track kind="captions" src="captions.vtt" srclang="ja" label="日本語">
</video>
```

### 4. focus スタイルの削除

**間違い:**
```css
button:focus {
  outline: none; /* フォーカスインジケーターを削除 */
}
```

**対策:**
```css
button:focus {
  outline: 3px solid #005fcc;
  outline-offset: 2px;
  /* カスタムフォーカススタイルを提供 */
}
```

### 5. placeholder の誤用

**間違い:**
```html
<input type="text" placeholder="名前を入力してください">
```

**対策:**
```html
<label for="name">名前</label>
<input type="text" id="name" placeholder="例: 山田 太郎">
```

### 6. 見出しのスキップ

**間違い:**
```html
<h1>タイトル</h1>
<h4>サブタイトル</h4>
```

**対策:**
```html
<h1>タイトル</h1>
<h2>サブタイトル</h2>
```

### 7. ARIA の過剰使用

**間違い:**
```html
<div role="button" aria-pressed="false" tabindex="0">
  送信
</div>
```

**対策:**
```html
<button type="submit">送信</button>
```

### 8. 非同期更新の通知なし

**間違い:**
```html
<div id="status"></div>

<script>
document.getElementById('status').textContent = '保存しました';
</script>
```

**対策:**
```html
<div id="status" role="status" aria-live="polite"></div>

<script>
document.getElementById('status').textContent = '保存しました';
</script>
```

---

## 参考リソース

### 公式ドキュメント

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/) - W3C公式仕様
- [WCAG 2.1 Overview](https://www.w3.org/WAI/WCAG21/Understanding/intro) - WAIによる解説
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) - ARIAの実装ガイド

### 学習リソース

- [WebAIM](https://webaim.org/) - ウェブアクセシビリティの総合情報サイト
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility) - MDNのアクセシビリティドキュメント
- [The A11Y Project](https://www.a11yproject.com/) - アクセシビリティチェックリストとガイド

### テストツール

- [axe DevTools](https://www.deque.com/axe/devtools/) - Chrome/Firefox拡張機能
- [WAVE](https://wave.webaim.org/) - WebAIMの評価ツール
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Googleの監査ツール

---

## まとめ

ウェブアクセシビリティは、すべての人がウェブコンテンツを利用できるようにするための重要な取り組みです。WCAG 2.1の4原則（POUR）を理解し、適切なHTML構造、ARIA属性、キーボードナビゲーションを提供することで、より包括的なウェブ体験を実現できます。

アクセシビリティの取り組みは、一度行えば終わりではなく、継続的なテストと改善が必要です。自動テストツールと手動テストを組み合わせて、定期的にアクセシビリティを監査することをお勧めします。

---

**報告者:** Player 4
**完了日:** 2025-02-01
