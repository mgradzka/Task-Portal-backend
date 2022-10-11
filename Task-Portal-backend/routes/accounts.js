const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Account = require('../models/account');
const Profile = require('../models/profile');
const Joi = require('joi');


// POST /api/accounts
    // signing up
router.post('/', async (req, res) => {
    try {
        const profileWannabe = _.pick(req.body, ['firstname', 'lastname', 'phonenumber', 'profiledescription', 'profilepicture']);
        const accountWannabe = _.pick(req.body, ['email']);
        const passwordWannabe = _.pick(req.body, ['password']);
        // check the raw password
        const schema = Joi.object({
            password: Joi.string().min(3).required()
        })
        let validationResult = schema.validate(passwordWannabe);
        if(validationResult.error) throw{statusCode: 400, errorMessage: 'Password does not match requirements', errorObj: validationResult.error}

        validationResult = Account.validate(accountWannabe)
        if(validationResult.error) throw{statusCode: 400, errorMessage: 'Badly formatted request', errorObj: validationResult.error}
        
        validationResult = Profile.validate(profileWannabe)
        if(validationResult.error) throw{statusCode: 400, errorMessage: 'Badly formatted request', errorObj: validationResult.error}

        const profileToBeSaved = new Profile(profileWannabe);
        const accountToBeSaved = new Account(accountWannabe);
        const account = await accountToBeSaved.create(passwordWannabe.password, profileToBeSaved)
        
        return res.send(JSON.stringify(account));

    } catch (err) {
        if(err.statusCode) {
            return res.status(err.statusCode).send(JSON.stringify(err));
        }

        return res.status(500).send(JSON.stringify(err));
    }
})

module.exports = router;