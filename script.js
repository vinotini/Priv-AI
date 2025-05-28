document.getElementById("uploadForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("document", file);

  const resultDiv = document.getElementById("result");
  const previewDiv = document.getElementById("preview");
  const leakList = document.getElementById("leakList");
  const scoreFill = document.getElementById("scoreFill");
  const scoreText = document.getElementById("scoreText");

  // Reset UI
  previewDiv.textContent = "Analyzing...";
  leakList.innerHTML = "";
  scoreFill.style.width = "0";
  scoreText.textContent = "";
  resultDiv.classList.remove("hidden");

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      previewDiv.textContent = "Error analyzing document.";
      return;
    }

    const data = await response.json();

    previewDiv.textContent = data.text;
    if (data.leaks.length === 0) {
      leakList.innerHTML = "<li>No privacy leaks detected!</li>";
    } else {
      data.leaks.forEach((leak) => {
        const li = document.createElement("li");
        li.textContent = leak;
        leakList.appendChild(li);
      });
    }

    scoreFill.style.width = `${data.riskScore}%`;
    scoreText.textContent = `Risk Score: ${data.riskScore.toFixed(2)}%`;
  } catch (error) {
    previewDiv.textContent = "Failed to analyze document.";
  }
});
