<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>일본어 문법 사전 & 테스트</title>
<style>
  :root {
    --bg: #0d0d0f;
    --bg2: #16161a;
    --bg3: #1e1e24;
    --bg4: #26262e;
    --accent: #e8c468;
    --accent2: #c8a848;
    --text: #f0ede6;
    --text2: #a8a49c;
    --text3: #6a6662;
    --border: #2e2e38;
    --border2: #3a3a48;
    --red: #e86868;
    --green: #68c868;
    --blue: #6898e8;
    --tag: #2a2418;
    --tag-border: #4a3c24;
    --card-hover: #1c1c22;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { font-size: 16px; }
  body {
    font-family: 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Malgun Gothic', sans-serif;
    background: var(--bg);
    color: var(--text);
    height: 100vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  /* ── Header ── */
  header {
    padding: 0.8rem 2rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 1rem;
    background: var(--bg);
    flex-shrink: 0;
  }
  .logo {
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--accent);
  }
  .logo span { color: var(--text2); font-weight: 400; font-size: 0.9rem; margin-left: 0.5rem; }
  .nav-tabs {
    display: flex;
    gap: 0.25rem;
    margin-left: auto;
    background: var(--bg3);
    border-radius: 8px;
    padding: 4px;
    border: 1px solid var(--border);
  }
  .nav-tab {
    padding: 0.4rem 1.1rem;
    border-radius: 5px;
    font-size: 0.85rem;
    cursor: pointer;
    border: none;
    background: transparent;
    color: var(--text2);
    font-family: inherit;
    transition: all 0.15s;
  }
  .nav-tab.active {
    background: var(--accent);
    color: #1a1400;
    font-weight: 600;
  }
  .nav-tab:hover:not(.active) { background: var(--bg4); color: var(--text); }

  /* ── Main layout ── */
  main { flex: 1; display: flex; overflow: hidden; min-height: 0; }

  /* ── Sidebar ── */
  aside {
    width: 320px;
    min-width: 320px;
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    background: var(--bg);
    overflow: hidden;
  }
  .search-box {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--border);
  }
  .search-box input {
    width: 100%;
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    color: var(--text);
    font-size: 0.85rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
  }
  .search-box input:focus { border-color: var(--accent); }
  .search-box input::placeholder { color: var(--text3); }

  .filter-row {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .filter-chip {
    font-size: 0.72rem;
    padding: 0.2rem 0.55rem;
    border-radius: 4px;
    border: 1px solid var(--border2);
    background: transparent;
    color: var(--text2);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.12s;
  }
  .filter-chip.active { border-color: var(--accent); background: var(--tag); color: var(--accent); }
  .filter-chip:hover:not(.active) { border-color: var(--border2); background: var(--bg3); }

  .grammar-list {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border2) transparent;
  }
  .grammar-item {
    padding: 0.6rem 1rem;
    border-bottom: 1px solid var(--border);
    cursor: pointer;
    transition: background 0.1s;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .grammar-item:hover { background: var(--card-hover); }
  .grammar-item.active { background: var(--bg3); border-left: 2px solid var(--accent); padding-left: calc(1rem - 2px); }
  .item-row1 { display: flex; align-items: baseline; gap: 0.45rem; }
  .item-num { font-size: 0.68rem; color: var(--text3); min-width: 1.8rem; flex-shrink: 0; }
  .item-grammar { font-size: 0.9rem; font-weight: 600; color: var(--accent); }
  .item-meaning { font-size: 0.75rem; color: var(--text2); margin-left: auto; text-align: right; max-width: 90px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0; }
  .item-freq { font-size: 0.65rem; color: var(--accent2); margin-left: auto; letter-spacing: 0.02em; flex-shrink: 0; }
  .lv-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-left: 4px; align-self: center; }
  .item-conn {
    font-size: 0.68rem;
    color: var(--text3);
    padding-left: 2.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: 'Courier New', monospace;
    letter-spacing: -0.01em;
  }
  .count-badge {
    padding: 0.3rem 1rem;
    font-size: 0.72rem;
    color: var(--text3);
    border-bottom: 1px solid var(--border);
    background: var(--bg);
  }

  /* ── Detail panel ── */
  .detail-panel {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 2rem 2.5rem;
    scrollbar-width: thin;
    scrollbar-color: var(--border2) transparent;
  }
  .detail-empty {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--text3);
  }
  .detail-empty .big { font-size: 2.5rem; }
  .detail-empty p { font-size: 0.9rem; }

  .grammar-header {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 1.75rem;
    flex-wrap: wrap;
  }
  .grammar-title { font-size: 2.2rem; font-weight: 700; color: var(--accent); letter-spacing: -0.02em; }
  .grammar-num-badge {
    font-size: 0.75rem;
    padding: 0.2rem 0.6rem;
    background: var(--tag);
    border: 1px solid var(--tag-border);
    border-radius: 4px;
    color: var(--accent2);
    margin-top: 0.6rem;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1.75rem;
  }
  .info-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem 1.1rem;
  }
  .info-card.full { grid-column: 1 / -1; }
  .info-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text3);
    margin-bottom: 0.4rem;
  }
  .info-value { font-size: 0.95rem; color: var(--text); line-height: 1.6; }
  .info-value.mono {
    font-family: 'Courier New', monospace;
    font-size: 0.88rem;
    color: var(--blue);
    background: var(--bg3);
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    display: inline-block;
  }
  .nuance-text { color: var(--text2); font-size: 0.9rem; line-height: 1.7; }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }
  .meta-chip {
    font-size: 0.72rem;
    padding: 0.18rem 0.6rem;
    border-radius: 4px;
    border: 1px solid var(--border2);
    color: var(--text2);
    background: transparent;
    font-family: inherit;
    letter-spacing: 0.04em;
  }
  .freq-chip {
    font-size: 0.8rem;
    border: none;
    padding: 0;
    color: var(--accent);
    letter-spacing: 0.08em;
  }
  .warn-card { background: #1e1610; border-color: #4a3410; }
  .warn-text { color: #e0a848; font-size: 0.88rem; line-height: 1.65; }
  .sim-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.1rem; }
  .sim-tag {
    font-size: 0.82rem;
    padding: 0.22rem 0.7rem;
    border-radius: 4px;
    border: 1px solid var(--border2);
    background: var(--bg3);
    color: var(--blue);
    cursor: pointer;
    transition: all 0.12s;
  }
  .sim-tag:hover { border-color: var(--blue); background: #0e1828; }

  .examples-section { margin-top: 0.5rem; }
  .examples-title {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text3);
    margin-bottom: 0.75rem;
  }
  .example-block {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 0 8px 8px 0;
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
  }
  .example-jp {
    font-size: 1rem;
    line-height: 1.8;
    color: var(--text);
    margin-bottom: 0.35rem;
  }
  .example-kr { font-size: 0.85rem; color: var(--text2); line-height: 1.6; }

  .nav-arrows {
    display: flex;
    gap: 0.5rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--border);
  }
  .arrow-btn {
    flex: 1;
    padding: 0.65rem;
    background: var(--bg3);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text2);
    font-size: 0.85rem;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
  }
  .arrow-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); background: var(--tag); }
  .arrow-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  /* ── Quiz section ── */
  #quiz-section {
    flex: 1;
    flex-direction: column;
    padding: 1.5rem 3rem;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--border2) transparent;
  }
  .quiz-header-bar {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }
  .quiz-header-bar h2 { font-size: 1.1rem; font-weight: 600; color: var(--text); }
  .quiz-stats {
    display: flex;
    gap: 1rem;
    margin-left: auto;
    align-items: center;
    font-size: 0.82rem;
    color: var(--text2);
  }
  .stat-val { color: var(--text); font-weight: 600; }
  .stat-val.correct { color: var(--green); }
  .stat-val.wrong { color: var(--red); }

  .quiz-mode-sel {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1.75rem;
    flex-wrap: wrap;
  }
  .mode-btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid var(--border2);
    background: transparent;
    color: var(--text2);
    font-size: 0.82rem;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
  }
  .mode-btn.active { border-color: var(--accent); background: var(--tag); color: var(--accent); font-weight: 600; }
  .mode-btn:hover:not(.active) { background: var(--bg3); }

  .quiz-card {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 2rem 2.25rem;
    max-width: 700px;
    margin: 0 auto;
  }
  .quiz-progress {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .progress-bar-wrap {
    flex: 1;
    height: 4px;
    background: var(--bg4);
    border-radius: 2px;
    overflow: hidden;
  }
  .progress-bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.3s ease;
  }
  .progress-text { font-size: 0.75rem; color: var(--text3); min-width: 4rem; text-align: right; }

  .quiz-q-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text3);
    margin-bottom: 0.5rem;
  }
  .quiz-question {
    font-size: 1.4rem;
    font-weight: 700;
    color: var(--accent);
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }
  .quiz-sub {
    font-size: 0.85rem;
    color: var(--text2);
    margin-bottom: 1.75rem;
    line-height: 1.6;
  }

  .quiz-choices {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.65rem;
    margin-bottom: 1.5rem;
  }
  .choice-btn {
    padding: 0.85rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border2);
    background: var(--bg3);
    color: var(--text);
    font-size: 0.9rem;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
    text-align: left;
    line-height: 1.5;
  }
  .choice-btn:hover:not(:disabled) { border-color: var(--border2); background: var(--bg4); }
  .choice-btn.correct { border-color: var(--green); background: #0a2010; color: var(--green); }
  .choice-btn.wrong { border-color: var(--red); background: #200a0a; color: var(--red); }
  .choice-btn:disabled { cursor: not-allowed; }

  .quiz-fill-input {
    width: 100%;
    background: var(--bg3);
    border: 1px solid var(--border2);
    border-radius: 8px;
    padding: 0.85rem 1rem;
    color: var(--text);
    font-size: 1rem;
    font-family: inherit;
    outline: none;
    margin-bottom: 0.75rem;
    transition: border-color 0.15s;
  }
  .quiz-fill-input:focus { border-color: var(--accent); }
  .quiz-fill-input.correct { border-color: var(--green); }
  .quiz-fill-input.wrong { border-color: var(--red); }

  .quiz-submit-btn {
    width: 100%;
    padding: 0.85rem;
    border-radius: 8px;
    border: none;
    background: var(--accent);
    color: #1a1400;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
    margin-bottom: 1rem;
  }
  .quiz-submit-btn:hover { background: var(--accent2); }
  .quiz-submit-btn:disabled { background: var(--bg4); color: var(--text3); cursor: not-allowed; }

  .quiz-result-box {
    padding: 0.85rem 1rem;
    border-radius: 8px;
    font-size: 0.85rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    display: none;
  }
  .quiz-result-box.correct { background: #0a2010; border: 1px solid #2a5030; color: var(--green); }
  .quiz-result-box.wrong { background: #200a0a; border: 1px solid #502020; color: var(--red); }
  .result-detail { color: var(--text2); font-size: 0.82rem; margin-top: 0.4rem; }

  .quiz-next-btn {
    width: 100%;
    padding: 0.8rem;
    border-radius: 8px;
    border: 1px solid var(--border2);
    background: transparent;
    color: var(--text);
    font-size: 0.9rem;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
    display: none;
  }
  .quiz-next-btn:hover { background: var(--bg3); border-color: var(--accent); color: var(--accent); }

  .quiz-end-screen {
    text-align: center;
    padding: 3rem 1rem;
  }
  .quiz-end-screen .score { font-size: 3.5rem; font-weight: 700; color: var(--accent); }
  .quiz-end-screen .score-sub { font-size: 1rem; color: var(--text2); margin: 0.5rem 0 2rem; }
  .quiz-restart-btn {
    padding: 0.75rem 2rem;
    border-radius: 8px;
    border: none;
    background: var(--accent);
    color: #1a1400;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s;
  }
  .quiz-restart-btn:hover { background: var(--accent2); }
  .wrong-review {
    text-align: left;
    margin-top: 2rem;
    max-width: 500px;
    margin-left: auto;
    margin-right: auto;
  }
  .wrong-review h3 { font-size: 0.85rem; color: var(--text2); margin-bottom: 1rem; font-weight: 500; }
  .wrong-item {
    padding: 0.7rem 1rem;
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 0.5rem;
  }
  .wrong-item .wi-grammar { font-size: 0.95rem; font-weight: 600; color: var(--red); }
  .wrong-item .wi-meaning { font-size: 0.8rem; color: var(--text2); margin-top: 0.2rem; }

  /* Scrollbar styling */
  .grammar-list::-webkit-scrollbar,
  .detail-panel::-webkit-scrollbar,
  #quiz-section::-webkit-scrollbar { width: 4px; }
  .grammar-list::-webkit-scrollbar-track,
  .detail-panel::-webkit-scrollbar-track,
  #quiz-section::-webkit-scrollbar-track { background: transparent; }
  .grammar-list::-webkit-scrollbar-thumb,
  .detail-panel::-webkit-scrollbar-thumb,
  #quiz-section::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  @media (max-width: 768px) {
    aside { width: 220px; min-width: 220px; }
    .detail-panel { padding: 1.25rem; }
    .info-grid { grid-template-columns: 1fr; }
    .quiz-choices { grid-template-columns: 1fr; }
    #quiz-section { padding: 1.25rem; }
  }
</style>
</head>
<body>

<header>
  <div class="logo">文法辞典 <span>일본어 N2 문법 181선</span></div>
  <nav class="nav-tabs">
    <button class="nav-tab active" onclick="switchTab('dict')" id="tab-dict">사전</button>
    <button class="nav-tab" onclick="switchTab('quiz')" id="tab-quiz">테스트</button>
  </nav>
</header>

<main>
  <!-- ── DICTIONARY ── -->
  <section id="dict-section" style="display:flex;flex:1;overflow:hidden;">
    <aside>
      <div class="search-box">
        <input type="text" id="search-input" placeholder="문법 검색..." oninput="filterList()" />
      </div>
      <div class="filter-row" id="filter-row"></div>
      <div class="count-badge" id="count-badge"></div>
      <div class="grammar-list" id="grammar-list"></div>
    </aside>

    <div class="detail-panel" id="detail-panel">
      <div class="detail-empty">
        <div class="big">文</div>
        <p>왼쪽 목록에서 문법을 선택하세요</p>
      </div>
    </div>
  </section>

  <!-- ── QUIZ ── -->
  <section id="quiz-section" style="display:none;">
    <div class="quiz-header-bar">
      <h2>문법 테스트</h2>
      <div class="quiz-stats">
        <span>정답 <span class="stat-val correct" id="q-correct">0</span></span>
        <span>오답 <span class="stat-val wrong" id="q-wrong">0</span></span>
        <span>정확도 <span class="stat-val" id="q-acc">—</span></span>
      </div>
    </div>
    <div class="quiz-mode-sel">
      <button class="mode-btn active" onclick="setMode('meaning')" id="mode-meaning">뜻 맞추기</button>
      <button class="mode-btn" onclick="setMode('grammar')" id="mode-grammar">문법 맞추기</button>
      <button class="mode-btn" onclick="setMode('example')" id="mode-example">예문 완성</button>
      <button class="mode-btn" onclick="setMode('nuance')" id="mode-nuance">뉘앙스 구분</button>
    </div>
    <div class="quiz-card" id="quiz-card">
      <div id="quiz-content">
        <div style="text-align:center;color:var(--text2);padding:2rem;">로딩 중...</div>
      </div>
    </div>
  </section>
</main>

<script>
const GRAMMAR = [
  {n:"1",g:"あげく",c:"Vた+あげく / Nの+あげく",m:"~한 끝에, 결국 ~하고 말았다",nu:"오랜 고민·고생·논의 끝에 나온 결과. 보통 부정적 결과.",ex:[{j:"太郎はお金のことや友人の問題でさんざん親に心配をかけたあげく、とうとう家を出てしまった。",k:"타로는 돈 문제와 친구 문제로 부모에게 실컷 걱정을 끼친 끝에, 결국 집을 나가 버렸다."},{j:"この問題については、長時間にわたる議論のあげく、結論は先送りされた。",k:"이 문제는 장시간 논의 끝에 결론이 미뤄졌다."}],lv:"중립",freq:"★★★",sim:"すえ（に）",warn:"부정적 결과에만 씀. 좋은 결과엔 すえに를 쓸 것."},
  {n:"2",g:"あまり",c:"V普通形+あまり / いA+あまり / なAな+あまり / Nの+あまり",m:"지나치게 ~해서, 너무 ~한 나머지",nu:"감정·상태가 너무 강해서 평소와 다른 결과가 나옴.",ex:[{j:"合格の知らせを聞いて、彼女はうれしさのあまり泣き出した。",k:"합격 소식을 듣고 그녀는 너무 기쁜 나머지 울음을 터뜨렸다."},{j:"試験の問題は易しかったのに、考えすぎたあまり間違えてしまった。",k:"시험 문제는 쉬웠는데 지나치게 생각한 나머지 틀렸다."}],lv:"중립",freq:"★★★",sim:"ばかりに",warn:"あまり는 \\\'지나침\\\', ばかりに는 \\\'그것 때문에 나쁜 결과\\\'. 원인의 성격이 다름."},
  {n:"3",g:"以上（は）",c:"V普通形+以上（は） / Nである+以上（は）",m:"~한 이상은, ~인 이상은",nu:"앞 조건이 성립하므로 뒤의 책임·의무가 당연함.",ex:[{j:"約束した以上、守るべきだと思う。",k:"약속한 이상 지켜야 한다고 생각한다."},{j:"学生である以上、勉強を第一にしなさい。",k:"학생인 이상 공부를 최우선으로 하세요."}],lv:"중립",freq:"★★★",sim:"上は / からには",warn:"以上は는 조건 강조, 上は는 각오·결심이 더 강함. 뒤에 의지·명령이 옴."},
  {n:"4",g:"一方（で）",c:"V普通形+一方（で） / いA+一方（で）",m:"~하는 한편으로, ~인 반면에",nu:"서로 다른 두 측면을 대조.",ex:[{j:"いい親は厳しく叱る一方で、誉めることも忘れない。",k:"좋은 부모는 엄하게 꾸짖는 한편 칭찬도 잊지 않는다."},{j:"一人暮らしは寂しさを感じることが多い一方、気楽なよさもある。",k:"혼자 사는 것은 외로움도 많지만 편한 장점도 있다."}],lv:"중립",freq:"★★★",sim:"反面 / ながら",warn:"一方で는 동일 주어에도, 다른 주어에도 쓸 수 있음. 반면 ながら는 역접."},
  {n:"5",g:"（た）上で",c:"Vた+上で / Nの+上で",m:"~한 후에, ~한 다음에",nu:"앞 행동을 완료한 뒤 그 결과를 바탕으로 뒤 행동을 함.",ex:[{j:"詳しいことはお目にかかった上で、説明いたします。",k:"자세한 것은 직접 뵌 후 설명드리겠습니다."},{j:"どの大学を受験するか、両親との相談の上で、決めます。",k:"어느 대학을 볼지는 부모님과 상담한 후 정하겠습니다."}],lv:"중립",freq:"★★☆",sim:"てから / 次第",warn:"「た上で」는 \\\'완료 후 판단\\\', 単なる순서(てから)와 달리 결과를 바탕으로 하는 뉘앙스."},
  {n:"6",g:"上で",c:"V辞書形+上で / Nの+上で",m:"~하는 데 있어서, ~함에 있어",nu:"어떤 목적·행위에서 중요한 조건이나 관점을 말함.",ex:[{j:"食料品の保存の上で、次のことに注意してください。",k:"식료품 보관에 있어서 다음 사항에 주의해 주세요."},{j:"今度の企画を成功させる上で、ぜひ皆の協力が必要なのだ。",k:"이번 기획을 성공시키는 데 모두의 협력이 필요하다."}],lv:"중립",freq:"★★☆",sim:"において / にあたって",warn:"5번と6번 上で는 접속 형태가 다름. Vた+上で vs V辞書形+上で로 의미가 달라짐."},
  {n:"7",g:"上は",c:"V辞書形+上は / Vた+上は",m:"~한 이상은",nu:"결심·각오가 강함. 이렇게 된 이상 당연히 해야 한다.",ex:[{j:"親元を離れる上は、十分な覚悟をするべきだ。",k:"부모 곁을 떠나는 이상 충분한 각오를 해야 한다."},{j:"実行する上は、十分な準備が必要だ。",k:"실행하는 이상 충분한 준비가 필요하다."}],lv:"문어체",freq:"★☆☆",sim:"以上（は） / からには",warn:"上は는 문어적·격식체. 회화에서 以上は 선호."},
  {n:"8",g:"得る（うる）",c:"Vます形語幹+得る / Vます形語幹+得ない",m:"~할 수 있다, ~할 가능성이 있다",nu:"능력보다 가능성. 그런 일이 일어날 수도 있음.",ex:[{j:"この事故はいつでも起こり得ることとして十分注意が必要だ。",k:"이 사고는 언제든 일어날 수 있는 일로 충분한 주의가 필요하다."},{j:"彼が事件の現場にいたなんて、そんなことはあり得ない。",k:"그가 사건 현장에 있었다니 그런 일은 있을 수 없다."}],lv:"문어체",freq:"★★★",sim:"ことができる",warn:"「うる」=가능성, 「える」=활용형. あり得る가 아닌 ありうる(文語), ありえる(회화) 구분."},
  {n:"9",g:"おそれがある",c:"V辞書形+おそれがある / Nの+おそれがある",m:"~할 우려가 있다",nu:"좋지 않은 가능성에 대한 경고. 공지·뉴스체.",ex:[{j:"この地震による津波のおそれはありません。",k:"이 지진으로 인한 쓰나미 우려는 없습니다."},{j:"この薬は副作用のおそれがあるので、医者の指示に従って飲んでください。",k:"이 약은 부작용 우려가 있으니 의사의 지시에 따라 복용하세요."}],lv:"문어체",freq:"★★★",sim:"かもしれない / かねない",warn:"공식 문서·방송에서 씀. かねない는 비판적 가능성, おそれ는 중립적 경고."},
  {n:"10",g:"折（に）",c:"V辞書形+折に / Vた+折に / Nの+折に",m:"~할 때, ~하는 기회에",nu:"정중하고 딱딱한 표현. 기회가 있을 때.",ex:[{j:"このことは今度お目にかかった折に詳しくお話しいたします。",k:"이 일은 다음에 뵈었을 때 자세히 말씀드리겠습니다."},{j:"先月北海道に行った折、偶然昔の友達に会った。",k:"지난달 홋카이도에 갔을 때 우연히 옛 친구를 만났다."}],lv:"문어체",freq:"★☆☆",sim:"際に / 機会があれば",warn:"매우 딱딱한 경어 표현. 비즈니스 메일이나 편지에서 자주 등장."},
  {n:"11",g:"甲斐があって",c:"Vた+甲斐があって / Nの+甲斐があって",m:"~한 보람이 있어서",nu:"노력·시간·돈을 들인 결과 좋은 성과가 나옴.",ex:[{j:"この子は教えたことはすぐ覚えるので、教えがいがある。",k:"이 아이는 가르친 것을 바로 외우므로 가르칠 보람이 있다."},{j:"時間とお金を使って遠くまで来たかいもなく、名物の桜はほとんど散ってしまっていた。",k:"시간과 돈을 들여 멀리 왔지만 보람도 없이 벚꽃은 거의 져 있었다."}],lv:"중립",freq:"★★☆",sim:"だけあって",warn:"甲斐がある는 \\\'노력에 보람\\\', だけあって는 \\\'그만한 이유가 있어 납득\\\'. 초점이 다름."},
  {n:"12",g:"かぎり（は）",c:"V辞書形+かぎり / Vている+かぎり",m:"~하는 한, ~인 한",nu:"조건이 유지되는 동안 뒤 내용도 성립.",ex:[{j:"小川氏がこの学校の校長でいるかぎり、校則は変えられないだろう。",k:"오가와 씨가 이 학교 교장으로 있는 한 교칙은 바뀌지 않을 것이다."},{j:"体が丈夫なかぎり、思い切り社会活動をしたいものだ。",k:"몸이 건강한 한 마음껏 사회활동을 하고 싶다."}],lv:"중립",freq:"★★★",sim:"間は / ないかぎり",warn:"「かぎり」는 조건 유지, 「間は」는 단순 기간. 의지 표현 여부로 구별."},
  {n:"13",g:"かぎり（한계）",c:"V辞書形+かぎり / V可能形+かぎり",m:"~할 수 있는 한, ~하는 한",nu:"가능한 범위 내에서 최대한.",ex:[{j:"さあ、いよいよ明日は入学試験だ。力のかぎり頑張ってみよう。",k:"자, 드디어 내일은 입학시험이다. 힘껏 노력해 보자."},{j:"できるかぎりのことはいたしますから。",k:"가능한 한의 일은 하겠습니다."}],lv:"중립",freq:"★★☆",sim:"できるだけ / なるべく",warn:"「力のかぎり」처럼 명사에도 붙음. 가능한 최대를 강조하는 의지적 표현."},
  {n:"14",g:"かぎりだ",c:"いA+かぎりだ / なAな+かぎりだ",m:"너무 ~하다, ~하기 그지없다",nu:"감정의 정도가 매우 큼. 문어적.",ex:[{j:"明日彼が3年ぶりにアフリカから帰ってくる。うれしいかぎりだ。",k:"내일 그가 3년 만에 아프리카에서 돌아온다. 너무 기쁘다."},{j:"この頃若い人ははっきりと自己主張する。うらやましいかぎりだ。",k:"요즘 젊은 사람들은 자기주장이 뚜렷하다. 부럽기 그지없다."}],lv:"문어체",freq:"★☆☆",sim:"てたまらない / てならない",warn:"문어체 감탄. い형용사·な형용사에만 접속. 동사엔 쓸 수 없음."},
  {n:"15",g:"かぎりでは",c:"V辞書形+かぎりでは / Vた+かぎりでは",m:"~의 한도 내에서는, ~하는 바로는",nu:"자신이 알고 있거나 조사한 범위 안에서 판단.",ex:[{j:"ちょっと話したかぎりでは、彼はいつもとまったくかわらないように思えた。",k:"잠깐 이야기해 본 바로는 그는 평소와 전혀 다르지 않아 보였다."}],lv:"중립",freq:"★★☆",sim:"によると / ところによると",warn:"「かぎりでは」는 자신의 경험·조사 범위, 「によると」는 외부 정보 출처."},
  {n:"16",g:"かける",c:"Vます形語幹+かける",m:"~하다가 말다, 막 ~하려고 하다",nu:"동작이 시작되었지만 완료되지 않음.",ex:[{j:"母は夕食を作りかけて、長電話をしている。",k:"어머니는 저녁을 만들다 말고 긴 전화를 하고 있다."},{j:"こんなところに食べかけのりんごを置いて、あの子はどこへ行ったのだろう。",k:"이런 곳에 먹다 만 사과를 두고 그 아이는 어디로 간 걸까."}],lv:"중립",freq:"★★☆",sim:"ところ（だった） / かけ",warn:"「かけの」로 명사 수식도 됨(食べかけのパン). 완료되지 않은 상태 강조."},
  {n:"17",g:"がたい",c:"Vます形語幹+がたい",m:"~하기 어렵다, ~할 수 없다",nu:"심리적·도덕적·감정적으로 하기 어려움. 딱딱한 표현.",ex:[{j:"あの元気な太郎が病気になるなんて信じがたいことです。",k:"그 건강한 타로가 병에 걸리다니 믿기 어려운 일입니다."},{j:"弱い者をいじめるとは許しがたい行為だ。",k:"약자를 괴롭히다니 용서하기 어려운 행위다."}],lv:"문어체",freq:"★★★",sim:"にくい / づらい",warn:"がたい는 심리적·도덕적 불가, にくい는 물리적 어려움. 「信じがたい」◎, 「信じにくい」△."},
  {n:"18",g:"が~だけに",c:"NがNだけに / 普通形+だけに",m:"~가 ~인 만큼",nu:"앞의 성질·상황 때문에 뒤 결과가 더 강하게 느껴짐.",ex:[{j:"母は今年93歳になった。今は元気だが、歳が歳だけに、病気をすると心配だ。",k:"어머니는 올해 93세다. 지금은 건강하지만 나이가 나이인 만큼 병에 걸리면 걱정된다."}],lv:"중립",freq:"★☆☆",sim:"だけに",warn:"「歳が歳だけに」처럼 동일 명사 반복 패턴. 주로 나이·지위 등 상황 강조에 씀."},
  {n:"19",g:"がち",c:"Vます形語幹+がち / N+がち",m:"자주 ~하다, ~하기 쉽다",nu:"좋지 않은 경향이 자주 나타남.",ex:[{j:"田中さんは留守がちだから、電話してもいないことが多い。",k:"다나카 씨는 집을 자주 비워서 전화해도 없는 일이 많다."},{j:"環境破壊の問題は自分の目に迫ってこないと、無関心になりがちである。",k:"환경 파괴 문제는 눈앞에 닥치지 않으면 무관심해지기 쉽다."}],lv:"중립",freq:"★★★",sim:"っぽい / やすい",warn:"がち는 나쁜 경향, やすい는 중립적 경향. 「病気がち」는 O, 「成功がち」는 X."},
  {n:"20",g:"（か）と思うと",c:"Vた+かと思うと / V辞書形+かと思うと",m:"~했다고 생각한 순간, ~하자마자",nu:"앞 동작 직후 바로 뒤 동작이 일어남. 빠른 변화에 놀람.",ex:[{j:"あの子はやっと勉強を始めたと思ったら、もう居眠りをしている。",k:"그 아이는 겨우 공부를 시작했다 싶더니 벌써 졸고 있다."}],lv:"중립",freq:"★★☆",sim:"たとたん / か~ないかのうちに",warn:"話者の놀람이 포함됨. たとたん보다 더 시간 간격이 짧음."},
  {n:"21",g:"か~ないかのうちに",c:"V辞書形+か+Vない形+ないかのうちに",m:"~하자마자, 채 ~되기도 전에",nu:"거의 동시에 일어나는 빠른 변화.",ex:[{j:"彼はいつも終了のベルが鳴ったか鳴らないかのうちに、教室を飛び出していく。",k:"그는 항상 종료 벨이 울리자마자 교실을 뛰쳐나간다."}],lv:"중립",freq:"★★☆",sim:"たとたん / やいなや",warn:"「鳴ったか鳴らないかのうちに」처럼 동사를 반복. 거의 동시 발생 강조."},
  {n:"22",g:"かねない",c:"Vます形語幹+かねない",m:"~할 수도 있다, ~하게 될 수도 있다",nu:"나쁜 결과가 생길 가능성.",ex:[{j:"そんな乱暴な運転をしたら事故を起こしかねないよ。",k:"그렇게 난폭하게 운전하면 사고를 낼 수도 있다."}],lv:"중립",freq:"★★★",sim:"かもしれない / おそれがある",warn:"화자가 나쁜 결과를 경고할 때 씀. 주어는 제3자의 행동인 경우가 많음."},
  {n:"23",g:"かねる",c:"Vます形語幹+かねる",m:"~하기 어렵다, ~할 수 없다",nu:"정중하게 거절하거나 곤란함을 표현.",ex:[{j:"ただ今のご説明では、私どもとしては納得しかねます。",k:"지금 설명만으로는 저희로서는 납득하기 어렵습니다."}],lv:"문어체",freq:"★★★",sim:"にくい / がたい",warn:"완곡한 거절·사양. 비즈니스 일본어에서 매우 자주 등장. 「しかねます」형태로 자주 씀."},
  {n:"24",g:"かのように",c:"普通形+かのように / Nである+かのように",m:"~인 것처럼",nu:"실제는 아니지만 그렇게 보임.",ex:[{j:"4月になって雪が降るなんて、まるで冬が戻ってきたかのようです。",k:"4월에 눈이 오다니 마치 겨울이 돌아온 것 같다."}],lv:"중립",freq:"★★☆",sim:"ように / らしい",warn:"실제는 아닌 가상 상황을 표현. 「まるで～かのように」형태가 전형적."},
  {n:"25",g:"からいうと",c:"N+からいうと",m:"~만 본다면, ~를 생각하면",nu:"특정 관점에서 판단.",ex:[{j:"教師の私の立場からいうと、試験はあまり多くない方がいいのです。",k:"교사인 제 입장에서 보면 시험은 너무 많지 않은 편이 좋습니다."}],lv:"중립",freq:"★★☆",sim:"からして / からすると",warn:"「からいうと」는 관점 제시, 「からすると」는 특정 입장에서의 판단. 미묘하게 다름."},
  {n:"26",g:"からして",c:"N+からして",m:"우선 ~부터",nu:"대표 예시 하나만 봐도 전체가 그렇다는 느낌.",ex:[{j:"この職場には時間を守らない人が多い。係長からしてよく遅刻する。",k:"이 직장에는 시간을 안 지키는 사람이 많다. 계장부터 자주 지각한다."}],lv:"중립",freq:"★★☆",sim:"からいうと / からみると",warn:"예시 하나로 전체를 대표. 비판적 뉘앙스가 강함. 「名前からしておかしい」처럼 씀."},
  {n:"27",g:"からすると",c:"N+からすると",m:"~입장에서 본다면",nu:"어떤 입장·관점에서 판단.",ex:[{j:"米を作る農家からすると、涼しい夏はあまりありがたくないことだ。",k:"쌀 농가 입장에서 보면 서늘한 여름은 별로 달갑지 않다."}],lv:"중립",freq:"★★☆",sim:"からいうと / にしたら",warn:"「からすると」와 「にしたら」는 거의 같은 의미. にしたら는 특정 인물에 한정."},
  {n:"28",g:"からといって",c:"普通形+からといって",m:"~라고 해서",nu:"앞 이유만으로 뒤 결론이 반드시 성립하지 않음.",ex:[{j:"アメリカに住んでいたからといって、英語がうまいとは限らない。",k:"미국에 살았다고 해서 영어를 잘한다고는 할 수 없다."}],lv:"중립",freq:"★★★",sim:"からには / ので",warn:"「からといって」뒤에는 반드시 부정·제한 표현이 옴. 「とは限らない」「わけではない」와 짝."},
  {n:"29",g:"気味",c:"Vます形語幹+気味 / N+気味",m:"왠지 ~한 느낌, 약간 ~기미",nu:"좋지 않은 상태가 약간 있음.",ex:[{j:"今日はちょっと風邪気味なので、早めに帰らせてください。",k:"오늘은 조금 감기 기운이 있어서 일찍 돌아가게 해 주세요."}],lv:"중립",freq:"★★☆",sim:"がち / っぽい",warn:"부정적 경향 소량. 「疲れ気味」처럼 상태 명사나 Vます형에 붙음. 「嬉しい気味」는 X."},
  {n:"30",g:"きらいがある",c:"V辞書形+きらいがある / Nの+きらいがある",m:"~하는 경향이 있다",nu:"바람직하지 않은 경향을 지적.",ex:[{j:"あの人の話はいつも大げさになるきらいがある。",k:"저 사람 이야기는 항상 과장되는 경향이 있다."}],lv:"문어체",freq:"★☆☆",sim:"がち / 傾向がある",warn:"문어적·지적 표현. 주로 비판적 평가에서 씀. 회화에서는 거의 안 씀."},
  {n:"31",g:"きり",c:"Vた+きり / N+きり",m:"~인 채, ~한 채",nu:"그 뒤로 상태가 계속됨. 기대한 변화가 없음.",ex:[{j:"彼女には去年一度会ったきりです。",k:"그녀와는 작년에 한 번 만난 것이 전부입니다."}],lv:"중립",freq:"★★☆",sim:"まま / っぱなし",warn:"「会ったきり」= 그 후 연락 없음. まま는 단순 상태 유지, きり는 변화 없음을 한탄."},
  {n:"32",g:"きる/きれる/きれない",c:"Vます形語幹+きる/きれる/きれない",m:"완전히 ~하다 / 다 ~할 수 없다",nu:"끝까지 완료하거나 한계까지 도달.",ex:[{j:"5冊まである長い小説を夏休み中に全部読みきった。",k:"5권짜리 긴 소설을 여름방학 중에 전부 다 읽었다."}],lv:"중립",freq:"★★★",sim:"しまう / 抜く",warn:"「きれない」는 한계 초과. 「信じきれない」처럼 심리 동사에도 씀."},
  {n:"33",g:"くせに",c:"普通形+くせに / Nの+くせに",m:"~인 주제에, ~이면서",nu:"비난·불만. 상대를 깎아내리는 느낌.",ex:[{j:"今度入社した人は、新人のくせに挨拶もしない。",k:"이번에 입사한 사람은 신입 주제에 인사도 하지 않는다."}],lv:"회화체",freq:"★★☆",sim:"のに / ながら",warn:"비난·불만의 감정 포함. 중립적 역접 のに와 달리 화자 감정이 강함. 격식체에선 X."},
  {n:"34",g:"くらいなら",c:"V辞書形+くらいなら",m:"~정도라면, 차라리 ~겠다",nu:"앞 상황보다 뒤 선택이 낫다는 비교.",ex:[{j:"自由がなくなるくらいなら、一生独身でいる方がいい。",k:"자유가 없어질 정도라면 평생 독신으로 있는 편이 낫다."}],lv:"중립",freq:"★★☆",sim:"より～ほうがいい / ものなら",warn:"「死ぬくらいなら」같은 극단 비교도 가능. 뒤에는 화자가 선호하는 대안이 옴."},
  {n:"35",g:"げ",c:"いA語幹+げ / なA語幹+げ",m:"~인 듯한, ~인 듯이",nu:"겉으로 보이는 분위기·기색.",ex:[{j:"会議の後、彼はいかにも不満ありげな顔をしている。",k:"회의 후 그는 정말 불만 있는 듯한 표정을 하고 있다."}],lv:"중립",freq:"★☆☆",sim:"そう / らしい",warn:"「悲しげ」처럼 형용사 어간에 붙어 외관 기색을 나타냄. 「悲しそう」는 더 직접적 추측."},
  {n:"36",g:"ことか",c:"普通形+ことか",m:"얼마나 ~했는지",nu:"감탄·강한 감정.",ex:[{j:"1点差で優勝を逃したとは、なんと残念なことか。",k:"1점 차로 우승을 놓치다니 얼마나 아쉬운 일인가."}],lv:"문어체",freq:"★★☆",sim:"ことだろう / ものか",warn:"「なんと～ことか」형태가 전형. 문어적 감탄. 의문문처럼 보이지만 감탄임."},
  {n:"37",g:"ことだ（감탄）",c:"いA+ことだ / なAな+ことだ",m:"정말 ~하다",nu:"감탄.",ex:[{j:"ここで遊んだのは、もう30年も前のことだ。懐かしいことだ。",k:"여기서 놀았던 것은 벌써 30년 전 일이다. 정말 그립다."}],lv:"문어체",freq:"★☆☆",sim:"ものだ / ことか",warn:"形容詞에만 붙는 감탄 용법. 동사엔 붙을 수 없음."},
  {n:"38",g:"ことだ（충고）",c:"V辞書形+ことだ / Vない形+ことだ",m:"~해야 한다",nu:"조언·충고. 명령보다 부드럽지만 단정적.",ex:[{j:"上級の読解力をつけたいのなら、毎日、新聞を読むことだ。",k:"고급 독해력을 기르고 싶다면 매일 신문을 읽는 것이다."}],lv:"중립",freq:"★★☆",sim:"べきだ / ものだ",warn:"「～ことだ」는 부드러운 충고. べきだ보다 위압감이 낮음. 동사 기본형·ない형에 접속."},
  {n:"39",g:"ことだし",c:"普通形+ことだし",m:"~하고 있고, ~하기도 하고",nu:"이유 중 하나를 들어 판단을 제안.",ex:[{j:"雨も降っていることだし、4時になったからそろそろ終わりにしましょう。",k:"비도 오고 있고 4시도 되었으니 슬슬 끝냅시다."}],lv:"회화체",freq:"★☆☆",sim:"し / ので",warn:"회화체. 여러 이유 중 하나를 들어 제안. し와 달리 「ことだし」만으로도 결론 도출 가능."},
  {n:"40",g:"ことだろう",c:"普通形+ことだろう",m:"얼마나 ~한 것인가",nu:"감탄·추측. 문어적.",ex:[{j:"気の合った友だちと酒を飲みながら話すのはなんて楽しいことだろう。",k:"마음 맞는 친구와 술을 마시며 이야기하는 것은 얼마나 즐거운 일인가."}],lv:"문어체",freq:"★☆☆",sim:"ことか / ものだ",warn:"문어적 감탄 추측. ことか보다 감탄의 강도가 약간 낮음. 詩·수필에 자주 등장."},
  {n:"41",g:"こととなると",c:"N+のこととなると",m:"~가 화제가 되면, ~소리만 들으면",nu:"특정 화제에는 태도가 달라짐.",ex:[{j:"山川さんは釣りのこととなると目が輝く。",k:"야마카와 씨는 낚시 얘기만 나오면 눈이 빛난다."}],lv:"중립",freq:"★☆☆",sim:"となると / というと",warn:"특정 화제에 갑자기 열정을 보이는 패턴. 주로 취미·전문 분야에 씀."},
  {n:"42",g:"ことなく",c:"V辞書形+ことなく",m:"~하지 않고",nu:"딱딱한 문어체. ないで와 비슷.",ex:[{j:"彼は生活のため、休日も休むことなく働いた。",k:"그는 생활을 위해 휴일에도 쉬지 않고 일했다."}],lv:"문어체",freq:"★★☆",sim:"ないで / ずに",warn:"문어체. 「ないで」를 격식 표현으로 바꾼 것. 신문·문학에서 자주 등장."},
  {n:"43",g:"ことに（は）",c:"感情形容詞+ことに（は）",m:"~할 일은, ~한 것은",nu:"감정을 먼저 제시하고 뒤에 이유를 말함.",ex:[{j:"うれしいことに、来年カナダに留学できそうだ。",k:"기쁘게도 내년에 캐나다에 유학할 수 있을 것 같다."}],lv:"중립",freq:"★★★",sim:"ことに",warn:"감정 형용사(うれしい, 悲しい, 驚いた 등)에만 씀. 뒤 문장에 그 이유가 옴."},
  {n:"44",g:"際（に）",c:"V辞書形+際に / Vた+際に / Nの+際に",m:"~일 때는, ~때",nu:"공식적·정중한 '때'.",ex:[{j:"非常の際はエレベーターを使わずに、階段をご利用ください。",k:"비상시에는 엘리베이터를 쓰지 말고 계단을 이용해 주세요."}],lv:"문어체",freq:"★★★",sim:"とき / 折に / にあたって",warn:"공식적·정중한 표현. 「非常の際」처럼 공고·안내문에 자주 쓰임."},
  {n:"45",g:"最中（に）",c:"Vている+最中に / Nの+最中に",m:"~하는 중에",nu:"한창 진행 중인 바로 그때.",ex:[{j:"新入社員の小林さんは、会議の最中に居眠りをした。",k:"신입사원 고바야시 씨는 회의 중에 졸았다."}],lv:"중립",freq:"★★☆",sim:"ているところに / ながら",warn:"「最中に」는 한창 진행 중을 강조. 「ているところに」보다 더 강조적."},
  {n:"46",g:"ざるを得ない",c:"Vない形語幹+ざるを得ない / する→せざるを得ない",m:"~할 수밖에 없다, ~해야 한다",nu:"다른 선택지가 없어 마지못해 함.",ex:[{j:"会社が倒産したのは社長に責任があるとは言わざるを得ない。",k:"회사가 도산한 것은 사장에게 책임이 있다고 말할 수밖에 없다."}],lv:"문어체",freq:"★★★",sim:"しかない / わけにはいかない",warn:"「する」만 例外的으로 「せざるを得ない」. 가장 빈출 오류 포인트. ない형에서 ない를 뺀 형태."},
  {n:"47",g:"次第",c:"Vます形語幹+次第",m:"~되는 대로, ~하는 즉시",nu:"앞 일이 완료되면 바로 뒤 행동.",ex:[{j:"向こうから連絡があり次第、出発しましょう。",k:"저쪽에서 연락이 오는 대로 출발합시다."}],lv:"문어체",freq:"★★★",sim:"たら / てから",warn:"「連絡があり次第」처럼 즉시성 강조. Vます형에 붙고, たら와 달리 완료 즉시 행동."},
  {n:"48",g:"次第だ",c:"普通形+次第だ",m:"~입니다, ~인 까닭에",nu:"사정·경위를 정중히 설명.",ex:[{j:"部長から帰れという連絡が入りまして、急いで帰ってきた次第です。",k:"부장님에게서 돌아오라는 연락이 와서 급히 돌아온 것입니다."}],lv:"문어체",freq:"★☆☆",sim:"わけだ / のだ",warn:"경위·사정 설명. 비즈니스 메일에서 자주 쓰임. 뒤에 です/ます가 항상 따라옴."},
  {n:"49",g:"次第で/次第では",c:"N+次第で / N+次第では",m:"~에 따라서, ~에 달렸다",nu:"결과가 조건에 의해 달라짐.",ex:[{j:"私はその日の天気次第で、1日の行動の予定を決めます。",k:"저는 그날 날씨에 따라 하루 일정을 정합니다."}],lv:"중립",freq:"★★★",sim:"によって / に応じて",warn:"「結果次第で」처럼 N+次第で. 결과가 완전히 조건에 달려있다는 뉘앙스 강조."},
  {n:"50",g:"すえ（に）",c:"Vた+すえに / Nの+すえに",m:"~한 끝에",nu:"오랜 과정 끝의 결론. あげく보다 중립적.",ex:[{j:"帰国するというのは、さんざん迷った末に出した結論です。",k:"귀국한다는 것은 한참 고민한 끝에 내린 결론입니다."}],lv:"중립",freq:"★★☆",sim:"あげく / 結果",warn:"すえに는 중립~긍정 결과도 가능. あげく는 부정 결과에 한정. 핵심 차이점."},
  {n:"51",g:"ずじまい",c:"Vない形語幹+ずじまい",m:"~하지 못하고 끝났다",nu:"하려고 했지만 결국 못함.",ex:[{j:"あの映画も終わってしまった。あんなに見たいと思っていたのに、とうとう見ずじまいだった。",k:"그 영화도 끝나 버렸다. 그렇게 보고 싶었는데 결국 못 봤다."}],lv:"중립",freq:"★☆☆",sim:"ないまま / ことができなかった",warn:"하려다 결국 못 한 아쉬움. 「見ずじまい」처럼 ない형 어근에 붙음. する→せずじまい."},
  {n:"52",g:"ずにはいられない",c:"Vない形語幹+ずにはいられない",m:"~하지 않고는 견딜 수 없다",nu:"감정·충동을 억누를 수 없음.",ex:[{j:"お腹が痛くて声を出さずにはいられなかった。",k:"배가 아파서 소리를 내지 않고는 견딜 수 없었다."}],lv:"중립",freq:"★★☆",sim:"ないではいられない / てたまらない",warn:"ずにはいられない는 문어적, ないではいられない는 구어적. 의미는 동일."},
  {n:"53",g:"たいものだ",c:"Vます形語幹+たいものだ",m:"정말 ~하고 싶다",nu:"강한 소망. 약간 감상적.",ex:[{j:"今年こそ海外旅行をしたいものだ。",k:"올해야말로 해외여행을 가고 싶다."}],lv:"중립",freq:"★☆☆",sim:"ほしい / てほしいものだ",warn:"화자 자신의 소망. 「～てほしいものだ」는 타인에 대한 바람. 주어가 다름."},
  {n:"54",g:"だけあって",c:"普通形+だけあって / N+だけあって",m:"~이었던 만큼, ~이었기 때문에",nu:"그만한 이유가 있어 기대대로라는 긍정 평가.",ex:[{j:"木村さんは10年も北京に住んでいただけあって、北京のことは何でも知っている。",k:"기무라 씨는 10년이나 베이징에 산 만큼 베이징에 대해 뭐든 안다."}],lv:"중립",freq:"★★★",sim:"だけに / だけのことはある",warn:"긍정적 기대 충족. 「さすが～だけあって」형태가 전형. 비판엔 쓸 수 없음."},
  {n:"55",g:"だけに（긍정）",c:"普通形+だけに / N+だけに",m:"~인 만큼, ~이기 때문에",nu:"앞 사실 때문에 뒤가 더 당연하거나 강하게 느껴짐.",ex:[{j:"辻さんは子供の時からイギリスで教育を受けただけに、きれいな英語を話す。",k:"츠지 씨는 어릴 때부터 영국에서 교육받은 만큼 깨끗한 영어를 한다."}],lv:"중립",freq:"★★★",sim:"だけあって / からこそ",warn:"だけに는 당연한 결과, からこそ는 역설적 강조. 뉘앙스가 미묘하게 다름."},
  {n:"56",g:"だけに（역접）",c:"普通形+だけに / N+だけに",m:"~때문에, ~이기에（역설적）",nu:"예상과 반대 결과가 와서 더 아쉽거나 의외임.",ex:[{j:"普段から体が丈夫なだけに、かえって癌の発見が遅れたのだそうだ。",k:"평소 몸이 건강했기 때문에 오히려 암 발견이 늦었다고 한다."}],lv:"중립",freq:"★★☆",sim:"のに / ばかりに",warn:"같은 「だけに」지만 역접 용법은 아쉬움·실망을 표현. 문맥으로 구별 필요."},
  {n:"57",g:"だけの",c:"V辞書形+だけの+N",m:"~할 만한, ~할 만큼의",nu:"그 정도의 가치·자격·이유가 있음.",ex:[{j:"この本を買いたいが、5000円払うだけの価値があるだろうか。",k:"이 책을 사고 싶지만 5000엔을 낼 만한 가치가 있을까."}],lv:"중립",freq:"★★☆",sim:"ほどの / くらいの",warn:"「だけの価値がある」처럼 가치·자격 판단에 씀. 뒤에 명사가 반드시 옴."},
  {n:"58",g:"たところ",c:"Vた+ところ",m:"~했더니, ~했는데",nu:"어떤 행동 후 새로 알게 된 결과.",ex:[{j:"昔住んでいた町を訪ねたところ、全く様子が変わっていて迷ってしまった。",k:"예전에 살던 동네를 찾아갔더니 완전히 모습이 바뀌어 길을 잃었다."}],lv:"중립",freq:"★★★",sim:"たら / と（결과）",warn:"「たところ」는 시도 후 발견. 과거 사실에만 씀. 미래 가정에는 쓸 수 없음."},
  {n:"59",g:"たところで",c:"Vた+ところで",m:"~해봤자, ~한다고 해도",nu:"해도 원하는 결과가 나오지 않음.",ex:[{j:"いくら働いたところで、こう物価が高くては生活は楽にはならない。",k:"아무리 일해 봤자 이렇게 물가가 높아서는 생활이 편해지지 않는다."}],lv:"중립",freq:"★★☆",sim:"ても / ものの",warn:"「いくら～たところで」형태가 전형. 반드시 부정적 결론이 뒤에 옴."},
  {n:"60",g:"たとたん（に）",c:"Vた+とたんに",m:"~하자마자, ~한 순간",nu:"바로 뒤에 예상 밖 일이 발생.",ex:[{j:"ずっと本を読んでいて急に立ち上がったとたん、めまいがしました。",k:"계속 책을 읽다가 갑자기 일어난 순간 어지러웠다."}],lv:"중립",freq:"★★★",sim:"と同時に / やいなや / かと思うと",warn:"主語가 바뀌어도 OK. 예상 밖 사건이 잇따를 때 씀. 의지 표현 뒤에는 X."},
  {n:"61",g:"たび（に）",c:"V辞書形+たびに / Nの+たびに",m:"~할 때마다",nu:"매번 반복.",ex:[{j:"あの人は会うたびにおもしろい話を聞かせてくれる。",k:"그 사람은 만날 때마다 재미있는 이야기를 들려준다."}],lv:"중립",freq:"★★☆",sim:"ごとに / につけ",warn:"「会うたびに」처럼 반복 상황에서 항상 같은 결과. ごとに는 규칙적 간격 강조."},
  {n:"62",g:"だらけ",c:"N+だらけ",m:"~투성이",nu:"좋지 않은 것이 많이 묻거나 가득함.",ex:[{j:"ケンカでもしたのか、彼は傷だらけになって帰ってきた。",k:"싸움이라도 했는지 그는 상처투성이가 되어 돌아왔다."}],lv:"중립",freq:"★★☆",sim:"まみれ / ばかり",warn:"だらけ는 바람직하지 않은 것이 가득. まみれ는 표면에 묻음(진흙·피 등). 대상이 다름."},
  {n:"63",g:"っこない",c:"Vます形語幹+っこない",m:"~할 리가 없다",nu:"강한 부정. 회화적.",ex:[{j:"こんな難しい本を買ってやったって、小学校1年生の太郎にはわかりっこない。",k:"이런 어려운 책을 사 줘 봤자 초등학교 1학년 타로에게는 알 리가 없다."}],lv:"회화체",freq:"★☆☆",sim:"はずがない / わけがない",warn:"매우 구어적. 「わかりっこない」처럼 Vます형에 붙음. 격식체에선 절대 X."},
  {n:"64",g:"つつ（역접）",c:"Vます形語幹+つつ",m:"~하면서도",nu:"알고 있지만 반대로 행동. 역접.",ex:[{j:"悪いと知りつつ、友だちの宿題の答えを書いてそのまま出してしまった。",k:"나쁘다는 걸 알면서도 친구 숙제 답을 써서 그대로 제출했다."}],lv:"문어체",freq:"★★★",sim:"ながら（역접） / のに",warn:"つつ는 문어적, ながら는 구어적. 「知りつつ」는 의도적 역행이 더 강함."},
  {n:"65",g:"つつ（동시）",c:"Vます形語幹+つつ",m:"~하면서",nu:"동시 진행. 문어적.",ex:[{j:"山に登りつつ、人は人生についてさまざまなことを考える。",k:"산에 오르면서 사람은 인생에 대해 여러 가지를 생각한다."}],lv:"문어체",freq:"★★☆",sim:"ながら（동시） / て",warn:"동시 동작. ながら는 주동작이 명확하지만 つつ는 양쪽이 동등한 느낌. 문어적."},
  {n:"66",g:"つつある",c:"Vます形語幹+つつある",m:"~하고 있는, 점점 ~해 가고 있다",nu:"변화가 진행 중. 문어적.",ex:[{j:"職場の環境は改善されつつある。",k:"직장 환경은 개선되고 있다."}],lv:"문어체",freq:"★★★",sim:"ていく / てくる",warn:"진행 중인 변화를 문어적으로 표현. 신문·보고서에서 자주 등장. ていく는 더 구어적."},
  {n:"67",g:"っぱなし",c:"Vます形語幹+っぱなし",m:"계속~한 상태, 계속~인 채",nu:"방치된 상태. 보통 부정적.",ex:[{j:"道具が出しっぱなしだよ。使ったら、片付けなさい。",k:"도구가 꺼낸 채로 있잖아. 썼으면 치워라."}],lv:"회화체",freq:"★★☆",sim:"まま / きり",warn:"방치·방임의 불만. 「出しっぱなし」처럼 부정적 상태 유지. まま보다 감정적."},
  {n:"68",g:"っぽい",c:"N+っぽい / Vます形語幹+っぽい",m:"~같은 느낌이 들다, 자주 그렇게 ~한다",nu:"그런 성질이 강해 보임. 약간 부정적일 수 있음.",ex:[{j:"君子はもう20歳なのに話すことが子供っぽい。",k:"기미코는 벌써 20살인데 말하는 것이 아이 같다."}],lv:"회화체",freq:"★★☆",sim:"らしい / げ / みたい",warn:"「子供っぽい」처럼 부정적 뉘앙스 多. らしい는 긍정적 전형성. 구어체 표현."},
  {n:"69",g:"て以来",c:"Vて+以来 / N+以来",m:"~한 이후, ~한 후",nu:"어떤 시점부터 지금까지 계속.",ex:[{j:"一人暮らしを始めて以来、ずっと外食が続いている。",k:"혼자 살기 시작한 이후 계속 외식이 이어지고 있다."}],lv:"중립",freq:"★★☆",sim:"てから / 以降",warn:"「以来」는 지금도 계속되는 상태에 씀. 단순 순서 てから와 달리 현재까지의 지속 강조."},
  {n:"70",g:"てこそ",c:"Vて+こそ",m:"~해야 비로소",nu:"앞 조건이 있어야 뒤 평가가 성립.",ex:[{j:"試合に勝ってこそ、プロのスポーツ選手と言える。",k:"시합에서 이겨야 비로소 프로 스포츠 선수라고 할 수 있다."}],lv:"중립",freq:"★★☆",sim:"てはじめて / からこそ",warn:"「てこそ」는 조건 충족 후 비로소. 「てはじめて」도 유사하나 てこそ가 더 강조적."},
  {n:"71",g:"てたまらない",c:"Vて+たまらない / いAくて+たまらない",m:"~해서 견딜 수 없다",nu:"감정·감각이 너무 강함.",ex:[{j:"風邪薬を飲んだから、眠くてたまらない。",k:"감기약을 먹어서 졸려 견딜 수 없다."}],lv:"중립",freq:"★★★",sim:"てならない / てしょうがない",warn:"세 표현 모두 \\\'견딜 수 없음\\\'이지만: たまらない=생리적·충동적, ならない=자연스러운 감정, しょうがない=구어."},
  {n:"72",g:"てでも",c:"Vて+でも",m:"~해서라도",nu:"수단을 가리지 않고 하겠다는 강한 의지.",ex:[{j:"駆け落ちしてでも、私は彼女と結婚する。",k:"도망쳐서라도 나는 그녀와 결혼하겠다."}],lv:"중립",freq:"★☆☆",sim:"までして / とも",warn:"극단적 수단도 감수하겠다는 강한 의지. 부정적·무모한 상황에도 씀."},
  {n:"73",g:"てならない",c:"Vて+ならない / いAくて+ならない",m:"~해서 견딜 수 없다（자연스러운 감정）",nu:"감정이 자연스럽게 강하게 솟음.",ex:[{j:"地球温暖化の問題を考えると、子供たちの将来のことが気になってならない。",k:"지구온난화 문제를 생각하면 아이들의 미래가 걱정되어 견딜 수 없다."}],lv:"문어체",freq:"★★☆",sim:"てたまらない / てしょうがない",warn:"자연스럽게 솟아오르는 감정. 의지로 억제가 안 됨. 문어적. 「気になってならない」가 전형."},
  {n:"74",g:"てはかなわない",c:"Vて+はかなわない",m:"~해서 견딜 수 없다（불만）",nu:"피해·불편을 견디기 어렵다는 불만.",ex:[{j:"課長にこう毎晩のように飲みに誘われてはかなわない。",k:"과장에게 이렇게 매일 밤처럼 술자리에 불리면 견딜 수 없다."}],lv:"중립",freq:"★☆☆",sim:"てたまらない / ては困る",warn:"피해·불편에 대한 불만·항의. 「こう～ては」형태와 자주 짝을 이룸."},
  {n:"75",g:"ではないか（감동）",c:"普通形+ではないか",m:"~는 것이 아닌가",nu:"감동·확인·강한 판단.",ex:[{j:"この犬は私の喜びや悲しみをみんなわかってくれるではありませんか。",k:"이 개는 나의 기쁨과 슬픔을 모두 알아주지 않습니까."}],lv:"중립",freq:"★★☆",sim:"じゃないか / ではありませんか",warn:"발화자 자신의 발견·감탄. 「ではありませんか」는 더 정중. 의문이 아님에 주의."},
  {n:"76",g:"ではないか（제안）",c:"普通形+ではないか",m:"~이지 않느냐",nu:"상대에게 판단을 촉구하거나 제안.",ex:[{j:"外は大雪じゃありませんか。こんな日に外出するのは危険ですよ。",k:"밖은 폭설이지 않습니까. 이런 날 외출하는 것은 위험합니다."}],lv:"중립",freq:"★☆☆",sim:"ようではないか / たらどうか",warn:"청자에게 사실을 인식시키고 행동을 촉구. 수사 의문문."},
  {n:"77",g:"てほしいものだ",c:"Vて+ほしいものだ",m:"~하길 바란다, ~해주었으면 좋겠다",nu:"강한 바람·소망.",ex:[{j:"災害がもうこれ以上ひどくならないでほしいものだ。",k:"재해가 더 이상 심해지지 않았으면 좋겠다."}],lv:"중립",freq:"★☆☆",sim:"てほしい / ものだ",warn:"「ものだ」가 붙어 소망이 더 강해짐. 타인에 대한 기대·부탁. ものだ 단독보다 감정적."},
  {n:"78",g:"てもさしつかえない",c:"Vても+さしつかえない",m:"~해도 괜찮다, ~해도 상관없다",nu:"허가·문제없음. 정중한 표현.",ex:[{j:"支払いは今すぐでなくてもさしつかえありません。後でもいいですよ。",k:"지불은 지금 당장이 아니어도 괜찮습니다. 나중이어도 됩니다."}],lv:"문어체",freq:"★☆☆",sim:"てもいい / てもかまわない",warn:"가장 격식체. 비즈니스·공문서에서 허가를 정중하게 표현할 때 씀."},
  {n:"79",g:"というと",c:"N+というと",m:"~라고 하면",nu:"어떤 말에서 연상되는 대표 이미지.",ex:[{j:"スイスというと何が思い浮かべますか。",k:"스위스라고 하면 무엇이 떠오릅니까."}],lv:"중립",freq:"★★☆",sim:"といえば / といったら",warn:"「というと」는 정의·연상, 「といえば」는 화제 전환, 「といったら」는 감탄 강조."},
  {n:"80",g:"というものだ",c:"普通形+というものだ",m:"~라고 할 수밖에 없다",nu:"화자의 평가·단정.",ex:[{j:"あの議員は公費で夫人と私的な海外旅行をした。それは困ったというものだ。",k:"그 의원은 공금으로 부인과 사적 해외여행을 했다. 그것은 곤란한 일이라고 할 수밖에 없다."}],lv:"중립",freq:"★★☆",sim:"わけだ / というわけだ",warn:"화자의 평가·단정. 약간 설교조. 「それというものだ」로도 씀."},
  {n:"81",g:"というものではない",c:"普通形+というものではない",m:"항상 ~라고는 할 수 없다",nu:"일반화·단순 판단을 부정.",ex:[{j:"まじめな人だから仕事ができるというものではない。",k:"성실한 사람이라고 해서 일을 잘한다고는 할 수 없다."}],lv:"중립",freq:"★★☆",sim:"とは限らない / わけではない",warn:"일반론을 부정. 「とは限らない」는 예외 있음, 「というものではない」는 이치가 그렇지 않음."},
  {n:"82",g:"というものは",c:"N+というものは",m:"~라는 것은, ~라고 하는 것은",nu:"어떤 대상의 본질·일반론을 말함.",ex:[{j:"ふるさとというものは遠く離れるといっそう懐かしくなる。",k:"고향이라는 것은 멀리 떨어지면 더욱 그리워진다."}],lv:"중립",freq:"★☆☆",sim:"とは / というのは",warn:"대상의 본질을 일반론으로 논할 때 씀. 格言·경험담에 자주 등장."},
  {n:"83",g:"といえば",c:"N+といえば / 普通形+といえば",m:"~라고 하면, ~라고 한다면",nu:"화제 제시·연상.",ex:[{j:"幼児教育といえば、うちの近くに新しい幼稚園ができたんですよ。",k:"유아교육이라고 하면, 우리 집 근처에 새 유치원이 생겼어요."}],lv:"중립",freq:"★★☆",sim:"というと / にしては",warn:"화제 전환 또는 연상. 「そういえば」와 달리 「といえば」는 주제 명시."},
  {n:"84",g:"とか~といった",c:"N+とか+N+といった+N",m:"~라는, ~라고 하는",nu:"여러 예시를 들어 범주를 나타냄.",ex:[{j:"駅とかレストランとかいった所では、全面禁煙が望ましい。",k:"역이나 레스토랑 같은 곳에서는 전면 금연이 바람직하다."}],lv:"중립",freq:"★☆☆",sim:"など / たり～たり",warn:"예시 열거. 「といった」뒤에 반드시 명사가 옴. 「といった + N」형태."},
  {n:"85",g:"といったら",c:"N+といったら",m:"~은, ~는（강조·감탄）",nu:"정도가 매우 큼. 감탄·강조.",ex:[{j:"この夏の暑さといったらひどかった。",k:"이번 여름 더위는 정말 심했다."}],lv:"회화체",freq:"★☆☆",sim:"というと / ったら",warn:"감탄·강조의 구어체. 「暑さといったら！」처럼 단독으로도 씀."},
  {n:"86",g:"どころか",c:"普通形+どころか / N+どころか",m:"~는커녕, ~는 고사하고",nu:"예상과 정반대이거나 훨씬 심한 사실 제시.",ex:[{j:"休日に子供連れで遊園地に出かけるのは、楽しいどころか苦しみ半分だ。",k:"휴일에 아이를 데리고 놀이공원에 가는 것은 즐겁기는커녕 반쯤 고역이다."}],lv:"중립",freq:"★★★",sim:"はもとより / のみならず",warn:"예상 반전. 뒤에 더 심한 사실이 옴. 「楽しいどころか」= 즐겁기는커녕."},
  {n:"87",g:"ところだった",c:"V辞書形+ところだった",m:"~할 뻔했다",nu:"거의 그렇게 될 상황이었지만 실제로는 피함.",ex:[{j:"誤解がもとで、危うく大切な親友を失うところだった。",k:"오해 때문에 하마터면 소중한 친구를 잃을 뻔했다."}],lv:"중립",freq:"★★☆",sim:"かけた / そうになった",warn:"실제로는 일어나지 않은 아슬아슬한 상황. 과거 사실에만 씀."},
  {n:"88",g:"ところではない",c:"V辞書形+ところではない / Nどころではない",m:"~할 여유는 없다, ~하기는커녕",nu:"상황이 바쁘거나 심각해서 할 수 없음.",ex:[{j:"当時はお金もなく、誕生日といっても祝うどころではなかった。",k:"당시에는 돈도 없어서 생일이라고 해도 축하할 여유가 없었다."}],lv:"중립",freq:"★★☆",sim:"どころか / 余裕がない",warn:"「どころではない」=상황이 그럴 여유가 없음. 감탄사처럼도 씀."},
  {n:"89",g:"ところをみると",c:"普通形+ところをみると",m:"~인 것을 보면",nu:"관찰한 사실을 근거로 추측.",ex:[{j:"部屋の電気がまだついているところをみると、森さんはまだ起きているようだ。",k:"방 불이 아직 켜져 있는 것을 보면 모리 씨는 아직 깨어 있는 듯하다."}],lv:"중립",freq:"★★☆",sim:"からみると / ことから",warn:"관찰 근거로 추측. 「ことから」는 이유 설명, 「ところをみると」는 추측에 초점."},
  {n:"90",g:"として~ない",c:"1+助数詞+として+ない",m:"~도, ~조차도（완전 부정）",nu:"완전 부정. 하나도 없음.",ex:[{j:"火事で焼けてしまったので、私の子供のころの写真は1枚として残っていない。",k:"화재로 타 버려서 내 어린 시절 사진은 한 장도 남아 있지 않다."}],lv:"문어체",freq:"★☆☆",sim:"すら / さえ",warn:"수 표현과 조합. 「1枚として残っていない」처럼 완전 부정. 문어적·강조 표현."},
  {n:"91",g:"とともに",c:"V辞書形+とともに / N+とともに",m:"~와 함께, ~와 같이",nu:"동시 변화 또는 함께함.",ex:[{j:"秋の深まりとともに今年も柿がおいしくなってきた。",k:"가을이 깊어짐과 함께 올해도 감이 맛있어졌다."}],lv:"중립",freq:"★★★",sim:"に伴って / と同時に",warn:"「に伴って」는 변화 수반, 「とともに」는 동시성·동행 모두 가능. 더 넓은 용법."},
  {n:"92",g:"とは",c:"N+とは / 普通形+とは",m:"~라는 것은, ~은, ~는",nu:"정의·설명·화제 제시.",ex:[{j:"赤字とは収入より支出が多いことです。",k:"적자란 수입보다 지출이 많은 것입니다."}],lv:"중립",freq:"★★☆",sim:"というのは / とは何か",warn:"정의 제시 또는 강한 감탄. 「雪が降るとは！」처럼 놀람에도 씀."},
  {n:"93",g:"とはいうものの",c:"普通形+とはいうものの",m:"~라고 하지만",nu:"앞 사실은 인정하지만 실제는 다름.",ex:[{j:"彼は20歳とはいうものの、まだ子供だ。",k:"그는 스무 살이라고는 하지만 아직 아이다."}],lv:"문어체",freq:"★★☆",sim:"ものの / とはいえ",warn:"앞 사실을 인정하면서 역접. 「とはいえ」보다 문어적. 내용 구성 방식은 동일."},
  {n:"94",g:"とは限らない",c:"普通形+とは限らない",m:"~라고는 할 수 없다",nu:"항상 그런 것은 아님.",ex:[{j:"新聞には書いてあることがいつも真実だとは限らない。",k:"신문에 쓰여 있는 것이 항상 진실이라고는 할 수 없다."}],lv:"중립",freq:"★★★",sim:"わけではない / というものではない",warn:"부분 부정. 「いつも～とは限らない」처럼 일반화 오류를 지적할 때 최빈출."},
  {n:"95",g:"ともなると",c:"N+ともなると",m:"~이 되면, ~정도가 되면",nu:"그 정도 단계가 되면 자연히 상황이 달라짐.",ex:[{j:"3人の子の親ともなると、自由時間はかなり制限される。",k:"세 아이의 부모가 되면 자유 시간은 꽤 제한된다."}],lv:"중립",freq:"★★☆",sim:"となると / にもなると",warn:"「社長ともなると」처럼 높은 지위에 도달하면 당연히 따르는 변화를 말함."},
  {n:"96",g:"ない限り",c:"Vない形+限り",m:"~가 없는 한, ~가 없으면",nu:"그 조건이 없으면 뒤 일이 성립하지 않음.",ex:[{j:"この建物は許可がない限り、見学できません。",k:"이 건물은 허가가 없는 한 견학할 수 없습니다."}],lv:"중립",freq:"★★☆",sim:"なければ / ないと",warn:"조건 부정. 「許可がない限り」= 허가 없으면 불가. 강한 제한 표현."},
  {n:"97",g:"ないことには",c:"Vない形+ことには",m:"~하기 전에는, ~하지 않고서는",nu:"앞 조건이 충족되어야 뒤가 가능.",ex:[{j:"体が健康でないことには、いい仕事はできないだろう。",k:"몸이 건강하지 않고서는 좋은 일을 할 수 없을 것이다."}],lv:"중립",freq:"★★☆",sim:"なければ / ないと",warn:"「ことには」가 붙어 전제 조건을 더 명확히 강조. 뒤에 不可能·困難 표현이 옴."},
  {n:"98",g:"ないことはない",c:"Vない形+ことはない",m:"~하지 않는 것은 아니다, ~하기는 하다",nu:"완전 긍정은 아니지만 가능성·여지는 있음.",ex:[{j:"東京まで快速で20分だから、今すぐ出れば間に合わないことはない。",k:"도쿄까지 쾌속으로 20분이니 지금 바로 나가면 못 맞출 것도 없다."}],lv:"중립",freq:"★★☆",sim:"なくもない / ないでもない",warn:"이중 부정으로 약한 긍정. 세 표현 모두 유사. 직접 긍정보다 망설임 뉘앙스."},
  {n:"99",g:"ないではいられない",c:"Vない形+ではいられない",m:"~하지 않을 수 없다",nu:"감정·충동이 강해 자연히 하게 됨.",ex:[{j:"その話を聞いて、泣かないではいられなかった。",k:"그 이야기를 듣고 울지 않을 수 없었다."}],lv:"중립",freq:"★★☆",sim:"ずにはいられない / てたまらない",warn:"구어적. ずにはいられない는 문어적. 억누를 수 없는 충동 표현으로 세트로 암기."},
  {n:"100",g:"ないでもない",c:"Vない形+でもない",m:"~하지 않는 것은 아니다",nu:"약한 긍정. 가능성은 조금 있음.",ex:[{j:"行きたくないでもないが、今日は少し疲れている。",k:"가고 싶지 않은 것은 아니지만 오늘은 좀 피곤하다."}],lv:"회화체",freq:"★☆☆",sim:"なくもない / ないことはない",warn:"세 표현 중 가장 구어적이고 망설임이 가장 강함. 적극적 동의가 아님에 주의."},
  {n:"101",g:"ないものか",c:"Vない形+ものか",m:"~하지 못하는 것일까",nu:"실현이 어려운 바람·기대.",ex:[{j:"何とかしてもっと安く買えないものか。",k:"어떻게 해서든 더 싸게 살 수는 없을까."}],lv:"중립",freq:"★☆☆",sim:"ものだろうか / てほしいものだ",warn:"실현이 어려운 바람. 「何とかして」와 자주 함께 씀. 독백에 가까운 표현."},
  {n:"102",g:"ながら（역접）",c:"Vます形語幹+ながら / Nながら",m:"~이면서, ~이지만",nu:"역접. 앞 사실과 어긋나는 뒤 내용.",ex:[{j:"彼は学生ながら、会社を経営している。",k:"그는 학생이면서도 회사를 운영하고 있다."}],lv:"중립",freq:"★★★",sim:"つつ / のに",warn:"「学生ながら」처럼 상태·자격에도 씀. つつ는 동작 동시 진행, ながら는 상태 대비도 OK."},
  {n:"103",g:"なくもない",c:"Vない形語幹+なくもない",m:"~하기도 한다, ~하지 않는 것은 아니다",nu:"약한 인정.",ex:[{j:"難しいが、できなくもない。",k:"어렵지만 못 할 것도 없다."}],lv:"중립",freq:"★☆☆",sim:"ないことはない / ないでもない",warn:"약한 긍정. 「できなくもない」= 불가는 아님. 적극성이 낮은 긍정."},
  {n:"104",g:"なんて/なんか/など",c:"N+なんて / なんか / など",m:"~따위, ~라고, ~라니",nu:"가볍게 예시, 낮춤, 놀람·비판.",ex:[{j:"私なんかまだまだ経験が足りません。",k:"저 같은 사람은 아직 경험이 부족합니다."}],lv:"회화체",freq:"★★☆",sim:"など / さえ",warn:"なんて는 가장 구어적이고 경시·놀람 뉘앙스. など는 중립적 열거. 격식체에서 なんて는 X."},
  {n:"105",g:"にあたって",c:"V辞書形+にあたって / N+にあたって",m:"~을 맞이해서, ~함에 있어서",nu:"중요한 시점·행동을 앞두고.",ex:[{j:"新しい仕事を始めるにあたって、十分な準備をした。",k:"새 일을 시작함에 있어서 충분히 준비했다."}],lv:"문어체",freq:"★★★",sim:"際に / に先立って",warn:"중요한 시점·행사에만 씀. 「飯を食べるにあたって」같은 일상 행동엔 부자연스러움."},
  {n:"106",g:"に応じて",c:"N+に応じて",m:"~에 따라서, ~에 상응해서",nu:"상황·조건에 맞춰 변화.",ex:[{j:"状況に応じて、計画を変更する必要がある。",k:"상황에 따라 계획을 변경할 필요가 있다."}],lv:"중립",freq:"★★★",sim:"によって / 次第で",warn:"「状況に応じて」처럼 유동적 대응. によって는 원인·수단도 포함. に応じて는 적응 초점."},
  {n:"107",g:"にかかわらず",c:"N+にかかわらず / 普通形+にかかわらず",m:"~에 관계없이",nu:"조건의 영향을 받지 않음.",ex:[{j:"年齢にかかわらず、誰でも参加できます。",k:"나이에 관계없이 누구나 참가할 수 있습니다."}],lv:"문어체",freq:"★★★",sim:"を問わず / に関係なく",warn:"「雨にかかわらず」처럼 조건 무관. を問わず와 거의 동의이나 にかかわらず가 더 문어적."},
  {n:"108",g:"に限って",c:"N+に限って",m:"~에 한해서, ~만은, ~치고",nu:"하필 그 경우에만. 예외·특별함.",ex:[{j:"忙しい日に限って、急な用事が入る。",k:"바쁜 날에 한해서 갑작스러운 일이 생긴다."}],lv:"중립",freq:"★★☆",sim:"だけ / のみ",warn:"「忙しい日に限って」처럼 하필 그때 일어난다는 아이러니 표현. 긍정·부정 모두 가능."},
  {n:"109",g:"に限らず",c:"N+に限らず",m:"~에 한정되지 않고, ~뿐만 아니라",nu:"범위를 넓힘.",ex:[{j:"日本に限らず、世界中で環境問題が深刻になっている。",k:"일본뿐만 아니라 전 세계에서 환경 문제가 심각해지고 있다."}],lv:"문어체",freq:"★★☆",sim:"のみならず / はもとより",warn:"「日本に限らず」= 일본뿐 아니라. のみならず보다 격식도가 약간 낮음."},
  {n:"110",g:"に限り",c:"N+に限り",m:"~에 한해서, ~만",nu:"조건·대상을 제한. 공지문에서 자주 씀.",ex:[{j:"本日に限り、全品半額です。",k:"오늘에 한해 전품 반값입니다."}],lv:"문어체",freq:"★★☆",sim:"だけ / のみ",warn:"공지·게시문에 자주 쓰이는 표현. 「本日に限り」처럼 조건 제한. 108번 に限って와 구별."},
  {n:"111",g:"にかけては",c:"N+にかけては",m:"~에 있어서는, ~만큼은",nu:"특정 분야에서 뛰어남.",ex:[{j:"数学にかけては、彼に勝てる人はいない。",k:"수학에 있어서는 그를 이길 사람이 없다."}],lv:"중립",freq:"★★☆",sim:"においては / については",warn:"특정 분야 최상의 능력을 강조. 「～に関しては」는 화제 제시, 「にかけては」는 능력 강조."},
  {n:"112",g:"に関して",c:"N+に関して",m:"~에 관해서, ~에 대해서",nu:"화제·대상 제시. 딱딱함.",ex:[{j:"この件に関して、質問があります。",k:"이 건에 관해서 질문이 있습니다."}],lv:"문어체",freq:"★★☆",sim:"について / に関する",warn:"공식적 화제 제시. 「について」보다 딱딱함. 「に関する」는 명사 수식 형태."},
  {n:"113",g:"に加えて",c:"N+に加えて",m:"~에 더해서, ~외에",nu:"추가.",ex:[{j:"雨に加えて、風も強くなってきた。",k:"비에 더해 바람도 강해졌다."}],lv:"중립",freq:"★★☆",sim:"ばかりか / のみならず",warn:"단순 추가. 긍정 추가에도 부정 추가에도 모두 씀. ばかりか는 부정적 추가 강조."},
  {n:"114",g:"にこしたことはない",c:"V辞書形+にこしたことはない",m:"~해서 나쁠 것이 없다, 가장 좋다",nu:"가능하면 그게 최선.",ex:[{j:"準備は早いにこしたことはない。",k:"준비는 빠를수록 좋다."}],lv:"중립",freq:"★☆☆",sim:"ほうがいい / べきだ",warn:"「ないにこしたことはない」= 없는 게 제일 좋음. 조언·당위보다 부드러운 표현."},
  {n:"115",g:"に応えて",c:"N+に応えて",m:"~을 받아들여서, ~에 응해서",nu:"기대·요구·요청에 반응.",ex:[{j:"皆の期待に応えて、彼は優勝した。",k:"모두의 기대에 부응해 그는 우승했다."}],lv:"중립",freq:"★☆☆",sim:"に応じて / に従って",warn:"「期待に応えて」처럼 기대·요구에 부응. に応じて는 상황 적응, に応えて는 요청 수락."},
  {n:"116",g:"に際して",c:"V辞書形+に際して / N+に際して",m:"~함에 있어서, ~할 때（공식）",nu:"공식적 상황에서의 시점.",ex:[{j:"出発に際して、注意事項を説明します。",k:"출발에 앞서 주의사항을 설명하겠습니다."}],lv:"문어체",freq:"★★☆",sim:"にあたって / の際に",warn:"にあたって보다 더 공식적. 행사 개회사·연설·안내문에서 자주 씀."},
  {n:"117",g:"に先立って",c:"N+に先立って",m:"~에 앞서, ~(하)기에 앞서",nu:"먼저 시행되는 절차.",ex:[{j:"会議に先立って、資料を配った。",k:"회의에 앞서 자료를 배포했다."}],lv:"문어체",freq:"★★☆",sim:"の前に / にあたって",warn:"공식적 순서 표현. 「会議に先立って」= 회의 전에 먼저. 의식·행사에서 자주 씀."},
  {n:"118",g:"にしたところで",c:"N+にしたところで",m:"~라고 해서, ~라 한들",nu:"그 경우에도 크게 다르지 않음.",ex:[{j:"彼にしたところで、すぐには答えられないだろう。",k:"그라고 해도 바로 대답하지는 못할 것이다."}],lv:"중립",freq:"★☆☆",sim:"としても / にしても",warn:"「彼にしたところで」= 그라고 해도. にしても와 거의 동의지만 にしたところで가 더 문어적."},
  {n:"119",g:"にしたら",c:"N+にしたら",m:"~입장에서는",nu:"특정 사람의 관점.",ex:[{j:"親にしたら、子供の将来が心配なのは当然だ。",k:"부모 입장에서는 자식의 장래가 걱정되는 것이 당연하다."}],lv:"중립",freq:"★★☆",sim:"からすると / にとって",warn:"특정 인물의 관점. 「にとって」는 영향·가치, 「にしたら」는 관점·심정."},
  {n:"120",g:"にしては",c:"N+にしては / 普通形+にしては",m:"~치고는, ~로서는",nu:"기대·기준과 비교해서 의외.",ex:[{j:"初めてにしては、よくできた。",k:"처음 치고는 잘했다."}],lv:"중립",freq:"★★★",sim:"わりに / くせに",warn:"기대·기준 대비 의외. くせに는 비난 뉘앙스, にしては는 중립적 의외. 주어에 주의."},
  {n:"121",g:"にしても/にしろ/にせよ",c:"普通形+にしても/にしろ/にせよ",m:"~라고 해도",nu:"양보. 그렇다 해도 뒤 내용은 성립.",ex:[{j:"忙しいにしても、連絡ぐらいはできるはずだ。",k:"바쁘다고 해도 연락 정도는 할 수 있을 것이다."}],lv:"중립",freq:"★★★",sim:"としても / でも",warn:"세 형태는 의미가 동일. にせよ가 가장 문어적. 「にしても」가 가장 일반적."},
  {n:"122",g:"にしろ~にしろ",c:"N+にしろ+N+にしろ",m:"~(이)든 ~(이)든",nu:"어느 쪽이든 결과가 같음.",ex:[{j:"行くにしろ行かないにしろ、早く返事してください。",k:"가든 안 가든 빨리 대답해 주세요."}],lv:"중립",freq:"★★☆",sim:"でも～でも / にしても～にしても",warn:"「行くにしろ行かないにしろ」처럼 양쪽 조건 모두 포함. 어느 쪽이든 결과 불변."},
  {n:"123",g:"にすぎない",c:"普通形+にすぎない / N+にすぎない",m:"~에 지나지 않는다, 겨우 ~일 뿐이다",nu:"낮게 평가하거나 제한.",ex:[{j:"これは私の個人的な意見にすぎない。",k:"이것은 내 개인적인 의견에 지나지 않는다."}],lv:"중립",freq:"★★★",sim:"だけだ / ばかりだ",warn:"「個人的な意見にすぎない」처럼 겸손 또는 축소 표현. 뒤에 과소평가 내용이 옴."},
  {n:"124",g:"に相違ない",c:"普通形+に相違ない",m:"~임이 틀림없다",nu:"강한 확신. 문어적.",ex:[{j:"この証拠から見ると、彼が犯人に相違ない。",k:"이 증거로 보면 그가 범인임이 틀림없다."}],lv:"문어체",freq:"★☆☆",sim:"に違いない / はずだ",warn:"「に違いない」와 거의 동의이나 相違ない가 더 문어적·고어적. 법률 문서에서도 씀."},
  {n:"125",g:"に沿って",c:"N+に沿って",m:"~에 따라, ~에 부응해서",nu:"방침·계획·기준을 따름.",ex:[{j:"計画に沿って、作業を進めてください。",k:"계획에 따라 작업을 진행해 주세요."}],lv:"문어체",freq:"★★☆",sim:"に従って / に基づいて",warn:"「計画に沿って」= 계획을 따라. に従って는 명령·규칙 준수, に沿って는 방향·기준 추종."},
  {n:"126",g:"につき",c:"N+につき",m:"~로 인해, ~때문에 / ~당",nu:"공지문·문어체. 이유 또는 단위.",ex:[{j:"工事中につき、通行止めです。",k:"공사 중이므로 통행금지입니다."}],lv:"문어체",freq:"★★☆",sim:"ので / あたり",warn:"이유(工事中につき)와 단위(1人につき) 두 용법. 공지문에서 이유 용법이 자주 출제."},
  {n:"127",g:"につけ（て）",c:"V辞書形+につけ",m:"~할 때마다, ~할 때나 ~할 때나",nu:"어떤 때마다 감정이 떠오름.",ex:[{j:"写真を見るにつけ、故郷を思い出す。",k:"사진을 볼 때마다 고향이 떠오른다."}],lv:"문어체",freq:"★★☆",sim:"たびに / ごとに",warn:"「見るにつけ」처럼 어떤 계기마다 감정이 떠오름. たびに보다 더 감성적·문어적."},
  {n:"128",g:"に伴って",c:"N+に伴って / V辞書形+に伴って",m:"~함에 따라서, ~하면서",nu:"한 변화와 함께 다른 변화가 발생.",ex:[{j:"人口の増加に伴って、住宅問題が深刻になった。",k:"인구 증가에 따라 주택 문제가 심각해졌다."}],lv:"문어체",freq:"★★★",sim:"とともに / に応じて",warn:"「増加に伴って」처럼 한 변화→다른 변화 수반. 뉴스·보고서에서 자주 씀."},
  {n:"129",g:"にほかならない",c:"N+にほかならない",m:"바로 ~이다, ~인 것이다",nu:"강한 단정·강조.",ex:[{j:"成功の理由は努力にほかならない。",k:"성공의 이유는 바로 노력이다."}],lv:"문어체",freq:"★★☆",sim:"に違いない / こそ",warn:"「バロそのものだ」에 가까운 단정. 「努力にほかならない」처럼 N+にほかならない."},
  {n:"130",g:"にもかかわらず",c:"普通形+にもかかわらず / N+にもかかわらず",m:"~임에도 불구하고",nu:"예상과 반대 결과. 딱딱함.",ex:[{j:"雨にもかかわらず、多くの人が集まった。",k:"비가 왔음에도 많은 사람이 모였다."}],lv:"문어체",freq:"★★★",sim:"のに / ても",warn:"역접 중 가장 문어적·강조적. 「のに」는 불만 감정, 「にもかかわらず」는 객관적 역접."},
  {n:"131",g:"にもとづいて",c:"N+にもとづいて",m:"~을 기본으로, ~에 준해서",nu:"자료·근거·기준을 바탕으로.",ex:[{j:"調査結果にもとづいて、報告書を書いた。",k:"조사 결과를 바탕으로 보고서를 썼다."}],lv:"문어체",freq:"★★☆",sim:"に沿って / をもとに",warn:"「調査結果にもとづいて」= 근거로 판단. に沿って는 방향성, にもとづいて는 증거·근거."},
  {n:"132",g:"ぬきで",c:"N+ぬきで",m:"~없이, ~을 빼고",nu:"어떤 요소를 제외.",ex:[{j:"冗談は抜きで、まじめに考えてください。",k:"농담은 빼고 진지하게 생각해 주세요."}],lv:"중립",freq:"★★☆",sim:"を抜きにして / なしで",warn:"「冗談は抜きで」처럼 어떤 요소를 제외. を抜きにして는 더 격식적."},
  {n:"133",g:"ぬく",c:"Vます形語幹+ぬく",m:"끝까지 ~하다",nu:"어려움 속에서도 끝까지 완수.",ex:[{j:"最後まで走りぬいた。",k:"끝까지 달려냈다."}],lv:"중립",freq:"★★☆",sim:"きる / とおす",warn:"「走りぬく」처럼 어려움을 극복하고 완수. きる는 단순 완료, ぬく는 인내·극복 강조."},
  {n:"134",g:"の上で",c:"N+の上で",m:"~만으로는, ~상으로는",nu:"표면적·문서상·계산상 관점.",ex:[{j:"計算の上では問題ない。",k:"계산상으로는 문제가 없다."}],lv:"중립",freq:"★☆☆",sim:"上で / 上は",warn:"「計算の上では」처럼 N+の上で. 표면·형식상의 관점에 한정. 5번·6번 上で와 구별 필요."},
  {n:"135",g:"のことだから",c:"N+のことだから",m:"~이기 때문에",nu:"그 사람·대상의 성격을 근거로 추측.",ex:[{j:"まじめな彼のことだから、きっと時間通りに来るだろう。",k:"성실한 그이니 분명 시간 맞춰 올 것이다."}],lv:"중립",freq:"★★☆",sim:"からして / だけあって",warn:"특정 인물의 성격·습관을 근거로 추측. 항상 긍정적 추측에 씀."},
  {n:"136",g:"のみならず",c:"普通形+のみならず / N+のみならず",m:"~뿐만 아니라",nu:"딱딱한 추가 표현.",ex:[{j:"彼は英語のみならず、フランス語も話せる。",k:"그는 영어뿐만 아니라 프랑스어도 할 수 있다."}],lv:"문어체",freq:"★★★",sim:"ばかりか / に加えて",warn:"문어적 추가 표현. ばかりか는 부정 내용 추가에 강하고, のみならず는 중립적."},
  {n:"137",g:"のもとで",c:"N+のもとで",m:"~아래서, ~밑에서",nu:"영향·지도·조건 아래.",ex:[{j:"先生の指導のもとで研究を進めた。",k:"선생님의 지도 아래 연구를 진행했다."}],lv:"문어체",freq:"★★☆",sim:"の下に / において",warn:"「指導のもとで」처럼 영향·지도 하에. の下で와 거의 동의. 문어적."},
  {n:"138",g:"ばかりか",c:"普通形+ばかりか / N+ばかりか",m:"~뿐만 아니라",nu:"추가 내용이 더 강함.",ex:[{j:"彼は遅刻したばかりか、宿題も忘れた。",k:"그는 지각했을 뿐만 아니라 숙제도 잊었다."}],lv:"중립",freq:"★★★",sim:"のみならず / に加えて",warn:"「遅刻したばかりか」처럼 더 나쁜 것을 추가. 뒤에 더 강한 내용이 오는 구조."},
  {n:"139",g:"ばかりだ",c:"V辞書形+ばかりだ",m:"점점 ~할 뿐이다, 더욱 ~하게 된다",nu:"변화가 한 방향으로 계속 진행. 주로 부정적.",ex:[{j:"物価は上がるばかりだ。",k:"물가는 오르기만 한다."}],lv:"중립",freq:"★★☆",sim:"一方だ / ていく",warn:"한 방향 진행. 주로 부정적 변화. 「上がるばかり」처럼 좋지 않은 변화에 씀."},
  {n:"140",g:"ばかりに",c:"普通形+ばかりに",m:"~한 탓에, ~때문에",nu:"그것 하나 때문에 나쁜 결과.",ex:[{j:"正直に話したばかりに、怒られてしまった。",k:"솔직히 말한 탓에 혼나고 말았다."}],lv:"중립",freq:"★★☆",sim:"あまり / せいで",warn:"「言ったばかりに」처럼 단 하나의 이유로 나쁜 결과. せいで와 유사하나 ばかりに가 더 후회 강조."},
  {n:"141",g:"はさておき",c:"N+はさておき",m:"~은 잠시 접어두고",nu:"중요한 화제를 뒤로 미루고 다른 화제로 전환.",ex:[{j:"結果はさておき、まず努力を認めたい。",k:"결과는 잠시 제쳐두고 우선 노력을 인정하고 싶다."}],lv:"중립",freq:"★☆☆",sim:"はともかく / を置いといて",warn:"화제를 의도적으로 보류. 「結果はさておき」처럼 중요한 것을 일단 제쳐두는 화법."},
  {n:"142",g:"はというと",c:"N+はというと",m:"~로 말하자면, ~은",nu:"앞 화제와 대비하여 특정 대상을 말함.",ex:[{j:"父は元気だ。母はというと、少し疲れているようだ。",k:"아버지는 건강하다. 어머니는 말하자면 조금 피곤해 보인다."}],lv:"중립",freq:"★☆☆",sim:"といえば / については",warn:"대비적 화제 전환. 「父は元気だ。母はというと…」처럼 대조 맥락에 씀."},
  {n:"143",g:"はともかく",c:"N+はともかく（として）",m:"~은 우선 제쳐두고",nu:"하나는 논외로 하고 중요한 것에 집중.",ex:[{j:"値段はともかく、品質はとてもいい。",k:"가격은 제쳐두고 품질은 매우 좋다."}],lv:"중립",freq:"★★☆",sim:"はさておき / にしても",warn:"「値段はともかく」처럼 일단 논외로. はさておきより 조금 더 가벼운 어조."},
  {n:"144",g:"はもとより",c:"N+はもとより",m:"~은 물론이고",nu:"당연한 것에 더해 다른 것도 포함.",ex:[{j:"彼は英語はもとより、中国語もできる。",k:"그는 영어는 물론이고 중국어도 할 수 있다."}],lv:"문어체",freq:"★★☆",sim:"はもちろん / のみならず",warn:"「英語はもとより」= 영어는 물론. はもちろん은 구어적, はもとより는 문어적."},
  {n:"145",g:"べきだ",c:"V辞書形+べきだ / する→すべきだ",m:"반드시 ~해야 한다, ~하는 편이 좋다",nu:"의무·당위·충고.",ex:[{j:"約束は守るべきだ。",k:"약속은 지켜야 한다."}],lv:"중립",freq:"★★★",sim:"なければならない / はずだ",warn:"강한 당위. 「するべき」보다 「すべき」가 더 문어적. は자가 탈락하는 형태에 주의."},
  {n:"146",g:"まい（의지）",c:"V辞書形+まい / する→するまい",m:"~하지 않겠다, ~하지 말자",nu:"강한 부정 의지.",ex:[{j:"もう二度と同じ失敗はするまい。",k:"다시는 같은 실패를 하지 않겠다."}],lv:"문어체",freq:"★★☆",sim:"ないようにする / つもりはない",warn:"문어적 부정 의지. 「するまい」는 구어적으로 어색. 회화에서는 「するつもりはない」선호."},
  {n:"147",g:"まい（추측）",c:"V辞書形+まい",m:"~하지 않을 것이다",nu:"부정 추측. 문어적.",ex:[{j:"彼はそんなことは言うまい。",k:"그는 그런 말은 하지 않을 것이다."}],lv:"문어체",freq:"★☆☆",sim:"ないだろう / はずがない",warn:"부정 추측. 문어적·고어적. 현대 회화에서는 「ないでしょう」를 더 많이 씀."},
  {n:"148",g:"まいか",c:"V辞書形+まいか",m:"~하지 않겠는가, ~지 않을까",nu:"걱정·부정 추측.",ex:[{j:"雨が降るまいかと心配だ。",k:"비가 오지 않을까 걱정이다."}],lv:"문어체",freq:"★☆☆",sim:"ないかしら / ないだろうか",warn:"걱정·부정 추측. 고어적 표현. 현대 일본어에서는 드물게 씀."},
  {n:"149",g:"までして",c:"Vて+まで / N+までして",m:"~해서까지",nu:"그렇게까지 할 필요가 있는지 비판·놀람.",ex:[{j:"借金までして買う必要はない。",k:"빚까지 내서 살 필요는 없다."}],lv:"중립",freq:"★☆☆",sim:"てまで / にまで",warn:"「借金までして」처럼 과도한 수단에 대한 비판·경고. 뒤에 부정적 판단이 옴."},
  {n:"150",g:"まみれ",c:"N+まみれ",m:"~투성이, ~범벅",nu:"액체·먼지·피 등 더러운 것이 묻음.",ex:[{j:"子供は泥まみれになって帰ってきた。",k:"아이는 진흙투성이가 되어 돌아왔다."}],lv:"중립",freq:"★☆☆",sim:"だらけ / っぽい",warn:"だらけ는 내용 가득, まみれ는 표면에 묻음. 「汗まみれ」「埃まみれ」처럼 주로 액체·분진."},
  {n:"151",g:"もかまわず",c:"N+もかまわず",m:"~도 상관없이, ~도 의식하지 않고",nu:"주변 상황을 신경 쓰지 않음.",ex:[{j:"人目もかまわず泣き出した。",k:"남의 시선도 아랑곳하지 않고 울기 시작했다."}],lv:"중립",freq:"★☆☆",sim:"にかかわらず / をものともせず",warn:"「人目もかまわず」처럼 주변 시선 무시. をものともせず는 어려움을 무릅쓰는 긍정적 뉘앙스."},
  {n:"152",g:"もしない",c:"Vます形語幹+もしない",m:"~도 하지 않다",nu:"당연히 해야 할 최소 행동도 안 함.",ex:[{j:"彼は挨拶もしない。",k:"그는 인사도 하지 않는다."}],lv:"회화체",freq:"★☆☆",sim:"さえしない / すら",warn:"「挨拶もしない」처럼 최소한의 행동조차 안 함. 강한 비판·불만."},
  {n:"153",g:"もの（변명）",c:"普通形+もの",m:"~는데 뭐, ~는데 어떡해",nu:"이유·변명. 회화체.",ex:[{j:"だって忙しかったんだもの。",k:"하지만 바빴는걸."}],lv:"회화체",freq:"★★☆",sim:"から / ので",warn:"여성어·아동어 뉘앙스. 이유·변명에서 감정적으로 씀. 남성이 쓰면 약한 인상."},
  {n:"154",g:"ものか",c:"V辞書形+ものか",m:"~은 무슨, 절대로 ~하지 않는다",nu:"강한 반발·부정.",ex:[{j:"あんな店、二度と行くものか。",k:"저런 가게, 두 번 다시 갈까 보냐."}],lv:"중립",freq:"★★☆",sim:"はずがない / わけがない",warn:"강한 부정 의지·반발. 「行くものか！」처럼 단독으로도 씀. 분노·거부감 표현."},
  {n:"155",g:"ものがある",c:"普通形+ものがある",m:"~인 부분이 있다, ~이기도 하다",nu:"어떤 강한 느낌·평가가 있음.",ex:[{j:"彼の演奏には人を感動させるものがある。",k:"그의 연주에는 사람을 감동시키는 무언가가 있다."}],lv:"중립",freq:"★★☆",sim:"ところがある / 面がある",warn:"어떤 강한 인상·느낌이 있음. 「感動させるものがある」처럼 평가에 씀. 객관적 판단 뉘앙스."},
  {n:"156",g:"ものだ（회상）",c:"Vた+ものだ",m:"~했었다",nu:"과거를 회상.",ex:[{j:"子供のころはよく川で遊んだものだ。",k:"어릴 적에는 자주 강에서 놀곤 했다."}],lv:"중립",freq:"★★★",sim:"ていた / した",warn:"과거 습관·회상. 「子供のころ～たものだ」형태. 현재와 달라진 아쉬움 내포."},
  {n:"157",g:"ものだ（감탄）",c:"普通形+ものだ",m:"~하다니, 참 ~하다",nu:"감탄·당연한 이치·충고.",ex:[{j:"時間がたつのは早いものだ。",k:"시간이 흐르는 것은 참 빠르다."}],lv:"중립",freq:"★★☆",sim:"ことか / ものだ（회상）",warn:"「早いものだ」처럼 일반적 진리·감탄. 156번 회상과 혼동 주의. 문맥으로 구별."},
  {n:"158",g:"ものだ/ものではない",c:"V辞書形+ものだ / V辞書形+ものではない",m:"~해야 한다 / ~해서는 안 된다",nu:"사회적 상식·도덕적 당위.",ex:[{j:"元気な若い人は乗り物の中でお年寄りに席を譲るものだ。",k:"건강한 젊은이는 교통수단 안에서 노인에게 자리를 양보해야 한다."}],lv:"중립",freq:"★★☆",sim:"べきだ / ことだ",warn:"사회적 상식·도덕 규범을 말함. べきだ보다 일반론적. 「若者は席を譲るものだ」."},
  {n:"159",g:"ものだから",c:"普通形+ものだから",m:"~해서, ~때문에, ~인 까닭에",nu:"변명·이유 제시. 회화적.",ex:[{j:"いつもは敬語なんか使わないものだから、偉い人の前に出ると緊張します。",k:"평소에는 경어 같은 것을 쓰지 않기 때문에 높은 사람 앞에 서면 긴장합니다."}],lv:"회화체",freq:"★★☆",sim:"から / ので / もの",warn:"변명·이유. から보다 감정적. 「～ものですから」로 정중하게도 씀. 의외성 이유에 자주 씀."},
  {n:"160",g:"ものなら",c:"V可能形+ものなら",m:"만약에 ~라면（불가능한 가정）",nu:"실현이 어렵다는 전제의 가정.",ex:[{j:"できるものなら鳥になって国へ帰りたい。",k:"가능하다면 새가 되어 고향으로 돌아가고 싶다."}],lv:"중립",freq:"★★☆",sim:"たら / とすれば",warn:"실현 거의 불가능한 가정. 「できるものなら」처럼 희망. 160번과 167번 ようものなら 혼동 주의."},
  {n:"161",g:"ものの",c:"普通形+ものの",m:"~이기는 하지만, ~하기는 했지만",nu:"앞 사실은 인정하지만 뒤는 기대와 다름.",ex:[{j:"新しい服を買ったものの、なかなか着ていく機会がない。",k:"새 옷을 사기는 했지만 좀처럼 입고 갈 기회가 없다."}],lv:"중립",freq:"★★★",sim:"が / けれど / とはいうものの",warn:"앞 사실 인정 후 역접. が보다 문어적. 「買ったものの」처럼 기대 불충족."},
  {n:"162",g:"やら~やら",c:"N+やら+N+やら",m:"~하기도 하고 ~하기도 하고",nu:"여러 가지가 뒤섞여 있음.",ex:[{j:"びっくりするやら悲しむやら、ニュースを聞いた人たちの反応は様々だった。",k:"놀라기도 하고 슬퍼하기도 하고, 뉴스를 들은 사람들의 반응은 다양했다."}],lv:"중립",freq:"★★☆",sim:"たり～たり / とか",warn:"복수 항목 열거. たり～たり는 동작, やら～やら는 감정·상태 혼재에 자주 씀."},
  {n:"163",g:"ようがない",c:"Vます形語幹+ようがない",m:"~하려고 해도 할 수가 없다",nu:"방법이 없음.",ex:[{j:"この時計はもう部品がないから、直しようがない。",k:"이 시계는 이제 부품이 없어서 고칠 방법이 없다."}],lv:"중립",freq:"★★☆",sim:"しようがない / にくい",warn:"방법·수단이 아예 없음. 「直しようがない」처럼 Vます형+ようがない. 불가능의 최강 표현."},
  {n:"164",g:"ようか~まいか",c:"V意向形+か+V辞書形+まいか",m:"~할까 말까, ~할지 말지",nu:"할지 말지 망설임.",ex:[{j:"この季節には、かさを持って行こうか行くまいかと毎朝迷ってしまう。",k:"이 계절에는 우산을 가져갈까 말까 매일 아침 망설인다."}],lv:"중립",freq:"★☆☆",sim:"かどうか / ようかどうか",warn:"할지 말지 망설임. 「まいか」는 문어적이므로 회화에서는 「ようかどうか」가 더 자연스러움."},
  {n:"165",g:"ようではないか",c:"V意向形+ではないか",m:"~하자, ~해야 되지 않겠는가",nu:"함께 행동하자는 강한 제안.",ex:[{j:"これからは少しでも人の役に立つことを考えようではないか。",k:"앞으로는 조금이라도 남에게 도움이 되는 일을 생각해 보자."}],lv:"문어체",freq:"★☆☆",sim:"ようではないか / ましょう",warn:"청중에게 함께 행동하자는 연설체. 「ではないか」뒤에 勧誘 의미. 격식 스피치에 씀."},
  {n:"166",g:"ようとしている",c:"V意向形+としている",m:"막 ~하려고 하고 있다",nu:"어떤 일이 막 일어나려는 직전.",ex:[{j:"大きな夕日が海に沈もうとしていた。",k:"큰 석양이 바다로 막 지려 하고 있었다."}],lv:"중립",freq:"★★☆",sim:"ところだ / 始める",warn:"직전 상황 강조. 「沈もうとしていた」처럼 자연 현상에도 씀. 의지 있는 주어에도 OK."},
  {n:"167",g:"ようものなら",c:"V意向形+ものなら",m:"만약에 ~하면（경고）",nu:"그렇게 하면 큰일 난다는 경고.",ex:[{j:"この学校は規則が厳しいから、断らずに欠席しようものなら、大変だ。",k:"이 학교는 규칙이 엄격해서 말없이 결석하기라도 하면 큰일이다."}],lv:"중립",freq:"★☆☆",sim:"ものなら / たら大変だ",warn:"경고·협박 뉘앙스. 「欠席しようものなら、大変だ」처럼 나쁜 결과 경고. 160번과 구별."},
  {n:"168",g:"わけがない",c:"普通形+わけがない",m:"~할 리가 없다",nu:"강한 부정. 논리상 그럴 수 없음.",ex:[{j:"こんな漢字の多い本をあの子が読むわけがない。",k:"이런 한자가 많은 책을 그 아이가 읽을 리가 없다."}],lv:"중립",freq:"★★★",sim:"はずがない / っこない",warn:"논리적 부정. はずがない는 기대·예상의 부정, わけがない는 이치상 불가. 뉘앙스 차이 빈출."},
  {n:"169",g:"わけではない",c:"普通形+わけではない",m:"꼭 ~인 것만은 아니다",nu:"부분 부정. 전면 부정은 아님.",ex:[{j:"私は学生時代に勉強ばかりしていたわけではない。よく旅行もした。",k:"나는 학생 시절 공부만 했던 것은 아니다. 여행도 자주 했다."}],lv:"중립",freq:"★★★",sim:"とは限らない / というものではない",warn:"부분 부정. 「全部わけではない」처럼 전면 부정이 아님을 명시. わけがない와 혼동 주의."},
  {n:"170",g:"わけにはいかない",c:"V辞書形+わけにはいかない",m:"~할 수 없다（사회적 이유）",nu:"사회적·도덕적 이유로 할 수 없음.",ex:[{j:"これは亡くなった友人がくれた大切なもので、あげるわけにはいかないんです。",k:"이것은 세상을 떠난 친구가 준 소중한 물건이라 줄 수 없습니다."}],lv:"중립",freq:"★★★",sim:"ざるを得ない / てはいけない",warn:"사회적·도덕적 이유로 불가. 「あげるわけにはいかない」= 줄 수 없음(내부 규범). 외부 금지 てはいけない와 다름."},
  {n:"171",g:"わりに（は）",c:"普通形+わりに / Nの+わりに",m:"~에 비해서는, ~보다（는）",nu:"기준·예상과 비교해 의외.",ex:[{j:"このくつは値段が高いわりによく売れる。",k:"이 신발은 가격이 비싼 것에 비해 잘 팔린다."}],lv:"중립",freq:"★★★",sim:"にしては / くせに",warn:"기대 대비 의외. くせに는 부정적 비난, わりに는 중립적 의외. にしては도 유사하나 わりに가 더 양적 비교."},
  {n:"172",g:"を契機に",c:"N+を契機に（して）",m:"~을 계기로 해서",nu:"어떤 사건이 전환점이 됨.",ex:[{j:"この災害を契機にして、わが家でも防災対策を強化することにした。",k:"이 재해를 계기로 우리 집에서도 방재 대책을 강화하기로 했다."}],lv:"문어체",freq:"★★☆",sim:"をきっかけに / をもとに",warn:"「災害を契機に」처럼 중요 사건이 전환점이 됨. をきっかけに보다 더 격식적·공식적."},
  {n:"173",g:"を問わず",c:"N+を問わず",m:"~하지 않고, ~을 불문하고",nu:"조건과 관계없이 모두 포함.",ex:[{j:"近年、文化財保護の問題は、国の内外を問わず大きな関心を呼んでいる。",k:"최근 문화재 보호 문제는 국내외를 불문하고 큰 관심을 불러일으키고 있다."}],lv:"문어체",freq:"★★★",sim:"にかかわらず / を問わず",warn:"「国内外を問わず」처럼 범위 전체 포함. にかかわらず와 거의 동의이나 を問わず는 명사에만."},
  {n:"174",g:"を抜きにして",c:"N+を抜きにして",m:"~을 빼고, ~을 제쳐두고",nu:"어떤 요소를 제외함.",ex:[{j:"今日は硬い話を抜きにして、気楽に楽しく飲みましょう。",k:"오늘은 딱딱한 이야기는 빼고 편하게 즐겁게 마십시다."}],lv:"중립",freq:"★☆☆",sim:"ぬきで / はさておき",warn:"어떤 요소를 완전히 제외. 「を抜きにしては」= ~없이는. ぬきで보다 조금 더 격식적."},
  {n:"175",g:"をはじめ",c:"N+をはじめ / N+をはじめとして",m:"~을 비롯",nu:"대표 예시를 들고 전체를 나타냄.",ex:[{j:"今年は富士山をはじめ、各地の有名な山に登ろう。",k:"올해는 후지산을 비롯해 각지의 유명한 산에 오르자."}],lv:"중립",freq:"★★★",sim:"など / ばかりか",warn:"「富士山をはじめ」처럼 대표 예시 후 전체. 뒤에 구체적 열거가 이어짐."},
  {n:"176",g:"をめぐって",c:"N+をめぐって",m:"~을 둘러싸고, ~에 관해서",nu:"논쟁·대립·논의의 중심 주제.",ex:[{j:"町の再開発をめぐって、住民が争っている。",k:"마을 재개발을 둘러싸고 주민들이 다투고 있다."}],lv:"문어체",freq:"★★☆",sim:"について / に関して",warn:"「再開発をめぐって」처럼 논쟁·대립 주제. に関して는 단순 화제, をめぐって는 갈등·분쟁 맥락."},
  {n:"177",g:"をもとに",c:"N+をもとに（して）",m:"~에서, ~을 참조해서, ~을 가지고",nu:"자료·아이디어를 바탕으로 새로 만듦.",ex:[{j:"ポップスの中には有名なクラシックの曲の一部をもとにしたものがある。",k:"팝송 중에는 유명한 클래식 곡의 일부를 바탕으로 한 것이 있다."}],lv:"중립",freq:"★★☆",sim:"に基づいて / にもとづいて",warn:"「データをもとに」처럼 출발 재료. に基づいて는 규칙·원칙 준수, をもとに는 참조·가공."},
  {n:"178",g:"んじゃない",c:"V辞書形+んじゃない",m:"~하지 마라, ~하면 안 된다",nu:"금지. 회화적이고 강한 말투.",ex:[{j:"食べ物の好き嫌いを言うんじゃありませんよ。",k:"음식 좋고 싫음을 말하는 거 아니야."}],lv:"회화체",freq:"★☆☆",sim:"な / てはいけない",warn:"구어체 금지. 「食べるんじゃない」처럼 직접적. てはいけない보다 강하고 거칠음."},
  {n:"추가1",g:"んだ",c:"V辞書形+んだ",m:"~해라, ~하거라",nu:"설명·명령. 선생님이나 윗사람이 말하는 느낌.",ex:[{j:"漢字は毎日、毎日、書いて覚えるんです。",k:"한자는 매일매일 써서 외우는 겁니다."}],lv:"회화체",freq:"★★☆",sim:"なさい / のだ",warn:"설명·명령 兼用. 「勉強するんだ」처럼 강한 지시. のだ보다 더 직접적·구어적."},
  {n:"추가2",g:"んだった",c:"V辞書形+んだった",m:"~할 걸, ~하면 좋았을 텐데",nu:"후회.",ex:[{j:"こんなことならもっと勉強するんだった。",k:"이럴 줄 알았으면 더 공부할 걸."}],lv:"회화체",freq:"★★☆",sim:"ばよかった / のだった",warn:"「もっと勉強するんだった」처럼 후회. ばよかった와 거의 동의지만 んだった가 더 구어적."},
  {n:"추가3",g:"んだって",c:"普通形+んだって",m:"~래, ~한대",nu:"들은 말 전달. 전문.",ex:[{j:"来年この駅にも駅ビルができるんだって。",k:"내년에 이 역에도 역 빌딩이 생긴대."}],lv:"회화체",freq:"★☆☆",sim:"そうだ（전문） / って",warn:"들은 내용을 전달. 매우 구어적. 「んですって」로 쓰면 약간 더 공손한 표현."}
];

/* ─── CATEGORIES ─── */
const CATS = {
  "전체": () => true,
  "가능/불가능": g => /得る|かねる|かねない|がたい|ようがない|わけにはいかない|ざるを得ない|っこない/.test(g.g),
  "역접/대비": g => /ながら|ものの|とはいうものの|くせに|一方|つつ（역/.test(g.g),
  "시간/순서": g => /以来|たとたん|次第|うちに|たび|最中|折|に先立|際|ところだった|ようとして/.test(g.g),
  "추측/판단": g => /ところをみると|のことだから|に相違ない|わけがない|わけではない/.test(g.g),
  "정도/감탄": g => /あまり|かぎりだ|ことか|ことだろう|といったら|たまらない|てならない|ものがある/.test(g.g),
  "충고/의무": g => /べきだ|ことだ（충|ものだ\/もの|ものだ（감/.test(g.g),
  "병렬/추가": g => /のみならず|ばかりか|はもとより|に加えて|やら/.test(g.g),
  "범위/한정": g => /かぎり|に限り|に限って|に限らず|にすぎない|ぬきで|を抜き|をはじめ|を問わず/.test(g.g),
};

let currentIdx = -1;
let filtered = [...GRAMMAR];
let currentCat = "전체";
let quizMode = "meaning";
let quizItems = [];
let quizPos = 0;
let qCorrect = 0, qWrong = 0;
let wrongItems = [];

/* ─── DICT ─── */
function renderList() {
  const list = document.getElementById('grammar-list');
  const badge = document.getElementById('count-badge');
  list.innerHTML = '';
  badge.textContent = `${filtered.length}개 항목`;
  filtered.forEach((item, i) => {
    const div = document.createElement('div');
    div.className = 'grammar-item' + (i === currentIdx ? ' active' : '');
    const lvDotColor = {회화체:'#68c868',중립:'#6898e8',문어체:'#e8c468'}[item.lv]||'#6a6662';
    div.innerHTML = `<div class="item-row1"><span class="item-num">${item.n}</span><span class="item-grammar">${item.g}</span><span class="item-freq">${item.freq||''}</span><span class="lv-dot" style="background:${lvDotColor}" title="${item.lv||''}"></span></div><div class="item-conn">${item.c}</div>`;
    div.onclick = () => selectItem(i);
    list.appendChild(div);
  });
}

function selectItem(idx) {
  currentIdx = idx;
  const item = filtered[idx];
  const panel = document.getElementById('detail-panel');

  const exHtml = item.ex.map(e => `
    <div class="example-block">
      <div class="example-jp">${e.j}</div>
      <div class="example-kr">${e.k}</div>
    </div>`).join('');

  const lvColor = {회화체:'var(--green)',중립:'var(--blue)',문어체:'var(--accent)'}[item.lv]||'var(--text2)';
  const simTags = (item.sim||'').split('/').map(s=>s.trim()).filter(Boolean)
    .map(s=>`<span class="sim-tag" onclick="searchGrammar(this.textContent)">${s}</span>`).join('');

  panel.innerHTML = `
    <div class="grammar-header">
      <div class="grammar-title">${item.g}</div>
      <div class="grammar-num-badge">No.${item.n}</div>
    </div>
    <div class="meta-row">
      <div class="meta-chip" style="color:${lvColor};border-color:${lvColor}33;">${item.lv||''}</div>
      <div class="meta-chip freq-chip">${item.freq||''}</div>
    </div>
    <div class="info-grid">
      <div class="info-card full">
        <div class="info-label">접속형</div>
        <div class="info-value mono">${item.c}</div>
      </div>
      <div class="info-card">
        <div class="info-label">의미</div>
        <div class="info-value">${item.m}</div>
      </div>
      <div class="info-card">
        <div class="info-label">뉘앙스</div>
        <div class="nuance-text">${item.nu}</div>
      </div>
      ${item.warn ? `<div class="info-card full warn-card">
        <div class="info-label">⚠ 오용 주의</div>
        <div class="info-value warn-text">${item.warn}</div>
      </div>` : ''}
      ${simTags ? `<div class="info-card full">
        <div class="info-label">유사 문법 (클릭해서 검색)</div>
        <div class="sim-tags">${simTags}</div>
      </div>` : ''}
    </div>
    <div class="examples-section">
      <div class="examples-title">예문</div>
      ${exHtml}
    </div>
    <div class="nav-arrows">
      <button class="arrow-btn" onclick="goNeighbor(-1)" ${idx===0?'disabled':''}>← 이전</button>
      <button class="arrow-btn" onclick="goNeighbor(1)" ${idx===filtered.length-1?'disabled':''}>다음 →</button>
    </div>`;

  renderList();
}

function searchGrammar(q) {
  q = q.trim();
  const input = document.getElementById('search-input');
  input.value = q;
  filterList();
  // try to select first match
  if (filtered.length > 0) selectItem(0);
}

function goNeighbor(dir) {
  const next = currentIdx + dir;
  if (next >= 0 && next < filtered.length) selectItem(next);
}

function filterList() {
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  filtered = GRAMMAR.filter(item => {
    const catOk = CATS[currentCat](item);
    if (!q) return catOk;
    return catOk && (item.g.toLowerCase().includes(q) || item.m.includes(q) || item.nu.includes(q) || item.c.toLowerCase().includes(q));
  });
  currentIdx = -1;
  document.getElementById('detail-panel').innerHTML = `<div class="detail-empty"><div class="big">文</div><p>왼쪽 목록에서 문법을 선택하세요</p></div>`;
  renderList();
}

function buildFilters() {
  const row = document.getElementById('filter-row');
  Object.keys(CATS).forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-chip' + (cat === '전체' ? ' active' : '');
    btn.textContent = cat;
    btn.onclick = () => {
      currentCat = cat;
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterList();
    };
    row.appendChild(btn);
  });
}

/* ─── TAB SWITCH ─── */
function switchTab(tab) {
  document.getElementById('dict-section').style.display = tab === 'dict' ? 'flex' : 'none';
  document.getElementById('quiz-section').style.display = tab === 'quiz' ? 'flex' : 'none';
  document.getElementById('tab-dict').classList.toggle('active', tab === 'dict');
  document.getElementById('tab-quiz').classList.toggle('active', tab === 'quiz');
  if (tab === 'quiz' && quizItems.length === 0) startQuiz();
}

/* ─── QUIZ ─── */
function setMode(mode) {
  quizMode = mode;
  ['meaning','grammar','example','nuance'].forEach(m => {
    document.getElementById('mode-'+m).classList.toggle('active', m === mode);
  });
  startQuiz();
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

function startQuiz() {
  quizItems = shuffle(GRAMMAR).slice(0, 20);
  quizPos = 0; qCorrect = 0; qWrong = 0; wrongItems = [];
  updateStats();
  renderQuestion();
}

function updateStats() {
  document.getElementById('q-correct').textContent = qCorrect;
  document.getElementById('q-wrong').textContent = qWrong;
  const total = qCorrect + qWrong;
  document.getElementById('q-acc').textContent = total ? Math.round(qCorrect/total*100)+'%' : '—';
}

function getChoices(correct, field, count=4) {
  const others = shuffle(GRAMMAR.filter(g => g[field] !== correct[field])).slice(0, count-1);
  return shuffle([correct, ...others]);
}

function renderQuestion() {
  const card = document.getElementById('quiz-card');
  if (quizPos >= quizItems.length) { renderEnd(); return; }

  const item = quizItems[quizPos];
  const pct = Math.round((quizPos / quizItems.length) * 100);

  let content = `
    <div class="quiz-progress">
      <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <div class="progress-text">${quizPos+1} / ${quizItems.length}</div>
    </div>`;

  if (quizMode === 'meaning') {
    const choices = getChoices(item, 'm');
    content += `
      <div class="quiz-q-label">문법의 의미는?</div>
      <div class="quiz-question">${item.g}</div>
      <div class="quiz-sub">${item.c}</div>
      <div class="quiz-choices" id="choices">
        ${choices.map(c=>`<button class="choice-btn" onclick="checkChoice(this,'${c.g}','${item.g}','${item.m}','${item.nu}')">${c.m}</button>`).join('')}
      </div>`;
  } else if (quizMode === 'grammar') {
    const choices = getChoices(item, 'g');
    content += `
      <div class="quiz-q-label">어떤 문법 표현인가?</div>
      <div class="quiz-question" style="font-size:1rem;color:var(--text);">${item.m}</div>
      <div class="quiz-sub">${item.nu}</div>
      <div class="quiz-choices" id="choices">
        ${choices.map(c=>`<button class="choice-btn" onclick="checkChoice(this,'${c.g}','${item.g}','${item.g}','${item.nu}')">${c.g}</button>`).join('')}
      </div>`;
  } else if (quizMode === 'example') {
    const ex = item.ex[0];
    const choices = getChoices(item, 'g');
    content += `
      <div class="quiz-q-label">어떤 문법이 사용되었나?</div>
      <div class="quiz-question" style="font-size:1rem;color:var(--text);font-weight:500;">${ex.j}</div>
      <div class="quiz-sub">${ex.k}</div>
      <div class="quiz-choices" id="choices">
        ${choices.map(c=>`<button class="choice-btn" onclick="checkChoice(this,'${c.g}','${item.g}','${item.g}','${item.nu}')">${c.g}</button>`).join('')}
      </div>`;
  } else {
    const pairs = [item, ...shuffle(GRAMMAR.filter(g=>g.g!==item.g)).slice(0,3)];
    const shuffled = shuffle(pairs);
    content += `
      <div class="quiz-q-label">이 문법과 일치하는 뉘앙스를 선택하세요</div>
      <div class="quiz-question">${item.g}</div>
      <div class="quiz-sub">${item.m}</div>
      <div class="quiz-choices" id="choices" style="grid-template-columns:1fr;">
        ${shuffled.map(c=>`<button class="choice-btn" onclick="checkChoice(this,'${c.g}','${item.g}','${item.g}','${item.nu}')" style="font-size:0.82rem;">${c.nu}</button>`).join('')}
      </div>`;
  }

  content += `
    <div class="quiz-result-box" id="result-box"></div>
    <div class="quiz-next-btn" id="next-btn" onclick="nextQuestion()">다음 문제 →</div>`;

  card.innerHTML = content;
}

function checkChoice(btn, chosen, correct, displayCorrect, nuance) {
  const isCorrect = chosen === correct;
  document.querySelectorAll('.choice-btn').forEach(b => {
    b.disabled = true;
    const val = b.textContent.trim();
    if (b === btn) b.classList.add(isCorrect ? 'correct' : 'wrong');
  });

  const box = document.getElementById('result-box');
  box.style.display = 'block';
  if (isCorrect) {
    qCorrect++;
    box.className = 'quiz-result-box correct';
    box.innerHTML = `✓ 정답! <div class="result-detail">${nuance}</div>`;
  } else {
    qWrong++;
    wrongItems.push(quizItems[quizPos]);
    box.className = 'quiz-result-box wrong';
    box.innerHTML = `✗ 오답. 정답: <strong>${displayCorrect}</strong><div class="result-detail">${nuance}</div>`;
  }
  updateStats();
  document.getElementById('next-btn').style.display = 'block';
}

function nextQuestion() {
  quizPos++;
  renderQuestion();
}

function renderEnd() {
  const score = Math.round(qCorrect / quizItems.length * 100);
  const grade = score >= 90 ? '완벽해요!' : score >= 70 ? '잘했어요!' : score >= 50 ? '더 연습해요' : '다시 도전!';
  const wrongHtml = wrongItems.length ? `
    <div class="wrong-review">
      <h3>틀린 문법 (${wrongItems.length}개)</h3>
      ${wrongItems.map(w=>`<div class="wrong-item"><div class="wi-grammar">${w.g}</div><div class="wi-meaning">${w.m}</div></div>`).join('')}
    </div>` : '';

  document.getElementById('quiz-card').innerHTML = `
    <div class="quiz-end-screen">
      <div class="score">${score}점</div>
      <div class="score-sub">${quizItems.length}문제 중 ${qCorrect}개 정답 — ${grade}</div>
      <button class="quiz-restart-btn" onclick="startQuiz()">다시 풀기</button>
      ${wrongHtml}
    </div>`;
}

/* ─── INIT ─── */
buildFilters();
renderList();
</script>
</body>
</html>
