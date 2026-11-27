'use strict';

const PRODUCTS = [
  {id:1,name:'Sambal Roa Istimewa',category:'Makanan',price:35000,description:'Sambal roa dengan cita rasa gurih dan pedas yang pas. Cocok menjadi pelengkap berbagai hidangan.',image:'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80'},
  {id:2,name:'Kopi Arabika Pilihan',category:'Minuman',price:55000,description:'Kopi pilihan dengan aroma khas dan karakter rasa seimbang untuk menemani aktivitas harian.',image:'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=800&q=80'},
  {id:3,name:'Keripik Pisang',category:'Camilan',price:22000,description:'Camilan renyah berbahan pisang pilihan. Tersedia untuk teman santai bersama keluarga.',image:'assets/images pisang.jpg'},
  {id:4,name:'Madu Hutan Murni',category:'Produk Alam',price:78000,description:'Madu hutan dengan rasa alami. Dikemas praktis untuk kebutuhan rumah tangga.',image:'https://images.unsplash.com/photo-1587049352851-8d4e89133924?auto=format&fit=crop&w=800&q=80'},
  {id:5,name:'Kue Kering Rumahan',category:'Camilan',price:40000,description:'Kue kering dengan tekstur lembut dan rasa klasik. Cocok disajikan saat berkumpul.',image:'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80'},
  {id:6,name:'Minuman Herbal',category:'Minuman',price:18000,description:'Minuman herbal racikan rumahan dengan bahan pilihan dan rasa yang menyegarkan.',image:'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80'}
];

const CART_KEY = 'ruangRasa.cart.v1';
const WA_KEY = 'ruangRasa.whatsapp.v1';
const DEFAULT_WA = '6281234567890';
const $ = (selector, parent=document) => parent.querySelector(selector);
const money = value => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);

let activeCategory = 'Semua';
let cart = readCart();
let whatsappNumber = readWhatsapp();
let lastFocus = null;

function readCart(){
  try{
    const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if(!Array.isArray(value)) return [];
    return value.filter(row => row && Number.isInteger(row.id) && PRODUCTS.some(p=>p.id===row.id))
      .map(row=>({id:row.id,qty:Math.max(1,Math.min(99,Number.parseInt(row.qty,10)||1))}));
  }catch{return [];}
}
function saveCart(){try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}catch{toast('Penyimpanan browser tidak tersedia.','error');}}
function readWhatsapp(){
  try{
    const value=localStorage.getItem(WA_KEY)||DEFAULT_WA;
    return /^[0-9]{10,15}$/.test(value)?value:DEFAULT_WA;
  }catch{return DEFAULT_WA;}
}
function toast(message,type='success'){
  const node=document.createElement('div');
  node.className=`toast${type==='error'?' error':''}`;
  node.textContent=message;
  $('#toastRegion').append(node);
  window.setTimeout(()=>node.remove(),2800);
}
function safeImage(img, fallback=''){
  img.addEventListener('error',()=>{if(fallback && img.src!==fallback)img.src=fallback;else img.alt='Gambar produk tidak tersedia';},{once:true});
}
function renderFilters(){
  const categories=['Semua',...new Set(PRODUCTS.map(p=>p.category))];
  const host=$('#categoryFilters');host.replaceChildren();
  categories.forEach(category=>{
    const button=document.createElement('button');
    button.type='button';button.className=`filter-chip${activeCategory===category?' active':''}`;
    button.textContent=category;button.setAttribute('aria-pressed',String(activeCategory===category));
    button.addEventListener('click',()=>{activeCategory=category;renderFilters();renderProducts();});
    host.append(button);
  });
}
function productCard(product){
  const article=document.createElement('article');article.className='product-card';
  const imageButton=document.createElement('button');imageButton.type='button';imageButton.className='product-image';imageButton.setAttribute('aria-label',`Lihat detail ${product.name}`);
  const img=document.createElement('img');img.src=product.image;img.alt=product.name;img.loading='lazy';safeImage(img);imageButton.append(img);
  const tag=document.createElement('span');tag.className='category-tag';tag.textContent=product.category;imageButton.append(tag);
  imageButton.addEventListener('click',()=>openProduct(product.id));
  const info=document.createElement('div');info.className='product-info';
  const title=document.createElement('h3');title.textContent=product.name;
  const description=document.createElement('p');description.textContent=product.description;
  const bottom=document.createElement('div');bottom.className='product-bottom';
  const price=document.createElement('span');price.className='price';price.textContent=money(product.price);
  const add=document.createElement('button');add.type='button';add.className='add-button';add.textContent='+ Tambah';add.addEventListener('click',()=>addToCart(product.id));
  bottom.append(price,add);info.append(title,description,bottom);article.append(imageButton,info);return article;
}
function renderProducts(){
  const query=$('#searchInput').value.trim().toLocaleLowerCase('id');
  const results=PRODUCTS.filter(p=>(activeCategory==='Semua'||p.category===activeCategory)&&`${p.name} ${p.category} ${p.description}`.toLocaleLowerCase('id').includes(query));
  const grid=$('#productGrid');grid.replaceChildren();
  results.forEach(p=>grid.append(productCard(p)));
  $('#productTotal').textContent=`${results.length} produk ditemukan`;
  $('#emptyState').classList.toggle('hidden',results.length!==0);
}
function openProduct(id){
  const product=PRODUCTS.find(p=>p.id===id);if(!product)return;
  lastFocus=document.activeElement;
  const host=$('#productModalContent');host.replaceChildren();
  const layout=document.createElement('div');layout.className='detail-layout';
  const img=document.createElement('img');img.src=product.image;img.alt=product.name;safeImage(img);
  const content=document.createElement('div');
  const category=document.createElement('span');category.className='section-kicker';category.textContent=product.category;
  const title=document.createElement('h2');title.id='modalTitle';title.textContent=product.name;
  const desc=document.createElement('p');desc.textContent=product.description;
  const price=document.createElement('strong');price.className='price';price.textContent=money(product.price);
  const add=document.createElement('button');add.type='button';add.className='btn btn-primary';add.textContent='Tambah ke keranjang';add.addEventListener('click',()=>{addToCart(product.id);closeModals();});
  content.append(category,title,desc,price,add);layout.append(img,content);host.append(layout);
  showModal($('#productModal'));
}
function showModal(modal){$('#overlay').classList.remove('hidden');modal.classList.remove('hidden');document.body.style.overflow='hidden';}
function closeModals(){
  document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));
  if(!$('#cartDrawer').classList.contains('open')){$('#overlay').classList.add('hidden');document.body.style.overflow='';}
  if(lastFocus && typeof lastFocus.focus==='function')lastFocus.focus();
}
function addToCart(id){
  const row=cart.find(item=>item.id===id);
  if(row){if(row.qty>=99){toast('Jumlah maksimum per produk adalah 99.','error');return;}row.qty++;}
  else cart.push({id,qty:1});
  saveCart();renderCart();toast('Produk ditambahkan ke keranjang.');
}
function changeQty(id,delta){
  const row=cart.find(item=>item.id===id);if(!row)return;
  row.qty+=delta;if(row.qty<=0)cart=cart.filter(item=>item.id!==id);
  if(row.qty>99)row.qty=99;
  saveCart();renderCart();
}
function renderCart(){
  const host=$('#cartItems');host.replaceChildren();
  const count=cart.reduce((sum,row)=>sum+row.qty,0);
  $('#cartCount').textContent=String(count);
  let total=0;
  if(!cart.length){const empty=document.createElement('div');empty.className='cart-empty';empty.textContent='Keranjang masih kosong. Yuk, pilih produk favoritmu!';host.append(empty);}
  cart.forEach(row=>{
    const product=PRODUCTS.find(p=>p.id===row.id);if(!product)return;
    total+=product.price*row.qty;
    const item=document.createElement('div');item.className='cart-row';
    const img=document.createElement('img');img.src=product.image;img.alt=product.name;safeImage(img);
    const info=document.createElement('div');
    const title=document.createElement('h4');title.textContent=product.name;
    const sub=document.createElement('small');sub.textContent=money(product.price);
    const controls=document.createElement('div');controls.className='quantity-control';
    const minus=document.createElement('button');minus.type='button';minus.textContent='−';minus.setAttribute('aria-label',`Kurangi ${product.name}`);minus.addEventListener('click',()=>changeQty(row.id,-1));
    const qty=document.createElement('span');qty.textContent=String(row.qty);qty.setAttribute('aria-label','Jumlah');
    const plus=document.createElement('button');plus.type='button';plus.textContent='+';plus.setAttribute('aria-label',`Tambah ${product.name}`);plus.addEventListener('click',()=>changeQty(row.id,1));
    controls.append(minus,qty,plus);info.append(title,sub,controls);
    const remove=document.createElement('button');remove.type='button';remove.className='remove-item';remove.textContent='Hapus';remove.addEventListener('click',()=>{cart=cart.filter(i=>i.id!==row.id);saveCart();renderCart();toast('Produk dihapus.');});
    item.append(img,info,remove);host.append(item);
  });
  $('#cartTotal').textContent=money(total);
  $('#checkoutButton').disabled=!cart.length;
  $('#checkoutButton').style.opacity=cart.length?'1':'.5';
}
function openCart(){
  closeModals();$('#overlay').classList.remove('hidden');$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden';$('#closeCart').focus();
}
function closeCart(){
  $('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');$('#overlay').classList.add('hidden');document.body.style.overflow='';$('#openCart').focus();
}
function checkout(){
  if(!cart.length){toast('Keranjang masih kosong.','error');return;}
  const lines=['Halo, saya ingin memesan produk berikut:',''];
  let total=0;
  cart.forEach(row=>{const p=PRODUCTS.find(item=>item.id===row.id);if(!p)return;const subtotal=p.price*row.qty;total+=subtotal;lines.push(`- ${p.name} (${row.qty} x ${money(p.price)}) = ${money(subtotal)}`);});
  lines.push('',`Total sementara: ${money(total)}`,'','Mohon konfirmasi ketersediaan dan ongkos kirim. Terima kasih.');
  const url=`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
  const opened=window.open(url,'_blank','noopener,noreferrer');
  if(!opened){window.location.href=url;return;}
  cart=[];saveCart();renderCart();closeCart();toast('Pesanan disiapkan. Silakan lanjutkan di WhatsApp.');
}
function openSettings(){
  lastFocus=document.activeElement;$('#whatsappInput').value=whatsappNumber;showModal($('#settingsModal'));$('#whatsappInput').focus();
}
function saveSettings(event){
  event.preventDefault();
  const value=$('#whatsappInput').value.replace(/\D/g,'');
  if(!/^[0-9]{10,15}$/.test(value)){toast('Nomor harus terdiri dari 10–15 digit angka.','error');return;}
  whatsappNumber=value;
  try{localStorage.setItem(WA_KEY,value);}catch{toast('Pengaturan tidak dapat disimpan di browser.','error');return;}
  updateWhatsappLinks();closeModals();toast('Nomor WhatsApp berhasil disimpan.');
}
function updateWhatsappLinks(){
  const url=`https://wa.me/${whatsappNumber}`;
  $('#ctaWhatsapp').href=url;$('#footerWhatsapp').href=url;
  $('#footerWhatsapp').textContent=`WhatsApp: ${whatsappNumber}`;
}
function init(){
  $('#year').textContent=String(new Date().getFullYear());
  renderFilters();renderProducts();renderCart();updateWhatsappLinks();
  $('#searchInput').addEventListener('input',renderProducts);
  $('#openCart').addEventListener('click',openCart);
  $('#closeCart').addEventListener('click',closeCart);
  $('#checkoutButton').addEventListener('click',checkout);
  $('#openSettings').addEventListener('click',openSettings);
  $('#settingsForm').addEventListener('submit',saveSettings);
  $('#overlay').addEventListener('click',()=>{if($('#cartDrawer').classList.contains('open'))closeCart();else closeModals();});
  document.querySelectorAll('[data-close-modal]').forEach(button=>button.addEventListener('click',closeModals));
  $('#menuToggle').addEventListener('click',()=>{
    const nav=$('#mainNav');const open=nav.classList.toggle('open');
    $('#menuToggle').setAttribute('aria-expanded',String(open));$('#menuToggle').setAttribute('aria-label',open?'Tutup navigasi':'Buka navigasi');
  });
  $('#mainNav').querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{$('#mainNav').classList.remove('open');$('#menuToggle').setAttribute('aria-expanded','false');}));
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if($('#cartDrawer').classList.contains('open'))closeCart();
      else if(!document.querySelector('.modal.hidden'))closeModals();
    }
  });
}
document.addEventListener('DOMContentLoaded',init);
