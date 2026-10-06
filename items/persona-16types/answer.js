// 関係性定義
const RELATIONS = {
  friend: "友達",
  partner: "恋人",
  work: "職場・学校",
  family: "家族",
  hobby: "ネット・趣味",
  other: "その他"
};

// 4段階選択肢の定義（中央値を排除した4件法）
const OPTIONS = [
  { label: "とてもそう思う", score: 4 },
  { label: "ややそう思う", score: 3 },
  { label: "あまりそう思わない", score: 2 },
  { label: "全くそう思わない", score: 1 }
];

// 決選設問（タイブレーク二者択一）の定義
// leftChoice: -1点 (合計9点) / rightChoice: +1点 (合計11点)
const TIEBREAKER_QUESTIONS = {
  ei: {
    question: "普段の雰囲気について、究極の二択で選ぶならどちらに近い？",
    leftLabel: "どちらかといえば、社交的で周囲と積極的に関わる【外向的 (E)】",
    rightLabel: "どちらかといえば、落ち着いていて自分の世界を大切にする【内向的 (I)】"
  },
  sn: {
    question: "物事の捉え方や興味について、究極の二択で選ぶならどちらに近い？",
    leftLabel: "どちらかといえば、現実的で事実や具体的な手順を重視する【感覚派 (S)】",
    rightLabel: "どちらかといえば、直感的で未来の可能性やアイデアを好む【直観派 (N)】"
  },
  tf: {
    question: "判断やコミュニケーションの基準として、どちらに近い？",
    leftLabel: "どちらかといえば、感情に流されず論理と筋道を重んじる【思考派 (T)】",
    rightLabel: "どちらかといえば、相手の気持ちや共感・調和を重んじる【感情派 (F)】"
  },
  jp: {
    question: "行動スタイルや物事の進め方として、どちらに近い？",
    leftLabel: "どちらかといえば、計画通りにキッチリ結論・進行をつけたい【判断派 (J)】",
    rightLabel: "どちらかといえば、臨機応変でノリや柔軟性を大切にしたい【知覚派 (P)】"
  }
};

// 設問定義（各軸4問：左側特性2問［反転］＋右側特性2問［正転］＝全16問）
const QUESTIONS_MASTER = [
  // --- 軸1: 外向(E: 1点側) vs 内向(I: 4点側) ---
  { id: "ei_1", axis: "ei", text: "初対面の人や大勢の集まりでも、すぐに打ち解けて活発に話すほうだ。", reverse: true },
  { id: "ei_2", axis: "ei", text: "休日は誰かと会ったり、外へ出かけたりしてアクティブに過ごすことが多い。", reverse: true },
  { id: "ei_3", axis: "ei", text: "多くの人と過ごした後は、1人の時間を作ってエネルギーを回復させている印象がある。", reverse: false },
  { id: "ei_4", axis: "ei", text: "自分の意見や感情をその場ですぐ口にするより、頭の中で一度整理してから話すほうだ。", reverse: false },

  // --- 軸2: 感覚(S: 1点側) vs 直観(N: 4点側) ---
  { id: "sn_1", axis: "sn", text: "目の前の事実や具体的な手順、過去の実績を重視して物事を進めるタイプだ。", reverse: true },
  { id: "sn_2", axis: "sn", text: "現実的で地に足がついており、細かな変化やディテールによく気づく。", reverse: true },
  { id: "sn_3", axis: "sn", text: "「もし〜だったら」といった未来の可能性や、抽象的なアイデア・概念の話を好む。", reverse: false },
  { id: "sn_4", axis: "sn", text: "物事の表面的な事実よりも、その裏にある背景や隠れた関連性に目を向けがちだ。", reverse: false },

  // --- 軸3: 思考(T: 1点側) vs 感情(F: 4点側) ---
  { id: "tf_1", axis: "tf", text: "感情に流されず、論理的な筋道や合理性を最優先して冷静に判断する。", reverse: true },
  { id: "tf_2", axis: "tf", text: "問題が起きたときは、共感よりも客観的な原因究明と具体的な解決策を求める。", reverse: true },
  { id: "tf_3", axis: "tf", text: "人の気持ちや場の空気に敏感で、誰かが傷つかないよう配慮することを何より大切にする。", reverse: false },
  { id: "tf_4", axis: "tf", text: "正論で相手を論破するよりも、相手の立場に寄り添って納得・共感し合うことを重視する。", reverse: false },

  // --- 軸4: 判断(J: 1点側) vs 知覚(P: 4点側) ---
  { id: "jp_1", axis: "jp", text: "予定や計画をあらかじめきっちり立て、スケジュール通りに行動することを好む。", reverse: true },
  { id: "jp_2", axis: "jp", text: "期限やルールを厳格に守り、物事に白黒ハッキリと結論をつけたがるタイプだ。", reverse: true },
  { id: "jp_3", axis: "jp", text: "予定をガチガチに決め込まず、その場のノリや直感で柔軟に動くほうが得意そうだ。", reverse: false },
  { id: "jp_4", axis: "jp", text: "締め切りギリギリまで選択肢を広く残しておき、臨機応変に対応する自由さを好む。", reverse: false }
];

let targetUserName = "あの人";
let targetUserId = "";
let selectedRelation = null;
let answererName = "";
let questions = [];
let currentQuestionIndex = 0;
let answers = {}; // { questionId: rawScore (1~4) }

// 各軸のベース合計点（4〜16点）
let axisSums = { ei: 0, sn: 0, tf: 0, jp: 0 };
let tiebreakerAxes = []; // ちょうど10点（引き分け）の軸リスト
let tiebreakerAnswers = {}; // { [axis]: -1 or 1 }
let currentTieIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const u = urlParams.get("u");
  const uid = urlParams.get("uid");

  if (u) {
    targetUserName = u.trim();
  }
  if (uid) {
    targetUserId = uid.trim();
  }

  // 画面内の対象者名を反映
  document.getElementById("target-user-name").textContent = targetUserName;
  document.getElementById("target-user-name-sub").textContent = targetUserName;
  document.getElementById("target-user-name-rel").textContent = targetUserName;
  document.getElementById("remind-target-name").textContent = targetUserName;
  document.getElementById("complete-target-name").textContent = targetUserName;

  // 関係性選択ボタンのイベント
  const relButtons = document.querySelectorAll(".rel-select-btn");
  relButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      relButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedRelation = btn.getAttribute("data-rel");
    });
  });

  // 診断開始ボタン
  const startBtn = document.getElementById("start-btn");
  startBtn.addEventListener("click", () => {
    if (!selectedRelation) {
      alert("あなたとの関係性を選択してください。");
      return;
    }
    const nameInput = document.getElementById("answerer-name-input").value.trim();
    answererName = nameInput || "匿名";

    // 設問シャッフルと開始
    questions = shuffleArray([...QUESTIONS_MASTER]);
    currentQuestionIndex = 0;
    answers = {};
    tiebreakerAnswers = {};

    document.getElementById("intro-screen").style.display = "none";
    document.getElementById("quiz-screen").style.display = "block";
    renderQuestion();
  });

  // 通常設問ナビゲーションボタン（前に戻る・次へ進む）
  document.getElementById("btn-prev-question").addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderQuestion();
    } else {
      document.getElementById("quiz-progress").style.width = "0%";
      document.getElementById("quiz-progress-num").textContent = `問 1 / ${QUESTIONS_MASTER.length}`;
      document.getElementById("quiz-screen").style.display = "none";
      document.getElementById("intro-screen").style.display = "block";
    }
  });

  document.getElementById("btn-next-question").addEventListener("click", () => {
    const currentQ = questions[currentQuestionIndex];
    if (!answers[currentQ.id]) {
      alert("いずれかの選択肢を選んでください。");
      return;
    }
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      renderQuestion();
    } else {
      processQuizCompletion();
    }
  });

  // 決選設問ナビゲーションボタン（前に戻る・次へ進む）
  const btnPrevTie = document.getElementById("btn-prev-tiebreaker");
  if (btnPrevTie) {
    btnPrevTie.addEventListener("click", () => {
      if (currentTieIndex > 0) {
        currentTieIndex--;
        renderTiebreaker();
      } else {
        // 最初の決選設問から戻る場合は通常設問の最終問へ復帰
        document.getElementById("tiebreaker-screen").style.display = "none";
        document.getElementById("quiz-screen").style.display = "block";
        currentQuestionIndex = questions.length - 1;
        renderQuestion();
      }
    });
  }

  const btnNextTie = document.getElementById("btn-next-tiebreaker");
  if (btnNextTie) {
    btnNextTie.addEventListener("click", () => {
      const axis = tiebreakerAxes[currentTieIndex];
      if (tiebreakerAnswers[axis] === undefined) {
        alert("いずれかの選択肢を選んでください。");
        return;
      }
      handleTiebreakerNext();
    });
  }
});

// 配列シャッフル関数（Fisher-Yates）
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 設問描画処理
function renderQuestion() {
  const q = questions[currentQuestionIndex];
  const progressNum = currentQuestionIndex + 1;
  const total = questions.length;

  document.getElementById("quiz-progress").style.width = `${Math.sqrt(currentQuestionIndex / total) * 100}%`;
  document.getElementById("quiz-progress-num").textContent = `問 ${progressNum} / ${total}`;
  document.getElementById("question-text").textContent = q.text;
  document.getElementById("btn-next-question").textContent = (currentQuestionIndex === total - 1) ? "回答を完了する →" : "次へ進む →";

  const container = document.getElementById("options-container");
  container.innerHTML = "";

  const savedAnswer = answers[q.id];

  OPTIONS.forEach(opt => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "quiz-option-btn";
    if (savedAnswer === opt.score) {
      btn.classList.add("selected");
    }

    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      answers[q.id] = opt.score;
      container.querySelectorAll(".quiz-option-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");

      setTimeout(() => {
        if (currentQuestionIndex < total - 1) {
          currentQuestionIndex++;
          renderQuestion();
        } else {
          processQuizCompletion();
        }
      }, 160);
    });
    container.appendChild(btn);
  });
}

// 通常設問完了後の判定処理（10点の軸を抽出して決選へ分岐）
function processQuizCompletion() {
  axisSums = { ei: 0, sn: 0, tf: 0, jp: 0 };

  questions.forEach(q => {
    const raw = answers[q.id] || 2;
    const effectiveScore = q.reverse ? (5 - raw) : raw;
    axisSums[q.axis] += effectiveScore;
  });

  // 合計がちょうど10点（50:50）になった軸を特定
  const previousTieAxes = [...tiebreakerAxes];
  tiebreakerAxes = [];
  ["ei", "sn", "tf", "jp"].forEach(axis => {
    if (axisSums[axis] === 10) {
      tiebreakerAxes.push(axis);
    }
  });

  // もはや10点でなくなった軸の決選回答はクリーンアップ
  Object.keys(tiebreakerAnswers).forEach(axis => {
    if (!tiebreakerAxes.includes(axis)) {
      delete tiebreakerAnswers[axis];
    }
  });

  document.getElementById("quiz-screen").style.display = "none";

  if (tiebreakerAxes.length > 0) {
    currentTieIndex = 0;
    document.getElementById("tiebreaker-screen").style.display = "block";
    renderTiebreaker();
  } else {
    finishQuiz();
  }
}

// 決選設問の描画処理
function renderTiebreaker() {
  const axis = tiebreakerAxes[currentTieIndex];
  const tbData = TIEBREAKER_QUESTIONS[axis];
  const totalTies = tiebreakerAxes.length;

  document.getElementById("tiebreaker-progress-num").textContent = `決選質問 ${currentTieIndex + 1} / ${totalTies}`;
  document.getElementById("tiebreaker-question-text").textContent = `【${targetUserName} さんについて】\n${tbData.question}`;

  const btnNextTie = document.getElementById("btn-next-tiebreaker");
  if (btnNextTie) {
    btnNextTie.textContent = (currentTieIndex === totalTies - 1) ? "回答を完了する →" : "次へ進む →";
  }

  const container = document.getElementById("tiebreaker-options-container");
  container.innerHTML = "";

  const savedChoice = tiebreakerAnswers[axis]; // -1 または 1

  // 選択肢1: 左特性 (-1点 ➔ 合計9点に確定)
  const leftBtn = document.createElement("button");
  leftBtn.type = "button";
  leftBtn.className = "quiz-option-btn";
  if (savedChoice === -1) leftBtn.classList.add("selected");
  leftBtn.textContent = tbData.leftLabel;
  leftBtn.addEventListener("click", () => {
    tiebreakerAnswers[axis] = -1;
    container.querySelectorAll(".quiz-option-btn").forEach(b => b.classList.remove("selected"));
    leftBtn.classList.add("selected");
    setTimeout(() => {
      handleTiebreakerNext();
    }, 160);
  });

  // 選択肢2: 右特性 (+1点 ➔ 合計11点に確定)
  const rightBtn = document.createElement("button");
  rightBtn.type = "button";
  rightBtn.className = "quiz-option-btn";
  if (savedChoice === 1) rightBtn.classList.add("selected");
  rightBtn.textContent = tbData.rightLabel;
  rightBtn.addEventListener("click", () => {
    tiebreakerAnswers[axis] = 1;
    container.querySelectorAll(".quiz-option-btn").forEach(b => b.classList.remove("selected"));
    rightBtn.classList.add("selected");
    setTimeout(() => {
      handleTiebreakerNext();
    }, 160);
  });

  container.appendChild(leftBtn);
  container.appendChild(rightBtn);
}

function handleTiebreakerNext() {
  currentTieIndex++;
  if (currentTieIndex < tiebreakerAxes.length) {
    renderTiebreaker();
  } else {
    document.getElementById("tiebreaker-screen").style.display = "none";
    finishQuiz();
  }
}

// 最終集計と完了URL生成処理（4〜16の整数合計点）
function finishQuiz() {
  // 不正値防止用クランプ（4〜16の整数を保証）
  const clampScore = (n) => Math.max(4, Math.min(16, Math.round(n)));

  // 決選設問の選択（-1 または +1）を基本点数へ合算
  const finalSums = { ...axisSums };
  tiebreakerAxes.forEach(axis => {
    const diff = tiebreakerAnswers[axis] || 0;
    finalSums[axis] += diff;
  });

  const sumEI = clampScore(finalSums.ei);
  const sumSN = clampScore(finalSums.sn);
  const sumTF = clampScore(finalSums.tf);
  const sumJP = clampScore(finalSums.jp);

  const rid = "r_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
  const scStr = `${sumEI},${sumSN},${sumTF},${sumJP}`;

  const currentPath = window.location.pathname;
  const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
  const resultUrl = `${window.location.origin}${basePath}app.html?uid=${encodeURIComponent(targetUserId)}&rid=${encodeURIComponent(rid)}&rel=${encodeURIComponent(selectedRelation)}&sc=${encodeURIComponent(scStr)}&n=${encodeURIComponent(answererName)}`;

  document.getElementById("complete-screen").style.display = "block";

  const urlInput = document.getElementById("result-url-input");
  urlInput.value = resultUrl;

  // LINE送信ボタンにURLとメッセージをバインド
  const lineShareBtn = document.getElementById("line-share-btn");
  if (lineShareBtn) {
    const lineText = encodeURIComponent(`${targetUserName}さんの他己分析に回答しました！\n以下のURLを開いて結果を確認してね👇\n${resultUrl}`);
    lineShareBtn.href = `https://line.me/R/msg/text/?${lineText}`;
  }

  // 結果URLコピーボタン
  const copyBtn = document.getElementById("copy-result-url-btn");
  copyBtn.onclick = () => {
    urlInput.select();
    navigator.clipboard.writeText(resultUrl);
    showToast("結果URLをコピーしました！");
  };
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
