const balance = document.getElementById('balance');
const income = document.getElementById('income');
const expense = document.getElementById('expense');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const chartCanvas = document.getElementById('chart');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

form.addEventListener('submit', addTransaction);

function addTransaction(e) {
  e.preventDefault();

  const transaction = {
    id: Date.now(),
    text: text.value.trim(),
    amount: +amount.value
  };

  if (transaction.text === '' || isNaN(transaction.amount)) {
    alert('Please enter valid transaction details.');
    return;
  }

  transactions.push(transaction);
  addTransactionDOM(transaction);
  updateValues();
  updateChart();
  updateLocalStorage();

  text.value = '';
  amount.value = '';
}

function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? '-' : '+';
  const item = document.createElement('li');
  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');
  item.innerHTML = `
    ${transaction.text} 
    <span>${sign}$${Math.abs(transaction.amount)}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
  `;
  list.appendChild(item);
}

function updateValues() {
  const amounts = transactions.map(t => t.amount);
  const total = amounts.reduce((acc, item) => acc + item, 0).toFixed(2);
  const incomeTotal = amounts.filter(item => item > 0).reduce((acc, item) => acc + item, 0).toFixed(2);
  const expenseTotal = (amounts.filter(item => item < 0).reduce((acc, item) => acc + item, 0) * -1).toFixed(2);

  balance.innerText = `$${total}`;
  income.innerText = `$${incomeTotal}`;
  expense.innerText = `$${expenseTotal}`;
}

function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateLocalStorage();
  init();
}

function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function init() {
  list.innerHTML = '';
  transactions.forEach(addTransactionDOM);
  updateValues();
  updateChart();
}

let chart;
function updateChart() {
  const incomeTotal = transactions.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
  const expenseTotal = transactions.filter(t => t.amount < 0).reduce((a, b) => a + b.amount, 0) * -1;

  if (chart) chart.destroy();

  chart = new Chart(chartCanvas, {
    type: 'doughnut',
    data: {
      labels: ['Income', 'Expense'],
      datasets: [{
        data: [incomeTotal, expenseTotal],
        backgroundColor: ['#28a745', '#dc3545'],
        hoverOffset: 10
      }]
    },
    options: {
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

init();
