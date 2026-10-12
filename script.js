document.addEventListener('DOMContentLoaded', () => {
    function readStorage(key, fallback) {
        try {
            const storedValue = localStorage.getItem(key);
            return storedValue ? JSON.parse(storedValue) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function makeProductId(card, fallbackIndex = 0) {
        const title = card.querySelector('h4')?.textContent.trim() || 'Item';
        const normalizedTitle = title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').toLowerCase();
        const price = card.getAttribute('data-price') || fallbackIndex;
        return `${normalizedTitle}_${price}`;
    }

    const navLinks = document.querySelectorAll('.nav_bar .nav_link');
    const dealChips = document.querySelectorAll('.deal_chip');
    const searchInput = document.getElementById('searchInput');
    const sortSelector = document.getElementById('sortSelector');
    const productGrid = document.getElementById('productGrid');
    const productCards = Array.from(document.querySelectorAll('.product_card'));
    productCards.forEach((card, index) => {
        card.dataset.productId = makeProductId(card, index);
    });
    const resultsCount = document.getElementById('resultsCount');
    const noResultsState = document.getElementById('noResultsState');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const wishlistLink = document.querySelector('.wishlist_link');
    const activeUser = readStorage('myntra_active_user', null);
    const profileLabel = document.getElementById('headerProfileName');
    if (profileLabel && activeUser && activeUser.name) {
        profileLabel.textContent = activeUser.name.split(' ')[0];
    }
    let currentCategory = 'all';
    let currentDeal = 'all';
    let currentQuery = '';
    let wishlistOnly = window.location.hash === '#wishlist';
    let toastTimer;

    function showToast(message) {
        let toast = document.getElementById('shopToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'shopToast';
            toast.className = 'shop_toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.classList.add('visible');
        window.clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => toast.classList.remove('visible'), 2200);
    }

    function getFavorites() {
        return readStorage('myntra_wishlist_items', []);
    }

    function updateGrid() {
        if (!noResultsState || !resultsCount || !productGrid || !sortSelector) return;

        let visibleCount = 0;
        const favoriteIds = getFavorites();

        productCards.forEach((card, index) => {
            const cardCategory = card.getAttribute('data-category');
            const cardPrice = parseFloat(card.getAttribute('data-price')) || 0;
            const cardDiscount = parseFloat(card.getAttribute('data-discount')) || 0;
            const cardDealTag = card.getAttribute('data-deal-tag') || '';
            const cardText = card.innerText.toLowerCase();
            const productId = card.dataset.productId || makeProductId(card, index);

            const matchesCategory = (currentCategory === 'all' || cardCategory === currentCategory);

            let matchesDeal = true;
            if (currentDeal === 'under_799') matchesDeal = (cardPrice <= 799);
            else if (currentDeal === 'min_60') matchesDeal = (cardDiscount >= 60);
            else if (currentDeal === 'trending') matchesDeal = (cardDealTag === 'trending');

            const matchesSearch = currentQuery === '' || cardText.includes(currentQuery);
            const matchesWishlist = !wishlistOnly || favoriteIds.includes(productId);

            if (matchesCategory && matchesDeal && matchesSearch && matchesWishlist) {
                card.classList.remove('hidden');
                visibleCount++;
            } else {
                card.classList.add('hidden');
            }
        });

        if (visibleCount === 0) {
            noResultsState.classList.remove('hidden');
        } else {
            noResultsState.classList.add('hidden');
        }
        noResultsState.querySelector('h3').textContent = wishlistOnly
            ? 'Your wishlist is empty'
            : 'No deals match your criteria';
        noResultsState.querySelector('p').textContent = wishlistOnly
            ? 'Tap a heart on any product to save it here.'
            : 'Try clearing filters or searching for another brand or product.';

        resultsCount.textContent = wishlistOnly
            ? `Showing ${visibleCount} wishlist item${visibleCount === 1 ? '' : 's'}`
            : `Showing ${visibleCount} deal${visibleCount === 1 ? '' : 's'}`;
        applySorting();
    }

    function applySorting() {
        if (!sortSelector || !productGrid) return;
        const sortType = sortSelector.value;
        const sortedCards = [...productCards].sort((a, b) => {
            const priceA = parseFloat(a.getAttribute('data-price')) || 0;
            const priceB = parseFloat(b.getAttribute('data-price')) || 0;
            const discA = parseFloat(a.getAttribute('data-discount')) || 0;
            const discB = parseFloat(b.getAttribute('data-discount')) || 0;

            if (sortType === 'price_low') return priceA - priceB;
            if (sortType === 'price_high') return priceB - priceA;
            if (sortType === 'discount_high') return discB - discA;
            return 0;
        });

        sortedCards.forEach(card => productGrid.appendChild(card));
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(item => item.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.getAttribute('data-category');
            wishlistOnly = false;
            wishlistLink?.classList.remove('active');
            wishlistLink?.setAttribute('aria-pressed', 'false');
            updateGrid();
            const dealsGrid = document.getElementById('deals-grid');
            dealsGrid?.scrollIntoView({ behavior: 'smooth' });
        });
    });

    document.querySelectorAll('.footer_category_link').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const categoryLink = document.querySelector(`.nav_bar .nav_link[data-category="${link.dataset.category}"]`);
            categoryLink?.click();
        });
    });

    dealChips.forEach(chip => {
        chip.addEventListener('click', function() {
            dealChips.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            currentDeal = this.getAttribute('data-deal');
            wishlistOnly = false;
            wishlistLink?.classList.remove('active');
            wishlistLink?.setAttribute('aria-pressed', 'false');
            updateGrid();
        });
    });

    searchInput?.addEventListener('input', () => {
        currentQuery = searchInput.value.trim().toLowerCase();
        updateGrid();
    });

    sortSelector?.addEventListener('change', applySorting);

    wishlistLink?.addEventListener('click', event => {
        event.preventDefault();
        wishlistOnly = !wishlistOnly;
        wishlistLink.classList.toggle('active', wishlistOnly);
        wishlistLink.setAttribute('aria-pressed', String(wishlistOnly));
        if (wishlistOnly) {
            currentCategory = 'all';
            currentDeal = 'all';
            currentQuery = '';
            if (searchInput) searchInput.value = '';
            navLinks.forEach(link => link.classList.toggle('active', link.dataset.category === 'all'));
            dealChips.forEach(chip => chip.classList.toggle('active', chip.dataset.deal === 'all'));
        }
        updateGrid();
        const dealsGrid = document.getElementById('deals-grid');
        dealsGrid?.scrollIntoView({ behavior: 'smooth' });
    });

    resetFiltersBtn?.addEventListener('click', () => {
        currentCategory = 'all';
        currentDeal = 'all';
        currentQuery = '';
        wishlistOnly = false;
        searchInput.value = '';
        sortSelector.value = 'featured';
        navLinks.forEach(link => link.classList.toggle('active', link.dataset.category === 'all'));
        dealChips.forEach(chip => chip.classList.toggle('active', chip.dataset.deal === 'all'));
        wishlistLink?.classList.remove('active');
        wishlistLink?.setAttribute('aria-pressed', 'false');
        updateGrid();
    });

    document.addEventListener('keydown', event => {
        const target = event.target;
        const isTyping = target instanceof HTMLElement
            && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
        if (event.key === '/' && !isTyping) {
            event.preventDefault();
            searchInput.focus();
        } else if (event.key === 'Escape' && target === searchInput) {
            searchInput.value = '';
            currentQuery = '';
            updateGrid();
            searchInput.blur();
        }
    });

    window.addEventListener('storage', event => {
        if (event.key === 'myntra_wishlist_items' || event.key === 'myntra_bag_items') {
            initFavorites(showToast, updateGrid);
            initBag(showToast);
            updateGrid();
        }
    });

    if (wishlistOnly) {
        navLinks.forEach(link => link.classList.toggle('active', link.dataset.category === 'all'));
        dealChips.forEach(chip => chip.classList.toggle('active', chip.dataset.deal === 'all'));
        wishlistLink?.classList.add('active');
        wishlistLink?.setAttribute('aria-pressed', 'true');
    }
    updateGrid();
    initFavorites(showToast, updateGrid);
    initBag(showToast);
});

// ==========================================
// ADD TO FAVORITES (WISHLIST) FEATURE
// ==========================================
function initFavorites(showToast = () => {}, onChange = () => {}) {
    const STORAGE_KEY = 'myntra_wishlist_items';

    function getFavorites() {
        try {
            const value = localStorage.getItem(STORAGE_KEY);
            return value ? JSON.parse(value) : [];
        } catch (error) {
            return [];
        }
    }

    function saveFavorites(favorites) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        updateWishlistCount();
    }

    function updateWishlistCount() {
        let countBadge = document.querySelector('.wishlist_count');
        const wishlistContainer = document.querySelector('.wishlist_link');
        
        if (!countBadge && wishlistContainer) {
            countBadge = document.createElement('span');
            countBadge.className = 'wishlist_count';
            wishlistContainer.style.position = 'relative';
            wishlistContainer.appendChild(countBadge);
        }

        if (countBadge) {
            const count = getFavorites().length;
            countBadge.textContent = count;
            countBadge.style.display = count > 0 ? 'inline-block' : 'none';
            countBadge.setAttribute('aria-label', `${count} wishlist items`);
        }
    }

    const cards = document.querySelectorAll('.product_card');
    const favorites = getFavorites();

    cards.forEach((card, index) => {
        const title = card.querySelector('h4') ? card.querySelector('h4').textContent.trim() : '';
        const price = card.getAttribute('data-price') || index;
        const productId = card.dataset.productId || `${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').toLowerCase()}_${price}`;

        const favBtn = card.querySelector('.fav_btn');
        if (!favBtn) return;

        const isFavorited = favorites.includes(productId);
        favBtn.setAttribute('aria-pressed', String(isFavorited));
        favBtn.setAttribute('aria-label', isFavorited ? 'Remove from wishlist' : 'Add to wishlist');
        if (isFavorited) {
            favBtn.classList.add('active');
        } else {
            favBtn.classList.remove('active');
        }

        favBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            let currentFavs = getFavorites();

            if (currentFavs.includes(productId)) {
                currentFavs = currentFavs.filter(id => id !== productId);
                favBtn.classList.remove('active');
                favBtn.setAttribute('aria-pressed', 'false');
                favBtn.setAttribute('aria-label', 'Add to wishlist');
                showToast('Removed from your wishlist');
            } else {
                currentFavs.push(productId);
                favBtn.classList.add('active');
                favBtn.setAttribute('aria-pressed', 'true');
                favBtn.setAttribute('aria-label', 'Remove from wishlist');
                showToast('Added to your wishlist');
            }

            saveFavorites(currentFavs);
            onChange();
        };
    });

    updateWishlistCount();
}

// ==========================================
// ADD TO BAG FEATURE (WITH TOGGLE REMOVE)
// ==========================================
function initBag(showToast = () => {}) {
    const BAG_STORAGE_KEY = 'myntra_bag_items';
    const bagCountElement = document.querySelector('.bag_count');

    function getBagItems() {
        try {
            const value = localStorage.getItem(BAG_STORAGE_KEY);
            return value ? JSON.parse(value) : [];
        } catch (error) {
            return [];
        }
    }

    function saveBagItems(items) {
        localStorage.setItem(BAG_STORAGE_KEY, JSON.stringify(items));
        updateBagBadge();
    }

    function updateBagBadge() {
        if (!bagCountElement) return;
        const items = getBagItems();
        const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        bagCountElement.textContent = totalCount;
        bagCountElement.style.display = totalCount > 0 ? 'inline-block' : 'none';
        bagCountElement.setAttribute('aria-label', `${totalCount} items in bag`);
    }

    const cards = document.querySelectorAll('.product_card');

    cards.forEach((card, index) => {
        const title = card.querySelector('h4') ? card.querySelector('h4').textContent.trim() : 'Item';
        const subtitle = card.querySelector('.card_info p') ? card.querySelector('.card_info p').textContent.trim() : '';
        const price = parseFloat(card.getAttribute('data-price')) || 0;
        const mrp = parseFloat(card.getAttribute('data-mrp')) || 0;
        const discount = card.getAttribute('data-discount') || '0';
        const imgSrc = card.querySelector('img') ? card.querySelector('img').src : '';
        const productId = card.dataset.productId || `${title.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_').toLowerCase()}_${price}_${index}`;

        const bagBtn = card.querySelector('.add_to_bag_btn');
        if (!bagBtn) return;

        const currentItems = getBagItems();
        const exists = currentItems.some(item => item.id === productId);

        if (exists) {
            bagBtn.innerHTML = `<span class="material-symbols-outlined">done</span> IN BAG`;
            bagBtn.classList.add('added');
        } else {
            bagBtn.innerHTML = `<span class="material-symbols-outlined">shopping_bag</span> ADD TO BAG`;
            bagBtn.classList.remove('added');
        }
        bagBtn.setAttribute('aria-pressed', String(exists));

        bagBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            let items = getBagItems();
            const existingIndex = items.findIndex(item => item.id === productId);

            if (existingIndex > -1) {
                // If it is already in the bag, remove it
                items.splice(existingIndex, 1);
                bagBtn.innerHTML = `<span class="material-symbols-outlined">shopping_bag</span> ADD TO BAG`;
                bagBtn.classList.remove('added');
                bagBtn.setAttribute('aria-pressed', 'false');
                showToast('Removed from your bag');
            } else {
                // Otherwise, add it to the bag
                items.push({
                    id: productId,
                    title: title,
                    subtitle: subtitle,
                    price: price,
                    mrp: mrp,
                    discount: discount,
                    image: imgSrc,
                    quantity: 1
                });
                bagBtn.innerHTML = `<span class="material-symbols-outlined">done</span> IN BAG`;
                bagBtn.classList.add('added');
                bagBtn.setAttribute('aria-pressed', 'true');
                showToast('Added to your bag');
            }

            saveBagItems(items);
        };
    });

    updateBagBadge();
}