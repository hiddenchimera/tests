// 全12問の設問データ（各軸3問ずつ）
// 1: E(+) / I(-)
// 2: S(+) / N(-)
// 3: T(+) / F(-)
// 4: J(+) / P(-)
// 回答スコア: 1(全く) 〜 5(非常に)
const surveyQuestions = [
  // E vs I (外向・内向)
  { id: 1, axis: 0, text: "大勢で集まる場や飲み会では、輪の中心になって会話を盛り上げる方だ", reverse: false },
  { id: 2, axis: 0, text: "休日は人と遊ぶよりも、一人で静かに過ごす時間を優先したいように見える", reverse: true },
  { id: 3, axis: 0, text: "初対面の人に対しても物怖じせず、気さくに話しかけることができる", reverse: false },

  // S vs N (感覚・直観)
  { id: 4, axis: 1, text: "具体的な数字や過去の実績・事実を根拠にして物事を考える現実派だ", reverse: false },
  { id: 5, axis: 1, text: "抽象的なアイデアや、未来の可能性について熱く語ることが多い", reverse: true },
  { id: 6, axis: 1, text: "現実離れした空想よりも、今目の前にある実用的な課題を重視する", reverse: false },

  // T vs F (思考・感情)
  { id: 7, axis: 2, text: "相談を受けたとき、感情に寄り添うよりも解決策や正論を冷静に提示する方だ", reverse: false },
  { id: 8, axis: 2, text: "他人の感情の機微に敏感で、相手が傷つかないよう配慮を最優先する", reverse: true },
  { id: 9, axis: 2, text: "議論や意見の食い違いがあっても、感情的にならず筋道を立てて話す", reverse: false },

  // J vs P (判断・知覚)
  { id: 10, axis: 3, text: "旅行や休日の予定は事前にきっちりスケジュールを立てて行動する方だ", reverse: false },
  { id: 11, axis: 3, text: "締め切りや計画に縛られず、その場の思いつきや臨機応変な行動を好む", reverse: true },
  { id: 12, axis: 3, text: "物事を進める際、整理整頓や手順のルール化を徹底する几帳面さがある", reverse: false }
];

let selectedRelation = "friend";
let currentQIndex = 0;
const axisScores = [0, 0, 0, 0];
const axisCounts = [0, 0, 0, 0];

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const targetUserName = urlParams.get("u") || "あの人";
  const targetUserId = urlParams.get("uid") || "";

  // 画面内の名前を反映
  document.getElementById("target-name-display").textContent = targetUserName;
  document.getElementById("target-name-bold").textContent = targetUserName;
  document.getElementById("finish-target-name").textContent = targetUserName;

  // 関係性ボタンの選択制御
  const relButtons = document.querySelectorAll(".rel-select-btn");
  relButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      relButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      selectedRelation = btn.getAttribute("data-rel");
    });
  });

  // 診断開始ボタン
  const startBtn = document.getElementById("start-survey-btn");
  startBtn.addEventListener("click", () => {
    document.getElementById("answer-intro-view").style.display = "none";
    document.getElementById("answer-survey-view").style.display = "block";
    renderSurveyQuestion();
  });

  // リッカート尺度ボタンのクリック
  const likertButtons = document.querySelectorAll(".likert-btn");
  likertButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = Number(btn.getAttribute("data-score"));
      handleSurveyAnswer(val, targetUserName, targetUserId);
    });
  });
});

function renderSurveyQuestion() {
  const q = surveyQuestions[currentQIndex];
  document.getElementById("survey-question-text").textContent = q.text;
  document.getElementById("survey-progress-text").textContent = `${currentQIndex + 1} / ${surveyQuestions.length}`;
  const pct = ((currentQIndex + 1) / surveyQuestions.length) * 100;
  document.getElementById("survey-progress-bar").style.width = `${pct}%`;
}

function handleSurveyAnswer(val, userName, userId) {
  const q = surveyQuestions[currentQIndex];
  // 逆転項目の計算（1〜5尺度）
  const actualScore = q.reverse ? (6 - val) : val;

  axisScores[q.axis] += actualScore;
  axisCounts[q.axis]++;
  currentQIndex++;

  if (currentQIndex < surveyQuestions.length) {
    renderSurveyQuestion();
  } else {
    // 診断終了：4軸の平均スコアを算出（1.0〜5.0）
    const finalScores = axisScores.map((sum, idx) => {
      return (sum / axisCounts[idx]).toFixed(1);
    });

    const respondentName = document.getElementById("respondent-name-input").value.trim() || "匿名";
    const responseId = "r_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);

    // ★ 返信先URLを app.html 宛てに組み立て
    const currentPath = window.location.pathname;
    const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
    const returnUrl = `${window.location.origin}${basePath}app.html?rid=${responseId}&rel=${selectedRelation}&sc=${finalScores.join(",")}&uid=${userId}&n=${encodeURIComponent(respondentName)}`;

    // 画面切り替え
    document.getElementById("answer-survey-view").style.display = "none";
    document.getElementById("answer-finish-view").style.display = "block";

    // LINEシェアボタン
    const lineText = encodeURIComponent(`${userName}さんの他己分析に回答しました！結果はこちらから確認してね：\n${returnUrl}`);
    document.getElementById("line-share-btn").href = `https://line.me/R/msg/text/?${lineText}`;

    // コピーボタン
    document.getElementById("copy-result-btn").onclick = () => {
      navigator.clipboard.writeText(returnUrl);
      alert("結果URLをコピーしました！LINEやDMで相手に送ってください。");
    };
  }
}
