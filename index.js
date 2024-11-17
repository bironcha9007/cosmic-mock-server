import express from 'express';
import jsonServer from 'json-server';
import auth from 'json-server-auth';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Inicializa el servidor Express
const server = express();

// Habilitar CORS
server.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', '*');
  next();
});

// Router de json-server
const router = jsonServer.router('./data/db.json');
server.use('/api', router);
server.db = router.db;

// Middleware para json-server y reglas de autenticación
const middlewares = jsonServer.defaults();
const rules = auth.rewriter({
  products: 444,
  featured_products: 444,
  undergraduatePrograms: 444,
  orders: 660,
  users: 644
});

// Ruta para registrar usuarios
const GITHUB_API_URL = 'https://api.github.com';
const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME, FILE_PATH } = process.env;

const updateDbJson = async (newData) => {
  try {
    // Obtener el archivo db.json desde GitHub
    const response = await fetch(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );
    const fileData = await response.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf8');
    const currentData = JSON.parse(content);

    // Agregar el nuevo usuario
    currentData.users.push(newData);

    // Convertir el contenido actualizado a base64
    const updatedContent = Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64');

    // Subir el archivo actualizado a GitHub
    const updateResponse = await fetch(
      `${GITHUB_API_URL}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Actualización de usuarios',
          content: updatedContent,
          sha: fileData.sha, // Necesario para actualizar el archivo
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error('No se pudo actualizar db.json en GitHub.');
    }

    console.log('Archivo db.json actualizado con éxito en GitHub.');
  } catch (error) {
    console.error('Error al actualizar db.json:', error);
    throw error;
  }
};

// Endpoint para registrar usuario
server.post('/api/register', async (req, res) => {
  const newUser = req.body;

  try {
    // Actualizar el archivo db.json en GitHub con el nuevo usuario
    await updateDbJson(newUser);
    res.status(201).json({ message: 'Usuario registrado y guardado en GitHub.' });
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar el usuario en GitHub.' });
  }
});

// Aplicar autenticación, reglas y middlewares
server.use(rules);
server.use(auth);
server.use(middlewares);
server.use(router);

// Iniciar el servidor
server.listen(8000, () => {
  console.log('Servidor escuchando en http://localhost:8000');
});
