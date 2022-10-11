const express = require('express');
const router = express.Router();
const _ = require('lodash');
const Joi = require('joi');
const autheticate = require('../middleware/autheticate');
const Application = require('../models/application')


router.post('/', [autheticate], async (req, res) => {
    try {

        const { error } = Application.validate(req.body);
        if (error)
          throw {
            statusCode: 400,
            errorMessage: `Badly formatted request`,
            errorObj: error,
          };
        const applicationToBeSaved = new Application(req.body);
        
        const application = await applicationToBeSaved.createApplication();
        res.send(JSON.stringify(application));
      } catch (err) {
        if (err.statusCode)
          return res.status(err.statusCode).send(JSON.stringify(err));
      }
})


router.get('/:taskid', [autheticate], async (req, res) => {
  try {
    const schema = Joi.object({
      taskid: Joi.number()
       .integer()
       .min(1)
       .required()
   })

   let validationResult = schema.validate(req.params);
   
   if (validationResult.error) throw { statusCode: 400, errorMessage: `Badly formatted request`, errorObj: validationResult.error }

   const applicationByTaskId = await Application.readByApplicants(req.params.taskid);

   res.send(JSON.stringify(applicationByTaskId));
    
  } catch (err) {
    if (err.statusCode)
    return res.status(err.statusCode).send(JSON.stringify(err));
  }

})

module.exports = router