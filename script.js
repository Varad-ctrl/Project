/* ========= Complex Expense Tracker - script.js =========
   Features:
   - Add/Edit/Delete transactions with date, category, note
   - Filter by date range and category
   - Summary: balance, income, expense
   - Charts: doughnut (income vs expense), monthly bar chart
   - CSV export and JSON import/export
   - LocalStorage persistence
*/

// ---------- Helpers ----------
const $ = (sel) => document.querySelector(sel);
const $all = (sel) => Array.from(document.querySelectorAll(sel));
const formatCurrency = (n) => `$${Number(n).toFixed(2)}`;

// safe reduce that handles empty arrays
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// ---------- DOM ----------
const balanceEl = $('#balance');
const incomeEl = $('#income');
const expenseEl = $('#expense');

const txListEl = $('#transactionsList');
const txCountEl = $('#txCount');

const form = $('#transactionForm');
const descInput = $('#desc');
const amtInput = $('#amt');
const dateInput = $('#date');
const categorySelect = $('#category');
const noteInput = $('#note');

const filterFrom = $('#filterFrom');
const filterTo = $('#filterTo');
const filterCategory = $('#filterCategory');
const clearFiltersBtn = $('#clearFilters');

const exportCsvBtn = $('#exportCsvBtn');
const exportJsonBtn = $('#exportJsonBtn');
const importJsonBtn = $('#importJsonBtn');
const importJsonFile = $('#importJsonFile');

const editModal = $('#editModal');
const editForm = $('#editForm');
const editId = $('#editId');
const editDesc = $('#editDesc');
const editAmt = $('#editAmt');
const editDate = $('#editDate');
const editCategory = $('#editCategory');
const editNote = $('#editNote');
const closeEdit = $('#closeEdit');

const doughnutCtx = $('#doughnutChart').getContext('2d');
const barCtx = $('#barChart').getContext('2d');

let doughnutChart = null;
let barChart = null;

// ---------- Data & Categories ----------
let transactions = JSON.parse(localStorage.getItem('transactions_v2')) || [];

// default categories (user can add via code later)
const DEFAULT_CATEGORIES = [
  "Salary", "Groceries", "Bills", "Eating Out", "Transport", "Shopping", "Entertainment", "Health", "Other"
];

// populate category selects
function populateCategories() {
  const categories = [...new Set(DEFAULT_CATEGORIES.concat(transactions.map(t => t.category || 'Other')))];
  categorySelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
  filterCategory.innerHTML = `<option value="">All</option>` + categories.map(c => `<option value="${c}">${c}</option>`).join('');
  editCategory.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}
populateCategories();

// ---------- Utility: safe parse date ----------
function toISODateLocal(d = new Date()) {
  // returns yyyy-mm-dd
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// set default date to today
dateInput.value = toISODateLocal(new Date());
editDate.value = toISODateLocal(new Date());

// ---------- Persistence ----------
function save() {
  localStorage.setItem('transactions_v2', JSON.stringify(transactions));
}

// ---------- Add transaction ----------
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const desc = descInput.value.trim();
  const amt = parseFloat(amtInput.value);
  const date = dateInput.value;
  const category = categorySelect.value || 'Other';
  const note = noteInput.value.trim();

  if (!desc || isNaN(amt) || !date) {
    alert('Please provide valid description, amount and date.');
    return;
  }

  const tx = {
    id: Date.now(),
    text: desc,
    amount: Number(amt), // + for income, - for expense
    date,
    category,
    note
  };

  transactions.push(tx);
  save();
  populateCategories();
  resetForm();
  render();
});

// ---------- Reset form ----------
$('#resetForm').addEventListener('click', resetForm);
function resetForm(){
  descInput.value = '';
  amtInput.value = '';
  dateInput.value = toISODateLocal(new Date());
  categorySelect.selectedIndex = 0;
  noteInput.value = '';
}

// ---------- Render transactions list, summary, charts ----------
function render() {
  // apply filters
  let filtered = transactions.slice();

  // date filters
  const from = filterFrom.value ? new Date(filterFrom.value + 'T00:00:00') : null;
  const to = filterTo.value ? new Date(filterTo.value + 'T23:59:59') : null;
  if (from) filtered = filtered.filter(t => new Date(t.date + 'T00:00:00') >= from);
  if (to) filtered = filtered.filter(t => new Date(t.date + 'T00:00:00') <= to);

  // category filter
  if (filterCategory.value) filtered = filtered.filter(t => t.category === filterCategory.value);

  // sort by date desc
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

  // render list
  txListEl.innerHTML = '';
  filtered.forEach(tx => {
    const li = document.createElement('li');
    li.className = 'tx ' + (tx.amount >= 0 ? 'income' : 'expense');
    li.innerHTML = `
      <div class="meta">
        <strong>${escapeHtml(tx.text)}</strong>
        <small>${tx.category} • ${tx.date}</small>
        ${tx.note ? `<small style="color:var(--muted)">${escapeHtml(tx.note)}</small>` : ''}
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <div class="amount">${tx.amount >= 0 ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}</div>
        <div class="actions">
          <button class="icon-btn" title="Edit" data-id="${tx.id}" data-action="edit">✏️</button>
          <button class="icon-btn" title="Delete" data-id="${tx.id}" data-action="delete">🗑️</button>
        </div>
      </div>
    `;
    txListEl.appendChild(li);
  });

  txCountEl.textContent = `${filtered.length} items`;

  // compute totals (careful arithmetic - use reduce)
  const amountsAll = transactions.map(t => Number(t.amount));
  const total = sum(amountsAll);
  const incomeTotal = sum(amountsAll.filter(a=>a>0));
  const expenseTotal = -1 * sum(amountsAll.filter(a=>a<0)); // positive number

  balanceEl.textContent = formatCurrency(total);
  incomeEl.textContent = formatCurrency(incomeTotal);
  expenseEl.textContent = formatCurrency(expenseTotal);

  // update charts using filtered data for monthly breakdown for the visible range
  updateDoughnutChart(incomeTotal, expenseTotal);
  updateBarChart(transactions); // monthly overview uses all transactions
}

// escape to avoid XSS when injecting text
function escapeHtml(text){
  return text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

// ---------- Edit & Delete button handling (event delegation) ----------
txListEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  if (action === 'delete') {
    if (confirm('Delete this transaction?')) {
      transactions = transactions.filter(t => t.id !== id);
      save();
      populateCategories();
      render();
    }
  } else if (action === 'edit') {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    // open modal
    editId.value = tx.id;
    editDesc.value = tx.text;
    editAmt.value = tx.amount;
    editDate.value = tx.date;
    editCategory.value = tx.category;
    editNote.value = tx.note || '';
    editModal.setAttribute('aria-hidden','false');
  }
});

// close modal
closeEdit.addEventListener('click', () => editModal.setAttribute('aria-hidden','true'));

// save edit
editForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = Number(editId.value);
  const tx = transactions.find(t => t.id === id);
  if (!tx) return;
  const textV = editDesc.value.trim();
  const amtV = parseFloat(editAmt.value);
  const dateV = editDate.value;
  const catV = editCategory.value;
  const noteV = editNote.value.trim();
  if (!textV || isNaN(amtV) || !dateV) { alert('Please provide valid values'); return; }
  tx.text = textV;
  tx.amount = Number(amtV);
  tx.date = dateV;
  tx.category = catV;
  tx.note = noteV;
  save();
  populateCategories();
  editModal.setAttribute('aria-hidden','true');
  render();
});

// ---------- Charts ----------

function updateDoughnutChart(incomeTotal, expenseTotal) {
  if (doughnutChart) doughnutChart.destroy();
  doughnutChart = new Chart(doughnutCtx, {
    type: 'doughnut',
    data: {
      labels:['Income','Expense'],
      datasets:[{
        data:[incomeTotal, expenseTotal],
        backgroundColor:['#10B981','#EF4444'],
        hoverOffset:8
      }]
    },
    options:{
      responsive:true,
      plugins:{legend:{position:'bottom'}}
    }
  });
}

// monthly aggregated bar chart (for last 12 months)
function updateBarChart(txArray){
  // group transactions by month-year
  const now = new Date();
  // array of last 12 months labels yyyy-mm
  const months = [];
  for(let i=11;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, label: d.toLocaleString(undefined,{month:'short', year:'numeric'}) });
  }

  const incomeByMonth = months.map(m => 0);
  const expenseByMonth = months.map(m => 0);

  txArray.forEach(tx => {
    const key = `${new Date(tx.date).getFullYear()}-${String(new Date(tx.date).getMonth()+1).padStart(2
