const API_URL = 'https://script.google.com/macros/s/AKfycbyjcz6MiW9jy-yYLrLZMCoszkdgKQlDQAwmbh5wlwEh51dv5K15ddRVPeJ1cBGLB2Og-A/exec'; // замените на ваш

let cart = [];
let _fpIndex = 0;

// Элементы корзины и модалки
const cartIcon = document.getElementById('cart-icon');
const cartCountSpan = document.getElementById('cart-count');
const cartModal = document.getElementById('cart-modal');
const modalCartContainer = document.getElementById('modal-cart-container');
const closeModalBtn = document.querySelector('.close-modal');
const modalCheckoutBtn = document.getElementById('modal-checkout-btn');

// Функция обновления счётчика на иконке
function updateCartCounter() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountSpan.textContent = totalItems;
}

// Функция обновления содержимого модального окна
function updateModalCart() {
    if (!modalCartContainer) return;

    if (cart.length === 0) {
        modalCartContainer.innerHTML = '<p>Корзина пуста</p>';
        return;
    }

    let html = '<div class="cart-items">';
    let total = 0;
    cart.forEach((item, idx) => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <div class="cart-item" data-index="${idx}">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">${item.price.toLocaleString()} ₽/500г</span>
                <input type="number" class="cart-quantity" value="${item.quantity}" step="1" min="0">
                <span class="cart-item-total">${itemTotal.toLocaleString()} ₽</span>
                <button class="remove-item">Удалить</button>
            </div>
        `;
    });
    html += `<div class="cart-total">Итого: ${total.toLocaleString()} ₽</div>`;
    html += `</div>`;
    modalCartContainer.innerHTML = html;

    // Обработчики для изменения количества
    document.querySelectorAll('#modal-cart-container .cart-quantity').forEach((input, idx) => {
        input.addEventListener('change', () => {
            let newQty = parseFloat(input.value);
            if (isNaN(newQty) || newQty < 0) newQty = 0;
            if (newQty === 0) {
                cart.splice(idx, 1);
            } else {
                cart[idx].quantity = newQty;
            }
            updateCartCounter();
            updateModalCart();
        });
    });

    // Обработчики удаления
    document.querySelectorAll('#modal-cart-container .remove-item').forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            cart.splice(idx, 1);
            updateCartCounter();
            updateModalCart();
        });
    });
}

// Добавление в корзину (обновляем счётчик и модалку)
function addToCart(product, quantity) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price_per_500g,
            quantity: quantity
        });
    }
    updateCartCounter();
    updateModalCart();
}

let _scrollY = 0;

// Открыть модальное окно
function openCartModal() {
    _scrollY = window.scrollY;
    document.body.style.top = `-${_scrollY}px`;
    cartModal.style.display = 'flex';
    document.body.classList.add('modal-open');
    updateModalCart(); // обновляем на всякий случай
}

// Закрыть модальное окно
function closeCartModal() {
    cartModal.style.display = 'none';
    document.body.classList.remove('modal-open');
    document.body.style.top = '';
    window.scrollTo(0, _scrollY);
}

// Обработчики модалки
cartIcon.addEventListener('click', (e) => { e.preventDefault(); openCartModal(); });
closeModalBtn.addEventListener('click', closeCartModal);
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) closeCartModal();
});

// Логотип — переход на главный раздел
const logoHome = document.getElementById('logo-home');
if (logoHome) {
    logoHome.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 0 }));
    });
}

// Кнопка "Оформить заказ" в модалке прокручивает к форме
modalCheckoutBtn.addEventListener('click', () => {
    closeCartModal();
    window.dispatchEvent(new CustomEvent('navigateToSection', { detail: 3 }));
});

// Загрузка товаров (без изменений)
async function loadProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    try {
        const response = await fetch(API_URL);
        const data = await response.json();

        if (data.success && Array.isArray(data.products)) {
            renderProducts(data.products);
        } else {
            container.innerHTML = '<p>Не удалось загрузить товары. Попробуйте позже.</p>';
            console.error('Ошибка формата:', data);
        }
    } catch (error) {
        container.innerHTML = '<p>Ошибка соединения. Проверьте интернет.</p>';
        console.error('Ошибка загрузки:', error);
    }
}

function renderProducts(products) {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (products.length === 0) {
        container.innerHTML = '<p>Товары временно отсутствуют</p>';
        container.dispatchEvent(new CustomEvent('productsRendered', {
            detail: { hasProducts: false }
        }));
        return;
    }

    let html = '';
    products.forEach(product => {
        const id = product.id;
        const name = product.name || 'Без названия';
        const price = product.price_per_500g ? Number(product.price_per_500g).toLocaleString() + ' ₽' : 'Цена не указана';
        const priceValue = product.price_per_500g || 0;
        const desc = product.description || 'Описание скоро появится';
        const img = product.image || 'images/placeholder.jpg';

        html += `
            <div class="product-card" data-id="${id}" data-price="${priceValue}">
                <div class="product-card-inner">
                    <div class="product-face product-face-front">
                        <div class="product-img-wrap"><img src="${img}" alt="${name}" onerror="this.src='images/placeholder.jpg'"></div>
                        <div class="product-info">
                            <div class="product-title">${name}</div>
                            <div class="product-desc">${desc}</div>
                            <div class="cart-controls">
                                <div class="cart-controls-price">${price} <span class="cart-controls-price-unit">за 500 г</span></div>
                                <div class="cart-controls-row">
                                    <div class="qty-stepper">
                                        <button class="qty-btn qty-minus">−</button>
                                        <span class="qty-display">1</span>
                                        <button class="qty-btn qty-plus">+</button>
                                    </div>
                                    <button class="add-to-cart">В корзину</button>
                                    <span class="card-cart-count" style="display:none">0 в корзине</span>
                                </div>
                                <div class="product-flip-hint">Нажмите на карточку, чтобы открыть описание</div>
                            </div>
                        </div>
                    </div>
                    <div class="product-face product-face-back">
                        <div class="product-back-content">
                            <div class="product-desc product-desc-back">${desc}</div>
                            <div class="product-flip-hint product-flip-hint-back">Нажмите ещё раз, чтобы вернуться</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
    
    // Добавляем классы позиций всем карточкам сразу
    const allCards = Array.from(container.querySelectorAll('.product-card'));
    if (allCards.length > 0) {
        allCards[0].classList.add('active');
    }
    if (allCards.length > 1) {
        allCards[1].classList.add('prev', 'prev-2');
    }
    if (allCards.length > 2) {
        allCards[allCards.length - 1].classList.add('prev', 'prev-1');
    }

    // Кнопки +/- для количества
    container.querySelectorAll('.product-card').forEach(card => {
        const minusBtn = card.querySelector('.qty-minus');
        const plusBtn = card.querySelector('.qty-plus');
        const qtyDisplay = card.querySelector('.qty-display');

        minusBtn.addEventListener('click', () => {
            let val = parseInt(qtyDisplay.textContent) || 1;
            if (val > 1) qtyDisplay.textContent = val - 1;
        });
        plusBtn.addEventListener('click', () => {
            let val = parseInt(qtyDisplay.textContent) || 1;
            qtyDisplay.textContent = val + 1;
        });

        card.addEventListener('click', (event) => {
            if (window.innerWidth > 480) return;
            if (event.target.closest('.qty-stepper, .qty-btn, .add-to-cart, .cart-controls')) return;
            card.classList.toggle('is-flipped');
        });
    });

    document.querySelectorAll('.add-to-cart').forEach((btn) => {
        btn.addEventListener('click', () => {
            const card = btn.closest('.product-card');
            const id = card.dataset.id;
            const product = products.find(p => String(p.id) === id);
            const qtyDisplay = card.querySelector('.qty-display');
            let quantity = parseInt(qtyDisplay.textContent) || 1;
            addToCart(product, quantity);

            // Обновляем бейдж на карточке
            const badge = card.querySelector('.card-cart-count');
            const cartItem = cart.find(item => String(item.id) === id);
            if (cartItem && badge) {
                badge.textContent = cartItem.quantity + ' в корзине';
                badge.style.display = 'inline';
            }
        });
    });

    container.dispatchEvent(new CustomEvent('productsRendered', {
        detail: { hasProducts: true }
    }));
}

// Отправка заказа (с использованием текущей корзины)
const orderForm = document.getElementById('order-form');
const statusDiv = document.getElementById('form-status');

if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();

        if (!name || !phone) {
            statusDiv.innerHTML = '<p style="color: red;">Заполните имя и номер телефона.</p>';
            return;
        }

        if (cart.length === 0) {
            statusDiv.innerHTML = '<p style="color: red;">Корзина пуста. Добавьте товары.</p>';
            return;
        }

        const cartData = cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));

        const formData = new URLSearchParams();
        formData.append('name', name);
        formData.append('phone', phone);
        formData.append('cart', JSON.stringify(cartData));

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString()
            });

            const result = await response.json();

            if (result.success) {
                statusDiv.innerHTML = `<p style="color: #ffd700;">Спасибо, ${name}! Ваш заказ принят. Мы свяжемся с вами.</p>`;
                cart = [];
                updateCartCounter();
                updateModalCart();
                orderForm.reset();
            } else {
                statusDiv.innerHTML = `<p style="color: red;">Ошибка: ${result.error || 'Неизвестная ошибка'}</p>`;
            }
        } catch (error) {
            statusDiv.innerHTML = '<p style="color: red;">Ошибка отправки. Попробуйте позже.</p>';
            console.error('Ошибка:', error);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateCartCounter();
    updateModalCart();

    const headerElement = document.querySelector('header');
    const headerNav = document.querySelector('header nav');
    const navToggle = document.getElementById('nav-toggle');
    const navAllLinks = headerNav ? Array.from(headerNav.querySelectorAll('a')) : [];

    if (headerElement && headerNav && navToggle && navAllLinks.length) {
        const closeCollapsedMenu = () => {
            headerNav.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        };

        const hasWrappedNavItems = () => {
            if (navAllLinks.length < 2) return false;
            const firstTop = navAllLinks[0].offsetTop;
            return navAllLinks.some((link) => Math.abs(link.offsetTop - firstTop) > 2);
        };

        const updateHeaderNavMode = () => {
            // Сначала возвращаем стандартный режим, чтобы корректно измерить перенос.
            headerElement.classList.remove('nav-collapsed');
            closeCollapsedMenu();

            if (hasWrappedNavItems()) {
                headerElement.classList.add('nav-collapsed');
            }
        };

        navToggle.addEventListener('click', () => {
            if (!headerElement.classList.contains('nav-collapsed')) return;
            const isOpen = headerNav.classList.toggle('open');
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        navAllLinks.forEach((link) => {
            link.addEventListener('click', () => {
                if (headerElement.classList.contains('nav-collapsed')) {
                    closeCollapsedMenu();
                }
            });
        });

        let resizeTimer;
        window.addEventListener('resize', () => {
            window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(updateHeaderNavMode, 90);
        });

        updateHeaderNavMode();
        window.setTimeout(updateHeaderNavMode, 120);
    }

    // Переворот карточки "О копчении"
    const flipCard = document.getElementById('history-flip-card');
    if (flipCard) {
        const flipInner = flipCard.querySelector('.history-flip-inner');
        const flipFront = flipCard.querySelector('.history-flip-front');
        const flipBack = flipCard.querySelector('.history-flip-back');
        let isFlipAnimating = false;

        const getHistoryFlipHeight = (showBack) => {
            if (!flipFront || !flipBack) return 0;
            return showBack ? flipBack.scrollHeight : flipFront.scrollHeight;
        };

        const syncHistoryFlipHeight = (showBack = flipCard.classList.contains('flipped')) => {
            if (!flipInner || !flipFront || !flipBack) return;

            const targetHeight = getHistoryFlipHeight(showBack);

            if (targetHeight > 0) {
                flipCard.style.height = `${targetHeight}px`;
                flipInner.style.height = `${targetHeight}px`;
            }
        };

        const animateHistoryFlip = (showBack) => {
            if (!flipInner) return;

            const currentHeight = getHistoryFlipHeight(!showBack);
            const targetHeight = getHistoryFlipHeight(showBack);

            if (currentHeight > 0) {
                flipCard.style.height = `${currentHeight}px`;
                flipInner.style.height = `${currentHeight}px`;
                flipCard.getBoundingClientRect();
                flipInner.getBoundingClientRect();
            }

            if (targetHeight > 0) {
                window.requestAnimationFrame(() => {
                    flipCard.style.height = `${targetHeight}px`;
                    flipInner.style.height = `${targetHeight}px`;
                });
            }

            const fromTransform = showBack
                ? 'translateZ(0) rotateY(0deg)'
                : 'translateZ(0) rotateY(180deg)';
            const toTransform = showBack
                ? 'translateZ(0) rotateY(180deg)'
                : 'translateZ(0) rotateY(0deg)';

            if (typeof flipInner.animate === 'function') {
                const animation = flipInner.animate(
                    [
                        { transform: fromTransform },
                        { transform: toTransform }
                    ],
                    {
                        duration: 700,
                        easing: 'cubic-bezier(0.4, 0.2, 0.2, 1)',
                        fill: 'forwards'
                    }
                );

                animation.onfinish = () => {
                    flipCard.classList.toggle('flipped', showBack);
                    flipInner.style.transform = toTransform;
                    syncHistoryFlipHeight(showBack);
                    isFlipAnimating = false;
                };

                animation.oncancel = () => {
                    isFlipAnimating = false;
                };

                return;
            }

            flipCard.classList.toggle('flipped', showBack);
            flipInner.style.transform = toTransform;
            syncHistoryFlipHeight(showBack);
            window.setTimeout(() => {
                isFlipAnimating = false;
            }, 700);
        };

        const scheduleHistoryFlipSync = () => {
            syncHistoryFlipHeight();
            window.requestAnimationFrame(syncHistoryFlipHeight);
        };

        flipCard.addEventListener('click', () => {
            if (isFlipAnimating) return;
            isFlipAnimating = true;
            const showBack = !flipCard.classList.contains('flipped');
            animateHistoryFlip(showBack);
        });

        window.addEventListener('resize', scheduleHistoryFlipSync);
        scheduleHistoryFlipSync();
    }

    // Плавная прокрутка к секциям по клику в меню с учетом высоты шапки
    const headerNavLinks = document.querySelectorAll('header nav a[href^="#"]');

    headerNavLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetSelector = link.getAttribute('href');
            if (!targetSelector || targetSelector === '#') return;
            event.preventDefault();
            const idxMap = { '#hero': 0, '#history': 1, '#pricelist': 2, '#order': 3 };
            const idx = idxMap[targetSelector];
            if (idx !== undefined) scrollToSection(idx);
        });
    });
    
    // Обработчики для кнопок прокрутки товаров (карусель)
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    const productsContainer = document.getElementById('products-container');
    const productsDots = document.getElementById('products-dots');
    
    if (scrollLeftBtn && scrollRightBtn && productsContainer) {
        let currentIndex = 0;
        let cards = [];
        let isAnimating = false;
        const CAROUSEL_ANIMATION_MS = 800;

        const setCarouselCooldown = (locked) => {
            isAnimating = locked;
            scrollLeftBtn.disabled = locked;
            scrollRightBtn.disabled = locked;
            productsContainer.classList.toggle('is-animating', locked);

            if (productsDots) {
                Array.from(productsDots.children).forEach((dot) => {
                    dot.disabled = locked;
                });
            }
        };
        
        const clearCarouselClasses = (card) => {
            card.classList.remove(
                'active', 'prev', 'prev-1', 'prev-2', 'exiting', 'entering-right', 'entering-left',
                'compact-exiting', 'compact-enter-from-right', 'compact-enter-from-left', 'is-flipped',
                'compact-exit-to-left', 'compact-exit-to-right'
            );
        };

        const syncProductDots = () => {
            if (!productsDots) return;

            if (productsDots.children.length !== cards.length) {
                productsDots.innerHTML = '';
                cards.forEach((_, idx) => {
                    const dot = document.createElement('button');
                    dot.className = 'products-dot';
                    dot.type = 'button';
                    dot.setAttribute('aria-label', `Перейти к карточке ${idx + 1}`);
                    dot.addEventListener('click', () => {
                        if (isAnimating || idx === currentIndex) return;
                        const direction = idx > currentIndex ? 'right' : 'left';
                        currentIndex = idx;
                        updateCarousel(direction);
                    });
                    productsDots.appendChild(dot);
                });
            }

            Array.from(productsDots.children).forEach((dot, idx) => {
                dot.classList.toggle('active', idx === currentIndex);
            });
        };

        const shouldUseCompactCarousel = () => {
            const currentCards = Array.from(productsContainer.querySelectorAll('.product-card'));
            if (currentCards.length < 3) return true;
            if (window.innerWidth <= 480) return true;
            const sampleCard = currentCards[0];
            if (!sampleCard) return false;

            const cardWidth = sampleCard.getBoundingClientRect().width;
            const containerWidth = productsContainer.getBoundingClientRect().width;
            const sideOffset = window.innerWidth <= 768 ? 240 : 350;
            const previewScale = 0.75;
            const requiredWidth = (sideOffset * 2) + (cardWidth * previewScale) + 24;

            return containerWidth < requiredWidth;
        };

        const applyCarouselState = (direction = 'right', animate = true) => {
            cards = Array.from(productsContainer.querySelectorAll('.product-card'));

            if (cards.length === 0) return;

            currentIndex = (currentIndex + cards.length) % cards.length;
            const previousIndex = cards.findIndex((c) => c.classList.contains('active'));
            const compactMode = shouldUseCompactCarousel();
            productsContainer.classList.toggle('compact-mode', compactMode);

            cards.forEach(clearCarouselClasses);

            if (compactMode) {
                const safePreviousIndex = previousIndex >= 0 ? previousIndex : currentIndex;

                if (animate && safePreviousIndex !== currentIndex) {
                    const exitingCard = cards[safePreviousIndex];
                    if (exitingCard) {
                        exitingCard.classList.add(
                            'compact-exiting',
                            direction === 'right' ? 'compact-exit-to-left' : 'compact-exit-to-right'
                        );
                    }
                }

                const activeCard = cards[currentIndex];
                if (activeCard) {
                    activeCard.classList.add('active');
                    if (animate && safePreviousIndex !== currentIndex) {
                        activeCard.classList.add(
                            direction === 'right' ? 'compact-enter-from-right' : 'compact-enter-from-left'
                        );
                    }
                }

                syncProductDots();

                return;
            }

            const activeCardIndex = previousIndex >= 0 ? previousIndex : currentIndex;
            let exitingCardIndex;

            if (direction === 'right') {
                exitingCardIndex = (activeCardIndex - 1 + cards.length) % cards.length;
            } else {
                exitingCardIndex = (activeCardIndex + 1) % cards.length;
            }

            cards.forEach((card, idx) => {
                if (idx === currentIndex) {
                    card.classList.add('active');
                    if (animate && activeCardIndex !== currentIndex) {
                        card.classList.add(direction === 'right' ? 'entering-right' : 'entering-left');
                    }
                } else {
                    card.classList.add('prev');
                    const positionInStack = (idx - currentIndex + cards.length) % cards.length;
                    const staysVisibleAsNeighbor =
                        positionInStack === 1 || positionInStack === cards.length - 1;

                    if (positionInStack === 1) {
                        card.classList.add('prev-2');
                    } else if (positionInStack === cards.length - 1) {
                        card.classList.add('prev-1');
                    }

                    if (animate && idx === exitingCardIndex && !staysVisibleAsNeighbor) {
                        card.classList.add('exiting');
                    }
                }
            });

            syncProductDots();
        };
        
        // Функция обновления карточек
        function updateCarousel(direction = 'right', animate = true) {
            if (isAnimating) return;
            setCarouselCooldown(animate);

            cards = Array.from(productsContainer.querySelectorAll('.product-card'));
            cards.forEach((card) => card.classList.remove('is-flipped'));

            if (cards.length === 0) {
                setCarouselCooldown(false);
                return;
            }

            applyCarouselState(direction, animate);

            if (animate) {
                setTimeout(() => {
                    setCarouselCooldown(false);
                }, CAROUSEL_ANIMATION_MS);
            }
        }
        
        scrollLeftBtn.addEventListener('click', () => {
            currentIndex--;
            updateCarousel('left');
        });
        
        scrollRightBtn.addEventListener('click', () => {
            currentIndex++;
            updateCarousel('right');
        });

        window.addEventListener('resize', () => {
            updateCarousel('right', false);
        });

        productsContainer.addEventListener('productsRendered', (event) => {
            const hasProducts = event.detail?.hasProducts;

            if (!hasProducts) {
                if (productsDots) {
                    productsDots.innerHTML = '';
                }
                return;
            }

            currentIndex = 0;
            updateCarousel('right', false);
        });
    }

    loadProducts();

    // Навигация по секциям стрелками
    const sectionIds = ['hero', 'history', 'pricelist', 'order'];
    const navUp = document.getElementById('section-nav-up');
    const navDown = document.getElementById('section-nav-down');

    const getSections = () => sectionIds
        .map(id => document.querySelector(`#${id}`))
        .filter(Boolean);

    const getCurrentSectionIndex = () => _fpIndex;

    const dotsContainer = document.getElementById('section-nav-dots');
    const sectionNav = document.getElementById('section-nav');
    let navIdleTimer;
    const NAV_IDLE_MS = 1800;

    const scheduleNavIdle = () => {
        if (!sectionNav) return;
        window.clearTimeout(navIdleTimer);
        navIdleTimer = window.setTimeout(() => {
            sectionNav.classList.add('is-idle');
        }, NAV_IDLE_MS);
    };

    const bumpNavActivity = () => {
        if (!sectionNav) return;
        sectionNav.classList.remove('is-idle');
        scheduleNavIdle();
    };

    const renderDots = () => {
        if (!dotsContainer) return;
        const sections = getSections();
        dotsContainer.innerHTML = '';
        sections.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'section-nav-dot';
            dot.setAttribute('aria-label', `Перейти к разделу ${i + 1}`);
            dot.addEventListener('click', () => scrollToSection(i));
            dotsContainer.appendChild(dot);
        });
    };

    const updateNavButtons = () => {
        const sections = getSections();
        const idx = getCurrentSectionIndex();
        if (navUp) navUp.disabled = idx === 0;
        if (navDown) navDown.disabled = idx >= sections.length - 1;
        if (dotsContainer) {
            dotsContainer.querySelectorAll('.section-nav-dot').forEach((dot, i) => {
                dot.classList.toggle('active', i === idx);
            });
        }
    };

    const getNavTargetRect = (nav, useCorner) => {
        const width = nav.offsetWidth;
        const height = nav.offsetHeight;

        if (useCorner) {
            const top = window.innerHeight - 20 - height;
            return {
                left: window.innerWidth - width - 8,
                right: window.innerWidth - 8,
                top,
                bottom: window.innerHeight - 20
            };
        }

        const top = (window.innerHeight - height) / 2;
        return {
            left: window.innerWidth - width - 8,
            right: window.innerWidth - 8,
            top,
            bottom: top + height
        };
    };

    const rectsOverlap = (a, b, pad = 4) => (
        a.left < b.right + pad &&
        a.right > b.left - pad &&
        a.top < b.bottom + pad &&
        a.bottom > b.top - pad
    );

    const shouldNavUseCornerForIndex = (idx) => {
        const nav = document.getElementById('section-nav');
        const sections = getSections();
        const targetSection = sections[idx];
        if (!nav || !targetSection) return false;

        const targetSectionTop = targetSection.getBoundingClientRect().top;
        const shiftedRects = Array.from(document.querySelectorAll('.hero-content, .history .container, .pricelist, .order'))
            .map((el) => {
                const rect = el.getBoundingClientRect();
                const shiftedTop = rect.top - targetSectionTop;
                return {
                    left: rect.left,
                    right: rect.right,
                    top: shiftedTop,
                    bottom: shiftedTop + rect.height
                };
            })
            .filter((rect) => rect.bottom > 0 && rect.top < window.innerHeight);

        const centeredNavRect = getNavTargetRect(nav, false);
        return shiftedRects.some((rect) => rectsOverlap(centeredNavRect, rect));
    };

    const shouldNavBeHiddenOnDesktop = () => {
        const sections = getSections();
        return sections.some((_, idx) => shouldNavUseCornerForIndex(idx));
    };

    const syncNavPosition = (targetIdx = getCurrentSectionIndex()) => {
        const nav = document.getElementById('section-nav');
        if (!nav) return;
        if (window.innerWidth <= 768) {
            nav.classList.remove('corner', 'is-bottom');
            nav.style.top = '';
            return;
        }
        if (shouldNavBeHiddenOnDesktop()) {
            nav.classList.add('is-bottom');
            nav.classList.remove('corner');
            nav.style.top = '';
            return;
        }
        nav.classList.remove('is-bottom');
        const useCorner = shouldNavUseCornerForIndex(targetIdx);
        const navRect = getNavTargetRect(nav, useCorner);
        nav.classList.toggle('corner', useCorner);
        nav.style.top = `${Math.max(0, navRect.top)}px`;
    };

    const syncSectionAnimationState = (activeIdx = getCurrentSectionIndex()) => {
        const sections = getSections();
        sections.forEach((section, index) => {
            section.classList.remove('is-before', 'is-active', 'is-after');
            if (index < activeIdx) section.classList.add('is-before');
            else if (index > activeIdx) section.classList.add('is-after');
            else section.classList.add('is-active');
        });
    };

    const scrollToSection = (idx) => {
        const sections = getSections();
        if (idx < 0 || idx >= sections.length) return;
        bumpNavActivity();
        syncNavPosition(idx);
        syncSectionHints(idx);
        syncSectionAnimationState(idx);
        const fpRunner = document.getElementById('fullpage-runner');
        if (fpRunner) fpRunner.style.transform = `translateY(calc(-${idx} * 100vh))`;
        _fpIndex = idx;
        window.__particleTargetScrollY = idx * window.innerHeight;
        window.__particleTargetSectionIdx = idx;
        updateNavButtons();
    };

    const sectionNames = ['Главная', 'О копчении', 'Виды копчений', 'Оформить заказ'];
    const hintTop = document.getElementById('section-hint-top');
    const hintBottom = document.getElementById('section-hint-bottom');

    const syncSectionHints = (idx = getCurrentSectionIndex()) => {
        if (!hintTop || !hintBottom) return;
        const sections = getSections();
        const isDesktop = window.innerWidth > 768;

        if (!isDesktop) {
            hintTop.hidden = true;
            hintBottom.hidden = true;
            return;
        }

        if (idx > 0) {
            hintTop.textContent = '↑ ' + (sectionNames[idx - 1] || '');
            hintTop.hidden = false;
            hintTop.onclick = () => scrollToSection(idx - 1);
        } else {
            hintTop.hidden = true;
        }

        if (idx < sections.length - 1) {
            hintBottom.textContent = (sectionNames[idx + 1] || '') + ' ↓';
            hintBottom.hidden = false;
            hintBottom.onclick = () => scrollToSection(idx + 1);
        } else {
            hintBottom.hidden = true;
        }
    };

    const origScrollToSection = scrollToSection;
    // Патчим scrollToSection чтобы обновлять hints
    const _scrollToSectionWithHints = (idx) => {
        origScrollToSection(idx);
        syncSectionHints(idx);
    };

    if (dotsContainer) {
        renderDots();
        if (navUp) {
            navUp.addEventListener('click', () => scrollToSection(getCurrentSectionIndex() - 1));
        }
        if (navDown) {
            navDown.addEventListener('click', () => scrollToSection(getCurrentSectionIndex() + 1));
        }
        window.addEventListener('navigateToSection', (e) => scrollToSection(e.detail));
        window.addEventListener('resize', () => { syncNavPosition(); syncSectionHints(); });
        updateNavButtons();
        syncSectionAnimationState();
        syncNavPosition();
        syncSectionHints();
    }

    if (sectionNav) {
        ['pointermove', 'pointerdown', 'touchstart', 'focusin', 'mouseenter'].forEach((eventName) => {
            sectionNav.addEventListener(eventName, bumpNavActivity, { passive: true });
        });

        ['mousemove', 'touchstart', 'keydown'].forEach((eventName) => {
            window.addEventListener(eventName, bumpNavActivity, { passive: true });
        });

        scheduleNavIdle();
    }

    // Отключить скролл мышью/тачем — только вне скроллируемых контейнеров
    const isInsideScrollable = (el) => {
        while (el && el !== document.documentElement) {
            const style = window.getComputedStyle(el);
            const oy = style.overflowY;
            if ((oy === 'scroll' || oy === 'auto') && el.scrollHeight > el.clientHeight) {
                return true;
            }
            el = el.parentElement;
        }
        return false;
    };

    window.addEventListener('wheel', (e) => {
        if (!isInsideScrollable(e.target)) e.preventDefault();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
        if (!isInsideScrollable(e.target)) e.preventDefault();
    }, { passive: false });

    let touchStartX = 0;
    let touchStartY = 0;
    let touchTrackingEnabled = false;
    const SWIPE_THRESHOLD = 60;
    const SWIPE_VERTICAL_BIAS = 1.2;

    window.addEventListener('touchstart', (e) => {
        if (!e.touches.length) return;
        if (document.body.classList.contains('modal-open')) {
            touchTrackingEnabled = false;
            return;
        }

        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchTrackingEnabled = !isInsideScrollable(e.target);
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
        if (!touchTrackingEnabled || !e.changedTouches.length) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        touchTrackingEnabled = false;

        if (absDeltaY < SWIPE_THRESHOLD) return;
        if (absDeltaY < absDeltaX * SWIPE_VERTICAL_BIAS) return;

        if (deltaY < 0) {
            scrollToSection(getCurrentSectionIndex() + 1);
        } else {
            scrollToSection(getCurrentSectionIndex() - 1);
        }
    }, { passive: true });

    const SCROLL_KEYS = ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '];
    window.addEventListener('keydown', (e) => {
        if (SCROLL_KEYS.includes(e.key) && !isInsideScrollable(document.activeElement)) {
            e.preventDefault();
        }
    });
});
