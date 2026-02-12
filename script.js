// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            // Close mobile menu if open
            if (window.innerWidth <= 992 && navLinks && navLinks.style.display === 'flex') {
                navLinks.style.display = 'none';
            }
            
            // Calculate the position to scroll to
            const headerHeight = document.querySelector('.header').offsetHeight;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Add shadow to header on scroll
const header = document.querySelector('.header');
if (header) {
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 2px 15px rgba(0, 0, 0, 0.1)';
        }
    });
}

// Handle window resize
function handleResize() {
    if (!navLinks) return;
    if (window.innerWidth > 992) {
        navLinks.style.display = 'flex';
    } else {
        navLinks.style.display = 'none';
    }
}

if (navLinks) {
    window.addEventListener('resize', handleResize);
    // Initialize
    handleResize();
}

// Add animation to elements when they come into view
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.product-card, .feature, .customer-link');
    
    elements.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const screenPosition = window.innerHeight / 1.3;
        
        if (elementPosition < screenPosition) {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }
    });
};

// Set initial styles for animation
document.addEventListener('DOMContentLoaded', () => {
    const elements = document.querySelectorAll('.product-card, .feature, .customer-link');
    elements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Trigger animation for elements in view on load
    setTimeout(animateOnScroll, 100);
});

// Add scroll event listener for animations
window.addEventListener('scroll', animateOnScroll);

/* --- Simple Cart Implementation --- */
const CART_KEY = 'panfex_cart_v1';
let cart = [];

function loadCart() {
    try {
        // 1) pokus o načtení z URL (?cart=...) – jednoduchý JSON bez ručního kódování
        const params = new URLSearchParams(window.location.search);
        const rawFromUrl = params.get('cart');
        if (rawFromUrl) {
            const fromUrl = JSON.parse(rawFromUrl);
            if (Array.isArray(fromUrl)) {
                cart = fromUrl;
                saveCart();
                return;
            }
        }

        // 2) localStorage
        const raw = localStorage.getItem(CART_KEY);
        if (raw) {
            cart = JSON.parse(raw);
            return;
        }

        // 3) window.name fallback (file:// režim v jednom panelu)
        if (window.name && window.name.startsWith('PANFEX_CART:')) {
            const json = window.name.substring('PANFEX_CART:'.length);
            cart = JSON.parse(json || '[]');
            return;
        }

        cart = [];
    } catch (e) {
        cart = [];
    }
}

function saveCart() {
    const json = JSON.stringify(cart);
    try {
        localStorage.setItem(CART_KEY, json);
    } catch (e) {
        // ignore
    }
    // Ulož i do window.name, aby se košík sdílel mezi stránkami i při otevření z disku
    try {
        window.name = 'PANFEX_CART:' + json;
    } catch (e) {
        // ignore
    }
}

function formatPrice(n) {
    return n + ' Kč';
}

function updateCartUI() {
    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const pageItemsEl = document.getElementById('cart-page-items');
    const pageTotalEl = document.getElementById('cart-page-total');
    const pageCheckoutEl = document.getElementById('cart-page-checkout');

    const totalQty = cart.reduce((s, it) => s + (it.qty || 0), 0);
    const totalPrice = cart.reduce((s, it) => s + (Number(it.price || 0) * (it.qty || 0)), 0);

    if (countEl) countEl.textContent = totalQty;
    if (totalEl) totalEl.textContent = formatPrice(totalPrice);

    if (itemsEl) {
        if (cart.length === 0) {
            itemsEl.innerHTML = '<div style="padding:0.8rem;color:var(--gray-dark)">Košík je prázdný.</div>';
        } else {
            itemsEl.innerHTML = cart.map(it => {
                const thumb = it.image
                    ? `
                        <div class="cart-item-thumb">
                            <img src="${escapeHtml(it.image)}" alt="${escapeHtml(it.name)}">
                        </div>
                    `
                    : '';

                return `
                    <div class="cart-item" data-id="${it.id}">
                        ${thumb}
                        <div class="cart-item-info">
                            <div class="item-name">${escapeHtml(it.name)}</div>
                            <div class="item-meta">${formatPrice(it.price)} × ${it.qty}</div>
                        </div>
                        <div class="item-actions">
                            <button class="btn btn-small" data-decrease-id="${it.id}">-</button>
                            <button class="btn btn-small" data-increase-id="${it.id}">+</button>
                            <button class="btn btn-small" data-remove-id="${it.id}">Smazat</button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    // Render cart page (if present)
    if (pageItemsEl) {
        if (cart.length === 0) {
            pageItemsEl.innerHTML = '<p style="padding:1rem;color:var(--gray-dark)">Košík je prázdný.</p>';
        } else {
            pageItemsEl.innerHTML = cart.map(it => `
                <div class="cart-item" data-id="${it.id}" style="align-items:flex-start;">
                    ${it.image ? `
                        <div class="cart-item-thumb">
                            <img src="${escapeHtml(it.image)}" alt="${escapeHtml(it.name)}">
                        </div>
                    ` : ''}
                    <div class="cart-item-info">
                        <div class="item-name">${escapeHtml(it.name)}</div>
                        <div class="item-meta">${formatPrice(it.price)} × ${it.qty}</div>
                    </div>
                    <div class="item-actions">
                        <button class="btn btn-small" data-decrease-id="${it.id}">-</button>
                        <button class="btn btn-small" data-increase-id="${it.id}">+</button>
                        <button class="btn btn-small" data-remove-id="${it.id}">Smazat</button>
                    </div>
                </div>
            `).join('');
        }
    }

    if (pageTotalEl) pageTotalEl.textContent = 'Celkem: ' + formatPrice(totalPrice);
    if (pageCheckoutEl) pageCheckoutEl.href = cart.length ? '#' : '#';
}

function escapeHtml(text) {
    return String(text).replace(/[&"'<>]/g, function (s) {
        return ({'&':'&amp;','"':'&quot;','\'':'&#39;','<':'&lt;','>':'&gt;'}[s]);
    });
}

function addToCart(product) {
    // product: {id, name, price, qty}
    if (!product || !product.id) return;
    const id = String(product.id);
    const price = Number(product.price || 0);
    const qty = Number(product.qty || 1);
    const image = product.image || product.img || product.picture || null;

    const existing = cart.find(i => String(i.id) === id);
    if (existing) {
        existing.qty = (existing.qty || 0) + qty;
        if (image && !existing.image) {
            existing.image = image;
        }
    } else {
        cart.push({ id, name: product.name || 'Produkt', price, qty, image });
    }
    saveCart();
    updateCartUI();
}

// Expose global function so pages can call: window.addToCart({id, name, price})
window.addToCart = addToCart;

// Wire add-to-cart buttons using data-add-to-cart attributes
document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-add-to-cart]');
    if (addBtn) {
        const id = addBtn.getAttribute('data-id') || addBtn.getAttribute('data-product-id');
        const name = addBtn.getAttribute('data-name') || addBtn.getAttribute('data-product-name') || addBtn.dataset.name;
        const price = addBtn.getAttribute('data-price') || addBtn.dataset.price || 0;
        addToCart({ id, name, price, qty: 1 });
        return;
    }

    const removeBtn = e.target.closest('[data-remove-id]');
    if (removeBtn) {
        const id = String(removeBtn.getAttribute('data-remove-id'));
        const confirmed = window.confirm('Opravdu chcete tuto položku odstranit z košíku?');
        if (!confirmed) {
            return;
        }
        cart = cart.filter(i => String(i.id) !== id);
        saveCart();
        updateCartUI();
        return;
    }

    const decBtn = e.target.closest('[data-decrease-id]');
    if (decBtn) {
        const id = String(decBtn.getAttribute('data-decrease-id'));
        const item = cart.find(i => String(i.id) === id);
        if (item) {
            item.qty = Math.max(0, (item.qty || 1) - 1);
            if (item.qty === 0) cart = cart.filter(i => String(i.id) !== id);
            saveCart();
            updateCartUI();
        }
        return;
    }

    const incBtn = e.target.closest('[data-increase-id]');
    if (incBtn) {
        const id = String(incBtn.getAttribute('data-increase-id'));
        const item = cart.find(i => String(i.id) === id);
        if (item) {
            item.qty = (item.qty || 0) + 1;
            saveCart();
            updateCartUI();
        }
        return;
    }
});

// Cart dropdown toggle and outside click
document.addEventListener('DOMContentLoaded', () => {
    // Load cart and render header dropdown contents. Dropdown is shown on hover (CSS).
    loadCart();
    updateCartUI();

    // Keep cart dropdown open while moving cursor from icon to panel
    const cartEl = document.getElementById('cart');
    const dropdownEl = document.getElementById('cart-dropdown');
    if (cartEl && dropdownEl) {
        let hideTimer;
        const showDropdown = () => {
            clearTimeout(hideTimer);
            cartEl.classList.add('show-dropdown');
        };
        const hideDropdown = () => {
            hideTimer = setTimeout(() => cartEl.classList.remove('show-dropdown'), 250);
        };

        cartEl.addEventListener('mouseenter', showDropdown);
        cartEl.addEventListener('mouseleave', hideDropdown);
        dropdownEl.addEventListener('mouseenter', showDropdown);
        dropdownEl.addEventListener('mouseleave', hideDropdown);
    }

    // Při přechodu na stránku košíku předej obsah košíku i přes URL,
    // aby se zobrazil stejně jako v rozbalovacím košíku i tam, kde localStorage nefunguje.
    const checkoutLinks = document.querySelectorAll('#checkout-btn, #cart-page-checkout, #cart-btn');
    checkoutLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (!cart || !cart.length) {
                return; // prázdný košík – necháme standardní chování
            }
            try {
                e.preventDefault();
                const targetUrl = new URL(link.getAttribute('href'), window.location.href);
                // JSON přímo do parametru; URLSearchParams ho sama zakóduje
                targetUrl.searchParams.set('cart', JSON.stringify(cart));
                window.location.href = targetUrl.toString();
            } catch (err) {
                // fallback – pokud URL selže, necháme odkaz pokračovat normálně
            }
        });
    });
});
