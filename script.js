document.getElementById("uploadForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please choose a file.");
    return;
  }

  const formData = new FormData();
  formData.append("document", file);

  fetch("/api/analyze", {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      document.getElementById("result").classList.remove("hidden");
      document.getElementById("preview").textContent = data.preview;

      const leakList = document.getElementById("leakList");
      leakList.innerHTML = "";
      data.leaks.forEach((leak) => {
        const li = document.createElement("li");
        li.textContent = leak;
        leakList.appendChild(li);
      });

      const score = data.risk_score;
      document.getElementById("scoreFill").style.width = `${score}%`;
      document.getElementById("scoreText").textContent = `Risk Score: ${score}%`;
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Something went wrong. Please try again.");
    });
});
