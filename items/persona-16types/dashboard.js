// 関係性マッピング定義
const RELATIONS_MAP = {
  friend: "友達",
  partner: "恋人",
  work: "職場・学校",
  family: "家族",
  hobby: "ネット・趣味",
  other: "その他"
};

// 16タイプの解説マスタ
const TYPE_DESCS = {
  INTJ: "高い分析力と戦略的思考で、物事の本質を的確に見抜く冷静沈着な策士タイプ。",
  INTP: "探求心に富み、独自の理論と知的好奇心で論理を突き詰める研究者タイプ。",
  ENTJ: "明確なビジョンと決断力で周囲を引っ張る、生まれながらのリーダータイプ。",
  ENTP: "柔軟な発想と鋭いディベート力で、新しいアイデアを次々と生み出す変革者タイプ。",
  INFJ: "深い洞察力と強い信念を持ち、静かに人を導く理想主義タイプ。",
  INFP: "感受性が豊かで誠実、自分独自の価値観や世界観を大切にする表現者タイプ。",
  ENFJ: "情熱と高い共感力で人々を巻き込み、調和をもたらすサポータータイプ。",
  ENFP: "好奇心旺盛で人懐っこく、周囲に刺激とポジティブな活力を与える自由人タイプ。",
  ISTJ: "責任感にあふれ、堅実かつ確実にルールや約束を守る信頼の守護者タイプ。",
  ISFJ: "細やかな気配りと献身的な姿勢で、周りの人を陰から支える調和タイプ。",
  ESTJ: "現実的で秩序を重んじ、物事をテキパキと効率的に管理・実行する推進タイプ。",
  ESFJ: "誰に対しても温かく親切で、コミュニティの和を第一に考える気配り上手タイプ。",
  ISTP: "観察力に長け、冷静な判断と実践的なスキルで状況を切り拓く職人タイプ。",
  ISFP: "穏やかで飾らず、日常の美しさや心地よい空気感を大切にする芸術肌タイプ。",
  ESTP: "リスクを恐れず今この瞬間を楽しみ、素早い行動で局面を動かすチャレンジャータイプ。",
  ESFP: "明るいエネルギーで場の空気を盛り上げ、周囲を笑顔にするムードメーカータイプ。"
};

const STORAGE_KEY = "persona16_profiles_v2";

let state = {
  profiles: {},
  currentProfileId: null,
  activeRelation: "all",
  filter: {
    startDate: "",
    endDate: "",
    keyword: "",
    limit: "all",
    category: "all",
    customPattern: ""
  },
  selectedResponses: new Set()
};

document.addEventListener("DOMContentLoaded", () => {
  loadProfiles();
  handleUrlIncoming();
  initEvents();
  renderApp();
});

// プロファイルデータのロード
function loadProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state.profiles = JSON.parse(raw);
    }
  } catch (e) {
    console.error("LocalStorage読み込み失敗:", e);
    state.profiles = {};
  }
}

// プロファイルデータのセーブ
function saveProfiles() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.profiles));
  } catch (e) {
    console.error("LocalStorage保存失敗:", e);
    showToast("データの保存に失敗しました。容量を確認してください。");
  }
}

// URLパラメータからの回答データ受信処理（4〜16の整数合計点）
function handleUrlIncoming() {
  const urlParams = new URLSearchParams(window.location.search);
  const uid = urlParams.get("uid");
  const rid = urlParams.get("rid");
  const rel = urlParams.get("rel");
  const sc = urlParams.get("sc");
  const n = urlParams.get("n");

  if (!rid || !rel || !sc) return;

  // scは 4〜16の整数 4つ (EI, SN, TF, JP)
  const scores = sc.split(",").map(s => parseInt(s.trim(), 10));
  if (scores.length !== 4 || scores.some(v => isNaN(v) || v < 4 || v > 16)) {
    console.warn("無効なスコアデータのため取り込みをスキップしました:", sc);
    cleanUrlParams();
    return;
  }

  let targetId = uid;
  if (!targetId || !state.profiles[targetId]) {
    targetId = state.currentProfileId || Object.keys(state.profiles)[0];
  }

  if (!targetId || !state.profiles[targetId]) {
    const newId = "p_" + Date.now().toString(36);
    state.profiles[newId] = {
      id: newId,
      name: "メイン",
      responses: []
    };
    targetId = newId;
    state.currentProfileId = newId;
  }

  const profile = state.profiles[targetId];
  if (!profile.responses) profile.responses = [];

  // 重複取り込み防止
  const exists = profile.responses.some(r => r.id === rid);
  if (!exists) {
    profile.responses.unshift({
      id: rid,
      name: n ? n.trim() : "匿名",
      relation: rel,
      scores: scores, // [sumEI, sumSN, sumTF, sumJP]
      date: new Date().toISOString().split("T")[0],
      memo: ""
    });
    saveProfiles();
    showToast("新しい回答を取り込みました！");
  }

  state.currentProfileId = targetId;
  cleanUrlParams();
}

function cleanUrlParams() {
  const url = new URL(window.location.href);
  url.search = "";
  window.history.replaceState({}, document.title, url.pathname);
}

// イベントリスナー登録
function initEvents() {
  // 初期プロファイル作成
  const genBtn = document.getElementById("generate-btn");
  if (genBtn) {
    genBtn.addEventListener("click", () => {
      const input = document.getElementById("user-name-input");
      const name = input.value.trim();
      if (!name) {
        alert("ニックネームを入力してください。");
        return;
      }
      const newId = "p_" + Date.now().toString(36);
      state.profiles[newId] = { id: newId, name: name, responses: [] };
      state.currentProfileId = newId;
      saveProfiles();
      renderApp();
    });
  }

  // プロファイル切り替え
  const selector = document.getElementById("profile-selector");
  if (selector) {
    selector.addEventListener("change", (e) => {
      state.currentProfileId = e.target.value;
      state.selectedResponses.clear();
      renderApp();
    });
  }

  // プロファイル追加
  const addBtn = document.getElementById("add-profile-btn");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      const name = prompt("追加する新しいプロファイル名（ニックネーム）を入力してください:");
      if (!name || !name.trim()) return;
      const newId = "p_" + Date.now().toString(36);
      state.profiles[newId] = { id: newId, name: name.trim(), responses: [] };
      state.currentProfileId = newId;
      saveProfiles();
      renderApp();
    });
  }

  // プロファイル削除
  const delBtn = document.getElementById("delete-profile-btn");
  if (delBtn) {
    delBtn.addEventListener("click", () => {
      const profile = state.profiles[state.currentProfileId];
      if (!profile) return;
      if (!confirm(`プロファイル「${profile.name}」とその回答データをすべて削除してもよろしいですか？`)) return;
      delete state.profiles[state.currentProfileId];
      const remainingIds = Object.keys(state.profiles);
      state.currentProfileId = remainingIds.length > 0 ? remainingIds[0] : null;
      saveProfiles();
      renderApp();
    });
  }

  // URLコピーボタン
  const copyBtn = document.getElementById("copy-url-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const input = document.getElementById("share-url-input");
      input.select();
      navigator.clipboard.writeText(input.value);
      showToast("回答用URLをコピーしました！");
    });
  }

  // 関係性タブ切り替え
  const relTabs = document.getElementById("relation-tabs");
  if (relTabs) {
    relTabs.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        relTabs.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.activeRelation = btn.getAttribute("data-rel");
        updateStatsView();
      });
    });
  }

  // フィルターイベント群
  const dateStart = document.getElementById("date-start");
  const dateEnd = document.getElementById("date-end");
  const filterKey = document.getElementById("filter-keyword");
  const dateClear = document.getElementById("date-filter-clear-btn");

  if (dateStart) dateStart.addEventListener("change", (e) => { state.filter.startDate = e.target.value; updateStatsView(); });
  if (dateEnd) dateEnd.addEventListener("change", (e) => { state.filter.endDate = e.target.value; updateStatsView(); });
  if (filterKey) filterKey.addEventListener("input", (e) => { state.filter.keyword = e.target.value.trim().toLowerCase(); updateStatsView(); });
  if (dateClear) {
    dateClear.addEventListener("click", () => {
      state.filter.startDate = "";
      state.filter.endDate = "";
      state.filter.keyword = "";
      state.filter.limit = "all";
      state.filter.category = "all";
      state.filter.customPattern = "";
      if (dateStart) dateStart.value = "";
      if (dateEnd) dateEnd.value = "";
      if (filterKey) filterKey.value = "";
      const customTypeInput = document.getElementById("filter-custom-type");
      if (customTypeInput) customTypeInput.value = "";
      const customLimitInput = document.getElementById("filter-limit-custom");
      if (customLimitInput) customLimitInput.value = "";
      document.querySelectorAll("#filter-limit-group .filter-pill").forEach(p => p.classList.toggle("active", p.dataset.limit === "all"));
      document.querySelectorAll("#filter-category-group .filter-pill").forEach(p => p.classList.toggle("active", p.dataset.cat === "all"));
      document.getElementById("custom-type-row").style.display = "none";
      updateStatsView();
    });
  }

  // 件数フィルターピル
  const limitGroup = document.getElementById("filter-limit-group");
  if (limitGroup) {
    limitGroup.querySelectorAll(".filter-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        limitGroup.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        state.filter.limit = pill.dataset.limit;
        const customInp = document.getElementById("filter-limit-custom");
        if (customInp) customInp.value = "";
        updateStatsView();
      });
    });
    const customLimitInput = document.getElementById("filter-limit-custom");
    if (customLimitInput) {
      customLimitInput.addEventListener("input", (e) => {
        const val = parseInt(e.target.value, 10);
        if (val > 0) {
          limitGroup.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
          state.filter.limit = val;
          updateStatsView();
        }
      });
    }
  }

  // 系統フィルターピル
  const catGroup = document.getElementById("filter-category-group");
  if (catGroup) {
    catGroup.querySelectorAll(".filter-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        catGroup.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        state.filter.category = pill.dataset.cat;
        const customRow = document.getElementById("custom-type-row");
        if (pill.dataset.cat === "custom") {
          customRow.style.display = "flex";
        } else {
          customRow.style.display = "none";
        }
        updateStatsView();
      });
    });
    const customTypeInput = document.getElementById("filter-custom-type");
    if (customTypeInput) {
      customTypeInput.addEventListener("input", (e) => {
        state.filter.customPattern = e.target.value.trim().toUpperCase();
        updateStatsView();
      });
    }
  }

  // 選択回答削除ボタン
  const delSelBtn = document.getElementById("delete-selected-btn");
  if (delSelBtn) {
    delSelBtn.addEventListener("click", () => {
      if (state.selectedResponses.size === 0) return;
      if (!confirm(`選択した ${state.selectedResponses.size} 件の回答を削除しますか？`)) return;
      const profile = state.profiles[state.currentProfileId];
      if (!profile || !profile.responses) return;
      profile.responses = profile.responses.filter(r => !state.selectedResponses.has(r.id));
      state.selectedResponses.clear();
      saveProfiles();
      renderApp();
    });
  }

  // バックアップモーダル関連
  initBackupEvents();
  // SNS共有モーダル関連
  initShareEvents();
}

// アプリ全体の描画切り替え
function renderApp() {
  const profileIds = Object.keys(state.profiles);
  const setupView = document.getElementById("setup-view");
  const dashboardView = document.getElementById("dashboard-view");

  if (profileIds.length === 0) {
    if (setupView) setupView.style.display = "block";
    if (dashboardView) dashboardView.style.display = "none";
    return;
  }

  if (setupView) setupView.style.display = "none";
  if (dashboardView) dashboardView.style.display = "block";

  if (!state.currentProfileId || !state.profiles[state.currentProfileId]) {
    state.currentProfileId = profileIds[0];
  }

  const profile = state.profiles[state.currentProfileId];

  // プロファイル選択セレクトボックスの更新
  const selector = document.getElementById("profile-selector");
  if (selector) {
    selector.innerHTML = "";
    profileIds.forEach(id => {
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = state.profiles[id].name;
      if (id === state.currentProfileId) opt.selected = true;
      selector.appendChild(opt);
    });
  }

  document.getElementById("target-user-name").textContent = profile.name;

  // シェアURLの設定
  const shareInput = document.getElementById("share-url-input");
  const currentPath = window.location.pathname;
  const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
  const shareUrl = `${window.location.origin}${basePath}answer.html?uid=${encodeURIComponent(profile.id)}&u=${encodeURIComponent(profile.name)}`;
  if (shareInput) shareInput.value = shareUrl;

  updateStatsView();
}

// 統計・集計ビューの更新
function updateStatsView() {
  const profile = state.profiles[state.currentProfileId];
  if (!profile) return;

  const responses = profile.responses || [];

  // 関係性カウントの更新
  document.getElementById("count-all").textContent = responses.length;
  ["friend", "partner", "work", "family", "hobby", "other"].forEach(rel => {
    const c = responses.filter(r => r.relation === rel).length;
    const el = document.getElementById(`count-${rel}`);
    if (el) el.textContent = c;
  });

  const emptyState = document.getElementById("empty-state");
  const statsArea = document.getElementById("stats-area");
  const relationTabs = document.getElementById("relation-tabs");
  const dateFilterBox = document.getElementById("date-filter-box");

  if (responses.length === 0) {
    if (emptyState) emptyState.style.display = "block";
    if (statsArea) statsArea.style.display = "none";
    if (relationTabs) relationTabs.style.display = "none";
    if (dateFilterBox) dateFilterBox.style.display = "none";
    renderResponseList([]);
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (statsArea) statsArea.style.display = "block";
  if (relationTabs) relationTabs.style.display = "flex";
  if (dateFilterBox) dateFilterBox.style.display = "block";

  // フィルター適用
  let filtered = [...responses];

  // ① 関係性タブフィルター
  if (state.activeRelation !== "all") {
    filtered = filtered.filter(r => r.relation === state.activeRelation);
  }

  // ② 期間フィルター
  if (state.filter.startDate) {
    filtered = filtered.filter(r => r.date >= state.filter.startDate);
  }
  if (state.filter.endDate) {
    filtered = filtered.filter(r => r.date <= state.filter.endDate);
  }

  // ③ キーワードフィルター
  if (state.filter.keyword) {
    filtered = filtered.filter(r => {
      const nameHit = r.name && r.name.toLowerCase().includes(state.filter.keyword);
      const memoHit = r.memo && r.memo.toLowerCase().includes(state.filter.keyword);
      return nameHit || memoHit;
    });
  }

  // ④ 系統 / カスタムタイプフィルター
  if (state.filter.category !== "all") {
    filtered = filtered.filter(r => {
      const type = get16TypeFromSums(r.scores);
      if (state.filter.category === "custom") {
        if (!state.filter.customPattern) return true;
        return matchTypePattern(type, state.filter.customPattern);
      }
      const cat = getColorCategory(type);
      return cat === state.filter.category;
    });
  }

  // ⑤ 件数制限（直近N件）
  if (state.filter.limit !== "all") {
    const limitNum = parseInt(state.filter.limit, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      filtered = filtered.slice(0, limitNum);
    }
  }

  // 統計集計の計算（合計点の平均値を算出）
  renderAggregatedStats(filtered);
  renderMiniCards(responses);
  renderResponseList(filtered);
}

// 4〜16点の合計点から 16タイプ文字列（INTJなど）を算出
function get16TypeFromSums(sums) {
  if (!sums || sums.length !== 4) return "----";
  const e_i = sums[0] > 10 ? "I" : "E";
  const s_n = sums[1] > 10 ? "N" : "S";
  const t_f = sums[2] > 10 ? "F" : "T";
  const j_p = sums[3] > 10 ? "P" : "J";
  return `${e_i}${s_n}${t_f}${j_p}`;
}

// 系統色カテゴリの判定
function getColorCategory(typeStr) {
  if (!typeStr || typeStr.length < 4) return "sj";
  const sn = typeStr[1];
  const tf = typeStr[2];
  const jp = typeStr[3];
  if (sn === "N" && tf === "T") return "nt";
  if (sn === "N" && tf === "F") return "nf";
  if (sn === "S" && jp === "J") return "sj";
  if (sn === "S" && jp === "P") return "sp";
  return "sj";
}

// ワイルドカード（- や _）対応のタイプパターンマッチ
function matchTypePattern(type, pattern) {
  if (pattern.length > 4) pattern = pattern.substring(0, 4);
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p === "-" || p === "_") continue;
    if (type[i] !== p) return false;
  }
  return true;
}

// 絞り込み後の集計結果を描画
function renderAggregatedStats(list) {
  const domType = document.getElementById("dominant-type");
  const typeDesc = document.getElementById("type-description");
  const filterLabel = document.getElementById("current-filter-label");
  const summaryCard = document.querySelector(".result-summary-card");

  const relName = state.activeRelation === "all" ? "全体" : (RELATIONS_MAP[state.activeRelation] || "指定条件");
  filterLabel.textContent = `${relName}の他己評価タイプ (${list.length}件)`;

  if (list.length === 0) {
    domType.textContent = "----";
    typeDesc.textContent = "該当する回答データがありません。条件を変更してください。";
    summaryCard.className = "result-summary-card theme-sj";
    resetAxesBars();
    return;
  }

  // 合計点の総和を足し合わせ、回答人数 list.length で割って各軸の平均合計点を算出
  const avgSums = [0, 0, 0, 0];
  list.forEach(r => {
    r.scores.forEach((s, i) => {
      avgSums[i] += s;
    });
  });
  avgSums.forEach((sum, i) => {
    avgSums[i] = sum / list.length;
  });

  const finalType = get16TypeFromSums(avgSums);
  domType.textContent = finalType;
  typeDesc.textContent = TYPE_DESCS[finalType] || "";

  const colorCat = getColorCategory(finalType);
  summaryCard.className = `result-summary-card theme-${colorCat}`;

  // 4軸バーの描画：(avgSum - 4) / 12 * 100 で厳密なパーセンテージを算出
  const axes = ["ei", "sn", "tf", "jp"];
  avgSums.forEach((avgVal, idx) => {
    const id = axes[idx];
    const rightPct = Math.round(((avgVal - 4) / 12) * 100);
    const leftPct = 100 - rightPct;

    document.getElementById(`bar-${id}`).style.left = `${rightPct}%`;
    document.getElementById(`val-${id}`).textContent = `${leftPct}% : ${rightPct}%`;
  });
}

function resetAxesBars() {
  ["ei", "sn", "tf", "jp"].forEach(id => {
    document.getElementById(`bar-${id}`).style.left = "50%";
    document.getElementById(`val-${id}`).textContent = "50% : 50%";
  });
}

// 関係性ごとの小計ミニカード群の描画
function renderMiniCards(allResponses) {
  const container = document.getElementById("relation-mini-cards");
  if (!container) return;
  container.innerHTML = "";

  const relConfigs = [
    { k: "friend", l: "友達" },
    { k: "partner", l: "恋人" },
    { k: "work", l: "職場・学校" },
    { k: "family", l: "家族" },
    { k: "hobby", l: "ネット・趣味" },
    { k: "other", l: "その他" }
  ];

  relConfigs.forEach(item => {
    const group = allResponses.filter(r => r.relation === item.k);
    const card = document.createElement("div");
    card.className = "mini-summary-card";

    let typeStr = "―";
    let themeClass = "mini-theme-empty";

    if (group.length > 0) {
      const avgSums = [0, 0, 0, 0];
      group.forEach(r => {
        r.scores.forEach((s, i) => { avgSums[i] += s; });
      });
      avgSums.forEach((sum, i) => { avgSums[i] = sum / group.length; });
      typeStr = get16TypeFromSums(avgSums);
      themeClass = `mini-theme-${getColorCategory(typeStr)}`;
    }

    card.classList.add(themeClass);
    card.innerHTML = `
      <span class="mini-card-title">${item.l}</span>
      <span class="mini-card-type">${typeStr}</span>
      <span class="mini-card-count">(${group.length}件)</span>
    `;

    card.addEventListener("click", () => {
      const tabBtn = document.querySelector(`.relation-tabs .tab-btn[data-rel="${item.k}"]`);
      if (tabBtn) tabBtn.click();
    });

    container.appendChild(card);
  });
}

// 回答履歴一覧の描画
function renderResponseList(list) {
  const container = document.getElementById("response-list");
  if (!container) return;
  container.innerHTML = "";

  const delSelBtn = document.getElementById("delete-selected-btn");
  if (delSelBtn) {
    delSelBtn.disabled = state.selectedResponses.size === 0;
    delSelBtn.textContent = state.selectedResponses.size > 0 
      ? `選択した回答を削除 (${state.selectedResponses.size})`
      : "選択した回答を削除";
  }

  if (list.length === 0) {
    container.innerHTML = `<p style="text-align: center; color: #94a3b8; padding: 20px; font-size: 0.85rem;">表示できる回答履歴がありません</p>`;
    return;
  }

  list.forEach(r => {
    const card = document.createElement("div");
    card.className = "response-card";

    const type = get16TypeFromSums(r.scores);
    const colorCat = getColorCategory(type);
    const relLabel = RELATIONS_MAP[r.relation] || "その他";

    const isChecked = state.selectedResponses.has(r.id);

    card.innerHTML = `
      <div class="response-card-main">
        <div class="response-info-left">
          <input type="checkbox" class="response-checkbox" data-id="${r.id}" ${isChecked ? "checked" : ""}>
          <span class="response-name-clickable" data-toggle="${r.id}">
            <strong>${escapeHtml(r.name)}</strong>
            <span class="response-toggle-arrow">▼</span>
          </span>
          <div class="memo-wrap">
            ${r.memo 
              ? `<span class="response-memo-tag" data-memoid="${r.id}" title="${escapeHtml(r.memo)}">📝 ${escapeHtml(r.memo)} <span class="memo-edit-pen">✎</span></span>`
              : `<button type="button" class="btn-add-memo" data-memoid="${r.id}">＋メモ</button>`
            }
          </div>
        </div>
        <div class="response-info-right">
          <span class="badge-rel rel-${r.relation}">${relLabel}</span>
          <span class="response-type type-${colorCat}">${type}</span>
          <span class="response-date">${r.date || ""}</span>
        </div>
      </div>
      <div class="response-detail" id="detail-${r.id}">
        <div class="detail-header-label">この回答者の評価パラメータ</div>
        <div class="detail-axes">
          ${renderDetailAxis("外向 (E)", "内向 (I)", r.scores[0])}
          ${renderDetailAxis("感覚 (S)", "直観 (N)", r.scores[1])}
          ${renderDetailAxis("思考 (T)", "感情 (F)", r.scores[2])}
          ${renderDetailAxis("判断 (J)", "知覚 (P)", r.scores[3])}
        </div>
      </div>
    `;

    // チェックボックスイベント
    const chk = card.querySelector(".response-checkbox");
    chk.addEventListener("change", (e) => {
      if (e.target.checked) {
        state.selectedResponses.add(r.id);
      } else {
        state.selectedResponses.delete(r.id);
      }
      delSelBtn.disabled = state.selectedResponses.size === 0;
      delSelBtn.textContent = state.selectedResponses.size > 0 
        ? `選択した回答を削除 (${state.selectedResponses.size})`
        : "選択した回答を削除";
    });

    // 詳細アコーディオン開閉
    const toggleBtn = card.querySelector(`[data-toggle="${r.id}"]`);
    toggleBtn.addEventListener("click", () => {
      card.classList.toggle("open");
    });

    // メモ編集・追加イベント
    const memoEl = card.querySelector(`[data-memoid="${r.id}"]`);
    if (memoEl) {
      memoEl.addEventListener("click", () => {
        const currentMemo = r.memo || "";
        const newMemo = prompt("この回答に関するひとことメモを入力してください（例: 高校の同級生、職場の後輩）:", currentMemo);
        if (newMemo !== null) {
          r.memo = newMemo.trim();
          saveProfiles();
          updateStatsView();
        }
      });
    }

    container.appendChild(card);
  });
}

function renderDetailAxis(leftLabel, rightLabel, sumScore) {
  const rightPct = Math.round(((sumScore - 4) / 12) * 100);
  const leftPct = 100 - rightPct;
  return `
    <div class="detail-axis-row">
      <div class="detail-axis-labels">
        <span style="color: #4f46e5;">${leftLabel} ${leftPct}%</span>
        <span style="color: #0ea5e9;">${rightPct}% ${rightLabel}</span>
      </div>
      <div class="detail-axis-bar-wrap">
        <div class="detail-axis-indicator" style="left: ${rightPct}%;"></div>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

// バックアップ・引継ぎモーダル制御
function initBackupEvents() {
  const modal = document.getElementById("backup-modal");
  const openBtn = document.getElementById("backup-profile-btn");
  const initImportBtn = document.getElementById("init-import-btn");
  const closeBtn = document.getElementById("close-backup-modal-btn");

  const tabExp = document.getElementById("tab-export-btn");
  const tabImp = document.getElementById("tab-import-btn");
  const paneExp = document.getElementById("export-pane");
  const paneImp = document.getElementById("import-pane");

  const openModal = () => { if (modal) modal.style.display = "flex"; };
  const closeModal = () => { if (modal) modal.style.display = "none"; };

  if (openBtn) openBtn.addEventListener("click", openModal);
  if (initImportBtn) initImportBtn.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  if (tabExp && tabImp) {
    tabExp.addEventListener("click", () => {
      tabExp.classList.add("active");
      tabImp.classList.remove("active");
      paneExp.style.display = "block";
      paneImp.style.display = "none";
    });
    tabImp.addEventListener("click", () => {
      tabImp.classList.add("active");
      tabExp.classList.remove("active");
      paneExp.style.display = "none";
      paneImp.style.display = "block";
    });
  }

  // ファイルエクスポート
  const btnDown = document.getElementById("btn-download-backup-file");
  if (btnDown) {
    btnDown.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.profiles, null, 2));
      const a = document.createElement("a");
      a.href = dataStr;
      a.download = `persona16_backup_${new Date().toISOString().split("T")[0]}.json`;
      a.click();
    });
  }

  // コードコピー
  const btnCopyCode = document.getElementById("btn-copy-backup-code");
  if (btnCopyCode) {
    btnCopyCode.addEventListener("click", () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(state.profiles))));
      navigator.clipboard.writeText(code);
      showToast("引継ぎコードをコピーしました！");
    });
  }

  // インポート実行
  const btnExecImp = document.getElementById("btn-execute-import");
  if (btnExecImp) {
    btnExecImp.addEventListener("click", () => {
      const fileInp = document.getElementById("backup-file-input");
      const codeInp = document.getElementById("backup-code-input");

      if (fileInp && fileInp.files.length > 0) {
        const file = fileInp.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const imported = JSON.parse(e.target.result);
            mergeProfiles(imported);
          } catch (err) {
            alert("無効なJSONファイルです。");
          }
        };
        reader.readAsText(file);
      } else if (codeInp && codeInp.value.trim()) {
        try {
          const jsonStr = decodeURIComponent(escape(atob(codeInp.value.trim())));
          const imported = JSON.parse(jsonStr);
          mergeProfiles(imported);
        } catch (err) {
          alert("引継ぎコードが正しくありません。");
        }
      } else {
        alert("ファイルを選択するか、引継ぎコードを貼り付けてください。");
      }
    });
  }
}

function mergeProfiles(imported) {
  if (!imported || typeof imported !== "object") {
    alert("データ形式が正しくありません。");
    return;
  }
  Object.keys(imported).forEach(id => {
    if (!state.profiles[id]) {
      state.profiles[id] = imported[id];
    } else {
      // 回答レコードの結合
      const existingRids = new Set((state.profiles[id].responses || []).map(r => r.id));
      (imported[id].responses || []).forEach(r => {
        if (!existingRids.has(r.id)) {
          state.profiles[id].responses.push(r);
        }
      });
    }
  });
  saveProfiles();
  alert("プロファイルを正常に復元・結合しました！");
  document.getElementById("backup-modal").style.display = "none";
  renderApp();
}

// SNS共有モーダル制御
function initShareEvents() {
  const modal = document.getElementById("share-modal");
  const openBtn = document.getElementById("open-share-modal-btn");
  const closeBtn = document.getElementById("close-share-modal-btn");

  if (openBtn) openBtn.addEventListener("click", () => {
    if (modal) modal.style.display = "flex";
    prepareShareData();
  });
  if (closeBtn) closeBtn.addEventListener("click", () => {
    if (modal) modal.style.display = "none";
  });
}

function prepareShareData() {
  const profile = state.profiles[state.currentProfileId];
  if (!profile || !profile.responses || profile.responses.length === 0) return;

  const responses = profile.responses;
  const avgSums = [0, 0, 0, 0];
  responses.forEach(r => {
    r.scores.forEach((s, i) => { avgSums[i] += s; });
  });
  avgSums.forEach((sum, i) => { avgSums[i] = Number((sum / responses.length).toFixed(1)); });

  const finalType = get16TypeFromSums(avgSums);

  // 関係性ごとの結果サマリー
  const relSummary = {};
  ["friend", "partner", "work", "family", "hobby", "other"].forEach(rel => {
    const group = responses.filter(r => r.relation === rel);
    if (group.length > 0) {
      const gSums = [0, 0, 0, 0];
      group.forEach(r => { r.scores.forEach((s, i) => { gSums[i] += s; }); });
      gSums.forEach((sum, i) => { gSums[i] = sum / group.length; });
      relSummary[rel] = {
        type: get16TypeFromSums(gSums),
        count: group.length
      };
    }
  });

  const exportPayload = {
    n: profile.name,
    c: responses.length,
    t: finalType,
    sc: avgSums, // 4〜16の合計点平均
    r: relSummary
  };

  const jsonStr = JSON.stringify(exportPayload);
  const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));

  const currentPath = window.location.pathname;
  const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
  const shareViewUrl = `${window.location.origin}${basePath}view.html?d=${encodeURIComponent(base64Str)}`;

  // Xシェアリンク
  const btnX = document.getElementById("btn-share-x");
  if (btnX) {
    const text = encodeURIComponent(`周りから見た私の性格タイプは【${finalType}】でした！\n友達・恋人・職場ごとの仮面（ペルソナ）を暴く他己分析結果👇\n#ペルソナ16タイプ他己分析 #ChimeraTestLab`);
    btnX.href = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareViewUrl)}`;
  }

  // URLコピー
  const btnCopy = document.getElementById("btn-copy-share-url");
  if (btnCopy) {
    btnCopy.onclick = () => {
      navigator.clipboard.writeText(shareViewUrl);
      showToast("閲覧用URLをコピーしました！");
    };
  }

  // 画像生成
  const btnImg = document.getElementById("btn-download-image");
  if (btnImg) {
    btnImg.onclick = () => {
      generateShareImage(profile.name, finalType, responses.length);
    };
  }
}

// Canvasを使ったシェアカード画像生成
function generateShareImage(targetName, typeStr, count) {
  const canvas = document.getElementById("share-card-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // 背景
  const grad = ctx.createLinearGradient(0, 0, 1200, 630);
  grad.addColorStop(0, "#1e1b4b");
  grad.addColorStop(1, "#312e81");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1200, 630);

  // 外枠カード
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(60, 60, 1080, 510, 24);
  ctx.fill();
  ctx.stroke();

  // タイトル
  ctx.fillStyle = "#c7d2fe";
  ctx.font = "bold 26px sans-serif";
  ctx.fillText("CHIMERA TEST LAB ｜ ペルソナ16タイプ他己分析", 100, 130);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px sans-serif";
  ctx.fillText(`${targetName} さんの他己分析結果（回答数: ${count}件）`, 100, 200);

  // メインタイプ表示
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 110px sans-serif";
  ctx.fillText(typeStr, 100, 340);

  ctx.fillStyle = "#e0e7ff";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText(TYPE_DESCS[typeStr] || "", 100, 410, 980);

  // フッター
  ctx.fillStyle = "#94a3b8";
  ctx.font = "22px sans-serif";
  ctx.fillText("https://tests.hiddenchimera.com/", 100, 520);

  // ダウンロード実行
  const link = document.createElement("a");
  link.download = `persona16_${targetName}_${typeStr}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}
