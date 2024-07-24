import express from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { getRandomUser } from './utils/getRandomUser.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Vista aplicación
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Crear Roommate
app.post('/roommate', async (req, res) => {
  try {
    const newRoommate = await getRandomUser();
    const roommates = JSON.parse(fs.readFileSync('data/roommates.json', 'utf8'));
    roommates.push({ id: uuidv4(), nombre: newRoommate.nombre, debe: 0, recibe: 0 });
    fs.writeFileSync('data/roommates.json', JSON.stringify(roommates));
    res.status(201).json({ message: 'Roommate añdido exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al añadir roommate' });
  }
});

// Recuperar Roommates
app.get('/roommates', (req, res) => {
  try {
    const roommates = JSON.parse(fs.readFileSync('data/roommates.json', 'utf8'));
    res.json({ roommates });
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar roommates' });
  }
});

// Recuperar gastos
app.get('/gastos', (req, res) => {
  try {
    const gastos = JSON.parse(fs.readFileSync('data/gastos.json', 'utf8'));
    res.json({ gastos });
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar gastos' });
  }
});

// Crear un nuevo gasto
app.post('/gasto', (req, res) => {
  try {
    const { roommate, descripcion, monto } = req.body;
    const gastos = JSON.parse(fs.readFileSync('data/gastos.json', 'utf8'));
    const roommates = JSON.parse(fs.readFileSync('data/roommates.json', 'utf8'));

    // Dividir el gasto entre todos los roommates
    const individualShare = monto / roommates.length;

    roommates.forEach((r) => {
      if (r.nombre === roommate) {
        r.recibe += monto - individualShare;
      } else {
        r.debe += individualShare;
      }
    });

    gastos.push({ id: uuidv4(), roommate, descripcion, monto });
    fs.writeFileSync('data/gastos.json', JSON.stringify(gastos));
    fs.writeFileSync('data/roommates.json', JSON.stringify(roommates));

    res.status(201).json({ message: 'Gasto añadido' });
  } catch (error) {
    res.status(500).json({ error: 'Error al añadir gasto' });
  }
});

// Actualizar gasto
app.put('/gasto', (req, res) => {
  try {
    const { id, roommate, descripcion, monto } = req.body;
    let gastos = JSON.parse(fs.readFileSync('data/gastos.json', 'utf8'));
    let roommates = JSON.parse(fs.readFileSync('data/roommates.json', 'utf8'));

    // Encontrar el gasto a actualizar
    const gastoToUpdate = gastos.find(g => g.id === id);

    // Revertir los ajustes del gasto anterior
    const oldMonto = gastoToUpdate.monto;
    const individualShareOld = oldMonto / roommates.length;
    roommates.forEach((r) => {
      if (r.nombre === gastoToUpdate.roommate) {
        r.recibe -= oldMonto - individualShareOld;
      } else {
        r.debe -= individualShareOld;
      }
    });

    // Actualizar el gasto
    gastoToUpdate.roommate = roommate;
    gastoToUpdate.descripcion = descripcion;
    gastoToUpdate.monto = monto;

    // Ajustar los balances para el nuevo monto
    const individualShareNew = monto / roommates.length;
    roommates.forEach((r) => {
      if (r.nombre === roommate) {
        r.recibe += monto - individualShareNew;
      } else {
        r.debe += individualShareNew;
      }
    });

    // Guardar los cambios
    fs.writeFileSync('data/gastos.json', JSON.stringify(gastos));
    fs.writeFileSync('data/roommates.json', JSON.stringify(roommates));

    res.json({ message: 'Gasto actualizado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el gasto' });
  }
});


// Borrar gasto
app.delete('/gasto', (req, res) => {
  try {
    const { id } = req.query;
    let gastos = JSON.parse(fs.readFileSync('data/gastos.json', 'utf8'));
    let roommates = JSON.parse(fs.readFileSync('data/roommates.json', 'utf8'));

    // Encontrar el gasto a eliminar
    const gastoToRemove = gastos.find(g => g.id === id);

    // Revertir ajustes en los balances
    const { roommate, monto } = gastoToRemove;
    const individualShare = monto / roommates.length;

    roommates.forEach((r) => {
      if (r.nombre === roommate) {
        r.recibe -= monto - individualShare;
      } else {
        r.debe -= individualShare;
      }
    });

    // Eliminar el gasto
    gastos = gastos.filter(g => g.id !== id);
    fs.writeFileSync('data/gastos.json', JSON.stringify(gastos));
    fs.writeFileSync('data/roommates.json', JSON.stringify(roommates));

    res.json({ message: 'Gasto eliminado exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar gasto' });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
