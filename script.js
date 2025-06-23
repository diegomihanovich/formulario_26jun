/* -------- CONFIG -------- */
const API_URL = 'https://script.google.com/macros/s/AKfycby9T6ToO_LjYwJiv1GHWHlfIWfHYqyHtotQWrx1fj4lbn4dkvXucxi9WL7ziHlzYAIl/exec'; // ← pega la URL /exec del deploy

/* ---- Pantalla 1: cargar detalles ---- */
const tabla     = document.getElementById('detalleTabla');
const btnCont   = document.getElementById('btnContinuar');
const intro     = document.getElementById('intro');
const formWrap  = document.getElementById('formWrap');
const form      = document.getElementById('registroForm');
const msg       = document.getElementById('msg');

fetch(API_URL + '?action=getDetails')
  .then(r => r.json())
  .then(data => {
    for (const [k,v] of Object.entries(data)) {
      const row = `<tr><td>${k.replace(/(^.|_.)/g, s =>
                      s.replace('_',' ').toUpperCase())}</td><td>${v}</td></tr>`;
      tabla.insertAdjacentHTML('beforeend', row);
    }
  })
  .catch(() => tabla.innerHTML = '<tr><td>Error al cargar datos 🙈</td></tr>');

btnCont.onclick = () => {
  intro.classList.add('hidden');
  formWrap.classList.remove('hidden');
  window.scrollTo(0,0);
};

/* ---- Pantalla 2: enviar registro ---- */
form.addEventListener('submit', e => {
  e.preventDefault();
  msg.textContent = 'Enviando...';

  const datos = new FormData(form);
  datos.append('action', 'addRecord');

  fetch(API_URL, { method:'POST', body:datos })
    .then(r => r.json())
    .then(r => {
      if (r.ok) {
        msg.textContent = '✅ ¡Registro guardado!';
        form.reset();
      } else {
        throw r.error;
      }
    })
    .catch(err => msg.textContent = '❌ Error: ' + err);
});
