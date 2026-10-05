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

  // --- ① 新規回答の受け取り処理（URLに rid, rel, sc がある場合） ---
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

  // --- ② 画面初期表示の制御 ---
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

// ストレージ読み込み＆マイグレーション処理
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

// 送られてきた回答の蓄積
function handleIncomingResponse(rid, rel, sc, uid, n) {
  let targetProfile = store.profiles.find(p => p.id === uid);
  if (!targetProfile) {
    targetProfile = getCurrentProfile() || store.profiles[0];
  }

  if (!targetProfile) {
    targetProfile = {
      id: uid || generateUUID("p_"),
      name: "あなた",
      responses: []
    };
    store.profiles.push(targetProfile);
    store.activeProfileId = targetProfile.id;
  }

  const isDuplicate = targetProfile.responses.some(r => r.id === rid);
  if (isDuplicate) {
    showToast("この回答はすでに反映済みです");
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

  let currentRel = "all";
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentRel = btn.getAttribute("data-rel");
      renderStats(profile.responses, currentRel);
    };
  });

  renderStats(profile.responses, currentRel);
  renderResponseList(profile);
}

// 単一リストの平均スコアおよび16タイプを算出するヘルパー
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

// 統計・集計の描画（★ メインカードとミニカード群の相互入れ替えに対応）
function renderStats(responses, activeRel = "all") {
  const tabsContainer = document.getElementById("relation-tabs");
  const emptyState = document.getElementById("empty-state");
  const statsArea = document.getElementById("stats-area");
  const summaryCard = document.querySelector(".result-summary-card");
  const miniCardsContainer = document.getElementById("relation-mini-cards");

  if (responses.length === 0) {
    tabsContainer.style.display = "none";
    statsArea.style.display = "none";
    emptyState.style.display = "block";
    emptyState.querySelector(".empty-title").textContent = "まだ回答が届いていません";
    emptyState.querySelector(".empty-desc").textContent = "上のURLを友達や仲間にシェアして、あなたの普段の印象を回答してもらいましょう！";
    return;
  }

  tabsContainer.style.display = "flex";

  // タブのバッジ件数更新
  document.getElementById("count-all").textContent = responses.length;
  ["friend", "partner", "work", "family", "hobby", "other"].forEach(r => {
    const countEl = document.getElementById(`count-${r}`);
    if (countEl) countEl.textContent = responses.filter(item => item.relation === r).length;
  });

  emptyState.style.display = "none";
  statsArea.style.display = "block";

  // --- ① メインカードのデータ判定 ---
  const mainData = activeRel === "all" ? responses : responses.filter(r => r.relation === activeRel);
  const mainMetrics = computeGroupMetrics(mainData);

  const mainLabel = activeRel === "all" ? "全体から見たタイプ" : `「${RELATIONS[activeRel]?.label}」から見たタイプ`;
  document.getElementById("current-filter-label").textContent = mainLabel;

  if (!mainMetrics) {
    // 該当データがまだ0件のとき
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
      const rightPercent = Math.round(((axis.score - 1) / 4) * 100);
      const leftPercent = 100 - rightPercent;
      document.getElementById(`bar-${axis.id}`).style.left = `${rightPercent}%`;
      document.getElementById(`val-${axis.id}`).textContent = `${leftPercent}% : ${rightPercent}%`;
    });
  }

  // --- ② 関係性ミニカード群（小計）の生成＆入れ替え処理 ---
  miniCardsContainer.innerHTML = "";

  // 全6区分
  const allRelKeys = ["friend", "partner", "work", "family", "hobby", "other"];

  // ミニカードに並べるリスト：現在メインに表示している項目以外を並べる
  let miniCardKeys = [];
  if (activeRel === "all") {
    // 全体がメインなら、ミニカードは全6区分
    miniCardKeys = allRelKeys.map(k => ({ key: k, label: `${RELATIONS[k].label}から見たタイプ` }));
  } else {
    // 特定の関係性がメインなら、先頭に「全体」を置き、残りの他5区分を並べる
    miniCardKeys.push({ key: "all", label: "全体から見たタイプ" });
    allRelKeys.filter(k => k !== activeRel).forEach(k => {
      miniCardKeys.push({ key: k, label: `${RELATIONS[k].label}から見たタイプ` });
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

    // ミニカードをクリックした時、その項目をメインカードへ切り替え（タブとも連動）
    card.addEventListener("click", () => {
      const tabBtns = document.querySelectorAll(".tab-btn");
      tabBtns.forEach(b => {
        b.classList.toggle("active", b.getAttribute("data-rel") === item.key);
      });
      renderStats(responses, item.key);
    });

    miniCardsContainer.appendChild(card);
  });
}

// 回答履歴一覧＆削除
function renderResponseList(profile) {
  const container = document.getElementById("response-list");
  const deleteBtn = document.getElementById("delete-selected-btn");
  container.innerHTML = "";

  if (profile.responses.length === 0) {
    container.innerHTML = `<p style="font-size:0.8rem; color:#94a3b8; text-align:center; padding:12px;">履歴はありません</p>`;
    deleteBtn.disabled = true;
    return;
  }

  profile.responses.forEach(item => {
    const card = document.createElement("div");
    card.className = "response-card";

    const relConfig = RELATIONS[item.relation] || { label: "その他", class: "rel-other" };
    const dateStr = formatDate(item.createdAt);
    const colorCat = getColorCategoryClass(item.type);

    const axisConfigs = [
      { left: "外向 (E)", right: "内向 (I)", score: item.scores[0] },
      { left: "感覚 (S)", right: "直観 (N)", score: item.scores[1] },
      { left: "思考 (T)", right: "感情 (F)", score: item.scores[2] },
      { left: "判断 (J)", right: "知覚 (P)", score: item.scores[3] }
    ];

    const detailRowsHtml = axisConfigs.map(ax => {
      const rightPct = Math.round(((ax.score - 1) / 4) * 100);
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

    card.innerHTML = `
      <div class="response-card-main">
        <div class="response-info-left">
          <input type="checkbox" class="select-checkbox" data-id="${item.id}">
          <span class="badge-rel ${relConfig.class}">${relConfig.label}</span>
          <span class="response-name-clickable" title="タップでパラメータを表示/非表示">
            ${escapeHtml(item.name)}
            <span class="response-toggle-arrow">▼</span>
          </span>
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

    renderResponseList(profile);
    const activeTabRel = document.querySelector(".tab-btn.active")?.getAttribute("data-rel") || "all";
    renderStats(profile.responses, activeTabRel);
    updateProfileSelector();
    showToast("回答を削除しました");
  };
}

function calculateTypeFromScore(scores) {
  const e_or_i = scores[0] >= 3.0 ? "I" : "E";
  const s_or_n = scores[1] >= 3.0 ? "N" : "S";
  const t_or_f = scores[2] >= 3.0 ? "F" : "T";
  const j_or_p = scores[3] >= 3.0 ? "P" : "J";
  return `${e_or_i}${s_or_n}${t_or_f}${j_or_p}`;
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
