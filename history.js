// Protect this page
if (localStorage.getItem('ssai_loggedIn') !== 'true') {
  window.location.href = 'login.html';
}

const historyContainer = document.getElementById('historyContainer');

const CATEGORY_COLORS = {
  Food: '#ff6b6b',
  Travel: '#2ecfb2',
  Shopping: '#ffb84d',
  Bills: '#5c7cfa',
  Other: '#a78bfa'
};

function getExpenses() {
  return JSON.parse(localStorage.getItem('ssai_expenses')) || [];
}

function saveExpenses(expenses) {
  localStorage.setItem('ssai_expenses', JSON.stringify(expenses));
}

function formatMonthYear(dateStr) {
  const date = new Date(dateStr);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return months[date.getMonth()] + ' ' + date.getFullYear();
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function renderHistory() {
  const expenses = getExpenses();

  if (expenses.length === 0) {
    historyContainer.innerHTML = '<p class="no-expenses">No expense history yet. Start adding expenses from the dashboard!</p>';
    return;
  }

  const grouped = {};
  expenses.forEach(function (exp) {
    const dateStr = exp.date || new Date().toISOString();
    const key = formatMonthYear(dateStr);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(exp);
  });

  let html = '';

  for (const monthKey in grouped) {
    const monthExpenses = grouped[monthKey];
    const monthTotal = monthExpenses.reduce(function (sum, exp) {
      return sum + Number(exp.amount);
    }, 0);

    html += `
      <div class="month-group">
        <div class="month-header">
          <span>${monthKey}</span>
          <span class="month-total">₹${monthTotal}</span>
        </div>
        <div class="expense-list">
    `;

    monthExpenses.forEach(function (exp) {
      const dateLabel = exp.date ? formatDate(exp.date) : '';
      const color = CATEGORY_COLORS[exp.category] || '#8fa3b8';
      html += `
        <div class="expense-item" style="border-left-color: ${color};">
          <div class="expense-info">
            <h4>${exp.category}</h4>
            <p>${exp.desc ? exp.desc : 'No description'} ${dateLabel ? '• ' + dateLabel : ''}</p>
          </div>
          <div style="display:flex; align-items:center;">
            <span class="expense-amount">-₹${exp.amount}</span>
            <button class="delete-btn" data-id="${exp.id}">✕</button>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  historyContainer.innerHTML = html;

  document.querySelectorAll('.delete-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-id');
      const updated = getExpenses().filter(function (exp) {
        return String(exp.id) !== id;
      });
      saveExpenses(updated);
      renderHistory();
    });
  });
}

renderHistory();