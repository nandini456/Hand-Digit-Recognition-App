const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let isDrawing = false;

ctx.fillStyle = "black";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Drawing events
canvas.addEventListener("mousedown", () => { isDrawing = true; });
canvas.addEventListener("mouseup", () => { isDrawing = false; ctx.beginPath(); });
canvas.addEventListener("mousemove", (event) => {
  if (!isDrawing) return;
  ctx.lineWidth = 15;
  ctx.lineCap = "round";
  ctx.strokeStyle = "white";
  ctx.lineTo(event.offsetX, event.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(event.offsetX, event.offsetY);
  predictLive(); // ← real-time prediction
});

// Clear canvas + reset bars
function clearCanvas() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  document.getElementById("result").textContent = "";
  for (let i = 0; i <= 9; i++) {
    const bar = document.getElementById(`bar-${i}`);
    bar.style.height = "0%";
    bar.style.backgroundColor = "steelblue";
  }
}

// Throttled prediction
let lastPredictionTime = 0;
const predictionInterval = 300; // ms

function predictLive() {
  const now = Date.now();
  if (now - lastPredictionTime < predictionInterval) return;
  lastPredictionTime = now;

  const image = canvas.toDataURL("image/png");
  fetch("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: image })
  })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        document.getElementById("result").textContent = "Error: " + data.error;
        return;
      }

      const prediction = data.prediction;
      const confidences = data.confidences;

      document.getElementById("result").textContent =
        `Prediction: ${prediction}, Confidence: ${confidences[prediction]}`;

      for (let i = 0; i <= 9; i++) {
        const bar = document.getElementById(`bar-${i}`);
        const height = confidences[i] * 100;
        bar.style.height = `${height}%`;
        bar.style.backgroundColor = i === prediction ? "red" : "steelblue";
      }
    })
    .catch(error => {
      console.error("Error:", error);
    });
}

// Create bar chart dynamically
const barChart = document.getElementById("bar-chart");
for (let i = 0; i <= 9; i++) {
  const bar = document.createElement("div");
  bar.className = "bar";
  bar.id = `bar-${i}`;
  bar.innerHTML = `<span>${i}</span>`;
  barChart.appendChild(bar);
}
