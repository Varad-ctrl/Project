// Elements
const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');
const listEl = document.getElementById('list');
const form = document.getElementById('form');
const textEl = document.getElementById('text');
const amountEl = document.getElementById('amount');
const typeEl = document.getElementById('type');
const categoryEl = document.getElementById('category');
const dateEl = document.getElementById('date');
const filterCategoryEl = document.getElementById('filter-category');
const filterMonthEl = document.getElementById('filter-month');
const resetFiltersBtn = document.getElementById('reset-filters');
const chartCanvas = document.getElementById('myChart').getContext('2d');

const STORAGE_KEY = 'transactions-advanced-fixed-v1';

let transactions = [];
let chartInstance = null;

// load from localStorage
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    transactions = raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load transactions:', e);
    transactions = [];
  }
}

// save to localStorage
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// utility to format currency
function fmt(n) {
  const abs = Math.abs(n).toFixed(2);
  return `$${Number(abs).toLocaleString()}`;
}

// render list (data array)
function renderTransactions(data) {
  listEl.innerHTML = '';
  if (!data.length) {
    listEl.innerHTML = '<li style="text-align:center;color:#666">No transactions yet</li>';
    return;
  }

  data.forEach(t => {
    const li = document.createElement('li');
    li.className = t.amount < 0 ? 'minus' : 'plus';

    const left = document.createElement('div');
    left.innerHTML = `<strong>${escapeHtml(t.text)}</strong><small>${escapeHtml(t.category)} • ${t.date}</small>`;

    const right = document.createElement('div');
    const sign = t.amount < 0 ? '-' : '+';
    right.innerHTML = `${sign}${fmt(t.amount)} <button aria-label="delete" data-id="${t.id}">x</button>`;

    li.appendChild(left);
    li.appendChild(right);
    listEl.appendChild(li);
  });
}

// escape HTML to avoid injection when rendering user input
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[m]);
}

// calculate totals and update UI
function updateTotals(data) {
  const amounts = data.map(t => t.amount);
  const total = amounts.reduce((a,b) => a + b, 0);
  const incomeTotal = amounts.filter(x => x > 0).reduce((a,b) => a + b, 0);
  const expenseTotal = Math.abs(amounts.filter(x => x < 0).reduce((a,b) => a + b, 0));

  balanceEl.innerText = `$${total.toFixed(2)}`;
  incomeEl.innerText = `+$${incomeTotal.toFixed(2)}`;
  expenseEl.innerText = `-$${expenseTotal.toFixed(2)}`;
}

// build and draw chart (expenses by category)
function drawChart(data) {
  // group only expenses (negative amounts)
  const expenseTx = data.filter(t => t.amount < 0);
  const grouped = {};
  expenseTx.forEach(t => {
    grouped[t.category] = (grouped[t.category] || 0) + Math.abs(t.amount);
  });

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  // If there's no expense data, show placeholder single slice with 0
  const chartData = labels.length ? {labels, datasets:[{data: values}]} :
    {labels: ['No expenses'], datasets:[{data:[1]}]};

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: 'pie',
    data: chartData,
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// apply current filters and rerender
function applyFiltersAndRender() {
  let filtered = [...transactions];

  const cat = filterCategoryEl.value;
  const month = filterMonthEl.value; // "YYYY-MM"

  if (cat && cat !== 'All') filtered = filtered.filter(t => t.category === cat);
  if (month) {
    const [y, m] = month.split('-').map(Number);
    filtered = filtered.filter(t => {
      const d = new Date(t.date + 'T00:00:00');
      return d.getFullYear() === y && (d.getMonth() + 1) === m;
    });
  }

  // sort by date desc then by id
  filtered.sort((a,b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

  renderTransactions(filtered);
  updateTotals(filtered);
  drawChart(filtered);
}

// create transaction object and add
function addTransactionFromForm(e) {
  e.preventDefault();

  const text = textEl.value.trim();
  const rawAmount = parseFloat(amountEl.value);
  const type = typeEl.value; // 'income' or 'expense'
  const category = categoryEl.value;
  const date = dateEl.value;

  if (!text || !isFinite(rawAmount) || rawAmount <= 0 || !category || !date) {
    alert('Please fill all fields and enter a positive amount.');
    return;
  }

  const amount = type === 'expense' ? -Math.abs(rawAmount) : Math.abs(rawAmount);

  const tx = {
    id: Date.now() + Math.floor(Math.random()*1000), // simple unique id
    text,
    amount,
    category,
    date,
  };

  transactions.push(tx);
  save();
  applyFiltersAndRender();

  form.reset();
  // set date input to today for convenience
  dateEl.value = new Date().toISOString().slice(0,10);
}

// handle delete click using event delegation
listEl.addEventListener('click', function(e) {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = Number(btn.dataset.id);
  if (!confirm('Delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  save();
  applyFiltersAndRender();
});

// wire up remove button for older browsers / external calls (also helpful)
window.removeTransaction = function(id) {
  transactions = transactions.filter(t => t.id !== id);
  save();
  applyFiltersAndRender();
};

// register form submit
form.addEventListener('submit', addTransactionFromForm);

// filters
filterCategoryEl.addEventListener('change', applyFiltersAndRender);
filterMonthEl.addEventListener('change', applyFiltersAndRender);
resetFiltersBtn.addEventListener('click', function(){
  filterCategoryEl.value = 'All';
  filterMonthEl.value = '';
  applyFiltersAndRender();
});

// initialize app
(function init(){
  // set default date to today
  if (!dateEl.value) dateEl.value = new Date().toISOString().slice(0,10);

  load();
  // ensure transactions are valid array
  if (!Array.isArray(transactions)) transactions = [];
  applyFiltersAndRender();
})();
