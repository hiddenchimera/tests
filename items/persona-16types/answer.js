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

// 設問定義（各軸4問：左側特性2問［反転］＋右側特性2問［正転］＝全16問）
// スコア計算：1.0点（左特性MAX）〜 4.0点（右特性MAX） / 中央値: 2.5点
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

    document.getElementById("intro-screen").style.display = "none";
    document.getElementById("quiz-screen").style.display = "block";
    renderQuestion();
  });

  // ナビゲーションボタン（前に戻る・次へ進む）
  document.getElementById("btn-prev-question").addEventListener("click", () => {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      renderQuestion();
    } else {
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
      finishQuiz();
    }
  });
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

  document.getElementById("quiz-progress").style.width = `${(progressNum / total) * 100}%`;
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
          finishQuiz();
        }
      }, 160);
    });
    container.appendChild(btn);
  });
}

// 診断集計と完了URL生成処理（4段階完全専用）
function finishQuiz() {
  const axisScores = {
    ei: 0,
    sn: 0,
    tf: 0,
    jp: 0
  };

  questions.forEach(q => {
    const raw = answers[q.id] || 2;
    // 逆転項目の反転（4段階：1点⇄4点、2点⇄3点 ➔ 5 - raw）
    const effectiveScore = q.reverse ? (5 - raw) : raw;
    axisScores[q.axis] += effectiveScore;
  });

  const avgEI = Number((axisScores.ei / 4).toFixed(1));
  const avgSN = Number((axisScores.sn / 4).toFixed(1));
  const avgTF = Number((axisScores.tf / 4).toFixed(1));
  const avgJP = Number((axisScores.jp / 4).toFixed(1));

  const rid = "r_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);
  const scStr = `${avgEI},${avgSN},${avgTF},${avgJP}`;

  const currentPath = window.location.pathname;
  const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
  const resultUrl = `${window.location.origin}${basePath}app.html?uid=${encodeURIComponent(targetUserId)}&rid=${encodeURIComponent(rid)}&rel=${encodeURIComponent(selectedRelation)}&sc=${encodeURIComponent(scStr)}&n=${encodeURIComponent(answererName)}`;

  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("complete-screen").style.display = "block";

  const urlInput = document.getElementById("result-url-input");
  urlInput.value = resultUrl;

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
