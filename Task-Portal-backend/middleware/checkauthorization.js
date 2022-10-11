module.exports = (req, res, next) => {
    try {
        console.log(req.account);
        if (req.account.authorized) return next();
        throw {statusCode: 401, errorMessage: `Access denied: authorization failed`, errorObj: {}}

    } catch (err) {
        if (err.statusCode) {
            return res.status(err.statusCode).send(JSON.stringify(err));
        }
        return res.status(500).send(JSON.stringify(err));
    }
}

