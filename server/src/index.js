require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { initDB } = require('./config/db');
const { iniciarRealtime } = require('./realtime');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(path.join(__dirname, '../docs/api/openapi.yaml'));

const app = express();
const server = http.createServer(app);
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({ origin: origins }));
app.use(express.json());

//rutas
app.use('/api/auth', require('./routes/auth.route'));
app.use('/api/tickets', require('./routes/ticket.route'));
app.use('/api/agentes', require('./routes/agente.route'));
app.use('/api/estudiantes', require('./routes/student.route'));
app.use('/api/conocimiento', require('./routes/conocimiento.route'));
app.use('/api/repair.all', require('./routes/repair.route'));
app.use('/api/usuarios', require('./routes/user.route'));
app.use('/api/metricas', require('./routes/metrics.route'));
app.use('/api/encuestas', require('./routes/survey.route'));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor corriendo' });
});

const PORT = process.env.PORT || 3000;

initDB().then(() => {
  iniciarRealtime(server);
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
