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

// 1. Ruta GET /joyas
app.get('/joyas', async (req, res) => {
    try {
      const { limits, page, order_by } = req.query;
      let query = 'SELECT * FROM inventario';
      let params = [];
  
      if (order_by) {
        const [field, direction] = order_by.split('_');
        query += ` ORDER BY ${field} ${direction}`;
      }
  
      if (limits) {
        query += ' LIMIT $1';
        params.push(parseInt(limits));
      }
  
      if (page) {
        const offset = (parseInt(page) - 1) * parseInt(limits);
        query += ' OFFSET $2';
        params.push(offset);
      }
  
      const result = await pool.query(query, params);
      res.json({
        totalJoyas: result.rows.length,
        stockTotal: result.rows.reduce((acc, item) => acc + item.stock, 0),
        results: result.rows.map(joya => ({
          name: joya.nombre,
          href: `/joyas/${joya.id}`,
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


// 2. Ruta GET /joyas/filtros
app.get('/joyas/filtros', async (req, res) => {
    try {
      const { precio_min, precio_max, categoria, metal } = req.query;
      let query = 'SELECT * FROM inventario WHERE 1=1';
      let params = [];
  
      if (precio_min) {
        query += ' AND precio >= $1';
        params.push(parseInt(precio_min));
      }
  
      if (precio_max) {
        query += ' AND precio <= $2';
        params.push(parseInt(precio_max));
      }
  
      if (categoria) {
        query += ' AND categoria = $3';
        params.push(categoria);
      }
  
      if (metal) {
        query += ' AND metal = $4';
        params.push(metal);
      }
  
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });