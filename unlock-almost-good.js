(async () => {
  const delay = ms => new Promise(res => setTimeout(res, ms));
  const collected = new Set();
  let unchangedCount = 0;

  // ✅ جلب Ticker من الأعلى
  const getByXPath = (xpath) => {
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
    return result.singleNodeValue?.innerText?.trim() || "UNKNOWN";
  };
  const ticker = getByXPath('//*[@id="root-container"]/div[3]/div[1]/div[2]/div[1]/div/div[1]/h2/span[2]');

  const unlockSection = document.evaluate(
    "//*[contains(text(), 'Unlock Events')]",
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (unlockSection) {
    unlockSection.scrollIntoView({ behavior: "smooth", block: "start" });
    await delay(1500);
  }

  const waitForElement = async (selector, maxTries = 20) => {
    for (let i = 0; i < maxTries; i++) {
      const el = document.querySelector(selector);
      if (el) return el;
      await delay(500);
    }
    return null;
  };

  const scroller = await waitForElement("div[data-test-id='virtuoso-scroller']");
  const list = await waitForElement("div[data-test-id='virtuoso-item-list']");

  if (!scroller || !list) {
    alert("❌ العنصر المسؤول عن المحتوى مش ظاهر.");
    return;
  }

  const processCards = async (cards) => {
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const inView = rect.bottom >= 0 && rect.top <= window.innerHeight;

      if (!inView) continue;

      const moreBtn = card.querySelector("p.sc-b2e3d974-0.hjsNqC");
      if (moreBtn && /More|Show/i.test(moreBtn.innerText) && !/Less/i.test(moreBtn.innerText)) {
        try { moreBtn.click(); await delay(300); } catch (e) {}
      }

      const text = card.innerText.trim();
      if (text && !collected.has(text)) {
        collected.add(text);
      }
    }
  };

  const initialCards = list.querySelectorAll("div[data-index]");
  await processCards(initialCards);

  for (let i = 0; i < 150; i++) {
    const beforeScrollSize = collected.size;
    scroller.scrollBy(0, 300);
    await delay(700);

    const cards = list.querySelectorAll("div[data-index]");
    await processCards(cards);

    if (collected.size === beforeScrollSize) {
      unchangedCount++;
      if (unchangedCount >= 5) break;
    } else {
      unchangedCount = 0;
    }

    console.log(`Iteration ${i}: Collected ${collected.size} items`);
  }

  scroller.scrollBy(0, 1000);
  await delay(1000);

  const finalCards = list.querySelectorAll("div[data-index]");
  await processCards(finalCards);

  const finalText = Array.from(collected).join("\n\n--------------------\n\n");

  const blob = new Blob([finalText], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${ticker}_unlock.txt`; // ✅ اسم الملف حسب التيكر
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  alert(`✅ تم تحميل ${collected.size} عنصر كملف نصي (${ticker}_unlock.txt)`);
})();