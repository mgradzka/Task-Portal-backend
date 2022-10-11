const express = require('express');
const router = express.Router();
const autheticate = require("../middleware/autheticate");
const Profile = require('../models/profile')

const jwt = require('jsonwebtoken');
const config = require('config');
const Joi = require('joi');


router.get('/:profileid', [autheticate], async (req,res) =>{
    try{
        const schema = Joi.object({
            profileid: Joi.number()
                .integer()
                .min(1)
                .required()
        })

        const {error} = schema.validate(req.params)
        if (error) throw { statusCode: 400, errorMessage: `Badly formatted request`, errorObj: error }

        const profile = await Profile.readByProfileid(req.params.profileid)
        res.send(JSON.stringify(profile))

    }catch(err) {
        if(err.statusCode) {
            return res.status(err.statusCode).send(JSON.stringify(err));
            
        }
        return res.status(500).send(JSON.stringify(err));
    }

})

module.exports = router;