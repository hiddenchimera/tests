// 全16問の設問データ（各軸4問：肯定2問 ＋ 逆転2問）
const surveyQuestions = [
  // --- E vs I (外向・内向) ---
  { id: 1, axis: 0, text: "大勢で集まる場や飲み会では、輪の中心になって会話を盛り上げる方だ", reverse: false },
  { id: 2, axis: 0, text: "休日は人と遊ぶよりも、一人で静かに過ごす時間を優先したいように見える", reverse: true },
  { id: 3, axis: 0, text: "初対面の人に対しても物怖じせず、自分から気さくに話しかけることができる", reverse: false },
  { id: 4, axis: 0, text: "自分の考えや感情をその場ですぐ口に出すより、心の中でじっくり反芻するタイプだ", reverse: true },

  // --- S vs N (感覚・直観) ---
  { id: 5, axis: 1, text: "具体的な数字や過去の実績・事実を根拠にして物事を考える現実派だ", reverse: false },
  { id: 6, axis: 1, text: "抽象的なアイデアや、未来の可能性について熱く語ることが多い", reverse: true },
  { id: 7, axis: 1, text: "現実離れした空想よりも、今目の前にある実用的な課題を重視する", reverse: false },
  { id: 8, axis: 1, text: "物事の裏にある意味や全体のつながり、直感的なインスピレーションを大切にしている", reverse: true },

  // --- T vs F (思考・感情) ---
  { id: 9, axis: 2, text: "相談を受けたとき、感情に寄り添うよりも解決策や正論を冷静に提示する方だ", reverse: false },
  { id: 10, axis: 2, text: "他人の感情の機微に敏感で、相手が傷つかないよう配慮を最優先する", reverse: true },
  { id: 11, axis: 2, text: "議論や意見の食い違いがあっても、感情的にならず筋道を立てて話す", reverse: false },
  { id: 12, axis: 2, text: "ルールや正しさよりも、関わる人たちの調和や共感を第一に考えて行動する", reverse: true },

  // --- J vs P (判断・知覚) ---
  { id: 13, axis: 3, text: "旅行や休日の予定は事前にきっちりスケジュールを立てて行動する方だ", reverse: false },
  { id: 14, axis: 3, text: "締め切りや計画に縛られず、その場の思いつきや臨機応変な行動を好む", reverse: true },
  { id: 15, axis: 3, text: "物事を進める際、整理整頓や手順のルール化を徹底する几帳面さがある", reverse: false },
  { id: 16, axis: 3, text: "白黒ハッキリ決めてしまうより、選択肢をオープンにして流動的に構えている方が心地よさそうだ", reverse: true }
];

let selectedRelation = "friend";
let currentQIndex = 0;
// 各問の回答値を保持する配列（未回答は null）
let userAnswers = new Array(surveyQuestions.length).fill(null);
let targetUserName = "あの人";
let targetUserId = "";

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  targetUserName = urlParams.get("u") || "あの人";
  targetUserId = urlParams.get("uid") || "";

  // 画面内の名前を反映
  document.getElementById("target-name-display").textContent = targetUserName;
  document.getElementById("target-name-bold").textContent = targetUserName;
  document.getElementById("finish-target-name").textContent = targetUserName;

  const reminderEl = document.getElementById("target-name-reminder");
  if (reminderEl) {
    reminderEl.textContent = targetUserName;
  }

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
    // 初回開始時のみ設問をシャッフル
    if (userAnswers.every(ans => ans === null)) {
      if (typeof shuffleArray === "function") {
        shuffleArray(surveyQuestions);
      }
    }
    document.getElementById("answer-intro-view").style.display = "none";
    document.getElementById("answer-survey-view").style.display = "block";
    renderSurveyQuestion();
  });

  // リッカート尺度ボタンのクリック
  const likertButtons = document.querySelectorAll(".likert-btn");
  likertButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const val = Number(btn.getAttribute("data-score"));
      userAnswers[currentQIndex] = val;
      // 回答したら自動で次へ
      proceedNext();
    });
  });

  // 「← 前に戻る」ボタン
  const prevBtn = document.getElementById("btn-prev-q");
  prevBtn.addEventListener("click", () => {
    if (currentQIndex === 0) {
      // 1問目で戻るを押した場合：初期設定画面（関係性・名前入力）へ戻る
      document.getElementById("answer-survey-view").style.display = "none";
      document.getElementById("answer-intro-view").style.display = "block";
    } else {
      currentQIndex--;
      renderSurveyQuestion();
    }
  });

  // 「次へ進む →」ボタン（すでに入力済みの設問をスキップして進む場合）
  const nextBtn = document.getElementById("btn-next-q");
  nextBtn.addEventListener("click", () => {
    if (userAnswers[currentQIndex] !== null) {
      proceedNext();
    }
  });
});

function renderSurveyQuestion() {
  const q = surveyQuestions[currentQIndex];
  document.getElementById("survey-question-text").textContent = q.text;
  document.getElementById("survey-progress-text").textContent = `${currentQIndex + 1} / ${surveyQuestions.length}`;
  const pct = ((currentQIndex + 1) / surveyQuestions.length) * 100;
  document.getElementById("survey-progress-bar").style.width = `${pct}%`;

  // 戻るボタンのラベル調整（1問目は「← 関係性の選択に戻る」）
  const prevBtn = document.getElementById("btn-prev-q");
  if (currentQIndex === 0) {
    prevBtn.textContent = "← 関係性の選択に戻る";
  } else {
    prevBtn.textContent = "← 前の質問に戻る";
  }

  // 選択済みスコアのハイライト復元 & 次へ進むボタンの表示制御
  const savedVal = userAnswers[currentQIndex];
  const likertButtons = document.querySelectorAll(".likert-btn");
  const nextBtn = document.getElementById("btn-next-q");

  likertButtons.forEach(btn => {
    const score = Number(btn.getAttribute("data-score"));
    if (savedVal !== null && score === savedVal) {
      btn.classList.add("selected");
    } else {
      btn.classList.remove("selected");
    }
  });

  // 既に回答済みの設問であれば「次へ進む →」ボタンを表示
  if (savedVal !== null && currentQIndex < surveyQuestions.length - 1) {
    nextBtn.style.visibility = "visible";
  } else {
    nextBtn.style.visibility = "hidden";
  }
}

function proceedNext() {
  if (currentQIndex < surveyQuestions.length - 1) {
    currentQIndex++;
    renderSurveyQuestion();
  } else {
    finishSurvey();
  }
}

function finishSurvey() {
  // 全16問の集計計算
  const axisScores = [0, 0, 0, 0];
  const axisCounts = [0, 0, 0, 0];

  surveyQuestions.forEach((q, idx) => {
    const val = userAnswers[idx];
    const actualScore = q.reverse ? (6 - val) : val;
    axisScores[q.axis] += actualScore;
    axisCounts[q.axis]++;
  });

  const finalScores = axisScores.map((sum, idx) => {
    return (sum / axisCounts[idx]).toFixed(1);
  });

  const respondentName = document.getElementById("respondent-name-input").value.trim() || "匿名";
  const responseId = "r_" + Date.now().toString(36) + "_" + Math.random().toString(36).substring(2, 7);

  // 返信先URLを app.html 宛てに組み立て
  const currentPath = window.location.pathname;
  const basePath = currentPath.substring(0, currentPath.lastIndexOf("/") + 1);
  const returnUrl = `${window.location.origin}${basePath}app.html?rid=${responseId}&rel=${selectedRelation}&sc=${finalScores.join(",")}&uid=${targetUserId}&n=${encodeURIComponent(respondentName)}`;

  // 画面切り替え
  document.getElementById("answer-survey-view").style.display = "none";
  document.getElementById("answer-finish-view").style.display = "block";

  // LINEシェアボタン
  const lineText = encodeURIComponent(`${targetUserName}さんの他己分析に回答しました！結果はこちらから確認してね：\n${returnUrl}`);
  document.getElementById("line-share-btn").href = `https://line.me/R/msg/text/?${lineText}`;

  // コピーボタン
  document.getElementById("copy-result-btn").onclick = () => {
    navigator.clipboard.writeText(returnUrl);
    alert("結果URLをコピーしました！LINEやDMで相手に送ってください。");
  };
}
