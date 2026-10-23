let currentUser = { name: "Visitante", role: "Cliente" };

let products = [
    { id: 1, name: "Arroz Branco Tipo 1 (5kg)", category: "Mercearia", price: 26.90, stock: 18, expiryDays: 120, icon: "🌾", sold: 42 },
    { id: 2, name: "Feijão Carioca Selecionado (1kg)", category: "Mercearia", price: 8.50, stock: 24, expiryDays: 90, icon: "🫘", sold: 35 },
    { id: 3, name: "Leite Integral UHT Longa Vida (1L)", category: "Laticínios", price: 5.49, stock: 4, expiryDays: 5, icon: "🥛", sold: 88 },
    { id: 4, name: "Maçã Gala Fresca (Kg)", category: "Hortifruti", price: 9.90, stock: 12, expiryDays: 4, icon: "🍎", sold: 50 },
    { id: 5, name: "Pão Francês Artesanal (Kg)", category: "Padaria", price: 14.90, stock: 8, expiryDays: 2, icon: "🥖", sold: 120 },
    { id: 6, name: "Picanha Bovina Maturada (Kg)", category: "Açougue", price: 59.90, stock: 6, expiryDays: 6, icon: "🥩", sold: 25 },
    { id: 7, name: "Cerveja Pilsen Puro Malte (350ml)", category: "Bebidas", price: 4.29, stock: 60, expiryDays: 180, icon: "🍺", sold: 210 },
    { id: 8, name: "Detergente Líquido Neutro (500ml)", category: "Limpeza", price: 2.99, stock: 35, expiryDays: 365, icon: "🧼", sold: 75 }
];

let cart = [];
let discountRate = 0;
let ordersHistory = [
    { id: 1001, time: "14:20", customer: "Maria Silva", total: 64.30, payment: "PIX" }
];
let currentCategoryFilter = "Todos";

// NAVEGAÇÃO DE TELAS
function switchView(viewName) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewName === 'stock-admin') {
        renderAdminTable();
        updateAdminStats();
    }
}

// ALTERNAR TABS DE AUTH
function switchAuthTab(tab) {
    document.querySelectorAll('.atab').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    
    if (tab === 'login') {
        document.querySelectorAll('.atab')[0].classList.add('active');
        document.getElementById('form-login').classList.add('active');
    } else {
        document.querySelectorAll('.atab')[1].classList.add('active');
        document.getElementById('form-register').classList.add('active');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const role = document.getElementById('login-role').value;
    const namePart = email.split('@')[0];

    currentUser = {
        name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
        role: role
    };

    document.getElementById('user-display').textContent = `👤 ${currentUser.name} (${currentUser.role})`;
    showToast(`Bem-vindo(a) de volta, ${currentUser.name}!`);
    switchView('store');
}

function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    currentUser = { name, role: "Cliente" };
    document.getElementById('user-display').textContent = `👤 ${currentUser.name}`;
    showToast(`Conta criada com sucesso para ${name}!`);
    switchView('store');
}

// FILTROS E ORDENAÇÃO DO CATÁLOGO
function filterCategory(cat) {
    currentCategoryFilter = cat;
    document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('current-category-title').textContent = cat === 'Todos' ? 'Todos os Produtos' : `Departamento: ${cat}`;
    renderCatalog();
}

function filterCatalog() {
    renderCatalog();
}

function sortCatalog() {
    renderCatalog();
}

function renderCatalog() {
    const search = document.getElementById('global-search').value.toLowerCase();
    const sortVal = document.getElementById('sort-select').value;
    const grid = document.getElementById('product-grid');

    let filtered = products.filter(p => {
        const matchSearch = p.name.toLowerCase().includes(search);
        const matchCat = currentCategoryFilter === 'Todos' || p.category === currentCategoryFilter;
        return matchSearch && matchCat;
    });

    if (sortVal === 'price-asc') filtered.sort((a,b) => a.price - b.price);
    if (sortVal === 'price-desc') filtered.sort((a,b) => b.price - a.price);
    if (sortVal === 'pop') filtered.sort((a,b) => b.sold - a.sold);

    if (filtered.length === 0) {
        grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--slate-500);">Nenhum produto encontrado.</p>`;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const isAlert = p.stock <= 5 || p.expiryDays <= 7;
        const tagText = p.expiryDays <= 7 ? `⚠️ Vence em ${p.expiryDays}d` : (p.stock <= 5 ? `⚠️ Restam ${p.stock}` : p.category);

        return `
            <div class="product-card">
                <div>
                    <div class="pcard-top">
                        <div class="pcard-emoji">${p.icon}</div>
                        <span class="pcard-tag ${isAlert ? 'alert' : ''}">${tagText}</span>
                    </div>
                    <div class="pcard-name">${p.name}</div>
                    <div class="pcard-meta">Estoque: ${p.stock} un | Validade: ${p.expiryDays} dias</div>
                </div>
                <div class="pcard-bottom">
                    <span class="pcard-price">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
                    <button class="btn btn-primary btn-sm" onclick="addToCart(${p.id})" ${p.stock <= 0 ? 'disabled' : ''}>
                        ${p.stock > 0 ? '+ Adicionar' : 'Esgotado'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// GESTÃO DO CARRINHO (DESKTOP E DRAWER MÓVEL)
function addToCart(id) {
    const prod = products.find(p => p.id === id);
    if (!prod || prod.stock <= 0) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        if (existing.qty < prod.stock) {
            existing.qty++;
        } else {
            showToast("⚠️ Quantidade máxima em stock atingida!");
            return;
        }
    } else {
        cart.push({ id: prod.id, name: prod.name, price: prod.price, qty: 1 });
    }

    renderCartUI();
    showToast(`🛒 ${prod.name} adicionado ao carrinho!`);
}

function updateCartQty(id, delta) {
    const item = cart.find(i => i.id === id);
    const prod = products.find(p => p.id === id);
    if (!item) return;

    const newQty = item.qty + delta;
    if (newQty <= 0) {
        cart = cart.filter(i => i.id !== id);
    } else if (prod && newQty <= prod.stock) {
        item.qty = newQty;
    } else {
        showToast("⚠️ Stock máximo atingido!");
    }
    renderCartUI();
}

function applyCoupon() {
    const code = document.getElementById('coupon-input').value.trim().toUpperCase();
    if (code === 'MERCADO10') {
        discountRate = 0.10;
        showToast("🎉 Cupom MERCADO10 aplicado (10% OFF)!");
    } else {
        discountRate = 0;
        showToast("❌ Cupom inválido.");
    }
    renderCartUI();
}

function renderCartUI() {
    const totalItems = cart.reduce((acc, i) => acc + i.qty, 0);
    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const discount = subtotal * discountRate;
    const finalTotal = subtotal - discount;

    // Atualizar Header Badge
    document.getElementById('header-cart-count').textContent = totalItems;
    document.getElementById('header-cart-total').textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;

    // Renderizar Mini Carrinho Desktop e Drawer Móvel
    const htmlContent = cart.length === 0 ? 
        `<p style="text-align:center; color:var(--slate-500); padding:2rem 0;">Carrinho vazio.</p>` :
        cart.map(i => `
            <div class="minicart-item">
                <div>
                    <strong>${i.name}</strong>
                    <small style="color:var(--slate-500)">R$ ${i.price.toFixed(2).replace('.', ',')} x ${i.qty}</small>
                </div>
                <div class="minicart-controls">
                    <button onclick="updateCartQty(${i.id}, -1)">-</button>
                    <span>${i.qty}</span>
                    <button onclick="updateCartQty(${i.id}, 1)">+</button>
                </div>
            </div>
        `).join('');

    document.getElementById('mini-cart-items').innerHTML = htmlContent;
    document.getElementById('drawer-items').innerHTML = htmlContent;

    // Valores
    ['cart-subtotal', 'drawer-subtotal'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`; });
    ['cart-discount', 'drawer-discount'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).textContent = `- R$ ${discount.toFixed(2).replace('.', ',')}`; });
    ['cart-final-total', 'drawer-final'].forEach(id => { if(document.getElementById(id)) document.getElementById(id).textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`; });
}

function toggleCartDrawer() {
    document.getElementById('cart-drawer').classList.toggle('open');
    document.getElementById('drawer-backdrop').classList.toggle('show');
}

// CHECKOUT / PAGAMENTO
function openCheckoutModal() {
    if (cart.length === 0) {
        showToast("⚠️ Adicione produtos ao carrinho antes de finalizar!");
        return;
    }
    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const finalTotal = subtotal * (1 - discountRate);
    document.getElementById('modal-pay-total').textContent = `R$ ${finalTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('checkout-modal').classList.add('open');
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('open');
}

function finalizeOrder() {
    const subtotal = cart.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const finalTotal = subtotal * (1 - discountRate);

    // Dar baixa no stock
    cart.forEach(item => {
        const p = products.find(prod => prod.id === item.id);
        if(p) {
            p.stock -= item.qty;
            p.sold += item.qty;
        }
    });

    ordersHistory.unshift({
        id: 1000 + ordersHistory.length + 1,
        time: new Date().toTimeString().slice(0,5),
        customer: currentUser.name,
        total: finalTotal,
        payment: "PIX"
    });

    cart = [];
    discountRate = 0;
    renderCartUI();
    renderCatalog();
    closeCheckoutModal();
    if(document.getElementById('cart-drawer').classList.contains('open')) toggleCartDrawer();
    showToast("✅ Pedido finalizado com sucesso! Stock atualizado.");
}

// GESTÃO DE ESTOQUE E VALIDADE (ADMIN)
function renderAdminTable() {
    const search = document.getElementById('admin-search').value.toLowerCase();
    const filterStatus = document.getElementById('admin-filter-status').value;
    const tbody = document.getElementById('admin-table-body');

    let filtered = products.filter(p => {
        const matchName = p.name.toLowerCase().includes(search);
        const isAlert = p.stock <= 5 || p.expiryDays <= 7;
        const matchStatus = filterStatus === 'all' || (filterStatus === 'alert' && isAlert);
        return matchName && matchStatus;
    });

    tbody.innerHTML = filtered.map(p => {
        const isAlertStock = p.stock <= 5;
        const isAlertExpiry = p.expiryDays <= 7;
        
        let badgeHtml = `<span class="status-badge ok">✅ Normal</span>`;
        if (isAlertExpiry) badgeHtml = `<span class="status-badge danger">⚠️ Vence em ${p.expiryDays}d</span>`;
        else if (isAlertStock) badgeHtml = `<span class="status-badge warn">⚠️ Stock Baixo (${p.stock})</span>`;

        return `
            <tr>
                <td><strong>${p.icon} ${p.name}</strong></td>
                <td>${p.category}</td>
                <td>R$ ${p.price.toFixed(2).replace('.', ',')}</td>
                <td><strong>${p.stock} un</strong></td>
                <td>${p.expiryDays} dias</td>
                <td>${badgeHtml}</td>
                <td>
                    <button class="btn btn-sm btn-dark" onclick="restockAdmin(${p.id})">+10 Stock</button>
                    ${isAlertExpiry ? `<button class="btn btn-sm btn-primary" onclick="promoAdmin(${p.id})">Promo -20%</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

function updateAdminStats() {
    document.getElementById('stat-total-prod').textContent = products.length;
    const alertExpiry = products.filter(p => p.expiryDays <= 7).length;
    const alertStock = products.filter(p => p.stock <= 5).length;
    const totalRev = ordersHistory.reduce((acc, o) => acc + o.total, 0);

    document.getElementById('stat-alert-expiry').textContent = alertExpiry;
    document.getElementById('stat-alert-stock').textContent = alertStock;
    document.getElementById('stat-revenue').textContent = `R$ ${totalRev.toFixed(2).replace('.', ',')}`;
}

function restockAdmin(id) {
    const p = products.find(prod => prod.id === id);
    if(p) {
        p.stock += 10;
        renderAdminTable();
        updateAdminStats();
        showToast(`📦 +10 unidades adicionadas ao stock de ${p.name}`);
    }
}

function promoAdmin(id) {
    const p = products.find(prod => prod.id === id);
    if(p) {
        p.price = +(p.price * 0.8).toFixed(2);
        renderAdminTable();
        showToast(`🔥 Promoção de liquidação aplicada em ${p.name}!`);
    }
}

function openNewProductModal() {
    document.getElementById('product-modal').classList.add('open');
}

function closeNewProductModal() {
    document.getElementById('product-modal').classList.remove('open');
}

function handleAddNewProduct(e) {
    e.preventDefault();
    const name = document.getElementById('new-name').value;
    const category = document.getElementById('new-cat').value;
    const icon = document.getElementById('new-icon').value;
    const price = parseFloat(document.getElementById('new-price').value);
    const stock = parseInt(document.getElementById('new-stock').value, 10);
    const expiryDays = parseInt(document.getElementById('new-expiry').value, 10);

    products.unshift({
        id: Date.now(),
        name, category, price, stock, expiryDays, icon, sold: 0
    });

    closeNewProductModal();
    renderCatalog();
    renderAdminTable();
    updateAdminStats();
    showToast(`✅ Produto "${name}" cadastrado com sucesso!`);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Inicialização
window.addEventListener('DOMContentLoaded', () => {
    renderCatalog();
    renderCartUI();
});
