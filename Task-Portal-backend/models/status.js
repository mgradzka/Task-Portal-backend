const Joi = require("joi");
const sql = require("mssql");

const config = require("config");
const con = config.get("dbConfig_UCN");

class Status {
  constructor(statusObj) {
    this.statusid = statusObj.statusid;
    this.statusname = statusObj.statusname
  }

  static validationSchema() {
  
    const schema = Joi.object({
        statusid: Joi.number()
        .integer()
        .min(1),
        statusname: Joi.string()
        .max(50)
        .required()
    })

    return schema
  }


  static validate(statusObj) {
    const schema = Status.validationSchema();
    return schema.validate(statusObj)
  }

}

module.exports = Status;
