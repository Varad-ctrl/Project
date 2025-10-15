const balance = document.getElementById("balance");
const income = document.getElementById("income");
const expense = document.getElementById("expense");
const list = document.getElementById("list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");
const category = document.getElementById("category");
const date = document.getElementById("date");
const filterCategory = document.getElementById("filter-category");
const filterMonth = document.getElementById("filter-month");
const resetFilters = document.getElementById("reset-filters");
const ctx = document.getElementById("myChart");

let transactions = JSON.parse(localStorage.getItem("transactions-advanced")) || [];
let chart;

// Initialize
function init() {
  renderTransactions(transactions);
  updateValues(transactions);
  updateChart(transactions);
}

// Add Transaction
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const newTransaction = {
    id: Date.now(),
    text: text.value,
    amount: +amount.value,
    category: category.value,
    date: date.value,
  };

  if (!newTransaction.text || !newTransaction.amount || !newTransaction.category || !newTransaction.date) {
    alert("Please fill all fields!");
    return;
  }

  transactions.push(newTransaction);
  updateLocalStorage();
  init();
  form.reset();
});

// Render Transactions
function renderTransactions(data) {
  list.innerHTML = "";
  data.forEach((t) => {
    const sign = t.amount < 0 ? "-" : "+";
    const item = document.createElement("li");
    item.classList.add(t.amount < 0 ? "minus" : "plus");
    item.innerHTML = `
      <div>
        <strong>${t.text}</strong><br>
        <small>${t.category} | ${t.date}</small>
      </div>
      <div>
        ${sign}$${Math.abs(t.amount).toFixed(2)}
        <button onclick="removeTransaction(${t.id})">x</button>
      </div>
    `;
    list.appendChild(item);
  });
}

// Update Values
function updateValues(data) {
  const amounts = data.map((t) => t.amount);
  const total = amounts.reduce((a, b) => a + b, 0).toFixed(2);
  const incomeTotal = amounts.filter((v) => v > 0).reduce((a, v) => a + v, 0).toFixed(2);
  const expenseTotal = Math.abs(amounts.filter((v) => v < 0).reduce((a, v) => a + v, 0)).toFixed(2);

  balance.innerText = `$${total}`;
  income.innerText = `+$${incomeTotal}`;
  expense.innerText = `-$${expenseTotal}`;
}

// Remove Transaction
function removeTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  updateLocalStorage();
  init();
}

// Update Local Storage
function updateLocalStorage() {
  localStorage.setItem("transactions-advanced", JSON.stringify(transactions));
}

// Filter Transactions
function applyFilters() {
  let filtered = [...transactions];

  const selectedCategory = filterCategory.value;
  const selectedMonth = filterMonth.value;

  if (selectedCategory !== "All") {
    filtered = filtered.filter((t) => t.category === selectedCategory);
  }

  if (selectedMonth) {
    const [year, month] = selectedMonth.split("-");
    filtered = filtered.filter((t) => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === +year && tDate.getMonth() + 1 === +month;
    });
  }

  renderTransactions(filtered);
  updateValues(filtered);
  updateChart(filtered);
}

filterCategory.addEventListener("change", applyFilters);
filterMonth.addEventListener("change", applyFilters);
resetFilters.addEventListener("click", () => {
  filterCategory.value = "All";
  filterMonth.value = "";
  init();
});

// Chart by Category
function updateChart(data) {
  if (chart) chart.destroy();

  const expenseData = data.filter((t) => t.amount < 0);
  const grouped = {};

  expenseData.forEach((t) => {
    grouped[t.category] = (grouped[t.category] || 0) + Math.abs(t.amount);
  });

  const labels = Object.keys(grouped);
  const values = Object.values(grouped);

  chart = new Chart(ctx, {
    type: "pie",
    data: {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: [
            "#3498db",
            "#e74c3c",
            "#f1c40f",
            "#9b59b6",
            "#1abc9c",
            "#e67e22",
          ],
        },
      ],
    },
  });
}

init();
