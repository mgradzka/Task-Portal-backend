const Joi = require("joi");
const sql = require("mssql");

const config = require("config");
const con = config.get("dbConfig_UCN");

class Category {
  constructor(categoryObj) {
    this.categoryid = categoryObj.categoryid;
    this.categoryname = categoryObj.categoryname;
  }

  static validationSchema(){
    const schema = Joi.object({
        categoryid: Joi.number()
        .integer()
        .min(1),
        categoryname: Joi.string()
        .max(50)
    })
    return schema
  }

  static validate(categoryObj) {
    const schema = Category.validationSchema();
    return schema.validate(categoryObj)
  }
}

module.exports = Category;
