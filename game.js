const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
const statusText = document.getElementById("statusText");

const CONFIG = {
  survivalSeconds: 60,
  gravity: 1800, // pixels / s^2
  jumpVelocity: -750,
  baseSpeed: 320, // obstacle speed in pixels / s
  spawnIntervalMin: 1.2, // seconds
  spawnIntervalMax: 2.5, // seconds
  groundHeight: 70,
  characterSprite: "assets/character.png",
  obstacleSprite: "assets/obstacle.png",
};

const floorY = canvas.height - CONFIG.groundHeight;

const character = {
  x: 140,
  y: floorY - 96,
  width: 72,
  height: 96,
  velocityY: 0,
  grounded: true,
};

let obstacles = [];
let elapsed = 0;
let isGameOver = false;
let isGameWon = false;
let startTime = null;
let lastFrameTime = null;
let spawnTimer = 0;
let nextSpawnIn = randomRange(CONFIG.spawnIntervalMin, CONFIG.spawnIntervalMax);

const characterImage = new Image();
let characterReady = false;
characterImage.src = CONFIG.characterSprite;
characterImage.onload = () => {
  characterReady = true;
};
characterImage.onerror = () => {
  characterReady = false;
  console.warn("キャラクター画像が読み込めませんでした。assets/character.png を配置してください。");
};

const obstacleImage = new Image();
let obstacleReady = false;
obstacleImage.src = CONFIG.obstacleSprite;
obstacleImage.onload = () => {
  obstacleReady = true;
};
obstacleImage.onerror = () => {
  obstacleReady = false;
  console.warn("障害物画像が読み込めませんでした。assets/obstacle.png を配置してください。");
};

function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

function resetGame() {
  obstacles = [];
  elapsed = 0;
  isGameOver = false;
  isGameWon = false;
  startTime = performance.now();
  lastFrameTime = null;
  spawnTimer = 0;
  nextSpawnIn = randomRange(CONFIG.spawnIntervalMin, CONFIG.spawnIntervalMax);
  character.y = floorY - character.height;
  character.velocityY = 0;
  character.grounded = true;
  updateStatusText();
}

function updateStatusText() {
  if (isGameWon) {
    statusText.textContent = "CLEAR! おめでとうございます";
    return;
  }
  if (isGameOver) {
    statusText.textContent = "GAME OVER... Rキーでリスタート";
    return;
  }
  const remaining = Math.max(0, CONFIG.survivalSeconds - elapsed);
  statusText.textContent = `残り時間: ${remaining.toFixed(1)}s`;
}

function spawnObstacle() {
  const height = randomRange(60, 150);
  const width = randomRange(40, 90);
  obstacles.push({
    x: canvas.width + width,
    y: floorY - height,
    width,
    height,
  });
}

function update(deltaTime) {
  if (isGameOver) {
    return;
  }

  elapsed = (performance.now() - startTime) / 1000;
  if (elapsed >= CONFIG.survivalSeconds) {
    isGameWon = true;
    isGameOver = true;
    updateStatusText();
    return;
  }

  // Character physics
  character.velocityY += CONFIG.gravity * deltaTime;
  character.y += character.velocityY * deltaTime;

  if (character.y + character.height >= floorY) {
    character.y = floorY - character.height;
    character.velocityY = 0;
    character.grounded = true;
  } else {
    character.grounded = false;
  }

  // Obstacles
  spawnTimer += deltaTime;
  if (spawnTimer >= nextSpawnIn) {
    spawnObstacle();
    spawnTimer = 0;
    nextSpawnIn = randomRange(CONFIG.spawnIntervalMin, CONFIG.spawnIntervalMax);
  }

  obstacles = obstacles.filter((obstacle) => obstacle.x + obstacle.width > 0);
  obstacles.forEach((obstacle) => {
    obstacle.x -= CONFIG.baseSpeed * deltaTime;
    if (checkCollision(character, obstacle)) {
      isGameOver = true;
      updateStatusText();
    }
  });

  updateStatusText();
}

function checkCollision(rectA, rectB) {
  return !(
    rectA.x + rectA.width < rectB.x ||
    rectA.x > rectB.x + rectB.width ||
    rectA.y + rectA.height < rectB.y ||
    rectA.y > rectB.y + rectB.height
  );
}

function draw() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  drawGround();
  drawCharacter();
  drawObstacles();
  drawOverlayText();
}

function drawBackground() {
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#9be2fe");
  gradient.addColorStop(0.6, "#67d5bf");
  gradient.addColorStop(1, "#5b8c5a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function drawGround() {
  context.fillStyle = "#3a5a40";
  context.fillRect(0, floorY, canvas.width, CONFIG.groundHeight);
  context.fillStyle = "rgba(0, 0, 0, 0.12)";
  for (let i = 0; i < canvas.width; i += 32) {
    context.fillRect(i, floorY - 4, 16, 4);
  }
}

function drawCharacter() {
  if (characterReady) {
    context.drawImage(
      characterImage,
      character.x,
      character.y,
      character.width,
      character.height
    );
  } else {
    context.fillStyle = "#ffb703";
    context.fillRect(character.x, character.y, character.width, character.height);
  }
}

function drawObstacles() {
  obstacles.forEach((obstacle) => {
    if (obstacleReady) {
      context.drawImage(
        obstacleImage,
        obstacle.x,
        obstacle.y,
        obstacle.width,
        obstacle.height
      );
    } else {
      context.fillStyle = "#1d3557";
      context.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }
  });
}

function drawOverlayText() {
  context.save();
  context.fillStyle = "rgba(0, 0, 0, 0.3)";
  context.fillRect(0, 0, 240, 48);
  context.fillStyle = "#f1faee";
  context.font = "20px 'Segoe UI', sans-serif";
  context.fillText(`生存時間: ${elapsed.toFixed(1)}s`, 18, 30);

  if (isGameOver) {
    context.fillStyle = "rgba(0, 0, 0, 0.55)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#ffffff";
    context.font = "bold 40px 'Segoe UI', sans-serif";
    const message = isGameWon ? "CLEAR!" : "GAME OVER";
    const subMessage = isGameWon
      ? "お疲れさまでした！Rキーで再挑戦"
      : "Rキーでリスタート";
    const mainWidth = context.measureText(message).width;
    context.fillText(message, (canvas.width - mainWidth) / 2, canvas.height / 2 - 10);
    context.font = "24px 'Segoe UI', sans-serif";
    const subWidth = context.measureText(subMessage).width;
    context.fillText(subMessage, (canvas.width - subWidth) / 2, canvas.height / 2 + 32);
  }

  context.restore();
}

function tryJump() {
  if (isGameOver) {
    return;
  }
  if (character.grounded) {
    character.velocityY = CONFIG.jumpVelocity;
    character.grounded = false;
  }
}

function handleKeyDown(event) {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    tryJump();
  }
  if (event.code === "KeyR") {
    event.preventDefault();
    resetGame();
  }
}

document.addEventListener("keydown", handleKeyDown, { passive: false });

document.addEventListener(
  "touchstart",
  (event) => {
    event.preventDefault();
    if (isGameOver) {
      resetGame();
    } else {
      tryJump();
    }
  },
  { passive: false }
);

function gameLoop(timestamp) {
  if (!lastFrameTime) {
    lastFrameTime = timestamp;
  }
  const deltaTime = (timestamp - lastFrameTime) / 1000;
  lastFrameTime = timestamp;

  update(deltaTime);
  draw();

  requestAnimationFrame(gameLoop);
}

resetGame();
requestAnimationFrame(gameLoop);
