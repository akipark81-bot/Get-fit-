
// Simple local storage helpers
const store = {
  get(key, fallback){ try{ return JSON.parse(localStorage.getItem(key)) ?? fallback }catch(e){ return fallback } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)) }
};

const state = {
  checkins: store.get('checkins', {}), // { 'YYYY-MM-DD': {type} }
  coins: store.get('coins', 0),
  outfit: store.get('outfit', 1),
  name: store.get('name', ''),
  weeklyGoal: store.get('weeklyGoal', 4),
};

const $ = sel => document.querySelector(sel);
const $$ = sel => [...document.querySelectorAll(sel)];

function todayKey(d=new Date()){
  const tzOffset = d.getTimezoneOffset() * 60000;
  const localISO = new Date(d - tzOffset).toISOString().slice(0,10);
  return localISO;
}

function updateStats(){
  // streak
  let streak = 0;
  const oneDay = 86400000;
  for(let i=0;;i++){
    const d = new Date(Date.now() - i*oneDay);
    const k = todayKey(d);
    if(state.checkins[k]) streak++;
    else break;
  }
  $('#streakValue').textContent = streak;

  // coins and days
  $('#coinsValue').textContent = state.coins;
  $('#daysValue').textContent = Object.keys(state.checkins).length;

  // last checkin hint
  const k = todayKey();
  if(state.checkins[k]){
    $('#lastCheckinHint').textContent = 'סומן היום ✔️ (' + state.checkins[k].typeText + ')';
  } else {
    $('#lastCheckinHint').textContent = 'לא סומן היום';
  }
}

function renderCalendar(){
  const grid = $('#calendarGrid');
  grid.innerHTML = '';
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const first = new Date(year, month, 1);
  const startDay = first.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month+1, 0).getDate();

  // add blanks for startDay (assuming Sunday-first for RTL)
  for(let i=0;i<startDay;i++){
    const cell = document.createElement('div');
    cell.className = 'cell';
    grid.appendChild(cell);
  }
  for(let day=1; day<=daysInMonth; day++){
    const cell = document.createElement('div');
    const k = todayKey(new Date(year, month, day));
    cell.className = 'cell' + (state.checkins[k] ? ' done' : '');
    cell.textContent = day;
    grid.appendChild(cell);
  }
}

function selectWorkout(typeBtn){
  $$('.workout-types .pill').forEach(b=>b.classList.remove('selected'));
  typeBtn.classList.add('selected');
}

function currentType(){
  const el = $('.workout-types .pill.selected');
  return { 
    key: el.dataset.type,
    typeText: el.textContent.trim()
  };
}

function checkinToday(){
  const k = todayKey();
  if(!state.checkins[k]){
    const type = currentType();
    state.checkins[k] = { type: type.key, typeText: type.typeText };
    state.coins += 5; // reward
    store.set('checkins', state.checkins);
    store.set('coins', state.coins);
    confetti();
    updateStats();
    renderCalendar();
  }
}

function confetti(){
  // tiny emoji confetti
  const burst = document.createElement('div');
  burst.style.position='fixed';
  burst.style.inset='0';
  burst.style.pointerEvents='none';
  document.body.appendChild(burst);
  const emojis = ['✨','🌸','⭐','💖','🧁'];
  for(let i=0;i<30;i++){
    const span = document.createElement('span');
    span.textContent = emojis[Math.floor(Math.random()*emojis.length)];
    span.style.position='absolute';
    span.style.left = Math.random()*100+'%';
    span.style.top = '-10%';
    span.style.fontSize = (16 + Math.random()*16)+'px';
    span.style.transition = 'transform 1.6s ease, opacity 1.6s ease';
    burst.appendChild(span);
    requestAnimationFrame(()=>{
      span.style.transform = `translateY(${110+Math.random()*20}vh) rotate(${(Math.random()*200-100)}deg)`;
      span.style.opacity = 0;
    });
  }
  setTimeout(()=>burst.remove(),1700);
}

function applyOutfit(n){
  state.outfit = n;
  store.set('outfit', n);
  $('#outfitLayer').src = `assets/outfit_${n}.svg`;
}

function initCloset(){
  $('#btnCloset').addEventListener('click', ()=>$('#closetDialog').showModal());
  $('#closetDialog').addEventListener('click', (e)=>{
    const btn = e.target.closest('.closet-item');
    if(!btn) return;
    const n = parseInt(btn.dataset.outfit,10);
    const price = parseInt(btn.dataset.price||'0',10);
    if(btn.classList.contains('locked')){
      if(state.coins >= price){
        state.coins -= price;
        btn.classList.remove('locked');
        store.set('coins', state.coins);
        updateStats();
      }else{
        alert('צריך עוד מטבעות!');
        return;
      }
    }
    applyOutfit(n);
  });
}

function initSettings(){
  $('#btnSettings').addEventListener('click', ()=>{
    $('#inputName').value = state.name || '';
    $('#inputWeeklyGoal').value = state.weeklyGoal;
    $('#settingsDialog').showModal();
  });
  $('#btnSaveSettings').addEventListener('click', (e)=>{
    e.preventDefault();
    state.name = $('#inputName').value.trim();
    state.weeklyGoal = Math.max(1, Math.min(7, parseInt($('#inputWeeklyGoal').value||'4',10)));
    store.set('name', state.name);
    store.set('weeklyGoal', state.weeklyGoal);
    $('#settingsDialog').close();
  });
}

function init(){
  // workout type selection
  $$('.workout-types .pill').forEach(b=>b.addEventListener('click', ()=>selectWorkout(b)));
  $('#btnCheckin').addEventListener('click', checkinToday);

  // initial render
  applyOutfit(state.outfit || 1);
  updateStats();
  renderCalendar();
  initCloset();
  initSettings();
}
document.addEventListener('DOMContentLoaded', init);
