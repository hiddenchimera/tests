// 関係性マッピング定義
const RELATIONS = {
  friend: { label: "友達", class: "rel-friend" },
  partner: { label: "恋人", class: "rel-partner" },
  work: { label: "職場・学校", class: "rel-work" },
  family: { label: "家族", class: "rel-family" },
  hobby: { label: "ネット・趣味", class: "rel-hobby" },
  other: { label: "その他", class: "rel-other" }
};

// 16タイプの簡易解説
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

// アプリデータ管理
let store = loadStore();

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);

  // --- ① 新規回答の受け取り処理 ---
  const rid = urlParams.get("rid");
  const rel = urlParams.get("rel");
  const sc = urlParams.get("sc");
  const uid = urlParams.get("uid");
  const n = urlParams.get("n") || "匿名";

  if (rid && rel && sc) {
    handleIncomingResponse(rid, rel, sc, uid, n);
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // --- ② 画面初期表示 ---
  renderApp();

  // --- ③ 初回URL発行ボタンイベント ---
  const generateBtn = document.getElementById("generate-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const nameInput = document.getElementById("user-name-input").value.trim();
      if (!nameInput) {
        alert("ニックネームを入力してください");
        return;
      }
      createProfile(nameInput);
    });
  }

  // --- ④ プロファイル新規追加ボタン ---
  const addProfileBtn = document.getElementById("add-profile-btn");
  if (addProfileBtn) {
    addProfileBtn.addEventListener("click", () => {
      const newName = prompt("新しいプロファイルのニックネームを入力してください（例: 本名用、SNS用など）");
      if (newName && newName.trim()) {
        createProfile(newName.trim());
      }
    });
  }

  // --- ⑤ 現在のプロファイル削除ボタン ---
  const deleteProfileBtn = document.getElementById("delete-profile-btn");
  if (deleteProfileBtn) {
    deleteProfileBtn.addEventListener("click", () => {
      const current = getCurrentProfile();
      if (!current) return;

      if (!confirm(`プロファイル「${current.name}」と、このプロファイルに届いたすべての回答データを削除しますか？\n（この操作は取り消せません）`)) {
        return;
      }

      store.profiles = store.profiles.filter(p => p.id !== current.id);
      store.activeProfileId = store.profiles.length > 0 ? store.profiles[0].id : null;
      saveStore();
      renderApp();
      showToast("プロファイルを削除しました");
    });
  }

  // --- ⑥ バックアップ・引継ぎモーダルの初期化 ---
  initBackupFeature();
});

// 暗号学的一意ID生成関数
function generateUUID(prefix = "") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return prefix + crypto.randomUUID();
  }
  return prefix + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 9);
}

// 4色系統クラスの取得
function getColorCategoryClass(typeStr) {
  if (!typeStr || typeStr.length < 4) return "theme-sj";
  const s_n = typeStr[1];
  const t_f = typeStr[2];
  const j_p = typeStr[3];

  if (s_n === "N" && t_f === "T") return "nt";
  if (s_n === "N" && t_f === "F") return "nf";
  if (s_n === "S" && j_p === "J") return "sj";
  if (s_n === "S" && j_p === "P") return "sp";
  return "sj";
}

// 日付フォーマット関数（YYYY/MM/DD）
function formatDate(isoStr) {
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
}

// ストレージ読み込み処理
function loadStore() {
  const raw = localStorage.getItem("persona16_data");
  if (!raw) {
    return { activeProfileId: null, profiles: [] };
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed.userName && Array.isArray(parsed.responses)) {
      const migratedProfile = {
        id: generateUUID("p_"),
        name: parsed.userName,
        responses: parsed.responses
      };
      const newStore = {
        activeProfileId: migratedProfile.id,
        profiles: [migratedProfile]
      };
      localStorage.setItem("persona16_data", JSON.stringify(newStore));
      return newStore;
    }
    return parsed;
  } catch (e) {
    return { activeProfileId: null, profiles: [] };
  }
}

function saveStore() {
  localStorage.setItem("persona16_data", JSON.stringify(store));
}

function getCurrentProfile() {
  return store.profiles.find(p => p.id === store.activeProfileId) || null;
}

function createProfile(name) {
  const newProfile = {
    id: generateUUID("p_"),
    name: name,
    responses: []
  };
  store.profiles.push(newProfile);
  store.activeProfileId = newProfile.id;
  saveStore();
  renderApp();
  showToast(`プロファイル「${name}」を作成しました`);
}

// 送られてきた回答の蓄積（本人識別チェック）
function handleIncomingResponse(rid, rel, sc, uid, n) {
  if (!uid) {
    alert("エラー: 出題者IDが含まれていない無効な回答URLです。");
    return;
  }

  const targetProfile = store.profiles.find(p => p.id === uid);

  if (!targetProfile) {
    alert(
      `【確認】\nこのリンクは、回答を募集した出題者本人（URLを発行した端末）専用の受け取りリンクです。\n\n現在の端末には該当する出題者データが見つかりませんでした。\nこのURLを出題者にLINEやDMで送り返してください。`
    );
    return;
  }

  const isDuplicate = targetProfile.responses.some(r => r.id === rid);
  if (isDuplicate) {
    showToast("この回答はすでに反映済みです");
    store.activeProfileId = targetProfile.id;
    saveStore();
    return;
  }

  const scores = sc.split(",").map(Number);
  const computedType = calculateTypeFromScore(scores);

  targetProfile.responses.unshift({
    id: rid,
    name: n,
    relation: rel,
    scores: scores,
    type: computedType,
    memo: "",
    createdAt: new Date().toISOString()
  });

  store.activeProfileId = targetProfile.id;
  saveStore();
  showToast(`${n}さん（${RELATIONS[rel]?.label || "回答"}）のデータを反映しました！`);
}

// 画面全体の再描画
function renderApp() {
  const setupView = document.getElementById("setup-view");
  const dashboardView = document.getElementById("dashboard-view");
  const currentProfile = getCurrentProfile();

  if (!currentProfile) {
    setupView.style.display = "block";
    dashboardView.style.display = "none";
  } else {
    setupView.style.display = "none";
    dashboardView.style.display = "block";
    updateProfileSelector();
    initDashboard(currentProfile);
  }
}

// プロファイル選択ドロップダウンの更新
function updateProfileSelector() {
  const selector = document.getElementById("profile-selector");
  selector.innerHTML = "";

  store.profiles.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `${p.name} (${p.responses.length}件)`;
    if (p.id === store.activeProfileId) opt.selected = true;
    selector.appendChild(opt);
  });

  selector.onchange = () => {
    store.activeProfileId = selector.value;
    saveStore();
    renderApp();
  };
}

// カスタムタイプ照合ヘルパー
function matchCustomTypePattern(targetType, pattern) {
  if (!targetType || !pattern) return true;
  const p = pattern.trim().toUpperCase();
  if (p.length === 0) return true;

  for (let i = 0; i < 4; i++) {
    const pChar = p[i];
    if (!pChar || pChar === "-" || pChar === "_" || pChar === " ") {
      continue;
    }
    if (targetType[i] !== pChar) {
      return false;
    }
  }
  return true;
}

// ダッシュボード初期化
function initDashboard(profile) {
  document.getElementById("target-user-name").textContent = profile.name;

  const currentPath = window.location.pathname;
  const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
  const answerUrl = `${window.location.origin}${basePath}answer.html?u=${encodeURIComponent(profile.name)}&uid=${profile.id}`;

  const shareInput = document.getElementById("share-url-input");
  shareInput.value = answerUrl;

  document.getElementById("copy-url-btn").onclick = () => {
    shareInput.select();
    navigator.clipboard.writeText(answerUrl);
    showToast("回答募集URLをコピーしました！");
  };

  const dateFilterBox = document.getElementById("date-filter-box");
  const dateStartInput = document.getElementById("date-start");
  const dateEndInput = document.getElementById("date-end");
  const keywordInput = document.getElementById("filter-keyword");
  const dateClearBtn = document.getElementById("date-filter-clear-btn");
  const limitPills = document.querySelectorAll("#filter-limit-group .filter-pill");
  const customLimitInput = document.getElementById("filter-limit-custom");
  const catPills = document.querySelectorAll("#filter-category-group .filter-pill");
  const customTypeRow = document.getElementById("custom-type-row");
  const customTypeInput = document.getElementById("filter-custom-type");

  let currentRel = "all";
  let currentLimit = "all";
  let currentCat = "all";

  if (profile.responses.length > 0) {
    dateFilterBox.style.display = "block";
  } else {
    dateFilterBox.style.display = "none";
  }

  const getFilteredResponses = () => {
    let result = [...profile.responses];

    const sVal = dateStartInput.value;
    const eVal = dateEndInput.value;
    if (sVal) {
      const start = new Date(`${sVal}T00:00:00`);
      result = result.filter(r => new Date(r.createdAt) >= start);
    }
    if (eVal) {
      const end = new Date(`${eVal}T23:59:59.999`);
      result = result.filter(r => new Date(r.createdAt) <= end);
    }

    const kw = keywordInput.value.trim().toLowerCase();
    if (kw) {
      result = result.filter(r => {
        const nameMatch = (r.name || "").toLowerCase().includes(kw);
        const memoMatch = (r.memo || "").toLowerCase().includes(kw);
        return nameMatch || memoMatch;
      });
    }

    if (currentCat === "custom") {
      const pattern = customTypeInput.value;
      result = result.filter(r => matchCustomTypePattern(r.type, pattern));
    } else if (currentCat !== "all") {
      result = result.filter(r => getColorCategoryClass(r.type) === currentCat);
    }

    let limitNum = null;
    const customLimitVal = customLimitInput.value.trim();
    if (customLimitVal) {
      const parsed = parseInt(customLimitVal, 10);
      if (!isNaN(parsed) && parsed > 0) limitNum = parsed;
    } else if (currentLimit !== "all") {
      const parsed = parseInt(currentLimit, 10);
      if (!isNaN(parsed)) limitNum = parsed;
    }

    if (limitNum !== null) {
      result = result.slice(0, limitNum);
    }

    return result;
  };

  const refreshDashboardView = () => {
    const filteredResponses = getFilteredResponses();
    const isFiltered = !!(
      dateStartInput.value || 
      dateEndInput.value || 
      keywordInput.value.trim() || 
      currentLimit !== "all" || 
      customLimitInput.value.trim() ||
      currentCat !== "all" ||
      (currentCat === "custom" && customTypeInput.value.trim())
    );

    renderStats(filteredResponses, currentRel, profile.responses.length > 0, isFiltered);
    renderResponseList(profile, filteredResponses);
  };

  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentRel = btn.getAttribute("data-rel");
      refreshDashboardView();
    };
  });

  dateStartInput.onchange = refreshDashboardView;
  dateEndInput.onchange = refreshDashboardView;
  keywordInput.oninput = refreshDashboardView;

  limitPills.forEach(pill => {
    pill.onclick = () => {
      limitPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentLimit = pill.getAttribute("data-limit");
      customLimitInput.value = "";
      refreshDashboardView();
    };
  });

  customLimitInput.oninput = () => {
    if (customLimitInput.value.trim()) {
      limitPills.forEach(p => p.classList.remove("active"));
      currentLimit = "custom";
    } else {
      limitPills[0].classList.add("active");
      currentLimit = "all";
    }
    refreshDashboardView();
  };

  catPills.forEach(pill => {
    pill.onclick = () => {
      catPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      currentCat = pill.getAttribute("data-cat");

      if (currentCat === "custom") {
        customTypeRow.style.display = "flex";
        customTypeInput.focus();
      } else {
        customTypeRow.style.display = "none";
      }

      refreshDashboardView();
    };
  });

  customTypeInput.oninput = refreshDashboardView;

  dateClearBtn.onclick = () => {
    dateStartInput.value = "";
    dateEndInput.value = "";
    keywordInput.value = "";
    currentLimit = "all";
    customLimitInput.value = "";
    currentCat = "all";
    customTypeInput.value = "";
    customTypeRow.style.display = "none";

    limitPills.forEach(p => p.classList.toggle("active", p.getAttribute("data-limit") === "all"));
    catPills.forEach(p => p.classList.toggle("active", p.getAttribute("data-cat") === "all"));

    refreshDashboardView();
  };

  initShareFeature(profile);
  refreshDashboardView();
}

function computeGroupMetrics(items) {
  if (!items || items.length === 0) return null;
  const avgScores = [0, 0, 0, 0];
  items.forEach(r => {
    r.scores.forEach((s, idx) => {
      avgScores[idx] += s;
    });
  });
  avgScores.forEach((sum, idx) => {
    avgScores[idx] = sum / items.length;
  });
  const type = calculateTypeFromScore(avgScores);
  return { avgScores, type, count: items.length };
}

function renderStats(responses, activeRel = "all", hasTotalResponses = true, isFiltered = false) {
  const tabsContainer = document.getElementById("relation-tabs");
  const emptyState = document.getElementById("empty-state");
  const statsArea = document.getElementById("stats-area");
  const summaryCard = document.querySelector(".result-summary-card");
  const miniCardsContainer = document.getElementById("relation-mini-cards");

  if (!hasTotalResponses) {
    tabsContainer.style.display = "none";
    statsArea.style.display = "none";
    emptyState.style.display = "block";
    document.getElementById("empty-state-title").textContent = "まだ回答が届いていません";
    document.getElementById("empty-state-desc").textContent = "上のURLを友達や仲間にシェアして、あなたの普段の印象を回答してもらいましょう！";
    return;
  }

  if (responses.length === 0 && isFiltered) {
    tabsContainer.style.display = "flex";
    statsArea.style.display = "none";
    emptyState.style.display = "block";
    document.getElementById("empty-state-title").textContent = "条件に一致する回答はありません";
    document.getElementById("empty-state-desc").textContent = "検索条件を変更するか、「条件をリセット」ボタンを押して全回答を表示してください。";

    document.getElementById("count-all").textContent = 0;
    ["friend", "partner", "work", "family", "hobby", "other"].forEach(r => {
      const countEl = document.getElementById(`count-${r}`);
      if (countEl) countEl.textContent = 0;
    });
    return;
  }

  tabsContainer.style.display = "flex";
  emptyState.style.display = "none";
  statsArea.style.display = "block";

  document.getElementById("count-all").textContent = responses.length;
  ["friend", "partner", "work", "family", "hobby", "other"].forEach(r => {
    const countEl = document.getElementById(`count-${r}`);
    if (countEl) countEl.textContent = responses.filter(item => item.relation === r).length;
  });

  const mainData = activeRel === "all" ? responses : responses.filter(r => r.relation === activeRel);
  const mainMetrics = computeGroupMetrics(mainData);

  const mainLabel = activeRel === "all" ? "全体から見たタイプ" : `「${RELATIONS[activeRel]?.label}」から見たタイプ`;
  document.getElementById("current-filter-label").textContent = mainLabel;

  if (!mainMetrics) {
    document.getElementById("dominant-type").textContent = "―";
    document.getElementById("type-description").textContent = "この関係性からの回答はまだありません。";
    summaryCard.className = "result-summary-card theme-sj";

    ["ei", "sn", "tf", "jp"].forEach(id => {
      document.getElementById(`bar-${id}`).style.left = "50%";
      document.getElementById(`val-${id}`).textContent = "50% : 50%";
    });
  } else {
    document.getElementById("dominant-type").textContent = mainMetrics.type;
    document.getElementById("type-description").textContent = TYPE_DESCS[mainMetrics.type] || "";
    const colorCat = getColorCategoryClass(mainMetrics.type);
    summaryCard.className = `result-summary-card theme-${colorCat}`;

    const axes = [
      { id: "ei", score: mainMetrics.avgScores[0] },
      { id: "sn", score: mainMetrics.avgScores[1] },
      { id: "tf", score: mainMetrics.avgScores[2] },
      { id: "jp", score: mainMetrics.avgScores[3] }
    ];

    axes.forEach(axis => {
      const rightPercent = Math.round(((axis.score - 1) / 3) * 100);
      const leftPercent = 100 - rightPercent;
      document.getElementById(`bar-${axis.id}`).style.left = `${rightPercent}%`;
      document.getElementById(`val-${axis.id}`).textContent = `${leftPercent}% : ${rightPercent}%`;
    });
  }

  miniCardsContainer.innerHTML = "";

  const allRelKeys = ["friend", "partner", "work", "family", "hobby", "other"];

  let miniCardKeys = [];
  if (activeRel === "all") {
    miniCardKeys = allRelKeys.map(k => ({ key: k, label: RELATIONS[k].label }));
  } else {
    miniCardKeys.push({ key: "all", label: "全体" });
    allRelKeys.filter(k => k !== activeRel).forEach(k => {
      miniCardKeys.push({ key: k, label: RELATIONS[k].label });
    });
  }

  miniCardKeys.forEach(item => {
    const groupItems = item.key === "all" ? responses : responses.filter(r => r.relation === item.key);
    const metrics = computeGroupMetrics(groupItems);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "mini-summary-card";

    let typeStr = "―";
    let themeClass = "mini-theme-empty";

    if (metrics) {
      typeStr = metrics.type;
      themeClass = `mini-theme-${getColorCategoryClass(metrics.type)}`;
    }

    card.classList.add(themeClass);

    card.innerHTML = `
      <span class="mini-card-title">${item.label}</span>
      <span class="mini-card-type">${typeStr}</span>
      <span class="mini-card-count">(${groupItems.length}件)</span>
    `;

    card.addEventListener("click", () => {
      const tabBtns = document.querySelectorAll(".tab-btn");
      tabBtns.forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-rel") === item.key);
      });
      activeRel = item.key;
      renderStats(responses, activeRel, hasTotalResponses, isFiltered);
    });

    miniCardsContainer.appendChild(card);
  });
}

function renderResponseList(profile, visibleResponses = null) {
  const container = document.getElementById("response-list");
  const deleteBtn = document.getElementById("delete-selected-btn");
  container.innerHTML = "";

  const list = visibleResponses !== null ? visibleResponses : profile.responses;

  if (list.length === 0) {
    container.innerHTML = `<p style="font-size:0.8rem; color:#94a3b8; text-align:center; padding:12px;">表示できる履歴はありません</p>`;
    deleteBtn.disabled = true;
    return;
  }

  list.forEach(item => {
    const card = document.createElement("div");
    card.className = "response-card";

    const relConfig = RELATIONS[item.relation] || { label: "その他", class: "rel-other" };
    const dateStr = formatDate(item.createdAt);
    const colorCat = getColorCategoryClass(item.type);
    const currentMemo = item.memo || "";

    const axisConfigs = [
      { left: "外向 (E)", right: "内向 (I)", score: item.scores[0] },
      { left: "感覚 (S)", right: "直観 (N)", score: item.scores[1] },
      { left: "思考 (T)", right: "感情 (F)", score: item.scores[2] },
      { left: "判断 (J)", right: "知覚 (P)", score: item.scores[3] }
    ];

    const detailRowsHtml = axisConfigs.map(ax => {
      const rightPct = Math.round(((ax.score - 1) / 3) * 100);
      const leftPct = 100 - rightPct;
      return `
        <div class="detail-axis-row">
          <div class="detail-axis-labels">
            <span style="color:#4f46e5;">${ax.left}</span>
            <span style="color:#64748b; font-size:0.7rem;">${leftPct}% : ${rightPct}%</span>
            <span style="color:#0ea5e9;">${ax.right}</span>
          </div>
          <div class="detail-axis-bar-wrap">
            <div class="detail-axis-indicator" style="left: ${rightPct}%;"></div>
          </div>
        </div>
      `;
    }).join("");

    const memoHtml = currentMemo 
      ? `<span class="response-memo-tag" title="ひとことメモ（タップで編集）">${escapeHtml(currentMemo)}<span class="memo-edit-pen">✏️</span></span>`
      : `<button type="button" class="btn-add-memo" title="ひとことメモを追加">＋メモ</button>`;

    card.innerHTML = `
      <div class="response-card-main">
        <div class="response-info-left">
          <input type="checkbox" class="select-checkbox" data-id="${item.id}">
          <span class="badge-rel ${relConfig.class}">${relConfig.label}</span>
          <span class="response-name-clickable" title="タップでパラメータを表示/非表示">
            ${escapeHtml(item.name)}
            <span class="response-toggle-arrow">▼</span>
          </span>
          <div class="memo-wrap" data-id="${item.id}">
            ${memoHtml}
          </div>
        </div>
        <div class="response-info-right">
          <span class="response-type type-${colorCat}">${item.type}</span>
          <span class="response-date">${dateStr}</span>
        </div>
      </div>
      <div class="response-detail">
        <p class="detail-header-label">${escapeHtml(item.name)} さんから見たパラメータ</p>
        <div class="detail-axes">
          ${detailRowsHtml}
        </div>
      </div>
    `;

    const toggleTrigger = card.querySelector(".response-name-clickable");
    toggleTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      card.classList.toggle("open");
    });

    const memoWrap = card.querySelector(".memo-wrap");
    memoWrap.addEventListener("click", (e) => {
      e.stopPropagation();
      const promptVal = prompt("この回答へのひとことメモを入力してください（最大12文字・空欄で削除）", currentMemo);
      if (promptVal !== null) {
        const trimmed = promptVal.trim().substring(0, 12);
        item.memo = trimmed;
        saveStore();
        renderResponseList(profile, visibleResponses);
        showToast(trimmed ? "メモを保存しました" : "メモを削除しました");
      }
    });

    container.appendChild(card);
  });

  const checkboxes = container.querySelectorAll(".select-checkbox");
  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const selected = container.querySelectorAll(".select-checkbox:checked");
      deleteBtn.disabled = selected.length === 0;
    });
  });

  deleteBtn.onclick = () => {
    const selectedIds = Array.from(container.querySelectorAll(".select-checkbox:checked")).map(cb => cb.dataset.id);
    if (selectedIds.length === 0) return;

    if (!confirm(`選択した ${selectedIds.length} 件の回答を削除しますか？\n（この操作は取り消せません）`)) return;

    profile.responses = profile.responses.filter(r => !selectedIds.includes(r.id));
    saveStore();

    initDashboard(profile);
    updateProfileSelector();
    showToast("回答を削除しました");
  };
}

function initShareFeature(profile) {
  const openModalBtn = document.getElementById("open-share-modal-btn");
  const shareModal = document.getElementById("share-modal");
  const closeModalBtn = document.getElementById("close-share-modal-btn");
  const btnShareX = document.getElementById("btn-share-x");
  const btnCopyUrl = document.getElementById("btn-copy-share-url");
  const btnDownloadImage = document.getElementById("btn-download-image");

  if (!openModalBtn || !shareModal) return;

  openModalBtn.onclick = () => {
    if (profile.responses.length === 0) {
      alert("まだ回答が届いていないため、共有できません。");
      return;
    }

    const totalMetrics = computeGroupMetrics(profile.responses);
    const relSummary = {};
    ["friend", "partner", "work", "family", "hobby", "other"].forEach(k => {
      const items = profile.responses.filter(r => r.relation === k);
      const m = computeGroupMetrics(items);
      relSummary[k] = m ? { type: m.type, count: m.count } : null;
    });

    const sharePayload = {
      n: profile.name,
      t: totalMetrics.type,
      c: totalMetrics.count,
      sc: totalMetrics.avgScores.map(v => Number(v.toFixed(1))),
      r: relSummary
    };

    const jsonStr = JSON.stringify(sharePayload);
    const encodedData = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode('0x' + p1);
    }));

    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
    const viewUrl = `${window.location.origin}${basePath}view.html?d=${encodeURIComponent(encodedData)}`;

    const notableRels = [];
    if (relSummary.friend) notableRels.push(`友達: ${relSummary.friend.type}`);
    if (relSummary.partner) notableRels.push(`恋人: ${relSummary.partner.type}`);
    if (relSummary.work) notableRels.push(`職場: ${relSummary.work.type}`);
    const relText = notableRels.length > 0 ? `（${notableRels.slice(0, 2).join(' / ')}）` : "";

    const tweetText = `周りから見た私の他己分析結果は【${totalMetrics.type}】でした！${relText}\n人間関係ごとに演じ分けている仮面（ペルソナ）を暴く性格診断。\n\n#ペルソナ16タイプ他己分析 #ChimeraTestLab\n${viewUrl}`;

    btnShareX.onclick = async (e) => {
      e.preventDefault();

      const canvas = document.getElementById("share-card-canvas");
      drawShareCardToCanvas(sharePayload, canvas);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `persona16_${sharePayload.n}.png`, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              text: tweetText,
              files: [file]
            });
            return;
          } catch (err) {
            if (err.name === 'AbortError') return;
          }
        }

        generateAndDownloadShareCard(sharePayload);
        const tweetIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(tweetIntentUrl, "_blank", "noopener,noreferrer");
      }, "image/png");
    };

    btnCopyUrl.onclick = () => {
      navigator.clipboard.writeText(viewUrl);
      showToast("閲覧専用URLをコピーしました！");
    };

    btnDownloadImage.onclick = () => {
      generateAndDownloadShareCard(sharePayload);
    };

    shareModal.style.display = "flex";
  };

  closeModalBtn.onclick = () => {
    shareModal.style.display = "none";
  };

  shareModal.onclick = (e) => {
    if (e.target === shareModal) shareModal.style.display = "none";
  };
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

function drawShareCardToCanvas(payload, canvas) {
  const ctx = canvas.getContext("2d");
  const W = 1200;
  const H = 630;

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#cbd5e1";
  for (let x = 15; x < W; x += 30) {
    for (let y = 15; y < H; y += 30) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const cardX = 40;
  const cardY = 30;
  const cardW = 1120;
  const cardH = 570;
  const cardR = 24;

  ctx.shadowColor = "rgba(15, 23, 42, 0.08)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 8;

  ctx.fillStyle = "#ffffff";
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardR);
  ctx.stroke();

  const badgeX = cardX + 36;
  const badgeY = cardY + 28;
  ctx.fillStyle = "#eef2ff";
  drawRoundedRect(ctx, badgeX, badgeY, 110, 26, 13);
  ctx.fill();
  ctx.strokeStyle = "#c7d2fe";
  ctx.lineWidth = 1;
  drawRoundedRect(ctx, badgeX, badgeY, 110, 26, 13);
  ctx.stroke();

  ctx.fillStyle = "#4f46e5";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DASHBOARD", badgeX + 55, badgeY + 13);

  ctx.textAlign = "left";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(`${payload.n} さんの他己分析`, badgeX, badgeY + 62);

  ctx.textAlign = "right";
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText("Chimera Test Lab ｜ ペルソナ16タイプ他己分析", cardX + cardW - 36, badgeY + 14);

  const sumX = badgeX;
  const sumY = badgeY + 84;
  const sumW = 500;
  const sumH = 240;
  const sumR = 16;

  const colorCat = getColorCategoryClass(payload.t);
  let themeBg = "#f0fdf4";
  let themeBorder = "#bbf7d0";
  let themeSub = "#16a34a";
  let themeMain = "#15803d";

  if (colorCat === "nt") {
    themeBg = "#faf5ff"; themeBorder = "#ddd6fe"; themeSub = "#7c3aed"; themeMain = "#6b21a8";
  } else if (colorCat === "sj") {
    themeBg = "#f0f9ff"; themeBorder = "#bae6fd"; themeSub = "#0284c7"; themeMain = "#0369a1";
  } else if (colorCat === "sp") {
    themeBg = "#fffbeb"; themeBorder = "#fde68a"; themeSub = "#d97706"; themeMain = "#b45309";
  }

  ctx.fillStyle = themeBg;
  drawRoundedRect(ctx, sumX, sumY, sumW, sumH, sumR);
  ctx.fill();
  ctx.strokeStyle = themeBorder;
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, sumX, sumY, sumW, sumH, sumR);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = themeSub;
  ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(`全体から見たタイプ (${payload.c}件の回答)`, sumX + sumW / 2, sumY + 38);

  ctx.fillStyle = themeMain;
  ctx.font = "900 64px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(payload.t, sumX + sumW / 2, sumY + 115);

  ctx.fillStyle = "#475569";
  ctx.font = "500 15px -apple-system, BlinkMacSystemFont, sans-serif";
  const desc = TYPE_DESCS[payload.t] || "";
  ctx.fillText(desc.length > 28 ? desc.substring(0, 28) + "…" : desc, sumX + sumW / 2, sumY + 185);

  const rightAreaX = sumX + sumW + 28;
  const rightAreaY = sumY;
  const miniW = 160;
  const miniH = 110;
  const gapMiniX = 16;
  const gapMiniY = 20;

  const relKeys = [
    { k: "friend", l: "友達" },
    { k: "partner", l: "恋人" },
    { k: "work", l: "職場・学校" },
    { k: "family", l: "家族" },
    { k: "hobby", l: "ネット・趣味" },
    { k: "other", l: "その他" }
  ];

  relKeys.forEach((item, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const mX = rightAreaX + col * (miniW + gapMiniX);
    const mY = rightAreaY + row * (miniH + gapMiniY);

    const relData = payload.r[item.k];

    let mBg = "#f8fafc";
    let mBorder = "#e2e8f0";
    let mTypeColor = "#cbd5e1";

    if (relData) {
      const rCat = getColorCategoryClass(relData.type);
      if (rCat === "nf") { mBg = "#f0fdf4"; mBorder = "#bbf7d0"; mTypeColor = "#15803d"; }
      else if (rCat === "nt") { mBg = "#faf5ff"; mBorder = "#e9d5ff"; mTypeColor = "#6b21a8"; }
      else if (rCat === "sj") { mBg = "#f0f9ff"; mBorder = "#bae6fd"; mTypeColor = "#0369a1"; }
      else if (rCat === "sp") { mBg = "#fffbeb"; mBorder = "#fde68a"; mTypeColor = "#b45309"; }
    }

    ctx.fillStyle = mBg;
    drawRoundedRect(ctx, mX, mY, miniW, miniH, 12);
    ctx.fill();
    ctx.strokeStyle = mBorder;
    ctx.lineWidth = 1.2;
    drawRoundedRect(ctx, mX, mY, miniW, miniH, 12);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(item.l, mX + miniW / 2, mY + 26);

    ctx.fillStyle = mTypeColor;
    ctx.font = "900 24px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(relData ? relData.type : "―", mX + miniW / 2, mY + 62);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(relData ? `(${relData.count}件)` : "(0件)", mX + miniW / 2, mY + 88);
  });

  const axesY = sumY + sumH + 24;
  const axisRowW = (cardW - 72 - 24) / 2;
  const axisRowH = 46;

  const axisData = [
    { left: "外向 (E)", right: "内向 (I)", score: payload.sc[0], x: badgeX, y: axesY },
    { left: "感覚 (S)", right: "直観 (N)", score: payload.sc[1], x: badgeX + axisRowW + 24, y: axesY },
    { left: "思考 (T)", right: "感情 (F)", score: payload.sc[2], x: badgeX, y: axesY + 54 },
    { left: "判断 (J)", right: "知覚 (P)", score: payload.sc[3], x: badgeX + axisRowW + 24, y: axesY + 54 }
  ];

  axisData.forEach(ax => {
    ctx.fillStyle = "#f8fafc";
    drawRoundedRect(ctx, ax.x, ax.y, axisRowW, axisRowH, 8);
    ctx.fill();
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    drawRoundedRect(ctx, ax.x, ax.y, axisRowW, axisRowH, 8);
    ctx.stroke();

    const rightPct = Math.round(((ax.score - 1) / 3) * 100);
    const leftPct = 100 - rightPct;

    ctx.textAlign = "left";
    ctx.fillStyle = "#4f46e5";
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(ax.left, ax.x + 14, ax.y + 18);

    ctx.textAlign = "center";
    ctx.fillStyle = "#64748b";
    ctx.font = "600 12px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`${leftPct}% : ${rightPct}%`, ax.x + axisRowW / 2, ax.y + 18);

    ctx.textAlign = "right";
    ctx.fillStyle = "#0ea5e9";
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(ax.right, ax.x + axisRowW - 14, ax.y + 18);

    const barX = ax.x + 14;
    const barY = ax.y + 28;
    const barW = axisRowW - 28;
    const barH = 6;

    ctx.fillStyle = "#e2e8f0";
    drawRoundedRect(ctx, barX, barY, barW, barH, 3);
    ctx.fill();

    const indX = barX + (barW * rightPct) / 100;
    ctx.beginPath();
    ctx.arc(indX, barY + 3, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#4f46e5";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

function generateAndDownloadShareCard(payload) {
  const canvas = document.getElementById("share-card-canvas");
  drawShareCardToCanvas(payload, canvas);

  const link = document.createElement("a");
  link.download = `persona16_${encodeURIComponent(payload.n)}_result.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  showToast("結果画像を保存しました！");
}

function calculateTypeFromScore(scores) {
  const e_or_i = scores[0] >= 2.5 ? "I" : "E";
  const s_or_n = scores[1] >= 2.5 ? "N" : "S";
  const t_or_f = scores[2] >= 2.5 ? "F" : "T";
  const j_or_p = scores[3] >= 2.5 ? "P" : "J";
  return `${e_or_i}${s_or_n}${t_or_f}${j_or_p}`;
}

// ★ バックアップ・引継ぎ（インポート／エクスポート）機能の実装
function initBackupFeature() {
  const backupBtn = document.getElementById("backup-profile-btn");
  const initImportBtn = document.getElementById("init-import-btn");
  const backupModal = document.getElementById("backup-modal");
  const closeModalBtn = document.getElementById("close-backup-modal-btn");

  const tabExportBtn = document.getElementById("tab-export-btn");
  const tabImportBtn = document.getElementById("tab-import-btn");
  const exportPane = document.getElementById("export-pane");
  const importPane = document.getElementById("import-pane");

  const btnDownloadFile = document.getElementById("btn-download-backup-file");
  const btnCopyCode = document.getElementById("btn-copy-backup-code");
  const backupFileInput = document.getElementById("backup-file-input");
  const backupCodeInput = document.getElementById("backup-code-input");
  const btnExecuteImport = document.getElementById("btn-execute-import");

  if (!backupModal) return;

  const openModal = (targetTab = "export") => {
    if (targetTab === "export") {
      tabExportBtn.classList.add("active");
      tabImportBtn.classList.remove("active");
      exportPane.style.display = "block";
      importPane.style.display = "none";
    } else {
      tabImportBtn.classList.add("active");
      tabExportBtn.classList.remove("active");
      importPane.style.display = "block";
      exportPane.style.display = "none";
    }
    backupModal.style.display = "flex";
  };

  if (backupBtn) backupBtn.onclick = () => openModal("export");
  if (initImportBtn) initImportBtn.onclick = () => openModal("import");

  closeModalBtn.onclick = () => backupModal.style.display = "none";
  backupModal.onclick = (e) => {
    if (e.target === backupModal) backupModal.style.display = "none";
  };

  tabExportBtn.onclick = () => {
    tabExportBtn.classList.add("active");
    tabImportBtn.classList.remove("active");
    exportPane.style.display = "block";
    importPane.style.display = "none";
  };

  tabImportBtn.onclick = () => {
    tabImportBtn.classList.add("active");
    tabExportBtn.classList.remove("active");
    importPane.style.display = "block";
    exportPane.style.display = "none";
  };

  // 1. JSONファイルでダウンロード保存
  btnDownloadFile.onclick = () => {
    if (!store.profiles || store.profiles.length === 0) {
      alert("エクスポートできるプロファイルが存在しません。");
      return;
    }
    const dataStr = JSON.stringify(store, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const current = getCurrentProfile();
    const nameStr = current ? current.name : "all";
    a.href = url;
    a.download = `persona16_backup_${encodeURIComponent(nameStr)}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("バックアップファイルを保存しました");
  };

  // 2. 引継ぎコードをクリップボードコピー
  btnCopyCode.onclick = () => {
    if (!store.profiles || store.profiles.length === 0) {
      alert("エクスポートできるプロファイルが存在しません。");
      return;
    }
    const jsonStr = JSON.stringify(store);
    const code = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
      return String.fromCharCode('0x' + p1);
    }));
    navigator.clipboard.writeText(code);
    showToast("引継ぎコードをコピーしました！");
  };

  // 3. インポート処理（ファイルまたはコード）
  btnExecuteImport.onclick = () => {
    const file = backupFileInput.files[0];
    const pastedCode = backupCodeInput.value.trim();

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          processImportData(parsed);
        } catch (err) {
          alert("ファイルの解析に失敗しました。有効なJSONファイルを選択してください。");
        }
      };
      reader.readAsText(file);
    } else if (pastedCode) {
      try {
        let parsed = null;
        if (pastedCode.startsWith("{")) {
          parsed = JSON.parse(pastedCode);
        } else {
          const decodedStr = decodeURIComponent(Array.prototype.map.call(atob(pastedCode), (c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          }).join(''));
          parsed = JSON.parse(decodedStr);
        }
        processImportData(parsed);
      } catch (err) {
        alert("引継ぎコードの復元に失敗しました。正しいコードが貼り付けられているか確認してください。");
      }
    } else {
      alert("バックアップファイルを選択するか、引継ぎコードを入力してください。");
    }
  };

  function processImportData(importedStore) {
    if (!importedStore || (!Array.isArray(importedStore.profiles) && !importedStore.userName)) {
      alert("プロファイルデータの形式が正しくありません。");
      return;
    }

    mergeImportedStore(importedStore);
    backupModal.style.display = "none";
    backupFileInput.value = "";
    backupCodeInput.value = "";
    renderApp();
    showToast("プロファイルを復元・結合しました！");
  }
}

// インポートデータの安全なマージ処理（ID単位の差分追加・重複除外）
function mergeImportedStore(imported) {
  let incomingProfiles = [];

  if (Array.isArray(imported.profiles)) {
    incomingProfiles = imported.profiles;
  } else if (imported.userName && Array.isArray(imported.responses)) {
    incomingProfiles = [{
      id: generateUUID("p_"),
      name: imported.userName,
      responses: imported.responses
    }];
  }

  incomingProfiles.forEach(inProf => {
    const existing = store.profiles.find(p => p.id === inProf.id);
    if (existing) {
      existing.name = inProf.name || existing.name;
      // 回答ログの差分マージ
      inProf.responses.forEach(inResp => {
        if (!existing.responses.some(r => r.id === inResp.id)) {
          existing.responses.push(inResp);
        }
      });
      // 作成日時順で並び替え
      existing.responses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      store.profiles.push(inProf);
    }
  });

  if (imported.activeProfileId && store.profiles.some(p => p.id === imported.activeProfileId)) {
    store.activeProfileId = imported.activeProfileId;
  } else if (!store.activeProfileId && store.profiles.length > 0) {
    store.activeProfileId = store.profiles[0].id;
  }

  saveStore();
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}
