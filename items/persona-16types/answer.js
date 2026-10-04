// 12問の設問定義
// axis: 0=E/I, 1=S/N, 2=T/F, 3=J/P
// reverse: false なら「高いほど右側(I, N, F, P)」、true なら「高いほど左側(E, S, T, J)」
const QUESTIONS = [
  // --- E / I 軸（外向 / 内向） ---
  {
    axis: 0,
    text: "複数人の集まりや飲み会の場で、中心になって会話を盛り上げたり最後までハイテンションで話し続けることが多い？",
    reverse: true // 当てはまるほど E
  },
  {
    axis: 0,
    text: "休日に予定を詰め込んで人と会うより、一人で趣味や休息に充てる時間を大切にしているように見える？",
    reverse: false // 当てはまるほど I
  },
  {
    axis: 0,
    text: "初対面の人やあまり親しくない人の輪の中にも、物怖じせず自然に溶け込んでいける？",
    reverse: true // 当てはまるほど E
  },

  // --- S / N 軸（感覚 / 直観） ---
  {
    axis: 1,
    text: "普段の会話で、「もし〇〇だったら？」という突飛な妄想や、抽象的なアイデア・将来の可能性について熱く語ることが多い？",
    reverse: false // 当てはまるほど N
  },
  {
    axis: 1,
    text: "物事を判断するとき、直感やひらめきよりも、実際の過去の実績や具体的な数字・事実を重視する？",
    reverse: true // 当てはまるほど S
  },
  {
    axis: 1,
    text: "たとえ話や言葉の裏にある隠された意味を汲み取ったり、物事の全体的なパターンや文脈を掴むのが得意に見える？",
    reverse: false // 当てはまるほど N
  },

  // --- T / F 軸（思考 / 感情） ---
  {
    axis: 2,
    text: "誰かが悩みや愚痴を話したとき、まず「共感や気持ちに寄り添うこと」を何よりも優先してくれる？",
    reverse: false // 当てはまるほど F
  },
  {
    axis: 2,
    text: "トラブルや意見の対立が起きたとき、感情論を挟まず「何が最も合理的・客観的に正しいか」で物事を進めようとする？",
    reverse: true // 当てはまるほど T
  },
  {
    axis: 2,
    text: "会話の中で人の表情や声のトーンの機微を敏感に察知し、場の空気を壊さないよう言葉を選ぶタイプだと思う？",
    reverse: false // 当てはまるほど F
  },

  // --- J / P 軸（判断 / 知覚） ---
  {
    axis: 3,
    text: "旅行やイベントの予定を立てるとき、事前に行き先やタイムスケジュールをきっちり決めてから動くタイプ？",
    reverse: true // 当てはまるほど J
  },
  {
    axis: 3,
    text: "締め切り直前になるまで腰が上がらなかったり、当日の気分やノリで臨機応変に予定を変えるのが好きそう？",
    reverse: false // 当てはまるほど P
  },
  {
    axis: 3,
    text: "部屋の片付けや作業の進捗管理など、ルーティンや決められたルールに従ってコツコツ進めるのが得意に見える？",
    reverse: true // 当てはまるほど J
  }
];

// 5段階選択肢
const SCALE_OPTIONS = [
  { label: "とても当てはまる", rawScore: 5 },
  { label: "やや当てはまる", rawScore: 4 },
  { label: "どちらともいえない", rawScore: 3 },
  { label: "あまり当てはまらない", rawScore: 2 },
  { label: "まったく当てはまらない", rawScore: 1 }
];

let targetName = "あの人";
let selectedRelation = "";
let currentIndex = 0;
// 各軸のスコア合算 [E/I, S/N, T/F, J/P]
const axisTotals = [0, 0, 0, 0];
const axisCounts = [0, 0, 0, 0];

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const uParam = urlParams.get("u");
  if (uParam) {
    targetName = uParam;
    document.getElementById("target-name-display").textContent = `${targetName} さん`;
    document.getElementById("target-name-inline").textContent = `${targetName} さん`;
  }

  // 関係性ボタンの選択制御
  const relButtons = document.querySelectorAll(".rel-select-btn");
  const startBtn = document.getElementById("start-answer-btn");

  relButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      relButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedRelation = btn.getAttribute("data-rel");
      startBtn.disabled = false;
    });
  });

  // 回答開始ボタン
  startBtn.addEventListener("click", () => {
    document.getElementById("relation-view").style.display = "none";
    document.getElementById("quiz-view").style.display = "block";
    renderQuestion();
  });
});

// 設問の描画
function renderQuestion() {
  const current = QUESTIONS[currentIndex];
  document.getElementById("progress").textContent = `質問 ${currentIndex + 1} / ${QUESTIONS.length}`;
  document.getElementById("question-text").textContent = current.text;

  const optionsContainer = document.getElementById("options-container");
  optionsContainer.innerHTML = "";

  SCALE_OPTIONS.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt.label;
    btn.addEventListener("click", () => {
      btn.blur();
      handleSelect(current, opt.rawScore);
    });
    optionsContainer.appendChild(btn);
  });
}

// 回答選択時の処理
function handleSelect(question, rawScore) {
  // スコア算出（1: 左寄り 〜 5: 右寄りに正規化）
  // reverse === true の場合、当てはまる(5)ほど左(1)になるよう反転
  const normalizedScore = question.reverse ? (6 - rawScore) : rawScore;

  axisTotals[question.axis] += normalizedScore;
  axisCounts[question.axis]++;

  currentIndex++;

  if (currentIndex < QUESTIONS.length) {
    renderQuestion();
  } else {
    finishQuiz();
  }
}

// 回答完了・返信URL生成
function finishQuiz() {
  document.getElementById("quiz-view").style.display = "none";
  document.getElementById("complete-view").style.display = "block";
  document.getElementById("target-name-complete").textContent = targetName;

  // 各軸の平均スコア（小数第1位まで）
  const finalScores = axisTotals.map((tot, idx) => {
    return (tot / axisCounts[idx]).toFixed(1);
  });

  // 一意の回答ID生成 (タイムスタンプ + ランダム文字列)
  const rid = "r_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 6);
  const respondentName = document.getElementById("respondent-name-input").value.trim() || "匿名";

  // 出題者（index.html）へ戻すパラメータ付きURL
  const baseUrl = window.location.href.split("?")[0].replace("answer.html", "");
  const returnUrl = `${baseUrl}?rid=${rid}&rel=${selectedRelation}&sc=${finalScores.join(",")}&n=${encodeURIComponent(respondentName)}`;

  // LINE送信ボタン設定（★「他己分析」表記に統一）
  const lineBtn = document.getElementById("line-send-btn");
  const lineText = encodeURIComponent(`${targetName}さんの他己分析に回答したよ！結果を確認してみてね👇\n${returnUrl}`);
  lineBtn.href = `https://line.me/R/msg/text/?${lineText}`;

  // コピー用設定
  const copyBtn = document.getElementById("copy-result-btn");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(returnUrl);
    showToast("結果URLをコピーしました！");
  });
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2500);
}
