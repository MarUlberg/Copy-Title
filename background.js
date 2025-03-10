chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: processPageTitle
  });
});

function processPageTitle() {
  function processAdultdbTitle(title) {
    function formatDate(month, day, year) {
      const months = { Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06", Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12" };
      return `${year}-${months[month]}-${day.padStart(2, '0')}`;
    }

    title = title.split(/ :: /)[0].trim();

    let dateRegex = /\b([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})\b/;
    let dateMatch = null;

    let sources = [
      document.body.innerText,
      document.body.innerHTML,
      document.querySelector("meta[property='article:published_time']")?.content,
      document.querySelector("meta[name='date']")?.content,
      ...Array.from(document.querySelectorAll("h1, h2, h3, p, span")).map(el => el.innerText)
    ];

    for (let source of sources) {
      if (source && typeof source === "string") {
        let match = source.match(dateRegex);
        if (match) {
          dateMatch = match;
          break;
        }
      }
    }

    if (dateMatch) {
      let formattedDate = formatDate(dateMatch[1], dateMatch[2], dateMatch[3]);
      if (title.includes("/")) {
        title = title.replace(/\s*\/\s*/, ` ${formattedDate} `);
      }
      console.log("✅ Found Date:", dateMatch[0], "➡ Reformatted as:", formattedDate);
    } else {
      console.warn("⚠ No date found on the page!");
    }

    title = title.replace(/:/g, " -");
    return title;
  }

  let title = document.title;
  const siteURL = window.location.origin;

  if (siteURL === "https://theporndb.net") {
    // Keep the original date-processing logic
    title = processAdultdbTitle(title);
  } else {
    // For all other sites, remove extra parts after " - ", " :: ", or " — "
    title = title.split(/ - | :: | — /)[0].trim();
  }

  navigator.clipboard.writeText(title)
    .then(() => console.log("📋 Copied title:", title))
    .catch(err => console.error("❌ Failed to copy title:", err));
}
