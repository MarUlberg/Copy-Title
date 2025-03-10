chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: copyPageTitle
  });
});

function copyPageTitle() {
  function formatDate(month, day, year) {
    const months = {
      Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
      Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
    };
    return `${year}-${months[month]}-${day.padStart(2, '0')}`; // Format YYYY-MM-DD
  }

  let title = document.title.replace(/ \:\: .*$/, ''); // Remove ":: ..." from title

  // Find a date formatted as "May 23, 2024"
  let dateRegex = /\b([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})\b/;
  let dateMatch = null;

  // Search multiple places for the date
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
        break; // Stop after finding the first valid date
      }
    }
  }

  if (dateMatch) {
    let formattedDate = formatDate(dateMatch[1], dateMatch[2], dateMatch[3]);

    // Replace the first "/" with the formatted date
    if (title.includes("/")) {
      title = title.replace(/\s*\/\s*/, ` ${formattedDate} `); // Trim spaces around "/" and insert date
    }

    console.log("✅ Found Date:", dateMatch[0], "➡ Reformatted as:", formattedDate);
  } else {
    console.warn("⚠ No date found on the page!");
  }

  // Replace ":" with " - "
  title = title.replace(/:/g, " -");

  navigator.clipboard.writeText(title)
    .then(() => console.log("📋 Copied title:", title))
    .catch(err => console.error("❌ Failed to copy title:", err));
}
