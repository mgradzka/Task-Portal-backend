module.exports = (req, res, next) => {
    
    const authorizedRole = 'admin';

    try {
        if (!req.account) throw {statusCode: 401, errorMessage: `Access denied: authentication required`, errorObj: {}}

        if (req.account.role && req.account.role.rolename == authorizedRole) {
            req.account.authorized = true;
            return next();
        }

        return next();
    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).send(JSON.stringify(err));
        }
        return res.status(500).send(JSON.stringify(err));
    }
}