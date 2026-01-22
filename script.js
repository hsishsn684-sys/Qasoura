// استيراد دوال Firebase عبر الإنترنت (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getDatabase, ref, set, onValue, push, remove, update } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// --- مفاتيح المشروع (fadl-ca30c) ---
const firebaseConfig = {
    apiKey: "AIzaSyD01U4W5-NnCpI2H7m3gERNqx_4GMhLaVY",
    authDomain: "fadl-ca30c.firebaseapp.com",
    databaseURL: "https://fadl-ca30c-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "fadl-ca30c",
    storageBucket: "fadl-ca30c.firebasestorage.app",
    messagingSenderId: "11016741410",
    appId: "1:11016741410:web:9f75ede0ccc13d6625207b",
    measurementId: "G-X18V9W5BTX"
};

// تهيئة التطبيق وقاعدة البيانات
let app, db;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    console.log("Firebase Connected Successfully to fadl-ca30c");
} catch (e) {
    console.error("Firebase Error:", e);
    alert("خطأ في الاتصال بقاعدة البيانات، تأكد من القواعد (Rules).");
}

// --- المتغيرات العامة ---
let productsTab1 = []; 
let productsTab2 = []; 
let productsTab3 = []; // قائمة ثالثة (Style)

let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let usersDB = JSON.parse(localStorage.getItem('usersDB')) || [];
let cart = [];
let selectedEvo = {};

// --- بدء التطبيق ---
window.onload = function() {
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if(splash) splash.style.display = 'none';
        
        // جلب البيانات من السحابة
        fetchFirebaseData();

        if(currentUser) loadStore();
        else document.getElementById('auth-screen').style.display = 'flex';
    }, 4000); 
};

// --- دوال النظام (Auth) ---
window.toggleAuth = (screen) => {
    if(screen === 'login') {
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    } else {
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
    }
}

window.registerUser = () => {
    const name = document.getElementById('reg-name').value;
    const age = document.getElementById('reg-age').value;
    const gov = document.getElementById('reg-gov').value;
    const pass = document.getElementById('reg-pass').value;

    if(!name || !age || !gov || !pass) { alert('يرجى ملء جميع الحقول'); return; }

    let newID; let isUnique = false;
    while(!isUnique) {
        newID = Math.floor(100000 + Math.random() * 900000);
        if(!usersDB.find(u => u.id === newID)) isUnique = true;
    }

    const newUser = { id: newID, name, age, gov, pass, avatar: `https://ui-avatars.com/api/?name=${name}&background=random` };
    usersDB.push(newUser);
    localStorage.setItem('usersDB', JSON.stringify(usersDB));
    loginUser(newID, pass);
}

window.loginUser = (inputId = null, inputPass = null) => {
    const id = inputId || document.getElementById('login-id').value;
    const pass = inputPass || document.getElementById('login-pass').value;

    if(id === 'admin' && pass === '123') {
        currentUser = { name: 'Admin', role: 'admin' };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadStore();
        return;
    }

    const user = usersDB.find(u => u.id == id && u.pass == pass);
    if(user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        loadStore();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
}

window.logout = () => {
    localStorage.removeItem('currentUser');
    location.reload();
}

window.loadStore = () => {
    if(!currentUser) return;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('store-screen').style.display = 'block';
    
    document.getElementById('header-name').innerText = currentUser.name;
    document.getElementById('header-id').innerText = currentUser.role === 'admin' ? 'مدير النظام' : `ID: ${currentUser.id} | ${currentUser.gov}`;
    document.getElementById('header-avatar').src = currentUser.role === 'admin' ? 'https://ui-avatars.com/api/?name=Admin&background=9c27b0&color=fff' : currentUser.avatar;

    if(currentUser.role === 'admin') {
        document.getElementById('cart-float').style.display = 'none';
        document.getElementById('admin-add-btn').style.display = 'flex';
    } else {
        document.getElementById('cart-float').style.display = 'flex';
        document.getElementById('admin-add-btn').style.display = 'none';
    }

    renderProducts();
}

// --- Firebase Data Fetching ---
const fetchFirebaseData = () => {
    if(!db) return;

    // القائمة 1
    const tab1Ref = ref(db, 'products/tab1');
    onValue(tab1Ref, (snapshot) => {
        const tempTab1 = [];
        snapshot.forEach((childSnapshot) => tempTab1.push(childSnapshot.val()));
        productsTab1 = tempTab1;
        renderProducts();
    });

    // القائمة 2
    const tab2Ref = ref(db, 'products/tab2');
    onValue(tab2Ref, (snapshot) => {
        const tempTab2 = [];
        snapshot.forEach((childSnapshot) => tempTab2.push(childSnapshot.val()));
        productsTab2 = tempTab2;
        renderProducts();
    });

    // القائمة 3 (الجديدة - Style)
    const tab3Ref = ref(db, 'products/tab3');
    onValue(tab3Ref, (snapshot) => {
        const tempTab3 = [];
        snapshot.forEach((childSnapshot) => tempTab3.push(childSnapshot.val()));
        productsTab3 = tempTab3;
        renderProducts();
    });
};

// --- عرض المنتجات ---
const renderProducts = () => {
    const grid1 = document.getElementById('grid-tab1'); // Incr
    const grid2 = document.getElementById('grid-tab2'); // Script
    const grid3 = document.getElementById('grid-tab3'); // Style

    grid1.innerHTML = ''; grid2.innerHTML = ''; grid3.innerHTML = '';

    productsTab1.forEach(p => grid1.appendChild(createProductCard(p, 1)));
    productsTab2.forEach(p => grid2.appendChild(createProductCard(p, 2)));
    productsTab3.forEach(p => grid3.appendChild(createProductCard(p, 3)));
}

const createProductCard = (product, listNum) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    let priceDisplay = product.price > 0 ? product.price + ' دينار' : 'حسب الطلب';
    
    let evoHTML = '';
    if(product.isEvo) {
        priceDisplay = 'من 1000 دينار';
        evoHTML = `
            <div class="evo-options" id="evo-${product.id}">
                <button class="evo-option" onclick="selectEvo(this, ${product.id}, '7 أيام', 1000)">7 أيام</button>
                <button class="evo-option" onclick="selectEvo(this, ${product.id}, '30 يوم', 3300)">30 يوم</button>
            </div>
        `;
    }

    let actionButtons = '';
    if(currentUser.role === 'admin') {
        actionButtons = `<div class="admin-controls"><button class="btn-edit" onclick="openEditModal(${listNum}, '${product.id}')">تعديل</button><button class="btn-delete" onclick="deleteProduct(${listNum}, '${product.id}')">حذف</button></div>`;
    } else {
        actionButtons = `<button class="add-btn" onclick='addToCart(${JSON.stringify(product)})'><i class="fas fa-cart-plus"></i> إضافة</button>${evoHTML}`;
    }

    card.innerHTML = `
        <img src="${product.img}" class="product-img" onerror="this.src='https://picsum.photos/seed/${product.id}/150/150'">
        <div class="product-details">
            <div class="product-name">${product.name}</div>
            <div class="product-price" id="price-${product.id}">${priceDisplay}</div>
            ${currentUser.role !== 'admin' ? '' : evoHTML}
            ${actionButtons}
        </div>
    `;
    return card;
}

window.selectEvo = (btn, productId, label, price) => {
    const parent = document.getElementById(`evo-${productId}`);
    Array.from(parent.children).forEach(child => child.style.background = '#333');
    btn.style.background = 'var(--primary-color)';
    document.getElementById(`price-${productId}`).innerText = price + ' دينار';
    selectedEvo[productId] = { label, price };
}

window.switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    // تحديث الزر النشط
    if(tabId === 'tab1') document.querySelector('.tabs button:nth-child(1)').classList.add('active');
    else if(tabId === 'tab2') document.querySelector('.tabs button:nth-child(2)').classList.add('active');
    else if(tabId === 'tab3') document.querySelector('.tabs button:nth-child(3)').classList.add('active');
}

// --- إدارة المنتجات ---
window.openAddProductModal = () => {
    document.getElementById('modal-title').innerText = 'إضافة منتج جديد';
    document.getElementById('edit-prod-id').value = '';
    document.getElementById('edit-prod-name').value = '';
    document.getElementById('edit-prod-price').value = '';
    document.getElementById('edit-prod-file').value = '';
    // تعديل الخيارات لـ 3 أقسام
    document.getElementById('edit-prod-list-select').innerHTML = `
        <option value="1">قائمة Incr</option>
        <option value="2">قائمة Script</option>
        <option value="3">قائمة Style</option>
    `;
    document.getElementById('product-modal').style.display = 'flex';
}

window.openEditModal = (listNum, productId) => {
    const list = listNum === 1 ? productsTab1 : listNum === 2 ? productsTab2 : productsTab3;
    const product = list.find(p => p.id == productId);
    
    document.getElementById('modal-title').innerText = 'تعديل المنتج';
    document.getElementById('edit-prod-id').value = productId;
    document.getElementById('edit-prod-source-list').value = listNum;
    document.getElementById('edit-prod-name').value = product.name;
    document.getElementById('edit-prod-price').value = product.price;
    
    // تعديل الخيارات لـ 3 أقسام
    document.getElementById('edit-prod-list-select').innerHTML = `
        <option value="1" ${listNum==1?'selected':''}>قائمة Incr</option>
        <option value="2" ${listNum==2?'selected':''}>قائمة Script</option>
        <option value="3" ${listNum==3?'selected':''}>قائمة Style</option>
    `;
    document.getElementById('edit-prod-type').value = product.isEvo ? 'evo' : 'normal';
    document.getElementById('product-modal').style.display = 'flex';
}

window.closeProductModal = () => { document.getElementById('product-modal').style.display = 'none'; }

window.deleteProduct = (listNum, productId) => {
    if(confirm('حذف هذا المنتج نهائياً؟')) {
        const path = listNum === 1 ? 'products/tab1' : listNum === 2 ? 'products/tab2' : 'products/tab3';
        const dbRef = ref(db, path);
        onValue(dbRef, (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                if(childSnapshot.val().id == productId) {
                    remove(ref(db, `${path}/${childSnapshot.key}`));
                }
            });
        }, {onlyOnce: true});
    }
}

window.saveProduct = () => {
    const id = document.getElementById('edit-prod-id').value;
    const name = document.getElementById('edit-prod-name').value;
    const price = parseFloat(document.getElementById('edit-prod-price').value);
    const targetListNum = parseInt(document.getElementById('edit-prod-list-select').value);
    const isEvo = document.getElementById('edit-prod-type').value === 'evo';
    const fileInput = document.getElementById('edit-prod-file');

    if(!name || isNaN(price)) { alert('ادخل الاسم والسعر'); return; }

    const finalizeSave = (imgSrc) => {
        const newProduct = { id: id ? id : Date.now(), name, price, img: imgSrc, isEvo };
        const path = targetListNum === 1 ? 'products/tab1' : targetListNum === 2 ? 'products/tab2' : 'products/tab3';

        if(id) {
            // تحديث
            const dbRef = ref(db, path);
            onValue(dbRef, (snapshot) => {
                snapshot.forEach((childSnapshot) => {
                    if(childSnapshot.val().id == newProduct.id) {
                        update(ref(db, `${path}/${childSnapshot.key}`), newProduct);
                    }
                });
            }, {onlyOnce: true});
        } else {
            // إضافة
            push(ref(db, path), newProduct);
        }
        closeProductModal();
    };

    if(fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) { finalizeSave(e.target.result); };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        if(id) {
            const list = document.getElementById('edit-prod-source-list').value;
            const oldList = list == '1' ? productsTab1 : list == '2' ? productsTab2 : productsTab3;
            const oldProd = oldList.find(p => p.id == id);
            finalizeSave(oldProd.img);
        } else { finalizeSave('images/gems_img.jpg'); }
    }
}

// --- السلة ---
window.addToCart = (product) => {
    let finalPrice = product.price;
    let finalName = product.name;
    if(product.isEvo) {
        if(!selectedEvo[product.id]) { alert('اختر المدة أولاً'); document.getElementById(`evo-${product.id}`).style.display = 'flex'; return; }
        finalPrice = selectedEvo[product.id].price;
        finalName = `${product.name} (${selectedEvo[product.id].label})`;
    }
    const existingItem = cart.find(i => i.cartId === product.id + (selectedEvo[product.id]?.label || ''));
    if(existingItem) { existingItem.qty++; showToast('تم تحديث الكمية'); } 
    else { cart.push({ cartId: product.id + (selectedEvo[product.id]?.label || ''), name: finalName, price: finalPrice, img: product.img, qty: 1 }); showToast('تمت الإضافة للسلة'); }
    updateCartUI();
}

const updateCartUI = () => {
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    document.getElementById('cart-count').innerText = count;
    const container = document.getElementById('cart-items-container');
    if(cart.length === 0) { container.innerHTML = '<p style="text-align:center; color:#666; padding:20px;">السلة فارغة</p>'; } 
    else {
        container.innerHTML = ''; let total = 0;
        cart.forEach((item, index) => {
            total += item.price * item.qty;
            container.innerHTML += `
                <div class="cart-item">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${item.img}" style="width:40px; height:40px; border-radius:8px; object-fit:contain; background:#333;">
                        <div><div style="font-weight:bold; font-size:14px;">${item.name}</div><small style="color:#888;">${item.price} دينار</small></div>
                    </div>
                    <div style="display:flex; align-items:center; gap:10px;"><span style="font-weight:bold; font-size:18px; color:var(--primary-color);">${item.qty}</span><button onclick="removeFromCart(${index})" style="background:none; border:none; color:#ff3d00; cursor:pointer; font-size:18px;"><i class="fas fa-trash"></i></button></div>
                </div>`;
        });
        document.getElementById('total-price').innerText = total;
    }
}
window.removeFromCart = (index) => { cart.splice(index, 1); updateCartUI(); }
window.openCart = () => { document.getElementById('cart-modal').style.display = 'flex'; }
window.closeCart = () => { document.getElementById('cart-modal').style.display = 'none'; }
const showToast = (msg) => { const toast = document.getElementById('toast'); toast.innerHTML = `<i class="fas fa-check-circle"></i> ${msg}`; toast.style.display = 'block'; setTimeout(() => toast.style.display = 'none', 2000); }

// --- الطلب ---
window.processOrder = () => {
    if(cart.length === 0) { alert('السلة فارغة! الرجاء اختيار منتجات للشراء.'); return; }
    closeCart();
    let msg = `*طلب جديد - قسورة للشحن*\n\n`;
    msg += `👤 الاسم: ${currentUser.name}\n🆔 ID: ${currentUser.id}\n📍 المحافظة: ${currentUser.gov}\n-----------------------\n`;
    let total = 0;
    cart.forEach(item => { msg += `🔹 ${item.name} (${item.qty}x)\n`; total += item.price * item.qty; });
    msg += `-----------------------\n💰 *المجموع: ${total} دينار*`;
    document.getElementById('link-whatsapp').href = `https://wa.me/9647768416326?text=${encodeURIComponent(msg)}`;
    const tgBtn = document.querySelector('#contact-modal .btn-telegram');
    tgBtn.onclick = function() {
        navigator.clipboard.writeText(msg).then(() => { alert('تم نسخ الفاتورة، الصقها في المحادثة.'); window.open('https://t.me/mk_6k2', '_blank'); });
    };
    document.getElementById('contact-modal').style.display = 'flex';
}

window.closeContactModal = () => {
    document.getElementById('contact-modal').style.display = 'none'; cart = []; updateCartUI();
}