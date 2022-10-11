const Joi = require("joi");
const sql = require("mssql");

const config = require("config");
const Task = require("./task");
const Account = require("./account");
const Profile = require("./profile");
const con = config.get("dbConfig_UCN");
const _ = require("lodash");

class Application {
  constructor(applicationObj) {
    this.taskid = applicationObj.taskid;
    this.account = {
      accountid: applicationObj.account.accountid,
      email: applicationObj.account.email,
    };
  }

  static validationSchema() {
    const schema = Joi.object({
      taskid: Joi.number().integer().min(1),
      account: Joi.object({
        accountid: Joi.number().integer().min(1),
        email: Joi.string().email(),
      }),
    });
    return schema;
  }

  static validate(applicationObj) {
    const schema = Application.validationSchema();
    return schema.validate(applicationObj);
  }

  static readApplicationById(taskid) {
    return new Promise((resolve,reject) => {
      (async() => {
        try{
          const pool = await sql.connect(con);
          const result = await pool.request()
          .input('taskid', sql.Int(), taskid)
          .query(`
          SELECT *
          FROM jobApplication a
          WHERE a.FK_taskid = @taskid
          
          `)

          let applications = [];

          if (result.recordset.length == 0) resolve(applications)
          

            let applicationArr = []
            result.recordset.forEach(record => {
              const applicationWannabe = {
                taskid: record.FK_taskid,
                account: {
                  accountid: record.FK_accountid,
                },
              }
              applicationArr.push(applicationWannabe)
            })

            applicationArr.forEach(applicant => {
              const { error } = Application.validate(applicant);

              if (error)
              throw {
                statusCode: 500,
                errorMessage: `Corrupt task information in the database, taskid: ${applicant.taskid}`,
                errorObj: error,
              };
            applications.push(new Application(applicant));
            })
            console.log(applications);
            resolve(applications)

        }catch(err){
          reject(err)
        }
        sql.close()
      })()
    })
  }

  static readByApplicants(taskid) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          
          const pool = await sql.connect(con);
          const result = await pool.request().input("taskid", sql.Int(), taskid)
            .query(`
                        SELECT * FROM jobApplication ap
                        INNER JOIN jobAccount a
                        ON ap.FK_accountid = a.accountid
                        INNER JOIN jobProfile pr
                        ON pr.profileid = a.FK_profileid
                            WHERE ap.FK_taskid = @taskid
                        `);

               
          if (result.recordset.length === 0)
            throw {
              statusCode: 404,
              errorMessage: `Nobody has applied for this job yet`,
              errorObj: {},
            };

          let profilesCollection = [];

          result.recordset.forEach(profile => {
            const almostProfile = {
              profileid: profile.profileid,
              profiledescription: profile.profiledescription,
              firstname: profile.firstname,
              lastname: profile.lastname,
              phonenumber: profile.phonenumber,
              accountid: profile.accountid, 
              email: profile.email
            }
            
            profilesCollection.push(almostProfile);
          });
            
            const profiles = [];

            profilesCollection.forEach((profile) => {
              const profileWannabe = _.pick(profile, [
                "profileid",
                "firstname",
                "lastname",
                "phonenumber",
                "profiledescription",
              ]);
              const accountWannabe = _.pick(profile, ["accountid", "email"]);
              
              let validationResult = Profile.validate(profileWannabe);
           
              if (validationResult.error)
                throw {
                  statusCode: 400,
                  errorMessage: "Badly formatted request",
                  errorObj: validationResult.error,
                };

              validationResult = Account.validate(accountWannabe);
              if (validationResult.error)
                throw {
                  statusCode: 400,
                  errorMessage: "Badly formatted request",
                  errorObj: validationResult.error,
                };

              const profileToBeSaved = new Profile(profileWannabe);
              const accountToBeSaved = new Account(accountWannabe);


              const account = { ...profileToBeSaved, ...accountToBeSaved };
              profiles.push(account);
            });

            resolve(profiles);
          
        } catch (err) {
          reject(err);
        }
        sql.close();
      })();
    });
  }

  static checkApplication(taskid, accountid) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const pool = await sql.connect(con);
          const result = await pool
            .request()
            .input("taskid", sql.Int(), taskid)
            .input("accountid", sql.Int(), accountid).query(`
                            SELECT *
                            FROM jobApplication a
                            WHERE a.FK_taskid = @taskid
                            AND a.FK_accountid = @accountid
                        `);

          if (result.recordset.length > 1)
            throw {
              statusCode: 500,
              errorMessage: `Corrupt DB, mulitple authors with taskid: ${taskid} and accountid: ${accountid}`,
              errorObj: {},
            };
          if (result.recordset.length == 0)
            throw {
              statusCode: 404,
              errorMessage: `Task has not been applied yet by accountid: ${accountid}`,
              errorObj: {},
            };

          const applicationWannabe = {
            taskid: result.recordset[0].FK_taskid,
            account: {
              accountid: result.recordset[0].FK_accountid,
            },
          };
          const { error } = Application.validate(applicationWannabe);
          if (error)
            throw {
              statusCode: 500,
              errorMessage: `Corrupt DB, application does not validate`,
              errorObj: error,
            };

          resolve(new Application(applicationWannabe));
        } catch (err) {
          reject(err);
        }
        sql.close();
      })();
    });
  }

  createApplication() {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          try {
            
            const task = await Task.readByTaskId(this.taskid);

            if (task.account.accountid === this.account.accountid)
              return reject({
                statusCode: 500,
                errorMessage: `You can not apply for your own task!`,
                errorObj: {},
              });
          } catch (err) {
            if (err.statusCode) {
              reject(err);
            }
          }

          // check whether they have already applied
          try {
            const application = await Application.checkApplication(
              this.taskid,
              this.account.accountid
            );

            const error = {
              statusCode: 409,
              errorMessage: `You already applied!`,
              errorObj: {},
            };
            return reject(error);
          } catch (err) {
            if (!err.statusCode || err.statusCode != 404) {
              reject(err);
            }
          }

          const pool = await sql.connect(con);
          const result = await pool
            .request()
            .input("taskid", sql.Int(), this.taskid)
            .input("accountid", sql.Int(), this.account.accountid).query(`
                            INSERT INTO jobApplication
                                ([FK_taskid], [FK_accountid])
                            VALUES
                                (@taskid, @accountid)
                            SELECT *
                            FROM jobApplication a
        
                        `);

          // const application = await result.recordset[result.recordset.length -1].FK_authorid;
          const last = result.recordset[result.recordset.length - 1];
          const applicationWannabe = {
            taskid: last.FK_taskid,
            account: {
              accountid: last.FK_accountid,
            },
          };

          const { error } = Application.validate(applicationWannabe);
          if (error)
            throw {
              statusCode: 500,
              errorMessage: `Corrupt DB, task does not validate: ${applicationWannabe.taskid}`,
              errorObj: error,
            };

          resolve(applicationWannabe);
        } catch (err) {
          reject(err);
        }
        sql.close();
      })();
    });
  }

static deleteApplication(taskid) {
    return new Promise((resolve, reject) => {
      (async () => {
        try {
          const application = await Application.readApplicationById(taskid);

          if(application.length == 0) return resolve('There is no application to delete')

          
          const pool = await sql.connect(con);

          let result;
          result = await pool.request().input("taskid", sql.Int(), taskid)
            .query(`
              DELETE FROM jobApplication
              WHERE FK_taskid = @taskid
            `);
          resolve(application);
        } catch (err) {
          reject(err);
        }
        sql.close();
      })();
    });
  }
  
}

module.exports = Application;
