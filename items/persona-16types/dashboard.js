// 関係性マッピング定義
const RELATIONS = {
  friend: { label: "友人", class: "rel-friend" },
  partner: { label: "恋人", class: "rel-partner" },
  colleague: { label: "同僚", class: "rel-colleague" },
  senior: { label: "先輩", class: "rel-senior" },
  junior: { label: "後輩", class: "rel-junior" },
  family: { label: "家族", class: "rel-family" },
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

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // ストレージからユーザー情報と回答一覧を取得
  let appData = JSON.parse(localStorage.getItem("persona16_data") || "null");

  // --- ① 新規回答の受け取り処理（URLに rid, rel, sc がある場合） ---
  const rid = urlParams.get("rid");
  const rel = urlParams.get("rel");
  const sc = urlParams.get("sc");
  const n = urlParams.get("n") || "匿名";

  if (rid && rel && sc) {
    if (!appData) {
      // 送り主データがまだ無い場合は名前を暫定作成
      appData = { userName: "あなた", responses: [] };
    }

    const isDuplicate = appData.responses.some(r => r.id === rid);

    if (isDuplicate) {
      showToast("この回答はすでに反映済みです");
    } else {
      const scores = sc.split(",").map(Number);
      const computedType = calculateTypeFromScore(scores);

      appData.responses.unshift({
        id: rid,
        name: n,
        relation: rel,
        scores: scores,
        type: computedType,
        createdAt: new Date().toISOString()
      });

      localStorage.setItem("persona16_data", JSON.stringify(appData));
      showToast(`${n}さん（${RELATIONS[rel]?.label || "回答"}）のデータを反映しました！`);
    }

    // URLのパラメータを除去してクリーンなURLに戻す
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // --- ② 画面初期表示の切り替え ---
  if (!appData || !appData.userName) {
    // ユーザー未作成時はセットアップ画面
    document.getElementById("setup-view").style.display = "block";
    document.getElementById("dashboard-view").style.display = "none";
  } else {
    // セットアップ済み時はダッシュボード表示
    document.getElementById("setup-view").style.display = "none";
    document.getElementById("dashboard-view").style.display = "block";
    initDashboard(appData);
  }

  // --- ③ URL発行ボタンのイベント ---
  const generateBtn = document.getElementById("generate-btn");
  if (generateBtn) {
    generateBtn.addEventListener("click", () => {
      const nameInput = document.getElementById("user-name-input").value.trim();
      if (!nameInput) {
        alert("ニックネームを入力してください");
        return;
      }

      appData = {
        userName: nameInput,
        responses: []
      };
      localStorage.setItem("persona16_data", JSON.stringify(appData));

      document.getElementById("setup-view").style.display = "none";
      document.getElementById("dashboard-view").style.display = "block";
      initDashboard(appData);
    });
  }
});

// ダッシュボード全体の初期化・描画
function initDashboard(appData) {
  document.getElementById("target-user-name").textContent = appData.userName;

  // シェア用URLの生成（answer.htmlへのリンク）
  const baseUrl = window.location.href.split("?")[0].replace("index.html", "");
  const answerUrl = `${baseUrl}answer.html?u=${encodeURIComponent(appData.userName)}`;
  const shareInput = document.getElementById("share-url-input");
  shareInput.value = answerUrl;

  // コピー機能
  document.getElementById("copy-url-btn").onclick = () => {
    shareInput.select();
    navigator.clipboard.writeText(answerUrl);
    showToast("回答募集URLをコピーしました！");
  };

  // タブイベントのバインド
  let currentRel = "all";
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentRel = btn.getAttribute("data-rel");
      renderStats(appData.responses, currentRel);
    };
  });

  // 初回描画
  renderStats(appData.responses, currentRel);
  renderResponseList(appData);
}

// 統計・集計の描画
function renderStats(responses, filterRel) {
  const tabsContainer = document.getElementById("relation-tabs");
  const emptyState = document.getElementById("empty-state");
  const statsArea = document.getElementById("stats-area");

  // 全体で回答が1件もない場合
  if (responses.length === 0) {
    tabsContainer.style.display = "none";
    statsArea.style.display = "none";
    emptyState.style.display = "block";
    emptyState.querySelector(".empty-title").textContent = "まだ回答が届いていません";
    emptyState.querySelector(".empty-desc").textContent = "上のURLを友達や同僚にシェアして、あなたの普段の印象を回答してもらいましょう！";
    return;
  }

  // 1件以上あればタブは常に表示
  tabsContainer.style.display = "flex";

  // 各タブの件数バッジ更新
  document.getElementById("count-all").textContent = responses.length;
  ["friend", "partner", "colleague", "senior", "junior", "family"].forEach(r => {
    const countEl = document.getElementById(`count-${r}`);
    if (countEl) countEl.textContent = responses.filter(item => item.relation === r).length;
  });

  // フィルタリング
  const targetData = filterRel === "all" ? responses : responses.filter(r => r.relation === filterRel);

  // 選択されたタブの回答数が0件の場合（タブは残し、メッセージのみ切り替え）
  if (targetData.length === 0) {
    statsArea.style.display = "none";
    emptyState.style.display = "block";
    emptyState.querySelector(".empty-title").textContent = `「${RELATIONS[filterRel]?.label || filterRel}」からの回答はまだありません`;
    emptyState.querySelector(".empty-desc").textContent = "他のタブを選択するか、この関係性の人にURLをシェアして回答を集めてみましょう。";
    return;
  }

  // データがある場合は集計エリアを表示
  emptyState.style.display = "none";
  statsArea.style.display = "block";

  // フィルターラベル
  document.getElementById("current-filter-label").textContent = 
    filterRel === "all" ? "全体の他己評価タイプ" : `「${RELATIONS[filterRel]?.label}」から見たタイプ`;

  // 4軸スコアの平均化（各スコアは 1〜5段階）
  const total = targetData.length;
  const avgScores = [0, 0, 0, 0];
  targetData.forEach(r => {
    r.scores.forEach((s, idx) => {
      avgScores[idx] += s;
    });
  });
  avgScores.forEach((sum, idx) => {
    avgScores[idx] = sum / total;
  });

  // 判定タイプ算出
  const dominantType = calculateTypeFromScore(avgScores);
  document.getElementById("dominant-type").textContent = dominantType;
  document.getElementById("type-description").textContent = TYPE_DESCS[dominantType] || "";

  // 4軸スライダー（中央=3.0を基準に0〜100%にマッピング）
  const axes = [
    { id: "ei", score: avgScores[0] }, // 1:E 〜 5:I
    { id: "sn", score: avgScores[1] }, // 1:S 〜 5:N
    { id: "tf", score: avgScores[2] }, // 1:T 〜 5:F
    { id: "jp", score: avgScores[3] }  // 1:J 〜 5:P
  ];

  axes.forEach(axis => {
    const rightPercent = Math.round(((axis.score - 1) / 4) * 100);
    const leftPercent = 100 - rightPercent;

    document.getElementById(`bar-${axis.id}`).style.left = `${rightPercent}%`;
    document.getElementById(`val-${axis.id}`).textContent = `${leftPercent}% : ${rightPercent}%`;
  });
}

// 回答履歴一覧の描画 & 削除処理
function renderResponseList(appData) {
  const container = document.getElementById("response-list");
  const deleteBtn = document.getElementById("delete-selected-btn");
  container.innerHTML = "";

  if (appData.responses.length === 0) {
    container.innerHTML = `<p style="font-size:0.8rem; color:#94a3b8; text-align:center; padding:12px;">履歴はありません</p>`;
    deleteBtn.disabled = true;
    return;
  }

  appData.responses.forEach(item => {
    const card = document.createElement("div");
    card.className = "response-card";

    const relConfig = RELATIONS[item.relation] || { label: "その他", class: "rel-other" };
    const dateStr = new Date(item.createdAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });

    card.innerHTML = `
      <div class="response-info-left">
        <input type="checkbox" class="select-checkbox" data-id="${item.id}">
        <span class="badge-rel ${relConfig.class}">${relConfig.label}</span>
        <span style="font-weight:600; color:#334155;">${escapeHtml(item.name)}</span>
        <span class="response-type">${item.type}</span>
      </div>
      <span class="response-date">${dateStr}</span>
    `;

    container.appendChild(card);
  });

  // チェックボックスの状態監視
  const checkboxes = container.querySelectorAll(".select-checkbox");
  checkboxes.forEach(cb => {
    cb.addEventListener("change", () => {
      const selected = container.querySelectorAll(".select-checkbox:checked");
      deleteBtn.disabled = selected.length === 0;
    });
  });

  // 削除ボタンイベント
  deleteBtn.onclick = () => {
    const selectedIds = Array.from(container.querySelectorAll(".select-checkbox:checked")).map(cb => cb.dataset.id);
    if (selectedIds.length === 0) return;

    if (!confirm(`選択した ${selectedIds.length} 件の回答を削除しますか？\n（この操作は取り消せません）`)) return;

    appData.responses = appData.responses.filter(r => !selectedIds.includes(r.id));
    localStorage.setItem("persona16_data", JSON.stringify(appData));

    // 再描画
    renderResponseList(appData);
    const activeTabRel = document.querySelector(".tab-btn.active")?.getAttribute("data-rel") || "all";
    renderStats(appData.responses, activeTabRel);
    showToast("回答を削除しました");
  };
}

// 4軸スコア（1〜5の配列）から16タイプ文字を判定
function calculateTypeFromScore(scores) {
  const e_or_i = scores[0] >= 3.0 ? "I" : "E";
  const s_or_n = scores[1] >= 3.0 ? "N" : "S";
  const t_or_f = scores[2] >= 3.0 ? "F" : "T";
  const j_or_p = scores[3] >= 3.0 ? "P" : "J";
  return `${e_or_i}${s_or_n}${t_or_f}${j_or_p}`;
}

// トースト通知の表示
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
