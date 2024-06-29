require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const pool = require('./database/config'); // Importar la configuración de la base de datos
const format = require('pg-format');
const loggerExpress = require('logger-express');

const app = express();
const port = process.env.PORT || 3000;