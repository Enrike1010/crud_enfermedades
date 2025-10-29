const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// === Cargar CSV ===
let dataset = [];
let nextId = 1;

fs.createReadStream('dataset_enfermedades.csv')
  .pipe(csv())
  .on('data', (row) => {
    const paciente = {
      id: parseInt(row.id),
      edad: parseInt(row.edad),
      sexo: row.sexo,
      presion_sistolica: parseInt(row.presion_sistolica),
      presion_diastolica: parseInt(row.presion_diastolica),
      colesterol: parseInt(row.colesterol),
      glucosa: parseInt(row.glucosa),
      imc: parseFloat(row.imc),
      tabaquismo: parseInt(row.tabaquismo),
      actividad_fisica: parseInt(row.actividad_fisica),
      historial_familiar: parseInt(row.historial_familiar),
      enfermedad: row.enfermedad,
      sintomas: row.sintomas
    };
    dataset.push(paciente);
    if (paciente.id >= nextId) nextId = paciente.id + 1;
  })
  .on('end', () => {
    console.log(`✅ CSV cargado con éxito (${dataset.length} pacientes)`);
  });

// === Guardar dataset en CSV ===
function guardarCSV() {
  if (dataset.length === 0) return;

  const encabezado = Object.keys(dataset[0]).join(',') + '\n';
  const filas = dataset.map(p =>
    `${p.id},${p.edad},${p.sexo},${p.presion_sistolica},${p.presion_diastolica},${p.colesterol},${p.glucosa},${p.imc},${p.tabaquismo},${p.actividad_fisica},${p.historial_familiar},${p.enfermedad},${p.sintomas}`
  ).join('\n');

  fs.writeFileSync('dataset_enfermedades.csv', encabezado + filas);
  console.log('💾 CSV actualizado');
}

// === Servir HTML ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// === CRUD API ===

// 🔹 GET todos (con paginación opcional)
app.get('/pacientes', (req, res) => {
  const limit = parseInt(req.query.limit) || 1000; // puedes cambiar a 200 si quieres más rápido
  res.json(dataset.slice(0, limit));
});

// 🔹 GET por ID
app.get('/pacientes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const paciente = dataset.find(p => p.id === id);
  if (!paciente) return res.status(404).json({ error: 'Paciente no encontrado' });
  res.json(paciente);
});

// 🔹 POST crear paciente
app.post('/pacientes', (req, res) => {
  const nuevo = { id: nextId++, ...req.body };
  dataset.push(nuevo);
  guardarCSV();
  res.status(201).json(nuevo);
});

// 🔹 PUT actualizar paciente
app.put('/pacientes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = dataset.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Paciente no encontrado' });

  dataset[idx] = { ...dataset[idx], ...req.body, id };
  guardarCSV();
  res.json(dataset[idx]);
});

// 🔹 DELETE eliminar paciente
app.delete('/pacientes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = dataset.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Paciente no encontrado' });

  dataset.splice(idx, 1);
  guardarCSV();
  res.json({ mensaje: 'Paciente eliminado correctamente' });
});

// === Iniciar servidor ===
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
