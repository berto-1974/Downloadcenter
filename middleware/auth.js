const jwt = require('jsonwebtoken');

function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Kein Token vorhanden' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token ungültig oder abgelaufen' });
    }
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Keine Admin-Berechtigung' });
    }
    req.admin = payload;
    next();
  });
}

module.exports = { requireAdmin };
