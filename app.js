const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(n);
const today = () => new Date().toISOString().slice(0,10);
const categories = {
  Food:{emoji:'☕',color:'#2c6a4f'},Travel:{emoji:'↗',color:'#8fc6a1'},Shopping:{emoji:'◇',color:'#e9be68'},
  Bills:{emoji:'⌁',color:'#e58b79'},Education:{emoji:'▤',color:'#8e9bd0'},Health:{emoji:'✚',color:'#d68c9d'},
  Entertainment:{emoji:'♫',color:'#c0a2dc'},Salary:{emoji:'↙',color:'#4f9d72'},Other:{emoji:'✦',color:'#b4c6b6'}
};
const defaultTransactions = [
 {id:1,title:'Monthly allowance',category:'Salary',date:today(),amount:18000,type:'income'},
 {id:2,title:'Coffee with friends',category:'Food',date:today(),amount:280,type:'expense'},
 {id:3,title:'Metro recharge',category:'Travel',date:shiftDate(-1),amount:500,type:'expense'},
 {id:4,title:'New notebook',category:'Education',date:shiftDate(-2),amount:180,type:'expense'},
 {id:5,title:'Groceries',category:'Food',date:shiftDate(-3),amount:740,type:'expense'},
 {id:6,title:'Phone bill',category:'Bills',date:shiftDate(-4),amount:399,type:'expense'},
 {id:7,title:'T-shirt',category:'Shopping',date:shiftDate(-5),amount:850,type:'expense'},
 {id:8,title:'Movie night',category:'Entertainment',date:shiftDate(-6),amount:650,type:'expense'},
 {id:9,title:'Lunch',category:'Food',date:shiftDate(-7),amount:420,type:'expense'},
 {id:10,title:'Cab ride',category:'Travel',date:shiftDate(-8),amount:360,type:'expense'},
 {id:11,title:'Course material',category:'Education',date:shiftDate(-9),amount:620,type:'expense'},
 {id:12,title:'Snacks',category:'Food',date:shiftDate(-10),amount:551,type:'expense'}
];
function shiftDate(days){const d=new Date();d.setDate(d.getDate()+days);return d.toISOString().slice(0,10)}
const defaultBudgets = [
 {category:'Food',limit:2500,emoji:'☕'},{category:'Travel',limit:1800,emoji:'🚇'},
 {category:'Shopping',limit:2000,emoji:'🛍️'},{category:'Bills',limit:1200,emoji:'🧾'},
 {category:'Education',limit:1500,emoji:'📚'},{category:'Entertainment',limit:1000,emoji:'🎧'}
];
const starterGroups = [
 {id:1,title:'Dinner after class',amount:1200,people:4,paidBy:'you',date:shiftDate(-1)},
 {id:2,title:'Cab to the mall',amount:360,people:3,paidBy:'friend',date:shiftDate(-3)}
];
let transactions = load('pw_transactions',defaultTransactions);
let budgets = load('pw_budgets',defaultBudgets);
let groups = load('pw_groups',starterGroups);
let nextId = Math.max(0,...transactions.map(t=>t.id))+1;
function load(key,fallback){try{const v=localStorage.getItem(key);return v?JSON.parse(v):fallback.map(x=>({...x}));}catch{return fallback.map(x=>({...x}));}}
function persist(){localStorage.setItem('pw_transactions',JSON.stringify(transactions));localStorage.setItem('pw_budgets',JSON.stringify(budgets));localStorage.setItem('pw_groups',JSON.stringify(groups));}
function monthItems(){const m=today().slice(0,7);return transactions.filter(t=>t.date.slice(0,7)===m)}
function totals(items){return items.reduce((a,t)=>{a[t.type]+=Number(t.amount);return a},{income:0,expense:0})}
function fmtDate(s){return new Date(s+'T12:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
function iconFor(category){return categories[category]?.emoji||'✦'}
function showToast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2600)}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function transactionRow(t,showDelete=false){const c=(t.category||'Other').toLowerCase();return `<tr><td><div class="transaction-name"><span class="transaction-icon ${escapeHTML(c)}">${iconFor(t.category)}</span><span>${escapeHTML(t.title)}</span></div></td><td><span class="category-pill">${escapeHTML(t.category)}</span></td><td>${fmtDate(t.date)}</td><td class="right amount-cell ${t.type==='expense'?'negative':''}">${t.type==='expense'?'−':'+'}${money(t.amount)}</td>${showDelete?`<td class="right"><button class="delete-button" data-delete="${t.id}" aria-label="Delete ${escapeHTML(t.title)}">×</button></td>`:''}</tr>`}
function categoryTotals(items){const out={};items.filter(t=>t.type==='expense').forEach(t=>out[t.category]=(out[t.category]||0)+Number(t.amount));return out}
function render(){const mi=monthItems(),t=totals(mi),saved=t.income-t.expense,all=totals(transactions);$('#balanceAmount').textContent=money(all.income-all.expense);$('#incomeAmount').textContent=money(t.income);$('#expenseAmount').textContent=money(t.expense);$('#savedAmount').textContent=money(saved);const pct=t.income?Math.min(100,Math.round(t.expense/t.income*100)):0;$('#expensePercent').textContent=pct+'%';$('#expenseTrack').style.width=pct+'%';
 renderDonut($('#periodSelect').value==='all'?transactions:mi);renderBudgetPreview();$('#recentRows').innerHTML=[...transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).slice(0,5).map(t=>transactionRow(t)).join('')||'<tr><td colspan="4">No transactions yet.</td></tr>';renderAllTransactions();renderBudgets();renderGroups();}
function renderDonut(items){const data=categoryTotals(items),entries=Object.entries(data).sort((a,b)=>b[1]-a[1]);const total=entries.reduce((s,e)=>s+e[1],0);$('#donutTotal').textContent=total>=1000?'₹'+(total/1000).toFixed(1)+'k':money(total);let angle=0;const stops=[];entries.forEach(([cat,val])=>{const start=angle;angle+=total?val/total*100:0;stops.push(`${categories[cat]?.color||'#b4c6b6'} ${start}% ${angle}%`)});$('#donut').style.background=stops.length?`conic-gradient(${stops.join(',')})`:'#e7eee7';$('#categoryLegend').innerHTML=entries.slice(0,5).map(([cat,val])=>`<div class="legend-item"><span class="legend-dot" style="background:${categories[cat]?.color||'#b4c6b6'}"></span><span>${escapeHTML(cat)}</span><b>${Math.round(total?val/total*100:0)}%</b></div>`).join('')||'<span class="muted-line">No spending yet</span>';}
function renderBudgetPreview(){const spend=categoryTotals(monthItems());$('#budgetPreview').innerHTML=budgets.slice(0,3).map(b=>{const used=spend[b.category]||0,p=Math.min(100,used/b.limit*100);return `<div><div class="budget-row-top"><span class="budget-name"><span class="budget-emoji">${b.emoji||iconFor(b.category)}</span>${escapeHTML(b.category)}</span><span class="budget-value"><b>${money(used)}</b> / ${money(b.limit)}</span></div><div class="progress"><span class="${p>=100?'over':p>=75?'warn':''}" style="width:${p}%"></span></div></div>`}).join('')}
function renderAllTransactions(){const q=$('#searchTransactions').value.toLowerCase(),type=$('#typeFilter').value;const list=[...transactions].sort((a,b)=>b.date.localeCompare(a.date)||b.id-a.id).filter(t=>(t.title+' '+t.category).toLowerCase().includes(q)&&(type==='all'||t.type===type));$('#allRows').innerHTML=list.map(t=>transactionRow(t,true)).join('');$('#transactionEmpty').classList.toggle('hidden',list.length>0);if(!list.length)$('#allRows').innerHTML='';}
function renderBudgets(){const spend=categoryTotals(monthItems());$('#budgetCards').innerHTML=budgets.map(b=>{const used=spend[b.category]||0,p=Math.min(100,used/b.limit*100),remaining=b.limit-used;return `<article class="budget-card"><div class="budget-emoji">${b.emoji||iconFor(b.category)}</div><h3>${escapeHTML(b.category)}</h3><div class="muted-line">Monthly spending limit</div><div class="budget-numbers"><strong>${money(used)}</strong><span>of ${money(b.limit)}</span></div><div class="progress"><span class="${p>=100?'over':p>=75?'warn':''}" style="width:${p}%"></span></div><div class="remaining">${remaining>=0?money(remaining)+' left':'Over by '+money(-remaining)}</div></article>`}).join('')}
function renderGroups(){const owe=groups.filter(g=>g.paidBy==='friend').reduce((s,g)=>s+g.amount/g.people,0),owed=groups.filter(g=>g.paidBy==='you').reduce((s,g)=>s+g.amount*(g.people-1)/g.people,0);$('#youOwe').textContent=money(owe);$('#youAreOwed').textContent=money(owed);$('#groupList').innerHTML=groups.length?[...groups].sort((a,b)=>b.date.localeCompare(a.date)).map(g=>`<div class="group-item"><div class="group-icon">♧</div><div class="group-info"><strong>${escapeHTML(g.title)}</strong><small>${fmtDate(g.date)} · ${g.people} people · ${money(g.amount/g.people)} each</small></div><div class="group-amount"><strong>${money(g.amount)}</strong><small>${g.paidBy==='you'?'You paid':'Friend paid'}</small></div></div>`).join(''):'<div class="empty-state">No group expenses yet. Add one to split the bill.</div>'}
const pageInfo={overview:['Good evening, Purav ✳',"Here's what's happening with your money."],transactions:['Transactions','Every money move, all in one place.'],budgets:['Budgets','Make a plan that works for real life.'],groups:['Split with friends','Keep the maths fair and the friendships easy.']};
function goTo(view){$$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===view));$('#pageTitle').textContent=pageInfo[view][0];$('#pageSubtitle').textContent=pageInfo[view][1];window.scrollTo({top:0,behavior:'smooth'});}
function openModal(id){$('#'+id).classList.remove('hidden')}
function closeModal(id){$('#'+id).classList.add('hidden')}
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.view)));
$$('[data-goto]').forEach(b=>b.addEventListener('click',()=>goTo(b.dataset.goto)));
$('#addExpenseTop').addEventListener('click',()=>{const f=$('#transactionForm');f.reset();$('#transactionDate').value=today();openModal('transactionModal')});
$('#newGroupButton').addEventListener('click',()=>openModal('groupModal'));
$$('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
$$('.modal-backdrop').forEach(m=>m.addEventListener('click',e=>{if(e.target===m)closeModal(m.id)}));
$('#transactionForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),type=f.get('kind'),category=f.get('category'),amount=Number(f.get('amount'));if(!Number.isFinite(amount)||amount<=0)return showToast('Enter a valid amount.');transactions.push({id:nextId++,title:f.get('title').trim(),category,date:f.get('date'),amount,type});persist();render();closeModal('transactionModal');showToast('Transaction saved. Nice and simple.');});
$('#groupForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),amount=Number(f.get('amount')),people=Number(f.get('people'));if(amount<=0||people<2)return showToast('Check the amount and number of people.');groups.push({id:Date.now(),title:f.get('title').trim(),amount,people,paidBy:f.get('paidBy'),date:today()});persist();renderGroups();closeModal('groupModal');e.currentTarget.reset();showToast(`Split calculated: ${money(amount/people)} per person.`);});
$('#searchTransactions').addEventListener('input',renderAllTransactions);$('#typeFilter').addEventListener('change',renderAllTransactions);$('#periodSelect').addEventListener('change',()=>renderDonut($('#periodSelect').value==='all'?transactions:monthItems()));
document.addEventListener('click',e=>{const b=e.target.closest('[data-delete]');if(!b)return;const id=Number(b.dataset.delete),t=transactions.find(x=>x.id===id);if(t&&confirm(`Delete "${t.title}"?`)){transactions=transactions.filter(x=>x.id!==id);persist();render();showToast('Transaction deleted.');}});
$('#editBudgetButton').addEventListener('click',()=>{const updated=budgets.map(b=>{const raw=prompt(`Monthly budget for ${b.category} (₹):`,b.limit);if(raw===null)return b;const n=Number(raw);return Number.isFinite(n)&&n>0?{...b,limit:n}:b});budgets=updated;persist();render();showToast('Budgets updated.');});
$('#resetButton').addEventListener('click',()=>{if(confirm('Reset all PocketWise demo data? Your changes in this browser will be cleared.')){transactions=defaultTransactions.map(x=>({...x}));budgets=defaultBudgets.map(x=>({...x}));groups=starterGroups.map(x=>({...x}));nextId=Math.max(...transactions.map(t=>t.id))+1;persist();render();showToast('Demo data reset.');}});
$('#profileButton').addEventListener('click',()=>showToast('This is a local demo profile.'));
$('#dateLabel').textContent=new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'}).toUpperCase();
$('#transactionDate').value=today();
render();