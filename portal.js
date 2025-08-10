
const TOTAL_SLIDES = 13;

function setCompleted(id){ try{ localStorage.setItem('class_'+id+'_completed','1'); }catch(e){} }
function isCompleted(id){ try{ return localStorage.getItem('class_'+id+'_completed')==='1'; }catch(e){return false;} }
function setLastSlide(id, idx){ try{ const p=parseInt(localStorage.getItem('class_'+id+'_lastSlide')||'-1',10); if(idx>p) localStorage.setItem('class_'+id+'_lastSlide',''+idx);}catch(e){} }
function getLastSlide(id){ try{ return parseInt(localStorage.getItem('class_'+id+'_lastSlide')||'-1',10);}catch(e){return -1;} }
function classProgress(id){ if(isCompleted(id)) return 100; const last=getLastSlide(id); const visited=Math.max(0,last+1); const pct=Math.round((visited/TOTAL_SLIDES)*100); return Math.min(99,pct); }

function hydrateDashboard(){ for(let i=1;i<=12;i++){ const bar=document.getElementById('bar_'+i); const pctL=document.getElementById('pct_'+i); const done=document.getElementById('done_'+i); const pct=classProgress(i); if(bar) bar.style.width=pct+'%'; if(pctL) pctL.textContent=pct+'%'; if(done) done.textContent=isCompleted(i)?'✅ Completed':'In progress'; } }

function shuffleArray(a){ const b=a.slice(); for(let i=b.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]];} return b; }

function renderQuizInto(node, quizData, passCallback, classId){
  const container=document.createElement('div'); container.className='slide';
  container.innerHTML=`
    <h2>Knowledge Check (10 Questions)</h2>
    <span class="pill">Pass: 9/10 (you may miss 1)</span>
    <span class="pill">Name & Store required</span>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0 6px;">
      <div><label class="label">Your Name</label><input id="learner_name" class="input" placeholder="Full Name"/></div>
      <div><label class="label">Store Number</label><input id="store_number" class="input" placeholder="e.g., 632-0101"/></div>
    </div>`;
  const qForm=document.createElement('form'); qForm.id='quiz_form';
  quizData.forEach((q,idx)=>{ const [question,options]=q; const block=document.createElement('div'); block.className='quiz-question'; const shuffled=shuffleArray(options);
    block.innerHTML=`<div><strong>Q${idx+1}.</strong> ${question}</div>`; const opts=document.createElement('div'); opts.className='quiz-options';
    shuffled.forEach((opt)=>{ const label=document.createElement('label'); label.innerHTML=`<input type="radio" name="q${idx}" value="${opt.replace(/"/g,'&quot;')}" /> ${opt}`; opts.appendChild(label); });
    block.appendChild(opts); qForm.appendChild(block); const hr=document.createElement('div'); hr.className='hr'; qForm.appendChild(hr);
  });
  const actions=document.createElement('div'); actions.className='quiz-actions';
  const submit=document.createElement('button'); submit.type='submit'; submit.className='btn'; submit.textContent='Submit Quiz';
  const reset=document.createElement('button'); reset.type='button'; reset.className='btn btn-outline'; reset.textContent='Clear'; reset.onclick=()=>qForm.reset();
  actions.appendChild(submit); actions.appendChild(reset); qForm.appendChild(actions); container.appendChild(qForm);
  const result=document.createElement('div'); result.className='slide';
  qForm.addEventListener('submit',(e)=>{
    e.preventDefault();
    const name=document.getElementById('learner_name').value.trim(); const store=document.getElementById('store_number').value.trim();
    if(!name||!store){ alert('Please enter your name and store number.'); return; }
    let correct=0; quizData.forEach((q,idx)=>{ const radios=qForm.querySelectorAll(`input[name="q${idx}"]`); let sel=null; radios.forEach(r=>{ if(r.checked) sel=r.value; }); const answer=q[1][0]; if(sel===answer) correct+=1; });
    const score=Math.round((correct/quizData.length)*100); const passed=(correct>=9);
    result.innerHTML=`<h2>Results</h2><p><strong>Score:</strong> ${score}% (${correct}/${quizData.length})</p><p>${passed?"✅ Great job! You passed.":"❌ You did not pass. Review and try again."}</p>`;
    if(passed){ if(classId){ setCompleted(classId); setLastSlide(classId, TOTAL_SLIDES-1); } const cert=document.createElement('div'); cert.className='certificate'; const today=new Date().toLocaleDateString();
      cert.innerHTML=`<h1>Certificate of Completion</h1><div class="subtitle">Awarded for successful completion (score ≥ 90%).</div>
      <div class="cert-grid"><div class="cert-field"><strong>Name:</strong> ${name}</div><div class="cert-field"><strong>Store #:</strong> ${store}</div><div class="cert-field"><strong>Course:</strong> ${document.title}</div><div class="cert-field"><strong>Date:</strong> ${today}</div></div>
      <div class="print-note">Tip: Use Print to save as PDF.</div>
      <div style="margin-top:12px;"><button class="btn btn-secondary" onclick="window.print()">Print / Save PDF</button><a href="index.html" class="btn" style="margin-left:8px;">Back to Dashboard</a></div>`;
      result.appendChild(cert);
      if(typeof passCallback==='function'){ passCallback({name,store,score}); }
    } else {
      const review=document.createElement('div'); review.className='print-note'; review.textContent='Review the slides above and retake the quiz when ready.'; result.appendChild(review);
    }
  });
  node.appendChild(container); node.appendChild(result);
}

function renderClass(slides, quizData, classId){
  const sidebar = document.getElementById('slide_list');
  const root = document.getElementById('lesson_root');
  const progress = document.getElementById('top_prog');
  const counter = document.getElementById('slide_counter');
  const prevBtn = document.getElementById('prev_btn');
  const nextBtn = document.getElementById('next_btn');
  const deck = document.getElementById('slide_host');

  // build sidebar
  slides.forEach((s, i)=>{
    const li=document.createElement('li'); li.innerHTML=`<span>•</span><span>${i+1}. ${s.h}</span>`;
    li.addEventListener('click', ()=>{ idx=i; update(); });
    sidebar.appendChild(li);
  });

  let idx = Math.max(0, getLastSlide(classId)+1); if(isNaN(idx)||idx<0||idx>12) idx=0;

  function highlightList(){
    const items = sidebar.querySelectorAll('li');
    items.forEach((el, i)=>{
      el.classList.toggle('active', i===idx);
    });
  }

  function update(){
    // progress + counter
    const pct = Math.round(((Math.min(idx,12))/12)*95);
    progress.style.width = (idx>=12 ? '100%' : pct+'%');
    counter.textContent = (idx<12) ? `Slide ${idx+1} of 13` : 'Slide 13 of 13 — Quiz';

    prevBtn.disabled = (idx===0);
    nextBtn.disabled = (idx>=12);

    // content
    deck.innerHTML='';
    if(idx<12){
      const s=slides[idx];
      const node=document.createElement('div'); node.className='slide'; node.innerHTML=`<h2>${idx+1}. ${s.h}</h2>${s.body}`;
      deck.appendChild(node);
      setLastSlide(classId, idx);
    } else {
      renderQuizInto(deck, quizData, function(){}, classId);
    }

    highlightList();
  }

  prevBtn.addEventListener('click', ()=>{ if(idx>0){ idx--; update(); } });
  nextBtn.addEventListener('click', ()=>{ if(idx<12){ idx++; update(); } });

  // keyboard arrows
  document.addEventListener('keydown', (e)=>{
    if(e.key==='ArrowRight' && idx<12){ idx++; update(); }
    if(e.key==='ArrowLeft'  && idx>0 ){ idx--; update(); }
  });

  update();
}

function googleTranslateElementInit(){ new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:'en,es',autoDisplay:false},'google_translate_element'); }
function setLang(lang){ function attempt(n){ const combo=document.querySelector('.goog-te-combo'); if(combo){ combo.value=lang; combo.dispatchEvent(new Event('change')); } else if(n>0){ setTimeout(()=>attempt(n-1),200);} } attempt(20); }
function initLangToggle(){ const btn=document.getElementById('lang_toggle'); if(!btn) return; let current='en'; btn.addEventListener('click',()=>{ current=(current==='en')?'es':'en'; setLang(current); btn.textContent=(current==='en')?'🌐 Español':'🌐 English'; }); }

window.addEventListener('DOMContentLoaded',()=>{ initLangToggle(); hydrateDashboard(); });
