const root = document.getElementById('mascot');
const svg = document.getElementById('mascot-svg');
const lids = document.getElementById('mascot-lids');
const eyeL = document.getElementById('mascot-eye-l');
const eyeR = document.getElementById('mascot-eye-r');
const bubble = document.getElementById('mascot-bubble');

if (!root || !svg || !lids || !eyeL || !eyeR || !bubble) {
  throw new Error('mascot: missing nodes');
}

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function blink() {
  if (reduce) return;
  lids!.setAttribute('opacity', '1');
  eyeL!.setAttribute('opacity', '0');
  eyeR!.setAttribute('opacity', '0');
  setTimeout(() => {
    lids!.setAttribute('opacity', '0');
    eyeL!.setAttribute('opacity', '1');
    eyeR!.setAttribute('opacity', '1');
  }, 140);
}
if (!reduce) setInterval(blink, 8000);

function lookLeft() {
  if (reduce) return;
  eyeL!.setAttribute('cx', '36');
  eyeR!.setAttribute('cx', '60');
  setTimeout(() => {
    eyeL!.setAttribute('cx', '38');
    eyeR!.setAttribute('cx', '62');
  }, 600);
}

function coverEyes() {
  if (reduce) return;
  lids!.setAttribute('opacity', '1');
  eyeL!.setAttribute('opacity', '0');
  eyeR!.setAttribute('opacity', '0');
  setTimeout(() => {
    lids!.setAttribute('opacity', '0');
    eyeL!.setAttribute('opacity', '1');
    eyeR!.setAttribute('opacity', '1');
  }, 600);
}

function hop() {
  if (reduce) return;
  root!.classList.add('hop');
  setTimeout(() => root!.classList.remove('hop'), 280);
}

function showBubble(text: string, ms = 1500) {
  bubble!.textContent = text;
  bubble!.style.opacity = '1';
  setTimeout(() => { bubble!.style.opacity = '0'; }, ms);
}

function popHeart() {
  const heart = document.createElement('div');
  heart.textContent = '\u2665';
  heart.style.cssText =
    'position:absolute;top:-12px;left:50%;transform:translateX(-50%);' +
    'color:#d97757;font-size:18px;opacity:1;transition:all 1s ease-out;';
  root!.appendChild(heart);
  requestAnimationFrame(() => {
    heart.style.opacity = '0';
    heart.style.transform = 'translate(-50%,-20px)';
  });
  setTimeout(() => heart.remove(), 1100);
}

window.addEventListener('terminal:type', lookLeft);
window.addEventListener('terminal:summon', hop);
window.addEventListener('terminal:unknown', coverEyes);
window.addEventListener('terminal:pet', () => { hop(); popHeart(); });

root.addEventListener('mouseenter', () => showBubble('hi.'));
root.addEventListener('click', () => showBubble('try: pet'));
