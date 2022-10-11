const express = require('express');
const router = express.Router();

const Account = require('../models/account')

const jwt = require('jsonwebtoken');
const config = require('config');

router.post('/', async (req, res) => {

    try{
        // Validate the req.body
        const {error } = Account.validateCredentials(req.body)
        if (error) throw { statusCode: 400, errorMessage: 'Badly formed request payload', errorObj: error }
        
        // check crendetials
        const account = await Account.checkCredentials(req.body);

        // generate a token
        const token = jwt.sign(JSON.stringify(account), config.get('jwt_secret_key'));

        // attach the token to the response header
        res.header('x-authentication-token', token);
        // console.log(token);

        return res.send(JSON.stringify(account));
    }catch(err) {
        if (err.statusCode) return res.status(err.statusCode).send(JSON.stringify(err));
        return res.status(500).send(JSON.stringify(err));
    }
})

module.exports = router;