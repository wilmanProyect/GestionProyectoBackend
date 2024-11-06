require('dotenv').config();
const jsonwebtoken = require('jsonwebtoken');
const SECRET_KEY = process.env.SECRET_KEY;

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(403).send('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1]; // Obtiene el token del formato "Bearer <token>"

    if (!token) {
        return res.status(403).send('Token no proporcionado');
    }

    // Verifica el token
    jsonwebtoken.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).send('Token inválido');
        }
        req.user = decoded;
        next();
    });

};

module.exports = authMiddleware;
