import express from "express";
import jsonServer from "json-server";
import auth from "json-server-auth";

const server = express();
server.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    next()
})

const router = jsonServer.router('./data/db.json');
server.use('/api', router);
server.db = router.db

const middlewares = jsonServer.defaults()
const rules = auth.rewriter({
    products: 444,
    featured_products: 444,
    undergraduatePrograms: 444,
    serviciosIE: 444,
    departamentosIE: 444,
    orders: 644,
    users: 644
});

server.use(rules)
server.use(auth)
server.use(middlewares)
server.use(router)

server.listen(8000, () => {
    console.log('Servidor escuchando en http://localhost:8000');
  });