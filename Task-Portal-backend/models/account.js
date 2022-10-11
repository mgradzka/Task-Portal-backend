const Joi = require("joi");
const sql = require("mssql");

const config = require("config");
const con = config.get("dbConfig_UCN");
const bcrypt = require('bcryptjs')

const Profile = require('./profile')

class Account {
  constructor(accountObj) {
    if (accountObj.accountid) {
      this.accountid = accountObj.accountid;
    }
    this.email = accountObj.email;
    this.profileid = accountObj.profileid;
    if(accountObj.role){
      this.role = {
        roleid: accountObj.role.roleid,
      }
      if (accountObj.role.rolename) {
          this.role.rolename = accountObj.role.rolename;
      }
    }
  }

  static validationSchema() {
    const schema = Joi.object({
      accountid: Joi.number()
        .integer()
        .min(1),
      email: Joi.string()
        .email()
        .max(255)
        .required(),
      profileid: Joi.number()
        .integer()
        .min(1),
      role: Joi.object({
        roleid: Joi.number()
          .integer()
          .min(1)
          .required(),
        rolename: Joi.string()
          .max(50)
      })
    })
    return schema
  }

  static validate(accountObj) {
    const schema = Account.validationSchema();
    return schema.validate(accountObj)
  }

  static validateCredentials(credentialsObj) {
    const schema = Joi.object({
      email: Joi.string()
        .email()
        .max(255)
        .required(),
      password: Joi.string()
        .required()
    })

    return schema.validate(credentialsObj);
  }

  static checkCredentials(credentialObj) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const account = await Account.readByEmail(credentialObj.email)
          const pool = await sql.connect(con);
          const result = await pool.request()
          .input('accountid', sql.Int(), account.accountid)
          .query(`
          SELECT *
          FROM jobPassword p
          WHERE p.FK_accountid = @accountid
          `)
          
          if (result.recordset.length != 1) throw { statusCode: 500, errorMessage: `Corrupt DB.`, errorObj: {} }
          const hashedPassword = result.recordset[0].hashedpassword;
        
          const okCredentials = bcrypt.compareSync(credentialObj.password, hashedPassword);
          if (!okCredentials) throw { statusCode: 401 }

          resolve(account)
        } catch (err) {
          if (err.statusCode) reject({ statusCode: 401, errorMessage: `Invalid email or password`, errorObj: {} })
          reject(err)
        }
        sql.close()
      })()
    })
  }

  static readByEmail(email) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {

          const pool = await sql.connect(con);
          const result = await pool.request()
            .input('email', sql.NVarChar(), email)
            .query(`
                      SELECT *
                      FROM jobAccount a
                        INNER JOIN jobRole r
                        ON a.FK_roleid = r.roleid
                      WHERE a.email = @email
                `)
          if (result.recordset.length == 0) throw { statusCode: 404, errorMessage: `Account not found.`, errorObj: {} }
          if (result.recordset.length != 1) throw { statusCode: 500, errorMessage: `Corrupt information in DB`, errorObj: {} }

          const firstResult = result.recordset[0];

          // structuring the DB response
          const almostAccount = {
            accountid: firstResult.accountid,
            email: firstResult.email,
            profileid: firstResult.FK_profileid,
            role: {
              roleid: firstResult.roleid,
              rolename: firstResult.rolename
            }
          }

          const { error } = Account.validate(almostAccount);
          if (error) throw { statusCode: 500, errorMessage: `Corrupt account information in the database, accountid: ${almostAccount.accountid}`, errorObj: error }


          resolve(new Account(almostAccount))
        } catch (err) {
          reject(err)
        }
        sql.close();
      })()
    })
  }

  

  // creating a password method

  create(password, profileObj) {

    return new Promise((resolve, reject) => {
      (async () => {
          try {

            // checking wther the account exists by email
            // if no error (exists) then reject
            try {
              const account = await Account.readByEmail(this.email);
              const error = {statusCode: 409, errorMessage: `Account with email ${this.email} already exists`, errorObj: {}}
              reject (error);

            } catch(err) {
              if(!err.statusCode || err.statusCode != 404) {
                reject(err);
              }
            }
            // checking wther the account exists by phonenumber
            // if no error (exists) then reject
            try {
              const account = await Profile.readByPhoneNumber(profileObj.phonenumber);
              const error = {statusCode: 409, errorMessage: `Account with phonenumber ${profileObj.phonenumber} already exists`, errorObj: {}}
              reject (error);

            } catch(err) {
              if(!err.statusCode || err.statusCode != 404) {
                reject(err);
              }
            }

            // inserting new account if the email does not exist in the DB
            const pool = await sql.connect(con);

            // allow description and image not to be filled out
            if(!profileObj.profiledescription) {
              profileObj.profiledescription = null;
            }
            if(!profileObj.profilepicture) {
              profileObj.profilepicture = null;
            }

            // inserting into the profile table
            const resultProfile = await pool.request()
              .input('firstname', sql.NVarChar(), profileObj.firstname)
              .input('lastname', sql.NVarChar(), profileObj.lastname)
              .input('phonenumber', sql.NVarChar(), profileObj.phonenumber)
              .input('profiledescription', sql.NVarChar(), profileObj.profiledescription)
              .input('profilepicture', sql.NVarChar(), profileObj.profilepicture)

              .query(`
                	INSERT INTO jobProfile
                    ([firstname], [lastname], [phonenumber], [profiledescription], [profilepicture])
                  VALUES
                    (@firstname, @lastname, @phonenumber, @profiledescription, @profilepicture);
                  SELECT * FROM jobProfile jp
                  WHERE jp.profileid = SCOPE_IDENTITY()
              `)
              // checking wether we have exactly 1 line inserted
              if(resultProfile.recordset.length != 1) throw{statusCode: 500, errorMessage: 'INSERT into profile table failed', errorObj: {}}
              // inserting into the account table
              const profileid = resultProfile.recordset[0].profileid;
              const resultAccount = await pool.request()
              .input('email', sql.NVarChar(), this.email)
              .input('profileid', sql.Int(), profileid)
              .query(`
              INSERT INTO jobAccount 
              ([email], [FK_profileid])
              VALUES
              (@email, @profileid)
              SELECT * FROM jobAccount ja
              WHERE ja.accountid = SCOPE_IDENTITY()
              `)
              
              // checking wether we have exactly 1 line inserted
              if(resultAccount.recordset.length != 1) throw{statusCode: 500, errorMessage: 'INSERT into profile table failed', errorObj: {}}
              
              // inserting the hashed password into password table
              
              const hashedpassword = bcrypt.hashSync(password);
              const accountid = resultAccount.recordset[0].accountid;
              
             
            const resultPassword = await pool.request()
              .input('accountid', sql.Int(), accountid)
              .input('hashedpassword', sql.NVarChar(), hashedpassword)
              .query(`
                INSERT INTO jobPassword
                  ([FK_accountid], [hashedpassword])
                VALUES
                  (@accountid, @hashedpassword)
                SELECT * FROM jobPassword jp
                WHERE jp.FK_accountid = @accountid
              `)

              // checking wether we have exactly 1 line inserted
            if(resultPassword.recordset.length != 1) throw{statusCode: 500, errorMessage: 'INSERT into profile table failed', errorObj: {}}
            sql.close();
            
            const account = await Account.readByEmail(this.email);
            resolve(account);

          } catch(err) {
            reject(err);
          }
          sql.close();
      })()
    })
  }

}


module.exports = Account;