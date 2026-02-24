// app.js
// Plain global JS, no modules.

// -------------------
// Data generator
// -------------------
const TAGS = [
  "Coffee","Hiking","Movies","Live Music","Board Games","Cats","Dogs","Traveler",
  "Foodie","Tech","Art","Runner","Climbing","Books","Yoga","Photography"
];
const FIRST_NAMES = [
  "Alex","Sam","Jordan","Taylor","Casey","Avery","Riley","Morgan","Quinn","Cameron",
  "Jamie","Drew","Parker","Reese","Emerson","Rowan","Shawn","Harper","Skyler","Devon"
];
const CITIES = [
  "Brooklyn","Manhattan","Queens","Jersey City","Hoboken","Astoria",
  "Williamsburg","Bushwick","Harlem","Lower East Side"
];
const JOBS = [
  "Product Designer","Software Engineer","Data Analyst","Barista","Teacher",
  "Photographer","Architect","Chef","Nurse","Marketing Manager","UX Researcher"
];
const BIOS = [
  "Weekend hikes and weekday lattes.",
  "Dog parent. Amateur chef. Karaoke enthusiast.",
  "Trying every taco in the city — for science.",
  "Bookstore browser and movie quote machine.",
  "Gym sometimes, Netflix always.",
  "Looking for the best slice in town.",
  "Will beat you at Mario Kart.",
  "Currently planning the next trip."
];

const UNSPLASH_SEEDS = [
  "1515462277126-2b47b9fa09e6",
  "1520975916090-3105956dac38",
  "1519340241574-2cec6aef0c01",
  "1554151228-14d9def656e4",
  "1548142813-c348350df52b",
  "1517841905240-472988babdf9",
  "1535713875002-d1d0cf377fde",
  "1545996124-0501ebae84d0",
  "1524504388940-b1c1722653e1",
  "1531123897727-8f129e1688ce",
];

function sample(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickTags() { return Array.from(new Set(Array.from({length:4}, ()=>sample(TAGS)))); }
function imgFor(seed) {
  return `https://images.unsplash.com/photo-${seed}?auto=format&fit=crop&w=1200&q=80`;
}

function generateProfiles(count = 12) {
  const profiles = [];
  for (let i = 0; i < count; i++) {
    const numPhotos = 2 + Math.floor(Math.random() * 3); // 2–4 photos
    const seeds = Array.from({ length: numPhotos }, () => sample(UNSPLASH_SEEDS));
    profiles.push({
      id: `p_${i}_${Date.now().toString(36)}`,
      name: sample(FIRST_NAMES),
      age: 18 + Math.floor(Math.random() * 22),
      city: sample(CITIES),
      title: sample(JOBS),
      bio: sample(BIOS),
      tags: pickTags(),
      images: seeds.map(imgFor),
    });
  }
  return profiles;
}

// -------------------
// UI rendering
// -------------------
const deckEl = document.getElementById("deck");
const shuffleBtn = document.getElementById("shuffleBtn");
const likeBtn = document.getElementById("likeBtn");
const nopeBtn = document.getElementById("nopeBtn");
const superLikeBtn = document.getElementById("superLikeBtn");
const galleryOverlay = document.getElementById("galleryOverlay");
const galleryClose = document.getElementById("galleryClose");
const galleryTrack = document.getElementById("galleryTrack");
const galleryDots = document.getElementById("galleryDots");

let profiles = [];
let isAnimating = false;

function renderDeck() {
  deckEl.setAttribute("aria-busy", "true");
  deckEl.innerHTML = "";

  profiles.forEach((p, idx) => {
    const card = document.createElement("article");
    card.className = "card";

    const img = document.createElement("img");
    img.className = "card__media";
    img.src = p.images[0];
    img.alt = `${p.name} — profile photo`;

    const body = document.createElement("div");
    body.className = "card__body";

    const titleRow = document.createElement("div");
    titleRow.className = "title-row";
    titleRow.innerHTML = `
      <h2 class="card__title">${p.name}</h2>
      <span class="card__age">${p.age}</span>
    `;

    const meta = document.createElement("div");
    meta.className = "card__meta";
    meta.textContent = `${p.title} • ${p.city}`;

    const chips = document.createElement("div");
    chips.className = "card__chips";
    p.tags.forEach((t) => {
      const c = document.createElement("span");
      c.className = "chip";
      c.textContent = t;
      chips.appendChild(c);
    });

    body.appendChild(titleRow);
    body.appendChild(meta);
    body.appendChild(chips);

    card.appendChild(img);
    card.appendChild(body);

    deckEl.appendChild(card);
  });

  deckEl.removeAttribute("aria-busy");
}

// -------------------
// Actions (shared by gestures and buttons)
// -------------------
const SWIPE_THRESHOLD = 60;
const EXIT_CLASS = {
  nope: "card--exit-left",
  like: "card--exit-right",
  superlike: "card--exit-up",
};

function getTopCard() {
  return deckEl.firstElementChild;
}

function performAction(action) {
  const card = getTopCard();
  if (!card || isAnimating || !profiles.length) return;

  isAnimating = true;
  const exitClass = EXIT_CLASS[action];
  card.classList.add(exitClass);

  const onEnd = () => {
    card.removeEventListener("transitionend", onEnd);
    profiles.shift();
    card.remove();
    isAnimating = false;
  };

  card.addEventListener("transitionend", onEnd);
  // Fallback if transitionend doesn’t fire (e.g. opacity only)
  setTimeout(() => {
    if (card.parentNode) {
      card.removeEventListener("transitionend", onEnd);
      profiles.shift();
      card.remove();
      isAnimating = false;
    }
  }, 320);
}

// -------------------
// Swipe detection (pointer events)
// -------------------
let pointerId = null;
let startX = 0, startY = 0;
let currentX = 0, currentY = 0;
let pointerDownTime = 0;

function getCardTransform(dx, dy) {
  const rot = Math.sign(dx) * Math.min(Math.abs(dx) / 12, 12);
  return `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
}

function onPointerDown(e) {
  if (isAnimating) return;
  const card = getTopCard();
  if (!card || e.target.closest(".gallery-overlay")) return;

  pointerId = e.pointerId;
  startX = e.clientX;
  startY = e.clientY;
  currentX = 0;
  currentY = 0;
  pointerDownTime = Date.now();
  card.classList.add("card--dragging");
  card.style.transform = getCardTransform(0, 0);

  deckEl.setPointerCapture(pointerId);
  deckEl.addEventListener("pointermove", onPointerMove);
  deckEl.addEventListener("pointerup", onPointerUp, { once: true });
  deckEl.addEventListener("pointercancel", onPointerUp, { once: true });
}

function onPointerMove(e) {
  if (e.pointerId !== pointerId) return;
  const card = getTopCard();
  if (!card) return;

  currentX = e.clientX - startX;
  currentY = e.clientY - startY;
  card.style.transform = getCardTransform(currentX, currentY);
}

const TAP_MOVE_THRESHOLD = 15;
const TAP_MAX_DURATION_MS = 250;
const DOUBLE_TAP_MS = 400;
let lastTapTime = 0;

function onPointerUp(e) {
  if (e.pointerId !== pointerId) return;
  deckEl.releasePointerCapture(pointerId);
  deckEl.removeEventListener("pointermove", onPointerMove);

  const card = getTopCard();
  if (!card) return;

  card.classList.remove("card--dragging");
  card.style.transform = "";

  const dx = currentX;
  const dy = currentY;

  if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) >= Math.abs(dy)) {
    performAction(dx < 0 ? "nope" : "like");
    lastTapTime = 0;
    return;
  }
  if (dy <= -SWIPE_THRESHOLD) {
    performAction("superlike");
    lastTapTime = 0;
    return;
  }

  // Tap (minimal movement, short duration) → double-tap check
  const duration = Date.now() - pointerDownTime;
  const moved = Math.abs(dx) > TAP_MOVE_THRESHOLD || Math.abs(dy) > TAP_MOVE_THRESHOLD;
  if (!moved && duration < TAP_MAX_DURATION_MS) {
    const now = Date.now();
    if (lastTapTime > 0 && now - lastTapTime <= DOUBLE_TAP_MS && profiles.length) {
      lastTapTime = 0;
      openGallery(profiles[0]);
      return;
    }
    lastTapTime = now;
  }
}

deckEl.addEventListener("pointerdown", onPointerDown, { passive: true });

// -------------------
// Double-tap: open photo gallery (also on double-click for desktop)
// -------------------

function openGallery(profile) {
  if (!profile || !profile.images || !profile.images.length) return;
  galleryTrack.innerHTML = "";
  galleryDots.innerHTML = "";
  profile.images.forEach((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = `${profile.name} — photo ${i + 1}`;
    galleryTrack.appendChild(img);

    const dot = document.createElement("button");
    dot.className = "gallery__dot" + (i === 0 ? " gallery__dot--active" : "");
    dot.type = "button";
    dot.setAttribute("aria-label", `Photo ${i + 1}`);
    dot.addEventListener("click", () => {
      galleryTrack.scrollTo({ left: galleryTrack.clientWidth * i, behavior: "smooth" });
    });
    galleryDots.appendChild(dot);
  });

  galleryTrack.addEventListener("scroll", () => {
    const index = Math.round(galleryTrack.scrollLeft / galleryTrack.clientWidth);
    galleryDots.querySelectorAll(".gallery__dot").forEach((d, i) => {
      d.classList.toggle("gallery__dot--active", i === index);
    });
  }, { passive: true });

  galleryOverlay.hidden = false;
  galleryOverlay.focus();
}

function closeGallery() {
  galleryOverlay.hidden = true;
}

galleryClose.addEventListener("click", closeGallery);
galleryOverlay.addEventListener("click", (e) => {
  if (e.target === galleryOverlay) closeGallery();
});
galleryOverlay.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeGallery();
});

// -------------------
// Bottom buttons (same behavior as gestures)
// -------------------
likeBtn.addEventListener("click", () => performAction("like"));
nopeBtn.addEventListener("click", () => performAction("nope"));
superLikeBtn.addEventListener("click", () => performAction("superlike"));
shuffleBtn.addEventListener("click", resetDeck);

function resetDeck() {
  profiles = generateProfiles(12);
  renderDeck();
}

// Boot
resetDeck();
