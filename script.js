// Protect this page - redirect to login if not logged in
if (localStorage.getItem('ssai_loggedIn') !== 'true') {
  window.location.href = 'login.html';
}

const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', function () {
  localStorage.removeItem('ssai_loggedIn');
  window.location.href = 'login.html';
});

// ---------- Expense Tracking ----------
const expenseForm = document.getElementById('expenseForm');
const expenseList = document.getElementById('expenseList');
const totalSpendEl = document.querySelector('.total-spend .stat-value');
const remainingEl = document.querySelector('.remaining .stat-value');
const budgetEl = document.querySelector('.budget .stat-value');
const noChartData = document.getElementById('noChartData');
const budgetWarning = document.getElementById('budgetWarning');
const insightText = document.getElementById('insightText');

const MONTHLY_BUDGET = 10000;

let expenseChart = null;
let currentFilter = 'All';
let capturedLocation = null;

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

function renderChart(expenses) {
  const canvas = document.getElementById('expenseChart');

  const totals = {};
  expenses.forEach(function (exp) {
    totals[exp.category] = (totals[exp.category] || 0) + Number(exp.amount);
  });

  const labels = Object.keys(totals);
  const data = Object.values(totals);
  const colors = labels.map(function (cat) {
    return CATEGORY_COLORS[cat] || '#8fa3b8';
  });

  if (labels.length === 0) {
    canvas.style.display = 'none';
    noChartData.style.display = 'block';
    if (expenseChart) {
      expenseChart.destroy();
      expenseChart = null;
    }
    return;
  }

  canvas.style.display = 'block';
  noChartData.style.display = 'none';

  if (expenseChart) {
    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = data;
    expenseChart.data.datasets[0].backgroundColor = colors;
    expenseChart.update();
  } else {
    expenseChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: colors,
          borderColor: '#14273d',
          borderWidth: 2
        }]
      },
      options: {
        plugins: {
          legend: {
            labels: { color: '#c8d6e5', font: { size: 12 } }
          }
        }
      }
    });
  }

  return totals;
}

function renderInsights(expenses, totals, totalSpend) {
  if (expenses.length === 0) {
    insightText.textContent = 'Add expenses to get personalized insights!';
    return;
  }

  let topCategory = '';
  let topAmount = 0;
  for (const cat in totals) {
    if (totals[cat] > topAmount) {
      topAmount = totals[cat];
      topCategory = cat;
    }
  }

  const percent = Math.round((topAmount / totalSpend) * 100);
  const budgetUsedPercent = Math.round((totalSpend / MONTHLY_BUDGET) * 100);

  let msg = `Unga total spend la ${percent}% (₹${topAmount}) "${topCategory}" category la thaan pogudhu. `;

  if (budgetUsedPercent >= 90) {
    msg += `Budget romba over aaguthu (${budgetUsedPercent}% used) - kavanama irunga! ⚠️`;
  } else if (budgetUsedPercent >= 70) {
    msg += `Budget ${budgetUsedPercent}% mudinjiduchu, konjam careful ah spend pannunga.`;
  } else {
    msg += `Nalla ah budget la irukinga, idhe madhiri continue pannunga! 👍`;
  }

  insightText.textContent = msg;
}

function renderBudgetWarning(totalSpend) {
  const percent = (totalSpend / MONTHLY_BUDGET) * 100;

  if (percent >= 100) {
    budgetWarning.style.display = 'block';
    budgetWarning.textContent = '🚨 Budget full ah exceed aaguthu! Spending control pannunga.';
  } else if (percent >= 80) {
    budgetWarning.style.display = 'block';
    budgetWarning.textContent = `⚠️ Budget ${Math.round(percent)}% mudichiduchu - kizhe irukura amount la careful ah irunga.`;
  } else {
    budgetWarning.style.display = 'none';
  }
}

function renderExpenses() {
  const allExpenses = getExpenses();
  const expenses = currentFilter === 'All'
    ? allExpenses
    : allExpenses.filter(function (exp) { return exp.category === currentFilter; });

  if (expenses.length === 0) {
    expenseList.innerHTML = currentFilter === 'All'
      ? '<p class="no-expenses">No expenses yet. Add one above!</p>'
      : '<p class="no-expenses">No expenses in this category.</p>';
  } else {
    expenseList.innerHTML = expenses.map(function (exp) {
      const locLabel = exp.location ? ` • 📍 ${exp.location}` : '';
      return `
        <div class="expense-item">
          <div class="expense-info">
            <h4>${exp.category}</h4>
            <p>${exp.desc ? exp.desc : 'No description'}${locLabel}</p>
          </div>
          <div style="display:flex; align-items:center;">
            <span class="expense-amount">-₹${exp.amount}</span>
            <button class="delete-btn" data-id="${exp.id}">✕</button>
          </div>
        </div>
      `;
    }).join('');
  }

  const totalSpend = allExpenses.reduce(function (sum, exp) {
    return sum + Number(exp.amount);
  }, 0);
  const remaining = MONTHLY_BUDGET - totalSpend;

  totalSpendEl.textContent = '₹' + totalSpend;
  budgetEl.textContent = '₹' + MONTHLY_BUDGET;
  remainingEl.textContent = '₹' + remaining;

  const totals = renderChart(allExpenses);
  renderInsights(allExpenses, totals || {}, totalSpend);
  renderBudgetWarning(totalSpend);

  document.querySelectorAll('.delete-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const id = btn.getAttribute('data-id');
      const updated = getExpenses().filter(function (exp) {
        return String(exp.id) !== id;
      });
      saveExpenses(updated);
      renderExpenses();
    });
  });
}

expenseForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const amount = document.getElementById('expenseAmount').value;
  const category = document.getElementById('expenseCategory').value;
  const desc = document.getElementById('expenseDesc').value.trim();

  if (!amount || !category) return;

  const expenses = getExpenses();
  expenses.unshift({
    id: Date.now() + Math.random(),
    amount: amount,
    category: category,
    desc: desc,
    location: capturedLocation,
    date: new Date().toISOString()
  });
  saveExpenses(expenses);

  capturedLocation = null;
  document.getElementById('locationStatus').textContent = '';
  expenseForm.reset();
  renderExpenses();
});

renderExpenses();

document.getElementById('filterCategory').addEventListener('change', function (e) {
  currentFilter = e.target.value;
  renderExpenses();
});

// ---------- Export CSV ----------
document.getElementById('exportBtn').addEventListener('click', function () {
  const expenses = getExpenses();

  if (expenses.length === 0) {
    alert('No expenses to export!');
    return;
  }

  let csv = 'Date,Category,Description,Amount,Location\n';
  expenses.forEach(function (exp) {
    const date = exp.date ? new Date(exp.date).toLocaleDateString('en-IN') : '';
    const desc = (exp.desc || '').replace(/,/g, ';');
    const loc = (exp.location || '').replace(/,/g, ';');
    csv += `${date},${exp.category},${desc},${exp.amount},${loc}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'smart_spend_expenses.csv';
  a.click();
  URL.revokeObjectURL(url);
});

// ---------- Voice Assistant ----------
const voiceBtn = document.getElementById('voiceBtn');
const voiceStatus = document.getElementById('voiceStatus');

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
  voiceBtn.style.display = 'none';
} else {
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.continuous = false;
  recognition.interimResults = false;

  let isListening = false;

  voiceBtn.addEventListener('click', function () {
    if (isListening) return;
    try {
      recognition.start();
    } catch (err) {
      console.log('Recognition already active, restarting...');
    }
  });

  recognition.onstart = function () {
    isListening = true;
    voiceBtn.classList.add('listening');
    voiceStatus.textContent = 'Listening... solunga, "500 rupees food"';
  };

  recognition.onend = function () {
    isListening = false;
    voiceBtn.classList.remove('listening');
  };

  recognition.onerror = function () {
    isListening = false;
    voiceBtn.classList.remove('listening');
    voiceStatus.textContent = 'Kelvi pattuchu illa, marupadiyum try pannunga.';
  };

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript.toLowerCase();
    voiceStatus.textContent = `Kettadhu: "${transcript}"`;

    const amountMatch = transcript.match(/\d+/);
    const amount = amountMatch ? amountMatch[0] : null;

    const categoryKeywords = {
      Food: ['food', 'lunch', 'dinner', 'breakfast', 'eat', 'restaurant'],
      Travel: ['travel', 'bus', 'train', 'taxi', 'petrol', 'fuel', 'auto'],
      Shopping: ['shopping', 'clothes', 'shop', 'buy'],
      Bills: ['bill', 'bills', 'electricity', 'recharge', 'rent'],
      Other: ['other']
    };

    let matchedCategory = null;
    for (const cat in categoryKeywords) {
      if (categoryKeywords[cat].some(function (word) { return transcript.includes(word); })) {
        matchedCategory = cat;
        break;
      }
    }

    if (amount && matchedCategory) {
      const expenses = getExpenses();
      expenses.unshift({
        id: Date.now() + Math.random(),
        amount: amount,
        category: matchedCategory,
        desc: 'Added by voice',
        date: new Date().toISOString()
      });
      saveExpenses(expenses);
      renderExpenses();
      voiceStatus.textContent = `✅ ₹${amount} added ah "${matchedCategory}" category la!`;
    } else {
      voiceStatus.textContent = `Puriyala 🙁 "amount category" madhiri sollunga (e.g., "500 food")`;
    }
  };
}

// ---------- Bill Scanner (OCR) ----------
const scanBtn = document.getElementById('scanBtn');
const billInput = document.getElementById('billInput');
const scanStatus = document.getElementById('scanStatus');

scanBtn.addEventListener('click', function () {
  billInput.click();
});

billInput.addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;

  scanStatus.textContent = '📷 Scanning bill... please wait';
  scanBtn.disabled = true;

  Tesseract.recognize(file, 'eng')
    .then(function (result) {
      const text = result.data.text;
      console.log('OCR Text:', text);

      const matches = text.match(/\d{1,3}(,\d{3})*(\.\d{1,2})?/g);

      if (matches && matches.length > 0) {
        const amounts = matches.map(function (m) {
          return parseFloat(m.replace(/,/g, ''));
        }).filter(function (n) { return !isNaN(n) && n > 0; });

        if (amounts.length > 0) {
          const total = Math.max.apply(null, amounts);
          document.getElementById('expenseAmount').value = total;
          scanStatus.textContent = `✅ Amount detected: ₹${total}. Category select pannunga & Add pannunga.`;
        } else {
          scanStatus.textContent = '🙁 Amount kandupidikala, manual ah type pannunga.';
        }
      } else {
        scanStatus.textContent = '🙁 Amount kandupidikala, manual ah type pannunga.';
      }

      scanBtn.disabled = false;
    })
    .catch(function (err) {
      console.error(err);
      scanStatus.textContent = '❌ Scan fail aachu, marupadiyum try pannunga.';
      scanBtn.disabled = false;
    });
});

// ---------- Location-based Expense ----------
const locationBtn = document.getElementById('locationBtn');
const locationStatus = document.getElementById('locationStatus');

locationBtn.addEventListener('click', function () {
  if (!navigator.geolocation) {
    locationStatus.textContent = '❌ Location support illa unga browser la.';
    return;
  }

  locationStatus.textContent = '📍 Location kandupidikirom...';

  navigator.geolocation.getCurrentPosition(
    function (position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
        .then(function (res) { return res.json(); })
        .then(function (data) {
          const address = data.address || {};
          const place = address.suburb || address.neighbourhood || address.village ||
            address.town || address.city || 'Unknown area';

          capturedLocation = place;
          locationStatus.textContent = `✅ Location added: ${place}`;
        })
        .catch(function () {
          capturedLocation = `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
          locationStatus.textContent = `✅ Location added (coordinates)`;
        });
    },
    function (err) {
      locationStatus.textContent = '❌ Location access denied illa fail aachu.';
    }
  );
});