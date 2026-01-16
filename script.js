/**
 * КАРТАЦИОН - Оптимизированный JavaScript
 * Картация с игровыми элементами и таймером
 */

// ============================================
// Глобальные переменные и состояние
// ============================================

const TRC_ADDRESS = "TJsEwbDVRrjcn2dKw1rMrJYgoxpiCae37N";

window.gameAudioState = {
  timeoutId: null,
  isMusicAllowed: false
};

let map,
  startPlacemark = null,
  currentPlacemark = null,
  currentPolyline = null,
  isFirstClick = true,
  startCoordinates = null,
  lastCoordinates = null,
  totalDistance = 0,
  timerInterval,
  timeLeft = 5 * 60,
  isTimerRunning = false,
  gameEnded = false,
  movementHistory = [],
  effectsEnabled = true,
  snowInterval = null,
  starsInterval = null,
  isBlindMode = false,
  currentQrUrl = null;

const logsPanel = document.querySelector(".logs-panel");

// ============================================
// Утилиты для аудио
// ============================================

function stopMusicCompletely() {
  if (window.gameAudioState.timeoutId) {
    clearTimeout(window.gameAudioState.timeoutId);
    window.gameAudioState.timeoutId = null;
  }
  window.gameAudioState.isMusicAllowed = false;
  const sound = document.getElementById("gameOverSound");
  if (sound) {
    sound.pause();
    sound.currentTime = 0;
  }
}

function scheduleMusicStart() {
  stopMusicCompletely();
  window.gameAudioState.isMusicAllowed = true;

  window.gameAudioState.timeoutId = setTimeout(() => {
    if (window.gameAudioState.isMusicAllowed && typeof timeLeft !== 'undefined' && timeLeft <= 0) {
      const sound = document.getElementById("gameOverSound");
      if (sound) {
        sound.volume = 1.0;
        sound.play().catch(e => console.log("Play error", e));
      }
    }
  }, 20000);
}

// ============================================
// Система логов
// ============================================

function addLog(text) {
  const logsContainer = document.getElementById("logsContainer");
  const now = new Date();
  const h = now.getHours().toString().padStart(2, "0");
  const m = now.getMinutes().toString().padStart(2, "0");
  const s = now.getSeconds().toString().padStart(2, "0");
  const timeString = `${h}:${m}:${s}`;

  const logEntry = document.createElement("div");
  logEntry.className = "log-entry";
  logEntry.innerHTML = `<span class="log-time">${timeString}</span><span class="log-text">${text}</span>`;
  logsContainer.appendChild(logEntry);
  logsContainer.scrollTop = logsContainer.scrollHeight;

  if (logsContainer.children.length > 50) {
    logsContainer.removeChild(logsContainer.firstChild);
  }
}

// ============================================
// Эффекты (звезды и снег)
// ============================================

function toggleEffects(enable) {
  effectsEnabled = enable;
  const snowContainer = document.getElementById("snow-container");
  
  if (enable) {
    snowContainer.style.display = "block";
    startSnowEffect();
  } else {
    snowContainer.style.display = "none";
    stopSnowEffect();
  }

  const garlandContainer = document.querySelector(".garland-container");
  if (garlandContainer) {
    garlandContainer.style.display = enable ? "block" : "none";
  }

  const starsContainer = document.getElementById("stars-container");
  if (enable) {
    starsContainer.style.display = "block";
    startStarsEffect();
  } else {
    starsContainer.style.display = "none";
    stopStarsEffect();
  }
}

function startSnowEffect() {
  if (snowInterval) clearInterval(snowInterval);
  createSnowflake();
  snowInterval = setInterval(createSnowflake, 50);
}

function stopSnowEffect() {
  if (snowInterval) clearInterval(snowInterval);
  snowInterval = null;
  const snowContainer = document.getElementById("snow-container");
  snowContainer.innerHTML = "";
}

function startStarsEffect() {
  if (starsInterval) clearInterval(starsInterval);
  createFallingStar();
  starsInterval = setInterval(createFallingStar, 200);
}

function stopStarsEffect() {
  if (starsInterval) clearInterval(starsInterval);
  starsInterval = null;
  const starsContainer = document.getElementById("stars-container");
  starsContainer.innerHTML = "";
}

function createFallingStar() {
  if (!effectsEnabled) return;
  const container = document.getElementById("stars-container");
  const star = document.createElement("div");
  star.className = "falling-star";
  star.style.left = Math.random() * 100 + "vw";
  star.style.animationDuration = Math.random() * 5 + 5 + "s";
  star.style.animationDelay = Math.random() * 2 + "s";
  const size = Math.random() * 3 + 1;
  star.style.width = size + "px";
  star.style.height = size + "px";
  container.appendChild(star);
  setTimeout(() => {
    if (star.parentNode) star.parentNode.removeChild(star);
  }, 10000);
}

function createSnowflake() {
  if (!effectsEnabled) return;
  const container = document.getElementById("snow-container");
  const snowflake = document.createElement("div");
  snowflake.className = "snowflake";
  const size = Math.random() * 8 + 4;
  snowflake.style.width = size + "px";
  snowflake.style.height = size + "px";
  snowflake.style.left = Math.random() * 100 + "vw";
  const duration = Math.random() * 5 + 8;
  snowflake.style.animationDuration = duration + "s";
  snowflake.style.animationDelay = Math.random() * 5 + "s";
  snowflake.style.boxShadow = "0 0 8px rgba(255, 255, 255, 0.8)";
  container.appendChild(snowflake);
  setTimeout(() => {
    if (snowflake.parentNode) snowflake.parentNode.removeChild(snowflake);
  }, 13000);
}

// ============================================
// Модалка поддержки
// ============================================

const supportModal = document.getElementById("supportModal");
const trcAddressInput = document.getElementById("trcAddress");
const copyStatus = document.getElementById("copyStatus");

function openSupport() {
  trcAddressInput.value = TRC_ADDRESS;
  copyStatus.textContent = "";
  supportModal.style.display = "flex";
  addLog("Открыли поддержку");
  setTimeout(() => {
    trcAddressInput.focus();
    trcAddressInput.select();
  }, 50);
}

function closeSupport() {
  supportModal.style.display = "none";
}

async function copyTRC() {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(TRC_ADDRESS);
    } else {
      trcAddressInput.focus();
      trcAddressInput.select();
      const ok = document.execCommand("copy");
      if (!ok) throw new Error("execCommand copy failed");
    }
    copyStatus.style.color = "#a8e6cf";
    copyStatus.textContent = "Адрес скопирован!";
    addLog("TRC адрес скопирован");
  } catch (e) {
    copyStatus.style.color = "#ff6b6b";
    copyStatus.textContent = "Не удалось скопировать. Выделите адрес и скопируйте вручную.";
    addLog("Ошибка копирования TRC адреса");
  }
}

// ============================================
// Игровая логика - сброс
// ============================================

function resetEverything() {
  if (map) map.geoObjects.removeAll();
  startPlacemark = null;
  currentPlacemark = null;
  currentPolyline = null;
  isFirstClick = true;
  startCoordinates = null;
  lastCoordinates = null;
  totalDistance = 0;
  gameEnded = false;
  movementHistory = [];

  document.getElementById("routeBtn").style.display = "none";
  document.getElementById("totalDistance").innerHTML = "0";
  document.getElementById("currentCoords").textContent = "0.0000, 0.0000";

  document
    .querySelectorAll(".arrow-btn, .timer-btn, input, #cubeBtn, select, .bottom-control-btn")
    .forEach((btn) => {
      btn.disabled = false;
      btn.style.opacity = 1;
    });

  timeLeft = 5 * 60;
  updateTimerDisplay();
  isTimerRunning = false;
  document.getElementById("timerDisplay").textContent = "05:00";
  document.getElementById("startPauseBtn").textContent = "СТАРТ";
  document.getElementById("startPauseBtn").classList.remove("running");
  document.getElementById("coordinatePanel").classList.remove("hidden");
  document.getElementById("gameOver").style.display = "none";
  addLog("Сброс");
}

// ============================================
// Отмена последнего шага
// ============================================

function undoLastStep() {
  if (!movementHistory.length) return;

  const lastMove = movementHistory.pop();
  if (!movementHistory.length) {
    resetEverything();
    return;
  }

  const prevMove = movementHistory[movementHistory.length - 1];
  lastCoordinates = prevMove.coords;

  if (map) map.geoObjects.removeAll();

  if (startCoordinates) {
    startPlacemark = new ymaps.Placemark(
      startCoordinates,
      {},
      { preset: "islands#blueStretchyIcon", iconColor: "0000ff", draggable: false }
    );
    map.geoObjects.add(startPlacemark);

    currentPlacemark = new ymaps.Placemark(
      lastCoordinates,
      {},
      { preset: "islands#greenCircleIcon", draggable: false }
    );
    map.geoObjects.add(currentPlacemark);
  }

  movementHistory.forEach((move, index) => {
    if (index === 0) return;
    const prevCoords = movementHistory[index - 1].coords;
    const polyline = new ymaps.Polyline([prevCoords, move.coords], {}, {
      strokeColor: "8A2BE2",
      strokeWidth: 5,
      strokeOpacity: 0.9
    });
    map.geoObjects.add(polyline);
  });

  updateTotalDistance();
  document.getElementById("currentCoords").textContent =
    `${lastCoordinates[0].toFixed(4)}, ${lastCoordinates[1].toFixed(4)}`;
  map.panTo(lastCoordinates, { duration: 300 });

  addLog(`Отмена: ${lastMove.direction}`);
}

// ============================================
// Кубик
// ============================================

function rollCube() {
  const btn = document.getElementById("cubeBtn");
  btn.classList.remove("rotate-360");
  void btn.offsetWidth;
  btn.classList.add("rotate-360");
  
  const rawRoll = Math.floor(Math.random() * 6 + 1);
  const baseAmount = parseFloat(document.getElementById("donationAmount").value) || 0;
  let finalMultiplier = rawRoll;
  let displayValue = rawRoll;
  let logText = "";
  
  const isMode2 = document.getElementById('cubeModeSwitch') && document.getElementById('cubeModeSwitch').checked;
  
  if (isMode2) {
    if (rawRoll % 2 === 0) {
      finalMultiplier = 2;
      displayValue = `${rawRoll} (x2)`;
      logText = `Кубик (Чёт ${rawRoll}): x2`;
    } else {
      finalMultiplier = 0.5;
      displayValue = `${rawRoll} (/2)`;
      logText = `Кубик (Нечёт ${rawRoll}): /2`;
    }
  } else {
    finalMultiplier = rawRoll;
    displayValue = rawRoll;
    logText = `Кубик: x${rawRoll}`;
  }
  
  const multipliedAmount = Math.floor(baseAmount * finalMultiplier);
  document.getElementById("cubeMultiplier").textContent = displayValue;
  document.getElementById("cubeAmount").textContent = multipliedAmount;
  showBanner("cubeBanner", 6000);
  addLog(`${logText} = ${multipliedAmount}`);
  document.getElementById("donationAmount").value = multipliedAmount;
}

// ============================================
// Яндекс.Карты - инициализация
// ============================================

ymaps.ready(initMap);

function initMap() {
  map = new ymaps.Map("map", {
    center: [55.751244, 37.618423],
    zoom: 12,
    controls: []
  });

  map.events.add("click", function (e) {
    if (isFirstClick) {
      const coords = e.get("coords");
      setStartPoint(coords);
      isFirstClick = false;
      toggleEffects(true);
      addLog("Старт установлен");
      if (!isTimerRunning) startTimer();
      addLog("Игра началась");
    }
  });
}

// ============================================
// Установка стартовой точки
// ============================================

function setStartPoint(coords) {
  if (startPlacemark) map.geoObjects.remove(startPlacemark);
  if (currentPlacemark) map.geoObjects.remove(currentPlacemark);

  startPlacemark = new ymaps.Placemark(coords, {}, {
    preset: "islands#blueStretchyIcon",
    iconColor: "0000ff",
    draggable: false
  });
  currentPlacemark = new ymaps.Placemark(coords, {}, {
    preset: "islands#greenCircleIcon",
    draggable: false
  });

  map.geoObjects.add(startPlacemark);
  map.geoObjects.add(currentPlacemark);

  startCoordinates = coords;
  lastCoordinates = coords;
  movementHistory = [{ direction: "start", amount: 0, distance: 0, coords }];

  document.getElementById("currentCoords").textContent =
    `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
  map.panTo(coords, { duration: 300 });
  updateTotalDistance();
  addLog(`Координаты: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);

  document.getElementById("coordinatePanel").classList.add("hidden");
}

function setStartPointByCoordinates() {
  const coordInput = document.getElementById("coordInput").value.trim();
  if (!coordInput) {
    alert("Введите координаты");
    return;
  }

  let lat, lon;
  const parts = coordInput.split(",");
  if (parts.length === 2) {
    lat = parseFloat(parts[0].replace(",", "."));
    lon = parseFloat(parts[1].replace(",", "."));
  } else {
    alert("Формат: 55.7512, 37.6184");
    return;
  }

  if (isNaN(lat) || isNaN(lon)) {
    alert("Неверные координаты");
    return;
  }
  if (lat < -90 || lat > 90) {
    alert("Широта от -90 до 90");
    return;
  }
  if (lon < -180 || lon > 180) {
    alert("Долгота от -180 до 180");
    return;
  }

  const coords = [lat, lon];
  setStartPoint(coords);
  isFirstClick = false;
  addLog(`Старт вручную: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
}

// ============================================
// Вычисления расстояния
// ============================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function updateTotalDistance() {
  if (!startCoordinates || !lastCoordinates) {
    totalDistance = 0;
    document.getElementById("totalDistance").innerHTML = "0";
    return;
  }
  totalDistance = calculateDistance(
    startCoordinates[0], startCoordinates[1],
    lastCoordinates[0], lastCoordinates[1]
  );
  const totalDistanceKm = (totalDistance / 1000).toFixed(1);
  document.getElementById("totalDistance").innerHTML = totalDistanceKm;
}

// ============================================
// Баннеры сообщений
// ============================================

function showBanner(bannerId, duration = 10000) {
  const banners = document.querySelectorAll(".message-banner");
  banners.forEach((banner) => (banner.style.display = "none"));
  const banner = document.getElementById(bannerId);
  if (!banner) return;
  banner.style.display = "block";
  setTimeout(() => (banner.style.display = "none"), duration);
}

function showStartHintAfterThanks() {
  setTimeout(() => {
    const b = document.getElementById('startHintBanner');
    if (b) {
      b.style.zIndex = '4000';
      b.style.display = 'block';
    }
    showBanner('startHintBanner', 5000);
  }, 80);
}

function openThanksModal() {
  const thanksModal = document.getElementById('thanksModal');
  if (!thanksModal) {
    showStartHintAfterThanks();
    return;
  }
  thanksModal.style.display = 'flex';

  const close = () => {
    thanksModal.style.display = 'none';
    showStartHintAfterThanks();
  };

  const closeBtn = document.getElementById('closeThanksBtn');
  if (closeBtn) closeBtn.addEventListener('click', close, { once: true });

  thanksModal.addEventListener('click', (e) => {
    if (e.target === thanksModal) close();
  }, { once: true });
}

// ============================================
// Отрисовка линии движения
// ============================================

function drawLine(direction) {
  if (!lastCoordinates || !startCoordinates) {
    showBanner("startHintBanner", 3000);
    return;
  }

  const price = parseFloat(document.getElementById("pricePerMeter").value) || 0;
  const donation = parseFloat(document.getElementById("donationAmount").value) || 0;
  if (!price || !donation) {
    alert("Заполните цену и сумму");
    return;
  }

  const distanceMeters = donation / price;
  const latPerMeter = 1 / 111111;
  const lonPerMeter = 1 / (111111 * Math.cos(lastCoordinates[0] * Math.PI / 180));

  let newCoords;
  switch (direction) {
    case "up":
      newCoords = [lastCoordinates[0] + distanceMeters * latPerMeter, lastCoordinates[1]];
      break;
    case "down":
      newCoords = [lastCoordinates[0] - distanceMeters * latPerMeter, lastCoordinates[1]];
      break;
    case "left":
      newCoords = [lastCoordinates[0], lastCoordinates[1] - distanceMeters * lonPerMeter];
      break;
    case "right":
      newCoords = [lastCoordinates[0], lastCoordinates[1] + distanceMeters * lonPerMeter];
      break;
    default:
      return;
  }

  const previousCoords = lastCoordinates;
  lastCoordinates = newCoords;

  currentPolyline = new ymaps.Polyline([previousCoords, newCoords], {
    balloonContent: `${donation}<br>${distanceMeters.toFixed(1)} м`
  }, {
    strokeColor: "8A2BE2",
    strokeWidth: 5,
    strokeOpacity: 0.9
  });
  map.geoObjects.add(currentPolyline);

  if (currentPlacemark) currentPlacemark.geometry.setCoordinates(newCoords);

  const stepDistance = calculateDistance(previousCoords[0], previousCoords[1], newCoords[0], newCoords[1]);
  movementHistory.push({ direction, amount: donation, distance: stepDistance, coords: newCoords });
  updateTotalDistance();

  document.getElementById("currentCoords").textContent =
    `${lastCoordinates[0].toFixed(4)}, ${lastCoordinates[1].toFixed(4)}`;

  map.panTo(lastCoordinates, { duration: 400 });

  let dirText;
  if (direction === "up") dirText = "Вверх";
  else if (direction === "down") dirText = "Вниз";
  else if (direction === "left") dirText = "Влево";
  else dirText = "Вправо";

  addLog(`${dirText}: ${donation} / ${distanceMeters.toFixed(1)} м`);
}

// ============================================
// Таймер
// ============================================

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById("timerDisplay").textContent =
    `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  const timerDisplay = document.getElementById("timerDisplay");
  const timerPanel = document.getElementById("timerPanel");

  if (timeLeft <= 30 && timeLeft > 0) {
    timerDisplay.classList.add("critical");
    timerPanel.classList.add("critical");
  } else {
    timerDisplay.classList.remove("critical");
    timerPanel.classList.remove("critical");
  }
}

function showGameOver() {
  gameEnded = true;
  scheduleMusicStart();

  if (isBlindMode) document.getElementById("classicLabel").click();

  addLog("Игра окончена");
  document.getElementById("routeBtn").style.display = "block";

  const totalDistanceKm = (totalDistance / 1000).toFixed(1);
  addLog(`Дистанция: ${totalDistanceKm} км`);

  setTimeout(() => (document.getElementById("gameOver").style.display = "none"), 5000);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      const hb = document.getElementById("heartbeat");
      if (hb) {
        hb.pause();
        hb.currentTime = 0;
      }
      showGameOver();
    } else {
      timeLeft--;
      updateTimerDisplay();
      const hb = document.getElementById("heartbeat");
      const timerDisplay = document.getElementById("timerDisplay");
      const timerPanel = document.getElementById("timerPanel");
      if (timeLeft <= 30 && timeLeft > 0) {
        timerDisplay.classList.add("critical");
        timerPanel.classList.add("critical");
        if (hb && hb.paused) {
          hb.volume = 1.0;
          hb.play().catch(e => {});
        }
      } else {
        timerDisplay.classList.remove("critical");
        timerPanel.classList.remove("critical");
        if (hb && !hb.paused) {
          hb.pause();
          hb.currentTime = 0;
        }
      }
    }
  }, 1000);

  isTimerRunning = true;
  document.getElementById("startPauseBtn").textContent = "ПАУЗА";
  document.getElementById("startPauseBtn").classList.add("running");
}

function pauseTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  document.getElementById("startPauseBtn").textContent = "СТАРТ";
  document.getElementById("startPauseBtn").classList.remove("running");
  showBanner("pauseBanner", 2000);
  addLog("Пауза");
}

// ============================================
// QR код маршрута
// ============================================

function generateQr(rtt) {
  document.getElementById("routeOptions").style.display = "none";

  const startLat = startCoordinates[0];
  const startLon = startCoordinates[1];
  const endLat = lastCoordinates[0];
  const endLon = lastCoordinates[1];

  const url = `https://yandex.ru/maps/?rtext=${startLat},${startLon}~${endLat},${endLon}&rtt=${rtt}`;
  currentQrUrl = url;

  const qrEl = document.getElementById("qrcode");
  qrEl.innerHTML = "";

  if (typeof QRCode === "undefined") {
    alert("QR библиотека не загрузилась. Проверьте интернет/доступ к cdnjs.");
    addLog("Ошибка: QRCode undefined");
    return;
  }

  const qr = new QRCode(qrEl, {
    text: url,
    width: 220,
    height: 220,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });

  if (qr && typeof qr.makeCode === "function") qr.makeCode(url);

  document.getElementById("qrModal").style.display = "flex";

  let typeText;
  if (rtt === "pd") typeText = "пешком";
  else if (rtt === "bc") typeText = "велосипед";
  else typeText = "авто";
  addLog(`QR создан (${typeText})`);
}

// ============================================
// Слепой режим
// ============================================

function setBlindMode(on) {
  isBlindMode = on;
  const overlay = document.getElementById("mapBlackScreen");
  const classicLabel = document.getElementById("classicLabel");
  const blindLabel = document.getElementById("blindLabel");

  if (on) {
    if (overlay) overlay.classList.add("active");
    if (classicLabel) classicLabel.classList.remove("active");
    if (blindLabel) blindLabel.classList.add("active");
    if (logsPanel) logsPanel.style.display = "none";
  } else {
    if (overlay) overlay.classList.remove("active");
    if (classicLabel) classicLabel.classList.add("active");
    if (blindLabel) blindLabel.classList.remove("active");
    if (logsPanel) logsPanel.style.display = "block";
  }
}

// ============================================
// Камера
// ============================================

function initCamera() {
  const cameraBtn = document.getElementById('cameraBtn');
  const cameraArea = document.getElementById('cameraArea');
  let cameraTimeout;

  cameraTimeout = setTimeout(() => {
    if (cameraBtn && cameraBtn.style.display !== 'none') {
      cameraBtn.classList.add('hidden');
      setTimeout(() => cameraBtn.remove(), 500);
      addLog("Кнопка камеры исчезла (тайм-аут)");
    }
  }, 20000);

  if (cameraBtn) {
    cameraBtn.addEventListener('click', () => {
      clearTimeout(cameraTimeout);
      if (cameraArea) cameraArea.classList.add('active');
      cameraBtn.classList.add('hidden');
      setTimeout(() => cameraBtn.remove(), 300);
      addLog("Камера активирована");
    });
  }
}

// ============================================
// Панель наказания
// ============================================

function initPunishmentPanel() {
  document.addEventListener('DOMContentLoaded', () => {
    const pInput = document.getElementById('punishmentInput');
    const pPanel = document.getElementById('punishmentPanel');

    if (!pInput) return;

    const autoGrow = () => {
      pInput.style.height = 'auto';
      pInput.style.height = pInput.scrollHeight + 'px';
    };

    pInput.addEventListener('input', () => {
      autoGrow();
    });

    pInput.addEventListener('focus', autoGrow);

    const toolbar = pPanel.querySelector('.punishment-toolbar');
    if (toolbar) {
      toolbar.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-cmd]');
        if (!btn) return;
        e.preventDefault();
        document.execCommand(btn.dataset.cmd, false, null);
        pInput.focus();
        autoGrow();
      });

      toolbar.addEventListener('mousedown', (e) => {
        if (e.target.tagName !== 'SELECT' && e.target.tagName !== 'INPUT') {
          e.preventDefault();
        }
      });
    }

    const txtColor = document.getElementById('punishmentTextColor');
    if (txtColor) {
      txtColor.addEventListener('input', (e) => {
        document.execCommand('foreColor', false, e.target.value);
      });
    }

    const bgColor = document.getElementById('punishmentBgColor');
    if (bgColor) {
      bgColor.addEventListener('input', (e) => {
        document.execCommand('hiliteColor', false, e.target.value);
      });
    }

    const fSize = document.getElementById('punishmentFontSize');
    if (fSize) {
      fSize.addEventListener('change', (e) => {
        pInput.focus();
        document.execCommand('fontSize', false, e.target.value);
        autoGrow();
      });
    }

    autoGrow();
  });
}

// ============================================
// Обработчики событий
// ============================================

function initEventListeners() {
  // Эффекты
  document.getElementById("effectsToggle").addEventListener("change", function () {
    toggleEffects(this.checked);
    addLog(this.checked ? "Эффекты включены" : "Эффекты выключены");
  });

  // Обратная связь
  document.getElementById("feedbackBtn").addEventListener("click", () => {
    window.open("https://t.me/kartacion", "_blank");
  });

  // Поддержка
  document.getElementById("supportBtn").addEventListener("click", openSupport);
  document.getElementById("closeSupportBtn").addEventListener("click", closeSupport);
  document.getElementById("copyTrcBtn").addEventListener("click", copyTRC);
  supportModal.addEventListener("click", (e) => {
    if (e.target === supportModal) closeSupport();
  });
  trcAddressInput.addEventListener("click", () => {
    trcAddressInput.focus();
    trcAddressInput.select();
  });

  // Игровые действия
  document.getElementById("resetBtn").addEventListener("click", resetEverything);
  document.getElementById("undoBtn").addEventListener("click", undoLastStep);
  document.getElementById("cubeBtn").addEventListener("click", rollCube);

  // Стрелки
  document.getElementById("arrowUp").addEventListener("click", () => drawLine("up"));
  document.getElementById("arrowDown").addEventListener("click", () => drawLine("down"));
  document.getElementById("arrowLeft").addEventListener("click", () => drawLine("left"));
  document.getElementById("arrowRight").addEventListener("click", () => drawLine("right"));

  // Таймер
  document.getElementById("startPauseBtn").addEventListener("click", function () {
    if (isTimerRunning) pauseTimer();
    else {
      startTimer();
      addLog("Таймер запущен");
    }
  });
  document.getElementById("addMinute").addEventListener("click", function () {
    timeLeft += 60;
    updateTimerDisplay();
    showBanner("plusBanner", 1500);
    addLog("+1 минута");
  });
  document.getElementById("removeMinute").addEventListener("click", function () {
    if (timeLeft > 60) {
      timeLeft -= 60;
      updateTimerDisplay();
      showBanner("minusBanner", 1500);
      addLog("-1 минута");
    } else alert("Нельзя меньше 1 минуты!");
  });

  // Координаты
  document.getElementById("setCoordinatesBtn").addEventListener("click", setStartPointByCoordinates);
  document.getElementById("coordInput").addEventListener("keypress", function (e) {
    if (e.key === "Enter") setStartPointByCoordinates();
  });

  // Маршрут и QR
  document.getElementById("routeBtn").addEventListener("click", () => {
    if (!startCoordinates || !lastCoordinates) {
      alert("Сначала поставьте старт");
      return;
    }
    document.getElementById("routeOptions").style.display = "block";
    addLog("Выбор маршрута / QR");
  });
  document.getElementById("walkBtn").addEventListener("click", () => generateQr("pd"));
  document.getElementById("bikeBtn").addEventListener("click", () => generateQr("bc"));
  document.getElementById("carBtn").addEventListener("click", () => generateQr("auto"));
  document.getElementById("closeQrBtn").addEventListener("click", () => {
    document.getElementById("qrModal").style.display = "none";
  });
  document.getElementById("openBrowserBtn").addEventListener("click", () => {
    if (currentQrUrl) window.open(currentQrUrl, "_blank");
  });

  // Режимы
  document.getElementById("blindModeToggle").addEventListener("change", function () {
    setBlindMode(this.checked);
    addLog(this.checked ? "Слепой режим: ВКЛ" : "Слепой режим: ВЫКЛ");
  });
  document.getElementById("classicLabel").addEventListener("click", function () {
    document.getElementById("blindModeToggle").checked = false;
    setBlindMode(false);
    addLog("Режим: Классический");
  });
  document.getElementById("blindLabel").addEventListener("click", function () {
    document.getElementById("blindModeToggle").checked = true;
    setBlindMode(true);
    addLog("Режим: Слепой");
  });

  // Режим кубика
  const modeSwitch = document.getElementById('cubeModeSwitch');
  if (modeSwitch) {
    modeSwitch.addEventListener('change', function () {
      const label = document.getElementById('cubeModeLabel');
      if (this.checked) {
        label.textContent = "Чёт x2 / Нечёт /2";
      } else {
        label.textContent = "x1 - x6";
      }
    });
  }

  // Инициализация компонентов
  updateTimerDisplay();
  initCamera();
  initPunishmentPanel();
  window.addEventListener('load', openThanksModal);
}

// Инициализация при загрузке
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEventListeners);
} else {
  initEventListeners();
}
