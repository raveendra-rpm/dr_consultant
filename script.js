document.addEventListener('DOMContentLoaded', () => {

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const icon = hamburger.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const icon = hamburger.querySelector('i');
                if (icon) icon.classList.replace('fa-times', 'fa-bars');
            });
        });
    }

    // Navbar scroll shrink
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 5px 25px rgba(0,0,0,0.12)';
        } else {
            navbar.style.boxShadow = '0 2px 15px rgba(0,0,0,0.05)';
        }
    });

    // Reveal animations on scroll (new system)
    const revealItems = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const delay = el.style.getPropertyValue('--delay') || '0s';
                setTimeout(() => {
                    el.classList.add('visible');
                }, parseFloat(delay) * 1000);
                revealObserver.unobserve(el);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealItems.forEach(el => revealObserver.observe(el));

    // Animated number counter
    const counters = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-target'), 10);
                const duration = 1800;
                const step = target / (duration / 16);
                let current = 0;
                const timer = setInterval(() => {
                    current += step;
                    if (current >= target) {
                        el.textContent = target.toLocaleString();
                        clearInterval(timer);
                    } else {
                        el.textContent = Math.floor(current).toLocaleString();
                    }
                }, 16);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(c => counterObserver.observe(c));

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if(question) {
            question.addEventListener('click', () => {
                // Close other open items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        otherItem.querySelector('.faq-answer').style.maxHeight = null;
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
                const answer = item.querySelector('.faq-answer');
                if (item.classList.contains('active')) {
                    answer.style.maxHeight = answer.scrollHeight + 40 + "px";
                } else {
                    answer.style.maxHeight = null;
                }
            });
        }
    });

});

// --- BOOKING WIDGET LOGIC ---
const stepLabels = ["Consultation","Date & Time","Your Details","Payment","Confirmed"];
let bookState = { step:1, type:null, price:0, mins:0, date:null, time:null, patient:{type:'new'}, method:null };

const stepperEl = document.getElementById('stepper');
function renderStepper(){
  if (!stepperEl) return;
  stepperEl.innerHTML = '';
  stepLabels.forEach((label,i)=>{
    const n = i+1;
    const div = document.createElement('div');
    div.className = 'step-node' + (n===bookState.step?' active':'') + (n<bookState.step?' done':'');
    div.innerHTML = `<div class="step-circle">${n<bookState.step?'✓':n}</div><div class="step-label">${label}</div>`;
    stepperEl.appendChild(div);
  });
  const fill = document.getElementById('progressFill');
  const txt = document.getElementById('progressText');
  if (fill) fill.style.width = ((bookState.step-1)/4*100)+'%';
  if (txt) txt.textContent = `Step ${bookState.step} of 5 — ${stepLabels[bookState.step-1]}`;
}

function showStep(n){
  document.querySelectorAll('.step-panel').forEach(p=>p.style.display='none');
  const stepEl = document.getElementById('step-'+n);
  if(stepEl) stepEl.style.display='block';
  
  const backBtn = document.getElementById('backBtn');
  if(backBtn) backBtn.style.visibility = (n===1 || n===5) ? 'hidden' : 'visible';
  
  const nextBtn = document.getElementById('nextBtn');
  if(nextBtn){
    if(n===4){ nextBtn.textContent = `Pay ₹${bookState.price} & Confirm`; }
    else if(n===5){ nextBtn.textContent = 'Book Another Consultation'; }
    else { nextBtn.textContent = 'Continue'; }
  }
  
  document.querySelectorAll('.book-widget .error').forEach(e=>e.style.display='none');
  renderStepper();
  if(n===2) buildDatesAndSlots();
  if(n===4) buildSummary();
}

// STEP 1 logic
document.querySelectorAll('.consult-card').forEach(card=>{
  card.addEventListener('click',()=>{
    document.querySelectorAll('.consult-card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
    bookState.type = card.dataset.type;
    bookState.price = parseInt(card.dataset.price);
    bookState.mins = parseInt(card.dataset.mins);
  });
});

// STEP 2 logic
function buildDatesAndSlots(){
  const dateScroll = document.getElementById('dateScroll');
  if(!dateScroll) return;
  dateScroll.innerHTML = '';
  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = new Date();
  for(let i=1;i<=7;i++){
    const d = new Date(today);
    d.setDate(today.getDate()+i);
    const pill = document.createElement('div');
    pill.className = 'date-pill' + (bookState.date===d.toDateString() ? ' selected':'');
    pill.innerHTML = `<div class="d">${days[d.getDay()]}</div><div class="n">${d.getDate()}</div>`;
    pill.addEventListener('click',()=>{
      bookState.date = d.toDateString();
      bookState.time = null;
      buildDatesAndSlots();
    });
    dateScroll.appendChild(pill);
  }
  const slotGrid = document.getElementById('slotGrid');
  if(!slotGrid) return;
  slotGrid.innerHTML = '';
  if(!bookState.date){ slotGrid.innerHTML = '<div class="hint">Select a date to see available slots.</div>'; return; }
  const times = ['10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','4:00 PM','4:30 PM','5:00 PM','5:30 PM'];
  let seed = 0; for(const c of bookState.date) seed += c.charCodeAt(0);
  times.forEach((t,idx)=>{
    const unavailable = (seed+idx) % 4 === 0;
    const slot = document.createElement('div');
    slot.className = 'slot' + (unavailable?' unavailable':'') + (bookState.time===t?' selected':'');
    slot.textContent = t;
    if(!unavailable){
      slot.addEventListener('click',()=>{
        bookState.time = t;
        buildDatesAndSlots();
      });
    }
    slotGrid.appendChild(slot);
  });
}

// STEP 3 logic
document.querySelectorAll('.toggle-opt').forEach(opt=>{
  opt.addEventListener('click',()=>{
    document.querySelectorAll('.toggle-opt').forEach(o=>o.classList.remove('selected'));
    opt.classList.add('selected');
    bookState.patient.type = opt.dataset.val;
  });
});

// STEP 4 logic
document.querySelectorAll('.pay-opt').forEach(opt=>{
  opt.addEventListener('click',()=>{
    document.querySelectorAll('.pay-opt').forEach(o=>o.classList.remove('selected'));
    opt.classList.add('selected');
    bookState.method = opt.dataset.method;
  });
});
function buildSummary(){
  const typeLabel = bookState.type==='quick' ? 'Quick Consult (15 min)' : 'Detailed Consult (30 min)';
  const summaryCard = document.getElementById('summaryCard');
  if(summaryCard){
    summaryCard.innerHTML = `
      <div class="summary-row"><span class="label">Consultation</span><span>${typeLabel}</span></div>
      <div class="summary-row"><span class="label">Date & Time</span><span>${bookState.date}, ${bookState.time}</span></div>
      <div class="summary-row"><span class="label">Patient</span><span>${bookState.patient.name} (${bookState.patient.age} yrs)</span></div>
      <div class="summary-row"><span class="label">Phone</span><span>${bookState.patient.phone}</span></div>
      <div class="summary-row total"><span class="label">Total Payable</span><span>₹${bookState.price}</span></div>
    `;
  }
}

// NAV
const backBtn = document.getElementById('backBtn');
if(backBtn){
  backBtn.addEventListener('click',()=>{
    if(bookState.step>1){ bookState.step--; showStep(bookState.step); }
  });
}

const nextBtn = document.getElementById('nextBtn');
if(nextBtn){
  nextBtn.addEventListener('click',()=>{
    if(bookState.step===1){
      if(!bookState.type){ document.getElementById('err-1').style.display='block'; return; }
      bookState.step=2; showStep(2); return;
    }
    if(bookState.step===2){
      if(!bookState.date || !bookState.time){ document.getElementById('err-2').style.display='block'; return; }
      bookState.step=3; showStep(3); return;
    }
    if(bookState.step===3){
      const name=document.getElementById('pName').value.trim();
      const age=document.getElementById('pAge').value.trim();
      const phone=document.getElementById('pPhone').value.trim();
      const reason=document.getElementById('pReason').value.trim();
      if(!name||!age||!phone||!reason){ document.getElementById('err-3').style.display='block'; return; }
      bookState.patient = {...bookState.patient, name, age, phone, email:document.getElementById('pEmail').value.trim(), reason};
      bookState.step=4; showStep(4); return;
    }
    if(bookState.step===4){
      if(!bookState.method){ document.getElementById('err-4').style.display='block'; return; }
      const btn=document.getElementById('nextBtn');
      btn.disabled=true; btn.textContent='Processing payment...';
      setTimeout(()=>{
        btn.disabled=false;
        const typeLabel = bookState.type==='quick' ? 'Quick Consult (15 min)' : 'Detailed Consult (30 min)';
        document.getElementById('bookingId').textContent = 'DVS-'+Math.random().toString(36).slice(2,8).toUpperCase();
        document.getElementById('confirmSummary').innerHTML = `${typeLabel} • ${bookState.date}, ${bookState.time} • ₹${bookState.price} paid via ${bookState.method.toUpperCase()}`;
        bookState.step=5; showStep(5);
      },1200);
      return;
    }
    if(bookState.step===5){
      // reset
      bookState = { step:1, type:null, price:0, mins:0, date:null, time:null, patient:{type:'new'}, method:null };
      document.querySelectorAll('.consult-card').forEach(c=>c.classList.remove('selected'));
      document.querySelectorAll('.pay-opt').forEach(c=>c.classList.remove('selected'));
      document.querySelectorAll('.toggle-opt').forEach(o=>o.classList.remove('selected'));
      const newToggle = document.querySelector('.toggle-opt[data-val="new"]');
      if(newToggle) newToggle.classList.add('selected');
      document.getElementById('pName').value='';
      document.getElementById('pAge').value='';
      document.getElementById('pPhone').value='';
      document.getElementById('pEmail').value='';
      document.getElementById('pReason').value='';
      showStep(1);
    }
  });
}

// Initialize
if(document.getElementById('step-1')){
  showStep(1);
}
