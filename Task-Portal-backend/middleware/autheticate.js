const config = require('config');
const jwt = require('jsonwebtoken');


module.exports = (req, res, next) => {
    try{
        const token = req.header('x-authentication-token');
        if(!token) throw{ statusCode: 401, errorMessage: 'Access denied', errorObj: {}}

        const decryptedToken = jwt.verify(token, config.get('jwt_secret_key'));
        req.account = decryptedToken;
        next()
    }catch(err){
        if(err.statusCode) return res.status(err.statusCode).send(JSON.stringify(err))
        return res.status(500).send(JSON.stringify(err));
    }

}