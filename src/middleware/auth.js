const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }

    if (req.path.startsWith('/api')) {
        return res.status(401).json({ message: 'No autenticado' });
    }

    return res.redirect('/login');
};

const requireAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.isAdmin) {
        return next();
    }

    if (req.path.startsWith('/api')) {
        return res.status(403).json({ message: 'No autorizado' });
    }

    return res.status(403).render('error', {
        title: 'Acceso denegado',
        message: 'No tienes permisos para acceder a esta sección.'
    });
};

module.exports = {
    requireAuth,
    requireAdmin
};
