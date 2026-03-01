// Budget baseline targets for the year 2026 (monthly targets)
const budgetBaseline = {
  year: 2026,
  monthlyTargets: {
    '2026-01': { income: 6000, fixed: 2200, flexible: 800 },
    '2026-02': { income: 6000, fixed: 2200, flexible: 800 },
    '2026-03': { income: 6200, fixed: 2200, flexible: 850 },
    '2026-04': { income: 6200, fixed: 2200, flexible: 850 },
    '2026-05': { income: 6000, fixed: 2200, flexible: 900 },
    '2026-06': { income: 6000, fixed: 2200, flexible: 900 },
    '2026-07': { income: 6300, fixed: 2200, flexible: 950 },
    '2026-08': { income: 6300, fixed: 2200, flexible: 950 },
    '2026-09': { income: 6000, fixed: 2200, flexible: 900 },
    '2026-10': { income: 6000, fixed: 2200, flexible: 900 },
    '2026-11': { income: 6500, fixed: 2200, flexible: 1000 },
    '2026-12': { income: 7000, fixed: 2200, flexible: 1200 }
  }
};

// Categories and sub-categories
const categories = {
  income: ['Salary', 'Bonus', 'Interest', 'Freelance', 'Investment'],
  fixed: ['Rent', 'Mortgage', 'Utilities', 'Insurance', 'Loan Payment', 'Subscription'],
  flexible: ['Groceries', 'Dining', 'Transport', 'Entertainment', 'Shopping', 'Healthcare']
};

// Transactions array (sample records)
const transactions = [
  {
    id: 't-2026-01-001',
    date: '2026-01-03',
    category: 'income',
    sub_category: 'Salary',
    amount: 3000.00,
    note: 'Partial January salary'
  },
  {
    id: 't-2026-01-002',
    date: '2026-01-05',
    category: 'fixed',
    sub_category: 'Rent',
    amount: -1200.00,
    note: 'Monthly apartment rent'
  },
  {
    id: 't-2026-01-012',
    date: '2026-01-12',
    category: 'flexible',
    sub_category: 'Groceries',
    amount: -145.75,
    note: 'Grocery run (supermarket)'
  }
];

// ----- Helper functions for data management and rendering -----
function formatCurrency(v) {
  return v.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

// ----- localStorage persistence -----
const LS_KEY = 'finance_assist:v1';

function saveToLocalStorage() {
  try {
    const payload = {
      budgetBaseline: { monthlyTargets: budgetBaseline.monthlyTargets },
      categories: categories,
      transactions: transactions
    };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    console.log('Saved data to localStorage');
  } catch (err) {
    console.error('Failed to save to localStorage', err);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      console.log('No localStorage data found for', LS_KEY);
      return;
    }
    const parsed = JSON.parse(raw);
    if (parsed && parsed.budgetBaseline && parsed.budgetBaseline.monthlyTargets) {
      budgetBaseline.monthlyTargets = parsed.budgetBaseline.monthlyTargets;
    }
    if (parsed && parsed.categories) {
      // replace categories content
      Object.keys(categories).forEach(k => delete categories[k]);
      Object.assign(categories, parsed.categories);
    }
    if (parsed && Array.isArray(parsed.transactions)) {
      transactions.length = 0;
      parsed.transactions.forEach(t => transactions.push(t));
    }
    console.log('Loaded data from localStorage');
  } catch (err) {
    console.error('Failed to load from localStorage', err);
  }
}

function saveBaseline() {
  const month = document.querySelector('#baseline-month').value; // YYYY-MM
  if (!month) {
    console.warn('No month selected for baseline');
    return;
  }
  const income = parseFloat(document.querySelector('#baseline-income').value) || 0;
  const fixed = parseFloat(document.querySelector('#baseline-fixed').value) || 0;
  const flexible = parseFloat(document.querySelector('#baseline-flexible').value) || 0;
  budgetBaseline.monthlyTargets[month] = { income, fixed, flexible };
  console.log('Saved baseline for', month, budgetBaseline.monthlyTargets[month]);
  renderBaselineDisplay(month);
  saveToLocalStorage();
}

function addTransactionFromForm() {
  const date = document.querySelector('#tx-date').value; // YYYY-MM-DD
  const category = document.querySelector('#tx-category').value;
  const sub = document.querySelector('#tx-sub-select').value || '';
  const amount = parseFloat(document.querySelector('#tx-amount').value) || 0;
  const note = document.querySelector('#tx-note').value || '';
  if (!date) {
    console.warn('Transaction requires a date');
    return;
  }
  const id = `t-${date.replace(/-/g,'')}-${Date.now()}`;
  const tx = { id, date, category, sub_category: sub, amount, note };
  transactions.push(tx);
  console.log('Added transaction', tx);
  renderTransactionsList();
  renderMonthlySummary(date.slice(0,7));
  saveToLocalStorage();
}

function populateSubCategories(category) {
  const select = document.querySelector('#tx-sub-select');
  if (!select) return;
  // clear existing options
  select.innerHTML = '';
  const list = categories[category] || [];
  if (list.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = '-- no sub-categories --';
    select.appendChild(opt);
    return;
  }
  list.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    select.appendChild(opt);
  });
}

function addNewSubCategory() {
  const category = document.querySelector('#tx-category').value;
  const newInput = document.querySelector('#tx-sub-new');
  if (!newInput) return;
  const val = newInput.value && newInput.value.trim();
  if (!val) {
    console.warn('No sub-category entered');
    return;
  }
  // ensure category exists
  if (!categories[category]) categories[category] = [];
  if (!categories[category].includes(val)) {
    categories[category].push(val);
    console.log(`Added new sub-category '${val}' to category '${category}'`);
  } else {
    console.log(`Sub-category '${val}' already exists in '${category}'`);
  }
  populateSubCategories(category);
  // select the newly added option
  const select = document.querySelector('#tx-sub-select');
  if (select) select.value = val;
  // clear input, focus it again, and provide visual feedback
  newInput.value = '';
  newInput.focus();
  const addBtn = document.querySelector('#tx-sub-add');
  if (addBtn) addBtn.disabled = true;
  const msg = document.querySelector('#tx-sub-msg');
  if (msg) {
    msg.textContent = `Added '${val}'`;
    msg.classList.add('success');
    // highlight the select briefly
    if (select) select.classList.add('highlight');
    setTimeout(() => {
      if (msg) {
        msg.textContent = '';
        msg.classList.remove('success');
      }
      if (select) select.classList.remove('highlight');
    }, 2500);
  }
  saveToLocalStorage();
}

function calculateSummaryForMonth(month) {
  // month: 'YYYY-MM'
  const txs = transactions.filter(t => t.date.startsWith(month));
  let income = 0, fixed = 0, flexible = 0;
  txs.forEach(t => {
    if (t.category === 'income') income += t.amount;
    else if (t.category === 'fixed') fixed += t.amount;
    else if (t.category === 'flexible') flexible += t.amount;
  });
  const baseline = budgetBaseline.monthlyTargets[month] || { income: 0, fixed: 0, flexible: 0 };
  return { month, income, fixed, flexible, baseline, transactions: txs };
}

function renderBaselineDisplay(selectedMonth) {
  const container = document.querySelector('#baseline-display');
  if (!container) return;
  if (selectedMonth && budgetBaseline.monthlyTargets[selectedMonth]) {
    const b = budgetBaseline.monthlyTargets[selectedMonth];
    container.innerHTML = `<p><strong>${selectedMonth}</strong>: Income ${formatCurrency(b.income)}, Fixed ${formatCurrency(b.fixed)}, Flexible ${formatCurrency(b.flexible)}</p>`;
  } else {
    const entries = Object.entries(budgetBaseline.monthlyTargets);
    if (entries.length === 0) container.textContent = 'No baseline targets set.';
    else container.innerHTML = '<ul>' + entries.map(([m,v]) => `<li><strong>${m}</strong>: Income ${formatCurrency(v.income)}, Fixed ${formatCurrency(v.fixed)}, Flexible ${formatCurrency(v.flexible)}</li>`).join('') + '</ul>';
  }
}

function renderTransactionsList() {
  const container = document.querySelector('#transactions-list');
  if (!container) return;
  if (transactions.length === 0) {
    container.textContent = 'No transactions recorded.';
    return;
  }
  container.innerHTML = '<ul>' + transactions.map(t => `<li>${t.date} — ${t.category}/${t.sub_category} — ${formatCurrency(t.amount)} — ${t.note || ''}</li>`).join('') + '</ul>';
}

function renderMonthlySummary(month) {
  const container = document.querySelector('#monthly-summary');
  if (!container) return;
  const s = calculateSummaryForMonth(month);
  const netTx = s.income + s.fixed + s.flexible;
  const baselineNet = s.baseline.income - s.baseline.fixed - s.baseline.flexible;
  const diff = netTx - baselineNet;
  container.innerHTML = `
    <h3>${month}</h3>
    <p>Transactions totals — Income: ${formatCurrency(s.income)}, Fixed: ${formatCurrency(s.fixed)}, Flexible: ${formatCurrency(s.flexible)}</p>
    <p>Baseline targets — Income: ${formatCurrency(s.baseline.income)}, Fixed: ${formatCurrency(s.baseline.fixed)}, Flexible: ${formatCurrency(s.baseline.flexible)}</p>
    <p>Net from transactions: ${formatCurrency(netTx)}</p>
    <p>Baseline net target: ${formatCurrency(baselineNet)}</p>
    <p>Difference (net - baselineNet): ${formatCurrency(diff)}</p>
    <p>Transactions count: ${s.transactions.length}</p>
  `;
  console.log('Rendered summary for', month, s, { netTx, baselineNet, diff });
}

// ----- Wire up DOM events -----
document.addEventListener('DOMContentLoaded', function () {
  // keep previous button if present
  const btn = document.getElementById('btn');
  const out = document.getElementById('output');
  if (btn && out) {
    btn.addEventListener('click', () => {
      out.textContent = 'Button clicked at ' + new Date().toLocaleTimeString();
    });
  }

  // baseline form
  const baselineSave = document.querySelector('#baseline-save');
  if (baselineSave) baselineSave.addEventListener('click', saveBaseline);
  const baselineMonth = document.querySelector('#baseline-month');
  if (baselineMonth) baselineMonth.addEventListener('change', (e) => renderBaselineDisplay(e.target.value));

  // load persisted data (if any) before initial render
  loadFromLocalStorage();

  // transaction form
  const txAdd = document.querySelector('#tx-add');
  if (txAdd) txAdd.addEventListener('click', addTransactionFromForm);
  // populate sub-categories when category changes
  const txCategory = document.querySelector('#tx-category');
  if (txCategory) {
    txCategory.addEventListener('change', (e) => populateSubCategories(e.target.value));
    // initial populate
    populateSubCategories(txCategory.value);
  }
  // add-new-sub button
  const txSubAdd = document.querySelector('#tx-sub-add');
  if (txSubAdd) txSubAdd.addEventListener('click', addNewSubCategory);
  // enable/disable add button based on input
  const txSubNew = document.querySelector('#tx-sub-new');
  if (txSubNew) {
    const subAddBtn = document.querySelector('#tx-sub-add');
    const updateBtnState = () => {
      if (!subAddBtn) return;
      const has = txSubNew.value && txSubNew.value.trim().length > 0;
      subAddBtn.disabled = !has;
    };
    txSubNew.addEventListener('input', updateBtnState);
    // initial state
    updateBtnState();
  }

  // initial renders
  renderBaselineDisplay();
  renderTransactionsList();
  renderMonthlySummary('2026-01');

  console.log('script.js loaded');
  console.log('budgetBaseline:', budgetBaseline);
  console.log('categories:', categories);
  console.log('transactions (sample):', transactions);
});
