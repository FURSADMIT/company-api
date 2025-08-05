const express = require('express');
const { Pool } = require('pg');
const swaggerUI = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Swagger документация
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc));

// ====================== CRUD ДЛЯ СОТРУДНИКОВ ======================

// 1. Получить всех сотрудников (GET)
app.get('/employees', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM Employees');
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 2. Получить сотрудника по ID (GET)
app.get('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM Employees WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 3. Создать нового сотрудника (POST)
app.post('/employees', async (req, res) => {
  try {
    const { first_name, last_name, position, department_id, car_id } = req.body;
    
    // Валидация
    if (!first_name || !last_name || !position) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const { rows } = await pool.query(
      `INSERT INTO Employees 
      (first_name, last_name, position, department_id, car_id) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [first_name, last_name, position, department_id, car_id]
    );
    
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 4. Обновить сотрудника (PUT)
app.put('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, position, department_id, car_id } = req.body;
    
    const { rows } = await pool.query(
      `UPDATE Employees 
      SET first_name = $1, last_name = $2, position = $3, department_id = $4, car_id = $5
      WHERE id = $6
      RETURNING *`,
      [first_name, last_name, position, department_id, car_id, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 5. Удалить сотрудника (DELETE)
app.delete('/employees/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rowCount } = await pool.query('DELETE FROM Employees WHERE id = $1', [id]);
    
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ====================== ДОПОЛНИТЕЛЬНЫЕ ЭНДПОИНТЫ ======================

// Поиск сотрудников по сериалу
app.get('/employees/by-series/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const { rows } = await pool.query(
      `SELECT ... WHERE s.title = $1`, // Ваш SQL-запрос
      [title]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'No employees found for this series' });
    }
    
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));