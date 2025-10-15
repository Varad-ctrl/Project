// DOM Elements
const balance = document.getElementById('balance');
const income = document.getElementById('income');
const expense = document.getElementById('expense');
const list = document.getElementById('list');
const form = document.getElementById('form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');
const chartCanvas = document.getElementById('chart');

// Retrieve transactions from localStorage or initialize empty array
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];

let chart; // Chart.js instance

// Event Listener
form.addEventListener('submit', addTransaction);

// =======================
// Add New Transaction
// =======================
function addTransaction(e) {
  e.preventDefault();

  const textValue = text.value.trim();
  const amountValue = parseFloat(amount.value);

  if (textValue === '' || isNaN(amountValue) || amountValue === 0) {
    alert('⚠️ Please enter a valid description and non-zero amount!');
    return;
  }

  const transaction = {
    id: Date.now(),
    text: textValue,
    amount: amountValue
  };

  transactions.push(transaction);

  updateUI();
  updateLocalStorage();

  // Clear input fields
  text.value = '';
  amount.value = '';
}

// =======================
// Remove Transaction
// =======================
function removeTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  updateUI();
  updateLocalStorage();
}

// =======================
// Update Balance, Income, and Exp
