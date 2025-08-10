
// Shared portal logic: progress tracking, quiz helpers, translation toggle, certificates

// ---- Progress helpers ----
function setCompleted(id) {
  try {
    localStorage.setItem('class_' + id + '_completed', '1');
  } catch (e) {}
}
function isCompleted(id) {
  try {
    return localStorage.getItem('class_' + id + '_completed') === '1';
  } catch (e) { return false; }
}
function allClassesCompleted() {
  for (let i = 1; i <= 12; i++) {
    if (!isCompleted(i)) return false;
  }
  return true;
}

// ---- Quiz helpers ----
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function renderQuiz(containerId, quizData, passCallback, classId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // capture name & store
  const capture = document.createElement('div');
  capture.innerHTML = `
    <div class="slide">
      <h2>Before you start</h2>
      <label class="label">Your Name</label>
      <input id="learner_name" class="input" placeholder="Full Name"/>
      <label class="label" style="margin-top:8px;">Store Number</label>
      <input id="store_number" class="input" placeholder="e.g., 632‑0101"/>
      <div class="print-note">We’ll print these on your certificate.</div>
    </div>
  `;
  container.appendChild(capture);

  // build randomized quiz (answers will be shuffled per render)
  const quizWrap = document.createElement('div');
  quizWrap.className = 'slide';
  quizWrap.innerHTML = `<h2>Knowledge Check (10 Questions)</h2>`;

  const qForm = document.createElement('form');
  qForm.id = "quiz_form";
  quizData.forEach((q, idx) => {
    const [question, options] = q;
    const shuffled = shuffleArray(options);
    const qBlock = document.createElement('div');
    qBlock.className = 'quiz-question';
    qBlock.innerHTML = `<div><strong>Q${idx+1}.</strong> ${question}</div>`;

    const optsWrap = document.createElement('div');
    optsWrap.className = 'quiz-options';

    shuffled.forEach((opt, oi) => {
      const id = `q${idx}_o${oi}`;
      const label = document.createElement('label');
      label.innerHTML = `<input type="radio" name="q${idx}" value="${opt.replace(/"/g,'&quot;')}" /> ${opt}`;
      optsWrap.appendChild(label);
    });

    qBlock.appendChild(optsWrap);
    qForm.appendChild(qBlock);
    const hr = document.createElement('div'); hr.className = 'hr'; qForm.appendChild(hr);
  });

  const actions = document.createElement('div');
  actions.className = 'quiz-actions';
  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.className = 'btn';
  submitBtn.textContent = 'Submit Quiz';
  actions.appendChild(submitBtn);

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'btn btn-outline';
  resetBtn.textContent = 'Clear Answers';
  resetBtn.onclick = () => {
    qForm.reset();
  };
  actions.appendChild(resetBtn);

  qForm.appendChild(actions);
  quizWrap.appendChild(qForm);
  container.appendChild(quizWrap);

  const resultSlide = document.createElement('div');
  resultSlide.className = 'slide';
  container.appendChild(resultSlide);

  qForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // validate name/store
    const name = document.getElementById('learner_name').value.trim();
    const store = document.getElementById('store_number').value.trim();
    if (!name || !store) {
      alert('Please enter your name and store number before submitting.');
      return;
    }
    // grade
    let correct = 0;
    quizData.forEach((q, idx) => {
      const [question, options] = q;
      const radios = qForm.querySelectorAll(`input[name="q${idx}"]`);
      let selected = null;
      radios.forEach(r => { if (r.checked) selected = r.value; });
      const correctAnswer = options[0]; // the first one in quizData is correct (order shuffled in UI)
      if (selected === correctAnswer) correct += 1;
    });

    const score = Math.round((correct / quizData.length) * 100);
    const passed = score >= 90;

    resultSlide.innerHTML = `
      <h2>Results</h2>
      <p><strong>Score:</strong> ${score}% (${correct}/${quizData.length})</p>
      <p>${passed ? "✅ Great job! You passed." : "❌ You did not pass. Please review the material and try again."}</p>
    `;

    if (passed) {
      // mark completed and show certificate
      if (classId) setCompleted(classId);
      const cert = document.createElement('div');
      cert.className = 'certificate';
      const today = new Date().toLocaleDateString();
      cert.innerHTML = `
        <h1>Certificate of Completion</h1>
        <div class="subtitle">Awarded for successful completion of this course with a score of 90% or higher.</div>
        <div class="cert-grid">
          <div class="cert-field"><strong>Name:</strong> ${name}</div>
          <div class="cert-field"><strong>Store #:</strong> ${store}</div>
          <div class="cert-field"><strong>Course:</strong> ${document.title}</div>
          <div class="cert-field"><strong>Date:</strong> ${today}</div>
        </div>
        <div class="print-note">Tip: Use your browser’s Print dialog to save as PDF.</div>
        <div style="margin-top:12px;">
          <button class="btn btn-secondary" onclick="window.print()">Print / Save PDF</button>
        </div>
      `;
      resultSlide.appendChild(cert);
      if (typeof passCallback === 'function') passCallback({name, store, score});
    } else {
      const review = document.createElement('div');
      review.className = 'print-note';
      review.textContent = "Review the slides above and retake the quiz when ready.";
      resultSlide.appendChild(review);
    }
  });
}

// ---- Google Translate (works when hosted online) ----
function googleTranslateElementInit() {
  new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'en,es', autoDisplay: false}, 'google_translate_element');
}

function setLang(lang) {
  // Drive the hidden Google combo to change language.
  const tries = 20;
  function attempt(n) {
    const combo = document.querySelector('.goog-te-combo');
    if (combo) {
      combo.value = lang;
      combo.dispatchEvent(new Event('change'));
    } else if (n > 0) {
      setTimeout(() => attempt(n-1), 200);
    }
  }
  attempt(tries);
}

function initLangToggle() {
  const btn = document.getElementById('lang_toggle');
  if (!btn) return;
  let current = 'en';
  btn.addEventListener('click', () => {
    current = (current === 'en') ? 'es' : 'en';
    setLang(current);
    btn.textContent = current === 'en' ? '🌐 Español' : '🌐 English';
  });
}

// Initialize common features on page load
window.addEventListener('DOMContentLoaded', () => {
  initLangToggle();
  // Update dashboard progress if present
  const progressBar = document.getElementById('overall_progress');
  const completedCountEl = document.getElementById('completed_count');
  if (progressBar || completedCountEl) {
    let done = 0;
    for (let i=1;i<=12;i++){ if(isCompleted(i)) done++; }
    const pct = Math.round((done/12)*100);
    if (progressBar) progressBar.style.width = pct + '%';
    if (completedCountEl) completedCountEl.textContent = done + " / 12 completed";
    // Final exam lock tile
    const finalTile = document.getElementById('final_tile');
    const finalLock = document.getElementById('final_lock');
    if (finalTile && finalLock) {
      if (allClassesCompleted()) {
        finalLock.style.display = 'none';
        finalTile.classList.remove('meta');
        finalTile.innerHTML = '✅ Unlocked — Take Final Exam';
      } else {
        finalLock.style.display = 'block';
        finalTile.innerHTML = '🔒 Complete all 12 classes to unlock';
      }
    }
  }
});
