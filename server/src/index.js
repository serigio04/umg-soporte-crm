require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./config/db');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

//middleware para manejar errores
const handleErrors = require('./middlewares/errorHandler.middleware');

const app = express();

app.use(cors({ origin: 'http://localhost:5173' })); // puerto de Vite
app.use(express.json());

// Swagger setup
const swaggerDocument = YAML.load(path.join(__dirname, '../docs/api/openapi.yaml'));

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

// Swagger UI route
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor corriendo' });
});

app.use(handleErrors);

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  initDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  });
}

module.exports = app;