document.addEventListener("DOMContentLoaded", () => {
  // 1. 診断画面：枠の外（body直下）に固定ボタンを自動挿入
  const navHeader = document.getElementById("test-nav-header");
  if (navHeader) {
    const fixedBtn = document.createElement("a");
    fixedBtn.href = "../../";
    fixedBtn.className = "fixed-top-back-btn";
    fixedBtn.innerHTML = "<span>←</span> <span>トップへ</span>";
    document.body.appendChild(fixedBtn);
    navHeader.remove(); // 枠内のプレースホルダーは削除
  }

  // 2. 結果画面のフッター生成
  const resultFooter = document.getElementById("test-result-footer");
  if (resultFooter) {
    resultFooter.innerHTML = `
      <div class="nav-links-row">
        <a href="index.html" class="sub-link">もう一度診断する</a>
        <span style="color: #cbd5e1;">|</span>
        <a href="../../" class="main-link">他の診断を見る（トップへ）</a>
      </div>
    `;
  }

  // 3. XシェアボタンのURL自動バインド
  const shareBtn = document.getElementById("share-btn");
  if (shareBtn) {
    const rawShareText = shareBtn.getAttribute("data-share-text") || "診断結果をチェック！";
    const currentUrl = encodeURIComponent(window.location.href);
    const shareText = encodeURIComponent(`${rawShareText}\n`);
    shareBtn.href = `https://twitter.com/intent/tweet?text=${shareText}&url=${currentUrl}`;
  }
});

// 配列をランダムにシャッフルする共通関数（Fisher-Yates法）
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
