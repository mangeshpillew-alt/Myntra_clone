document.addEventListener('DOMContentLoaded', () => {
    const BAG_STORAGE_KEY = 'myntra_bag_items';
    const DELIVERY_PINCODE_KEY = 'myntra_delivery_pincode';

    function readStorage(key, fallback) {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    const cartItemsList = document.getElementById('cartItemsList');
    const emptyBagState = document.getElementById('emptyBagState');
    const priceBlock = document.getElementById('priceBlock');

    const totalItemsCount = document.getElementById('totalItemsCount');
    const totalMRP = document.getElementById('totalMRP');
    const totalDiscount = document.getElementById('totalDiscount');
    const finalAmount = document.getElementById('finalAmount');
    const placeOrderBtn = document.getElementById('placeOrderBtn');
    const addressButton = document.querySelector('.change_address_btn');
    const pincodeDisplay = document.getElementById('userPincode');

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    function getBagItems() {
        return readStorage(BAG_STORAGE_KEY, []);
    }

    function saveBagItems(items) {
        localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(items));
        renderCheckout();
    }

    function renderCheckout() {
        const items = getBagItems();
        const savedPincode = localStorage.getItem(DELIVERY_PINCODE_KEY);
        if (savedPincode && pincodeDisplay) {
            pincodeDisplay.textContent = `Delivery to ${savedPincode}`;
        }

        if (items.length === 0) {
            if (cartItemsList) cartItemsList.innerHTML = '';
            if (cartItemsList) cartItemsList.classList.add('hidden');
            if (emptyBagState) emptyBagState.classList.remove('hidden');
            if (priceBlock) priceBlock.classList.add('hidden');
            return;
        }

        if (cartItemsList) cartItemsList.classList.remove('hidden');
        if (emptyBagState) emptyBagState.classList.add('hidden');
        if (priceBlock) priceBlock.classList.remove('hidden');

        if (!cartItemsList) return;

        // Render Cards
        cartItemsList.innerHTML = items.map((item, index) => {
            const mrpValue = item.mrp && item.mrp > 0 ? item.mrp : item.price;
            const quantity = Math.max(1, Number(item.quantity) || 1);
            const title = escapeHtml(item.title || 'Fashion item');
            const subtitle = escapeHtml(item.subtitle || '');
            const image = escapeHtml(item.image || 'https://via.placeholder.com/150');
            const itemId = escapeHtml(item.id || '');
            return `
                <div class="bag_item_card" data-id="${itemId}">
                    <img src="${image}" alt="${title}" class="item_img">
                    <div class="item_details">
                        <h4 class="item_title">${title}</h4>
                        <p class="item_subtitle">${subtitle}</p>
                        
                        <div class="quantity_selector">
                            <span>Qty:</span>
                            <button type="button" class="qty_btn decrease_qty" data-index="${index}" aria-label="Decrease quantity">-</button>
                            <strong>${quantity}</strong>
                            <button type="button" class="qty_btn increase_qty" data-index="${index}" aria-label="Increase quantity">+</button>
                        </div>

                        <div class="price_row_item">
                            <span class="bold_price">₹${(item.price * quantity).toLocaleString('en-IN')}</span>
                            ${mrpValue > item.price ? `<span class="item_mrp">₹${(mrpValue * quantity).toLocaleString('en-IN')}</span>` : ''}
                            ${item.discount ? `<span class="item_discount">(${escapeHtml(item.discount)}% OFF)</span>` : ''}
                        </div>
                    </div>
                    <button type="button" class="remove_item_btn" data-index="${index}" title="Remove item" aria-label="Remove ${title} from bag">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
            `;
        }).join('');

        // Calculate Pricing
        let sumMRP = 0;
        let sumFinalPrice = 0;
        let totalCount = 0;

        items.forEach(item => {
            const qty = item.quantity || 1;
            const itemMRP = item.mrp && item.mrp > 0 ? item.mrp : item.price;
            
            sumMRP += itemMRP * qty;
            sumFinalPrice += item.price * qty;
            totalCount += qty;
        });

        const discountTotal = sumMRP - sumFinalPrice;

        if (totalItemsCount) totalItemsCount.textContent = totalCount;
        if (totalMRP) totalMRP.textContent = `₹${sumMRP.toLocaleString('en-IN')}`;
        if (totalDiscount) totalDiscount.textContent = `-₹${discountTotal.toLocaleString('en-IN')}`;
        if (finalAmount) finalAmount.textContent = `₹${sumFinalPrice.toLocaleString('en-IN')}`;

        attachEventListeners();
    }

    function attachEventListeners() {
        // Remove Item
        document.querySelectorAll('.remove_item_btn').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-index'), 10);
                const items = getBagItems();
                items.splice(idx, 1);
                saveBagItems(items);
            };
        });

        // Increase Quantity
        document.querySelectorAll('.increase_qty').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-index'), 10);
                const items = getBagItems();
                items[idx].quantity = (items[idx].quantity || 1) + 1;
                saveBagItems(items);
            };
        });

        // Decrease Quantity
        document.querySelectorAll('.decrease_qty').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-index'), 10);
                const items = getBagItems();
                if ((items[idx].quantity || 1) > 1) {
                    items[idx].quantity -= 1;
                } else {
                    items.splice(idx, 1);
                }
                saveBagItems(items);
            };
        });
    }

    placeOrderBtn?.addEventListener('click', () => {
        if (!window.confirm('Place this demo order? No payment will be collected.')) return;
        window.alert('Demo order placed! Thank you for shopping with us.');
        localStorage.removeItem(BAG_STORAGE_KEY);
        renderCheckout();
    });

    addressButton?.addEventListener('click', () => {
        const currentPincode = localStorage.getItem(DELIVERY_PINCODE_KEY) || '';
        const pincode = window.prompt('Enter your 6-digit delivery pincode:', currentPincode);
        if (pincode === null) return;

        const normalizedPincode = pincode.trim();
        if (!/^\d{6}$/.test(normalizedPincode)) {
            window.alert('Please enter a valid 6-digit pincode.');
            return;
        }

        localStorage.setItem(DELIVERY_PINCODE_KEY, normalizedPincode);
        if (pincodeDisplay) pincodeDisplay.textContent = `Delivery to ${normalizedPincode}`;
    });

    window.addEventListener('storage', event => {
        if (event.key === BAG_STORAGE_KEY || event.key === DELIVERY_PINCODE_KEY) {
            renderCheckout();
        }
    });

    renderCheckout();
});