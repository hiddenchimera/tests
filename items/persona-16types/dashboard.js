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

  const exists = profile.responses.some(r => r.id === rid);
  if (!exists) {
    profile.responses.unshift({
      id: rid,
      name: n ? n.trim() : "匿名",
      relation: rel,
      scores: scores,
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

  const selector = document.getElementById("profile-selector");
  if (selector) {
    selector.addEventListener("change", (e) => {
      state.currentProfileId = e.target.value;
      state.selectedResponses.clear();
      renderApp();
    });
  }

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

  const copyBtn = document.getElementById("copy-url-btn");
  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const input = document.getElementById("share-url-input");
      input.select();
      navigator.clipboard.writeText(input.value);
      showToast("回答用URLをコピーしました！");
    });
  }

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

  initBackupEvents();
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

  let filtered = [...responses];

  if (state.activeRelation !== "all") {
    filtered = filtered.filter(r => r.relation === state.activeRelation);
  }
  if (state.filter.startDate) {
    filtered = filtered.filter(r => r.date >= state.filter.startDate);
  }
  if (state.filter.endDate) {
    filtered = filtered.filter(r => r.date <= state.filter.endDate);
  }
  if (state.filter.keyword) {
    filtered = filtered.filter(r => {
      const nameHit = r.name && r.name.toLowerCase().includes(state.filter.keyword);
      const memoHit = r.memo && r.memo.toLowerCase().includes(state.filter.keyword);
      return nameHit || memoHit;
    });
  }
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
  if (state.filter.limit !== "all") {
    const limitNum = parseInt(state.filter.limit, 10);
    if (!isNaN(limitNum) && limitNum > 0) {
      filtered = filtered.slice(0, limitNum);
    }
  }

  renderAggregatedStats(filtered);
  renderMiniCards(responses);
  renderResponseList(filtered);
}

function get16TypeFromSums(sums) {
  if (!sums || sums.length !== 4) return "----";
  const e_i = sums[0] > 10 ? "I" : "E";
  const s_n = sums[1] > 10 ? "N" : "S";
  const t_f = sums[2] > 10 ? "F" : "T";
  const j_p = sums[3] > 10 ? "P" : "J";
  return `${e_i}${s_n}${t_f}${j_p}`;
}

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

function matchTypePattern(type, pattern) {
  if (pattern.length > 4) pattern = pattern.substring(0, 4);
  for (let i = 0; i < pattern.length; i++) {
    const p = pattern[i];
    if (p === "-" || p === "_") continue;
    if (type[i] !== p) return false;
  }
  return true;
}

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

    const toggleBtn = card.querySelector(`[data-toggle="${r.id}"]`);
    toggleBtn.addEventListener("click", () => {
      card.classList.toggle("open");
    });

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

  const btnCopyCode = document.getElementById("btn-copy-backup-code");
  if (btnCopyCode) {
    btnCopyCode.addEventListener("click", () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(state.profiles))));
      navigator.clipboard.writeText(code);
      showToast("引継ぎコードをコピーしました！");
    });
  }

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
    sc: avgSums,
    r: relSummary
  };

  const jsonStr = JSON.stringify(exportPayload);
  const base64Str = btoa(unescape(encodeURIComponent(jsonStr)));

  const currentPath = window.location.pathname;
  const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
  const shareViewUrl = `${window.location.origin}${basePath}view.html?d=${encodeURIComponent(base64Str)}`;

  const btnX = document.getElementById("btn-share-x");
  if (btnX) {
    const text = encodeURIComponent(`周りから見た私の性格タイプは【${finalType}】でした！\n友達・恋人・職場ごとの仮面（ペルソナ）を暴く他己分析結果👇\n#ペルソナ16タイプ他己分析 #ChimeraTestLab`);
    btnX.href = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareViewUrl)}`;
  }

  const btnCopy = document.getElementById("btn-copy-share-url");
  if (btnCopy) {
    btnCopy.onclick = () => {
      navigator.clipboard.writeText(shareViewUrl);
      showToast("閲覧用URLをコピーしました！");
    };
  }

  const btnImg = document.getElementById("btn-download-image");
  if (btnImg) {
    btnImg.onclick = () => {
      generateShareImage(profile.name, finalType, responses.length, avgSums, relSummary);
    };
  }
}

// Canvasを使ったシェアカード画像生成（2枚目のライトUI＆フルコンポーネントデザイン）
function generateShareImage(targetName, typeStr, count, avgSums, relSummary) {
  const canvas = document.getElementById("share-card-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // 1200 x 630 (OGP / Twitter標準比率)
  canvas.width = 1200;
  canvas.height = 630;

  // 1. 全体背景（サイトと同じ微細ドットパターン #f8fafc + #cbd5e1 ドット）
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, 1200, 630);

  ctx.fillStyle = "#cbd5e1";
  const dotSpacing = 24;
  for (let x = 12; x < 1200; x += dotSpacing) {
    for (let y = 12; y < 630; y += dotSpacing) {
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 2. メインの白いカード枠 (#quiz-card風)
  ctx.save();
  ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(40, 30, 1120, 570, 24);
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // 3. ヘッダー：DASHBOARD バッジ
  ctx.fillStyle = "#eef2ff";
  ctx.strokeStyle = "#c7d2fe";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(75, 56, 110, 28, 999);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#4f46e5";
  ctx.font = "bold 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("DASHBOARD", 130, 75);

  // 4. ヘッダー右上ロゴ
  ctx.textAlign = "right";
  ctx.font = "bold 16px sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("Chimera Test Lab  |  ペルソナ16タイプ他己分析", 1125, 75);

  // 5. タイトル：「○○ さんの他己分析」
  ctx.textAlign = "left";
  ctx.fillStyle = "#0f172a";
  ctx.font = "900 34px sans-serif";
  ctx.fillText(`${targetName} さんの他己分析`, 75, 122);

  // 6. メイン総合判定カード（左上）
  const colorCat = getColorCategory(typeStr);
  const themeColors = {
    nt: { bg: "#f5f3ff", border: "#ddd6fe", sub: "#7c3aed", type: "#5b21b6" },
    nf: { bg: "#f0fdf4", border: "#bbf7d0", sub: "#16a34a", type: "#14532d" },
    sj: { bg: "#f0f9ff", border: "#bae6fd", sub: "#0284c7", type: "#0c4a6e" },
    sp: { bg: "#fffbeb", border: "#fde68a", sub: "#d97706", type: "#78350f" }
  };
  const theme = themeColors[colorCat] || themeColors.sj;

  ctx.fillStyle = theme.bg;
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(75, 142, 470, 228, 16);
  ctx.fill();
  ctx.stroke();

  // 総合判定カード内テキスト
  ctx.textAlign = "center";
  ctx.fillStyle = theme.sub;
  ctx.font = "bold 16px sans-serif";
  ctx.fillText(`全体から見たタイプ (${count}件の回答)`, 310, 180);

  ctx.fillStyle = theme.type;
  ctx.font = "900 68px sans-serif";
  ctx.fillText(typeStr, 310, 260);

  ctx.fillStyle = "#475569";
  ctx.font = "bold 14px sans-serif";
  let desc = TYPE_DESCS[typeStr] || "";
  if (desc.length > 25) desc = desc.substring(0, 25) + "…";
  ctx.fillText(desc, 310, 315);

  // 7. 関係性ミニカード群（右上 3列×2行）
  const relDefs = [
    { k: "friend", l: "友達", col: 0, row: 0 },
    { k: "partner", l: "恋人", col: 1, row: 0 },
    { k: "work", l: "職場・学校", col: 2, row: 0 },
    { k: "family", l: "家族", col: 0, row: 1 },
    { k: "hobby", l: "ネット・趣味", col: 1, row: 1 },
    { k: "other", l: "その他", col: 2, row: 1 }
  ];

  const miniStartX = 570;
  const miniStartY = 142;
  const miniW = 173;
  const miniH = 108;
  const miniGap = 18;

  relDefs.forEach(def => {
    const x = miniStartX + def.col * (miniW + miniGap);
    const y = miniStartY + def.row * (miniH + miniGap);
    const relData = relSummary[def.k];

    let rType = "―";
    let rCount = 0;
    let rTheme = { bg: "#ffffff", border: "#e2e8f0", typeColor: "#cbd5e1" };

    if (relData && relData.count > 0) {
      rType = relData.type;
      rCount = relData.count;
      const rCat = getColorCategory(rType);
      rTheme = themeColors[rCat] || themeColors.sj;
    }

    ctx.fillStyle = rTheme.bg;
    ctx.strokeStyle = rTheme.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, miniW, miniH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(def.l, x + miniW / 2, y + 26);

    ctx.fillStyle = rTheme.typeColor || rTheme.type;
    ctx.font = "900 28px sans-serif";
    ctx.fillText(rType, x + miniW / 2, y + 66);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`(${rCount}件)`, x + miniW / 2, y + 92);
  });

  // 8. 4軸スライダー群（下部 2列×2行）
  const axisDefs = [
    { left: "外向 (E)", right: "内向 (I)", sum: avgSums[0], col: 0, row: 0 },
    { left: "感覚 (S)", right: "直観 (N)", sum: avgSums[1], col: 1, row: 0 },
    { left: "思考 (T)", right: "感情 (F)", sum: avgSums[2], col: 0, row: 1 },
    { left: "判断 (J)", right: "知覚 (P)", sum: avgSums[3], col: 1, row: 1 }
  ];

  const axisStartX = 75;
  const axisStartY = 405;
  const axisW = 495;
  const axisH = 68;
  const axisGapX = 55;
  const axisGapY = 16;

  axisDefs.forEach(def => {
    const x = axisStartX + def.col * (axisW + axisGapX);
    const y = axisStartY + def.row * (axisH + axisGapY);

    const rightPct = Math.round(((def.sum - 4) / 12) * 100);
    const leftPct = 100 - rightPct;

    // スライダー枠
    ctx.fillStyle = "#f8fafc";
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, y, axisW, axisH, 10);
    ctx.fill();
    ctx.stroke();

    // テキスト行
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#4f46e5";
    ctx.fillText(def.left, x + 16, y + 26);

    ctx.textAlign = "right";
    ctx.fillStyle = "#0ea5e9";
    ctx.fillText(def.right, x + axisW - 16, y + 26);

    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`${leftPct}% : ${rightPct}%`, x + axisW / 2, y + 26);

    // バー背景
    const barX = x + 16;
    const barY = y + 42;
    const barW = axisW - 32;
    const barH = 6;

    ctx.fillStyle = "#e2e8f0";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 999);
    ctx.fill();

    // インジケーター丸
    const indX = barX + (barW * (rightPct / 100));
    const indY = barY + barH / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;

    ctx.fillStyle = "#4f46e5";
    ctx.beginPath();
    ctx.arc(indX, indY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });

  // ダウンロード実行
  const link = document.createElement("a");
  link.download = `persona16_${targetName}_result.png`;
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
