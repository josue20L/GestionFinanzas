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

const requireJefe = (req, res, next) => {
    if (req.session && req.session.user && (req.session.user.isAdmin || req.session.user.isJefe)) {
        return next();
    }

    if (req.path.startsWith('/api')) {
        return res.status(403).json({ message: 'No autorizado - Se requiere rol Jefe o Admin' });
    }

    return res.status(403).render('error', {
        title: 'Acceso denegado',
        message: 'No tienes permisos para realizar esta acción.'
    });
};

const requireEmpresaAccess = (req, res, next) => {
    // Si es admin, tiene acceso a todo
    if (req.session && req.session.user && req.session.user.isAdmin) {
        return next();
    }

    // Verificar si tiene acceso a la empresa solicitada
    const userEmpresas = req.session.user.accesos.map(a => a.id_empresa);
    const requestedEmpresa = req.params.id || req.params.idEmpresa || req.params.id_empresa || req.body.id_empresa || req.query.id_empresa;

    if (requestedEmpresa && !userEmpresas.includes(Number(requestedEmpresa))) {
        if (req.path.startsWith('/api')) {
            return res.status(403).json({ message: 'No tienes acceso a esta empresa' });
        }
        return res.status(403).render('error', {
            title: 'Acceso denegado',
            message: 'No tienes permisos para esta empresa.'
        });
    }

    next();
};

module.exports = {
    requireAuth,
    requireAdmin,
    requireJefe,
    requireEmpresaAccess
};
