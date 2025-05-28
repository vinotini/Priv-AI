document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('uploadForm');
  const fileInput = document.getElementById('fileInput');
  const previewBox = document.getElementById('preview');
  const leakList = document.getElementById('leakList');
  const scoreBar = document.getElementById('scoreBar');
  const scoreText = document.getElementById('scoreText');
  const errorBox = document.getElementById('error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.textContent = '';
    previewBox.textContent = '';
    leakList.innerHTML = '';
    scoreBar.style.width = '0%';
    scoreText.textContent = '';

    if (!fileInput.files.length) {
      errorBox.textContent = 'Please select a file.';
      return;
    }

    const formData = new FormData();
    formData.append('document', fileInput.files[0]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze file.');
      }

      const data = await response.json();

      previewBox.textContent = data.preview || 'No preview available.';
      if (data.leaks.length) {
        for (const leak of data.leaks) {
          const li = document.createElement('li');
          li.textContent = leak;
          leakList.appendChild(li);
        }
      } else {
        leakList.innerHTML = '<li>No leaks detected</li>';
      }

      const riskScore = data.risk_score || 0;
      scoreBar.style.width = riskScore + '%';
      scoreText.textContent = `Risk Score: ${riskScore}/100`;
    } catch (error) {
      errorBox.textContent = error.message;
    }
  });
});
