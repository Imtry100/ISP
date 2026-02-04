const express = require('express');
const corsMiddleware = require('./middleware/cors');
const errorHandler = require('./middleware/errorHandler');

const healthRoutes = require('./routes/health');
const sessionsRoutes = require('./routes/sessions');
const uploadRoutes = require('./routes/upload');
const questionsRoutes = require('./routes/questions');

const app = express();

app.use(corsMiddleware);
app.use(express.json());

app.use('/health', healthRoutes);
app.use('/sessions', sessionsRoutes);
app.use('/upload', uploadRoutes);
app.use('/generate-questions', questionsRoutes);

app.use(errorHandler);

module.exports = app;
