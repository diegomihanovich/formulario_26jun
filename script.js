const API_URL = 'https://script.google.com/macros/s/AKfycbyMGJOJ8z3GcqtgrpmtA7CiKuCNRwgK0RK97_6I0MTcM5oxwGqg13TAP7RIjAd7Q4Ey/exec';

/* ---- Referencias UI ---- */
const tabla = document.getElementById('detalleTabla');
const btnCont = document.getElementById('btnContinuar');
const intro = document.getElementById('intro');
const formWrap = document.getElementById('formWrap');
const form = document.getElementById('registroForm');
const msg = document.getElementById('msg');
const cantPersonasSelect = document.getElementById('cantPersonas');
const operariosContainer = document.getElementById('operariosContainer');
const fechaInput = document.getElementById('fecha');

let fixedData = {};
let operariosDisponibles = [];

const NORMALIZE_LABEL = /(^.|_.)/g;

/* ---- Helpers ---- */
const formatLabel = (key) => key
  .replace(NORMALIZE_LABEL, (fragment) => fragment.replace('_', ' ').toUpperCase());

const showTableMessage = (message) => {
  tabla.innerHTML = `<tr><td colspan="2">${message}</td></tr>`;
};

const setTodayAsDefaultDate = () => {
  if (!fechaInput) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  fechaInput.value = `${yyyy}-${mm}-${dd}`;
};

const createSelectOption = (value, text = value) => {
  const option = document.createElement('option');
  option.value = String(value);
  option.textContent = text;
  return option;
};

const renderOperarioFields = () => {
  const cantidad = parseInt(cantPersonasSelect.value, 10) || 1;
  operariosContainer.innerHTML = '';

  const hasOperariosDisponibles = operariosDisponibles.length > 0;

  for (let i = 1; i <= cantidad; i += 1) {
    const wrapper = document.createElement('label');
    wrapper.className = 'operario-field';

    const caption = document.createElement('span');
    caption.className = 'operario-field__caption';
    caption.textContent = cantidad === 1 ? 'Operario' : `Operario ${i}`;
    wrapper.appendChild(caption);

    const select = document.createElement('select');
    select.name = `operario${i}`;
    select.required = hasOperariosDisponibles;

    if (!hasOperariosDisponibles) {
      select.appendChild(createSelectOption('', 'Sin operarios'));
    } else {
      operariosDisponibles.forEach((operario) => {
        select.appendChild(createSelectOption(operario));
      });
    }

    wrapper.appendChild(select);
    operariosContainer.appendChild(wrapper);
  }
};

const handleDropdownData = (data) => {
  const personas = Array.isArray(data?.personas) && data.personas.length > 0
    ? data.personas
    : ['1', '2', '3', '4'];

  cantPersonasSelect.innerHTML = '';
  personas.forEach((persona) => {
    cantPersonasSelect.appendChild(createSelectOption(persona));
  });

  if (cantPersonasSelect.options.length > 0) {
    cantPersonasSelect.value = cantPersonasSelect.options[0].value;
  }

  operariosDisponibles = Array.isArray(data?.operarios) && data.operarios.length > 0
    ? data.operarios
    : [];

  renderOperarioFields();
};

const updateFixedData = (data) => {
  fixedData = data || {};
  tabla.innerHTML = '';

  if (!data || Object.keys(data).length === 0) {
    showTableMessage('No se encontraron detalles para mostrar.');
    return;
  }

  Object.entries(data).forEach(([key, value]) => {
    const row = document.createElement('tr');

    const labelCell = document.createElement('td');
    labelCell.textContent = formatLabel(key);

    const valueCell = document.createElement('td');
    valueCell.textContent = value ?? '';

    row.appendChild(labelCell);
    row.appendChild(valueCell);
    tabla.appendChild(row);
  });
};

const showError = (error) => {
  console.error('Error al cargar datos:', error);
  showTableMessage('No se pudieron cargar los detalles del pedido.');
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Solicitud fallida (${response.status})`);
  }
  return response.json();
};

const loadFixedData = async () => {
  try {
    showTableMessage('Cargando detalles...');
    const data = await fetchJson(`${API_URL}?action=getOptions`);
    if (data?.error) {
      throw new Error(data.error);
    }
    updateFixedData(data);
  } catch (error) {
    showError(error);
  }
};

const loadDropdowns = async () => {
  try {
    const data = await fetchJson(`${API_URL}?action=getDropdowns`);
    if (data?.error) {
      throw new Error(data.error);
    }
    handleDropdownData(data);
  } catch (error) {
    console.error('Error al cargar desplegables:', error);
    handleDropdownData({});
  }
};

const buildPayload = () => {
  const formEntries = Array.from(new FormData(form).entries())
    .map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]);

  const datos = Object.fromEntries(formEntries);

  const operarios = formEntries
    .filter(([key]) => key.toLowerCase().startsWith('operario'))
    .map(([, value]) => value)
    .filter((value) => value);

  const hasOperariosDisponibles = operariosDisponibles.length > 0;

  const payload = {
    ...datos,
    operariosLista: hasOperariosDisponibles ? operarios.join(', ') : '',
  };

  Object.entries(fixedData).forEach(([key, value]) => {
    payload[`${key}_fijo`] = value ?? '';
  });

  return payload;
};

const sendPayload = async (payload) => {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`No se pudo guardar (HTTP ${response.status})`);
  }

  return response.json();
};

const onSaveSuccess = (result) => {
  if (result?.status === 'OK') {
    msg.textContent = '✅ ¡Registro guardado!';
    form.reset();
    setTodayAsDefaultDate();
    renderOperarioFields();
  } else {
    const message = result?.message || 'Error desconocido al guardar.';
    onSaveError(new Error(message));
  }
};

const onSaveError = (error) => {
  const message = error?.message || 'Error desconocido al guardar.';
  msg.textContent = `❌ Error: ${message}`;
};

/* ---- Inicialización ---- */
setTodayAsDefaultDate();
loadFixedData();
loadDropdowns();

btnCont.addEventListener('click', () => {
  intro.classList.add('hidden');
  formWrap.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

cantPersonasSelect.addEventListener('change', renderOperarioFields);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  msg.textContent = 'Enviando...';

  try {
    const payload = buildPayload();
    const result = await sendPayload(payload);
    onSaveSuccess(result);
  } catch (error) {
    onSaveError(error);
  }
});
