import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import pool from './database/config.js'; // Importar la configuración de la base de datos
import * as loggerExpress from 'logger-express';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middelware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(loggerExpress.logger());

// Middelware para registrar las rutas consultadas
app.use((req, res, next) => {
  console.log(`Consulta a la ruta: ${req.method} ${req.url}`);
  next();
});

// 1. Ruta GET /joyas
// a. Devuelve la estructura HATEOAS de todas las joyas almacenadas en la base de datos
// b. Recibe en la query string los parametros: limits, page, order by
app.get('/joyas', async (req, res) => {
    try {
      const { limits, page, order_by } = req.query;
      let query = 'SELECT * FROM inventario';
      let params = [];
  
      // Ordenamiento
      if (order_by) {
        const [field, direction] = order_by.split('_');
        query += ` ORDER BY ${field} ${direction}`;
      }
  
      // Limite de recursos
      if (limits) {
        query += ' LIMIT $1';
        params.push(parseInt(limits));
      }
  
      // Paginacion
      if (page) {
        const offset = (parseInt(page) - 1) * parseInt(limits);
        query += ' OFFSET $2';
        params.push(offset);
      }
  
      // Consulta a la base de datos con parametros para evitar SQL Injection
      const result = await pool.query(query, params);
      
      res.json({
        totalJoyas: result.rows.length,
        stockTotal: result.rows.reduce((acc, item) => acc + item.stock, 0),
        results: result.rows.map(joya => ({
          name: joya.nombre,
          href: `/joyas/${joya.id}`,
        })),
        // Estructura de datos HATEOAS
        _links: {
          self: { href: `/joyas?limits=${limits}&page=${page}&order_by=${order_by}`},
          next: { href: `/joyas?limits=${limits}&page=${parseInt(page) + 1}&order_by=${order_by}`},
          previous: { href: `/joyas?limits=${limits}&page=${parseInt(page) -1}&order_by=${order_by}`}
        }
      });
    } catch (error) {
      // Usar try catch para capturar los posibles errores
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });


// 2. Ruta GET /joyas/filtros
// Recibe los siguientes parametros en la query string: precio_min, precio_max, categoria, metal
app.get('/joyas/filtros', async (req, res) => {
    try {
      const { precio_min, precio_max, categoria, metal } = req.query;
      let query = 'SELECT * FROM inventario WHERE 1=1';
      let params = [];
  
      // Filtro de recursos por campos
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
  
      // Consult a la base de datos con parametros para evitar SQL Injection
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (error) {
      // Usar try catch para capturar los posibles errores
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Escuchar el servidor en el puerto configurado
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });