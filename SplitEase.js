   let people = [];
        let items = [];
        let tipPct = 0;
        let currency = '₦';

        // CURRENCY
        document.getElementById('currency-select').addEventListener('change', function () {
            currency = this.value;
            document.getElementById('currency-prefix').textContent = currency;
            document.getElementById('currency-prefix2').textContent = currency;
            if (document.getElementById('result-section').style.display !== 'none') calculate();
        });

        // PEOPLE
        document.getElementById('person-input').addEventListener('keydown', e => { if (e.key === 'Enter') addPerson(); });

        function addPerson() {
            const input = document.getElementById('person-input');
            const name = input.value.trim();
            if (!name) return showToast('Enter a name first');
            if (people.includes(name)) return showToast('That name already exists');
            people.push(name);
            input.value = '';
            renderPeople();
            renderChips();
        }

        function removePerson(name) {
            people = people.filter(p => p !== name);
            items = items.map(item => ({
                ...item,
                for: item.for.filter(p => p !== name)
            })).filter(item => item.for.length > 0 || people.length === 0);
            renderPeople();
            renderItems();
            renderChips();
        }

        function renderPeople() {
            const el = document.getElementById('people-list');
            if (!people.length) { el.innerHTML = '<div class="empty">Add people to split with</div>'; return; }
            el.innerHTML = people.map(name => `
    <div class="person-row">
      <div class="person-avatar">${name[0].toUpperCase()}</div>
      <span class="person-name">${name}</span>
      <button class="person-remove" onclick="removePerson('${name.replace(/'/g, "\\'")}')">✕</button>
    </div>
  `).join('');
        }

        // CHIPS
        let selectedPeople = [];
        function renderChips() {
            const el = document.getElementById('person-chips');
            if (!people.length) { el.innerHTML = '<div class="empty" style="padding:6px 0;">Add people first</div>'; return; }
            selectedPeople = selectedPeople.filter(p => people.includes(p));
            el.innerHTML = `
    <div class="chip chip-all ${selectedPeople.length === 0 ? 'active' : ''}" onclick="selectAllChips(this)">All</div>
    ${people.map(name => `
      <div class="chip ${selectedPeople.includes(name) ? 'active' : ''}" onclick="toggleChip(this,'${name.replace(/'/g, "\\'")}')">${name}</div>
    `).join('')}
  `;
        }
        function toggleChip(el, name) {
            if (selectedPeople.includes(name)) selectedPeople = selectedPeople.filter(p => p !== name);
            else selectedPeople.push(name);
            renderChips();
        }
        function selectAllChips(el) {
            selectedPeople = [];
            renderChips();
        }

        // ITEMS
        document.getElementById('item-name').addEventListener('keydown', e => { if (e.key === 'Enter') addItem(); });

        function addItem() {
            const name = document.getElementById('item-name').value.trim();
            const amount = parseFloat(document.getElementById('item-amount').value);
            if (!name) return showToast('Enter an item name');
            if (!amount || amount <= 0) return showToast('Enter a valid amount');
            if (!people.length) return showToast('Add people first');
            const forPeople = selectedPeople.length ? [...selectedPeople] : [...people];
            items.push({ name, amount, for: forPeople, id: Date.now() });
            document.getElementById('item-name').value = '';
            document.getElementById('item-amount').value = '';
            selectedPeople = [];
            renderItems();
            renderChips();
        }

        function removeItem(id) {
            items = items.filter(i => i.id !== id);
            renderItems();
        }

        function renderItems() {
            const el = document.getElementById('items-list');
            if (!items.length) { el.innerHTML = '<div class="empty">No items added yet</div>'; return; }
            el.innerHTML = items.map(item => `
    <div class="item-row">
      <div class="item-dot"></div>
      <span class="item-name">${item.name}</span>
      <span class="item-tag">${item.for.join(', ')}</span>
      <span class="item-amount">${currency}${item.amount.toFixed(2)}</span>
      <button class="person-remove" onclick="removeItem(${item.id})">✕</button>
    </div>
  `).join('');
        }

        // TIP
        function setTip(pct, btn) {
            tipPct = pct;
            document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById('tip-custom').value = '';
        }
        function setCustomTip(val) {
            tipPct = parseFloat(val) || 0;
            document.querySelectorAll('.tip-btn').forEach(b => b.classList.remove('active'));
        }
        function recalculate() {
            if (document.getElementById('result-section').style.display !== 'none') calculate();
        }

        // CALCULATE
        function calculate() {
            if (!people.length) return showToast('Add at least one person');
            if (!items.length) return showToast('Add at least one item');

            const subtotal = items.reduce((s, i) => s + i.amount, 0);
            const tipAmt = subtotal * (tipPct / 100);
            const extra = parseFloat(document.getElementById('extra-charge').value) || 0;
            const total = subtotal + tipAmt + extra;
            const extraPerPerson = people.length ? (tipAmt + extra) / people.length : 0;

            const owed = {};
            people.forEach(p => { owed[p] = { base: 0, extra: extraPerPerson, items: [] }; });

            items.forEach(item => {
                const share = item.amount / item.for.length;
                item.for.forEach(person => {
                    if (owed[person]) {
                        owed[person].base += share;
                        owed[person].items.push(`${item.name} (${currency}${share.toFixed(2)})`);
                    }
                });
            });

            document.getElementById('sum-subtotal').textContent = currency + subtotal.toFixed(2);
            document.getElementById('sum-tip').textContent = currency + (tipAmt + extra).toFixed(2);
            document.getElementById('sum-total').textContent = currency + total.toFixed(2);

            const rows = document.getElementById('result-rows');
            rows.innerHTML = people.map(p => {
                const personTotal = (owed[p].base + owed[p].extra);
                return `
      <div class="result-row">
        <div class="result-person">
          <div class="result-avatar">${p[0].toUpperCase()}</div>
          <div>
            <div class="result-name">${p}</div>
            <div class="result-items">${owed[p].items.join(' · ') || 'No items assigned'}</div>
          </div>
        </div>
        <div class="result-amount">${currency}${personTotal.toFixed(2)}</div>
      </div>
    `;
            }).join('');

            document.getElementById('result-section').style.display = 'block';
            document.getElementById('result-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // COPY
        function copyResult() {
            const subtotal = items.reduce((s, i) => s + i.amount, 0);
            const tipAmt = subtotal * (tipPct / 100);
            const extra = parseFloat(document.getElementById('extra-charge').value) || 0;
            const total = subtotal + tipAmt + extra;
            const extraPP = people.length ? (tipAmt + extra) / people.length : 0;

            const owed = {};
            people.forEach(p => { owed[p] = 0; });
            items.forEach(item => {
                const share = item.amount / item.for.length;
                item.for.forEach(p => { if (owed[p] !== undefined) owed[p] += share; });
            });

            const lines = [`🧾 SplitEase Bill — Total: ${currency}${total.toFixed(2)}`, ''];
            people.forEach(p => {
                lines.push(`${p}: ${currency}${(owed[p] + extraPP).toFixed(2)}`);
            });

            navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('✓ Copied to clipboard'));
        }

        // RESET
        function resetAll() {
            people = []; items = []; tipPct = 0; selectedPeople = [];
            document.getElementById('tip-custom').value = '';
            document.getElementById('extra-charge').value = '';
            document.querySelectorAll('.tip-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
            renderPeople(); renderItems(); renderChips();
            document.getElementById('result-section').style.display = 'none';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // TOAST
        function showToast(msg) {
            const t = document.getElementById('toast');
            t.textContent = msg;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 2500);
        }