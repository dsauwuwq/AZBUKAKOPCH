const API_URL = 'https://script.google.com/macros/s/AKfycbyjcz6MiW9jy-yYLrLZMCoszkdgKQlDQAwmbh5wlwEh51dv5K15ddRVPeJ1cBGLB2Og-A/exec'; // замените на ваш

let cart = [];

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

// Открыть модальное окно
function openCartModal() {
    cartModal.style.display = 'block';
    updateModalCart(); // обновляем на всякий случай
}

// Закрыть модальное окно
function closeCartModal() {
    cartModal.style.display = 'none';
}

// Обработчики модалки
cartIcon.addEventListener('click', (e) => { e.preventDefault(); openCartModal(); });
closeModalBtn.addEventListener('click', closeCartModal);
window.addEventListener('click', (e) => {
    if (e.target === cartModal) closeCartModal();
});

// Кнопка "Оформить заказ" в модалке прокручивает к форме
modalCheckoutBtn.addEventListener('click', () => {
    closeCartModal();
    const orderSection = document.getElementById('order');
    if (orderSection) {
        orderSection.scrollIntoView({ behavior: 'smooth' });
    }
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
        return;
    }

    let html = '';
    products.forEach(product => {
        const id = product.id;
        const name = product.name || 'Без названия';
        const price = product.price_per_500g ? Number(product.price_per_500g).toLocaleString() + ' ₽' : 'Цена не указана';
        const priceValue = product.price_per_500g || 0;
        const desc = product.description || '';
        const img = product.image || 'images/placeholder.jpg';

        html += `
            <div class="product-card" data-id="${id}" data-price="${priceValue}">
                <img src="${img}" alt="${name}" onerror="this.src='images/placeholder.jpg'">
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
    loadProducts();
    updateCartCounter();
    updateModalCart();

    // Переворот карточки "О копчении"
    const flipCard = document.getElementById('history-flip-card');
    if (flipCard) {
        flipCard.addEventListener('click', () => {
            flipCard.classList.toggle('flipped');
        });
    }

    // Плавная прокрутка к секциям по клику в меню с учетом высоты шапки
    const headerNavLinks = document.querySelectorAll('header nav a[href^="#"]');
    const headerElement = document.querySelector('header');

    headerNavLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const targetSelector = link.getAttribute('href');
            if (!targetSelector) return;

            const targetElement = document.querySelector(targetSelector);
            if (!targetElement) return;

            event.preventDefault();

            const headerHeight = headerElement ? headerElement.offsetHeight : 0;
            const targetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight - 12;

            window.scrollTo({
                top: Math.max(0, targetTop),
                behavior: 'smooth'
            });
        });
    });
    
    // Обработчики для кнопок прокрутки товаров (карусель)
    const scrollLeftBtn = document.getElementById('scroll-left');
    const scrollRightBtn = document.getElementById('scroll-right');
    const productsContainer = document.getElementById('products-container');
    
    if (scrollLeftBtn && scrollRightBtn && productsContainer) {
        let currentIndex = 0;
        let cards = [];
        let isAnimating = false;
        let prevIndex = 0;
        
        // Функция обновления карточек
        function updateCarousel(direction = 'right') {
            if (isAnimating) return;
            isAnimating = true;
            
            cards = Array.from(productsContainer.querySelectorAll('.product-card'));
            
            if (cards.length === 0) {
                isAnimating = false;
                return;
            }
            
            // Сохраняем индекс активной карточки до обновления
            const activeCardIndex = cards.findIndex(c => c.classList.contains('active'));
            
            // Нормализуем индекс
            currentIndex = (currentIndex + cards.length) % cards.length;
            
            // Определяем карточку, которая уходит с края
            let exitingCardIndex;
            if (direction === 'right') {
                // При свапе вправо левая карточка уходит
                exitingCardIndex = (activeCardIndex - 1 + cards.length) % cards.length;
            } else {
                // При свапе влево правая карточка уходит
                exitingCardIndex = (activeCardIndex + 1) % cards.length;
            }
            
            // Обновляем классы всех карточек
            cards.forEach((card, idx) => {
                card.classList.remove('active', 'prev', 'prev-1', 'prev-2', 'exiting', 'entering-right', 'entering-left');
                
                if (idx === currentIndex) {
                    // Это новая активная карточка
                    card.classList.add('active');
                    if (direction === 'right') {
                        card.classList.add('entering-right');
                    } else {
                        card.classList.add('entering-left');
                    }
                } else {
                    card.classList.add('prev');
                    
                    // Вычисляем расстояние от новой активной карточки
                    let positionInStack = (idx - currentIndex + cards.length) % cards.length;
                    
                    if (positionInStack === 1) {
                        // Правая карточка
                        card.classList.add('prev-2');
                    } else if (positionInStack === cards.length - 1) {
                        // Левая карточка
                        card.classList.add('prev-1');
                    }
                    
                    // Добавляем класс exiting только для карточки, которая уходит с края
                    if (idx === exitingCardIndex) {
                        card.classList.add('exiting');
                    }
                }
            });
            
            setTimeout(() => {
                isAnimating = false;
            }, 800);
        }
        
        scrollLeftBtn.addEventListener('click', () => {
            currentIndex--;
            updateCarousel('left');
        });
        
        scrollRightBtn.addEventListener('click', () => {
            currentIndex++;
            updateCarousel('right');
        });
        
        // Инициализация карусели при загрузке товаров
        setTimeout(() => {
            updateCarousel('right');
        }, 500);
    }
});
