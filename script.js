/* ---- Pantalla 1: cargar detalles ---- */
const tabla     = document.getElementById('detalleTabla');
const btnCont   = document.getElementById('btnContinuar');
const intro     = document.getElementById('intro');
const formWrap  = document.getElementById('formWrap');
const form      = document.getElementById('registroForm');
const msg       = document.getElementById('msg');

let fixedData = {};

const NORMALIZE_LABEL = /(^.|_.)/g;

function updateFixedData(data) {
  fixedData = data || {};
  tabla.innerHTML = '';

  if (!data || Object.keys(data).length === 0) {
    tabla.innerHTML = '<tr><td colspan="2">No se encontraron detalles para mostrar.</td></tr>';
    return;
  }

  for (const [key, value] of Object.entries(data)) {
    const label = key.replace(NORMALIZE_LABEL, s => s.replace('_', ' ').toUpperCase());
    const row = `<tr><td>${label}</td><td>${value ?? ''}</td></tr>`;
    tabla.insertAdjacentHTML('beforeend', row);
  }
}

function showError(err) {
  console.error(err);
  tabla.innerHTML = '<tr><td colspan="2">No se pudieron cargar los detalles del pedido.</td></tr>';
}

tabla.innerHTML = '<tr><td colspan="2">Cargando detalles...</td></tr>';

google.script.run
  .withSuccessHandler(updateFixedData)
  .withFailureHandler(showError)
  .getFXLOptionsData();

btnCont.onclick = () => {
  intro.classList.add('hidden');
  formWrap.classList.remove('hidden');
  window.scrollTo(0,0);
};

/* ---- Pantalla 2: enviar registro ---- */
form.addEventListener('submit', e => {
  e.preventDefault();
  msg.textContent = 'Enviando...';

  const formEntries = Array.from(new FormData(form).entries())
    .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]);
  const datos = Object.fromEntries(formEntries);
  const operariosLista = formEntries
    .filter(([key]) => key.toLowerCase().startsWith('operario'))
    .map(([, value]) => value)
    .filter(value => value !== undefined && value !== null && value !== '');

  const payload = { ...datos, operariosLista };

  for (const [key, value] of Object.entries(fixedData)) {
    payload[key] = value ?? '';
  }

  google.script.run
    .withSuccessHandler(onSaveSuccess)
    .withFailureHandler(onSaveError)
    .saveEntry(payload);
});

function onSaveSuccess(response) {
  if (!response || response.ok) {
    msg.textContent = '✅ ¡Registro guardado!';
    form.reset();
  } else {
    const err = response && response.error ? response.error : 'Error desconocido';
    onSaveError(err);
  }
}

function onSaveError(error) {
  const message = typeof error === 'string'
    ? error
    : (error && error.message) ? error.message : 'Error desconocido';
  msg.textContent = '❌ Error: ' + message;
}
