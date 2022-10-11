const express = require("express");
const Joi = require("joi");
const { object } = require("joi");
const autheticate = require("../middleware/autheticate");
const router = express.Router();
const _ = require("lodash");

const Task = require("../models/task");
const Application = require("../models/application");

const admin = require('../middleware/admin');
const check = require('../middleware/checkauthorization');



// Get all the tasks
router.get("/", async (req, res) => {
  try {
    // queries
    let taskSets = [];
    Object.keys(req.query).forEach((key) => {
      taskSets.push(new Set());
    });

    // if we have query parameters
    if (taskSets.length > 0) {
      const allTasks = await Task.readAll();

      allTasks.forEach((singleTask) => {
        for (let i = 0; i < taskSets.length; i++) {
          switch (Object.values(req.query)[i]) {
            case "outdoor":
              if (
                singleTask.category.categoryname.includes(
                  req.query.categoryname
                )
              ) {
                taskSets[i].add(singleTask);
              }
              break;
            case "indoor":
              if (
                singleTask.category.categoryname.includes(
                  req.query.categoryname
                )
              ) {
                taskSets[i].add(singleTask);
              }
              break;
            default:
              break;
          }
        }
      });
      let tasks;
      if (taskSets.length == 1) {
        tasks = Array.from(taskSets[0]);
      }
      return res.send(JSON.stringify(tasks));
    } else {
      // all tasks
      const allTasks = await Task.readAll();
      return res.send(JSON.stringify(allTasks));
    }
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).send(JSON.stringify(err));
    }
    return res.status(500).send(JSON.stringify(err));
  }
});


router.post("/", [autheticate], async (req, res) => {
  try {

    const { error } = Task.validate(req.body);
    if (error)
      throw {
        statusCode: 400,
        errorMessage: `Badly formatted request`,
        errorObj: error,
      };

    const taskToBeSaved = new Task(req.body);
    const task = await taskToBeSaved.create();
    res.send(JSON.stringify(task));
  } catch (err) {
    if (err.statusCode)
      return res.status(err.statusCode).send(JSON.stringify(err));
  }
});

// get a specific task among the own tasks
router.get('/own/:taskid', [autheticate], async (req, res) => {
  try {
    const schema = Joi.object({
      taskid: Joi.number()
       .integer()
       .min(1)
       .required()
   })
   
   let validationResult = schema.validate(req.params);
   if (validationResult.error) throw { statusCode: 400, errorMessage: `Badly formatted request`, errorObj: validationResult.error }


    const taskById = await Task.readByTaskId(req.params.taskid);
    
    if(taskById.account.accountid != req.account.accountid) throw { statusCode: 403, errorMessage: `Cannot get task with taskid: ${req.params.taskid}`, errorObj: {} }

    res.send(JSON.stringify(taskById));
    
  } catch (err) {
    if (err.statusCode)
    return res.status(err.statusCode).send(JSON.stringify(err));
  }

})

//get all the task for specific profile
router.get("/own", [autheticate], async (req, res) => {
  try {
    const accountid = req.account.accountid;
    const tasks = await Task.readTasksByAccountId(accountid);
    res.send(JSON.stringify(tasks));
  } catch (err) {
    if (err.statusCode)
      return res.status(err.statusCode).send(JSON.stringify(err));
  }
});

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


    const taskById = await Task.readByTaskId(req.params.taskid);
    
    res.send(JSON.stringify(taskById));
    
  } catch (err) {
    if (err.statusCode)
    return res.status(err.statusCode).send(JSON.stringify(err));
  }

})

router.put('/:taskid', [autheticate], async (req, res) => {
  try {
    const schema = Joi.object({
       taskid: Joi.number()
        .integer()
        .min(1)
        .required()
    })


    let validationResult = schema.validate(req.params);
    if (validationResult.error) throw { statusCode: 400, errorMessage: `Badly formatted request`, errorObj: validationResult.error }
    
    const taskById = await Task.readByTaskId(req.params.taskid);
    
    
    if(taskById.account.accountid != req.account.accountid) throw { statusCode: 403, errorMessage: `Cannot update task with name: ${taskByTaskid.account.accountid }`, errorObj: {} }
    

    if(req.body.tasktitle) {
      taskById.tasktitle = req.body.tasktitle
    } 
    if(req.body.taskdescription) {
      taskById.taskdescription = req.body.taskdescription
    } 
    if(req.body.taskaddress) {
      taskById.taskaddress = req.body.taskaddress
    } 
    if(req.body.taskpostdate) {
      taskById.taskpostdate = req.body.taskpostdate
    } 
    if(req.body.tasksalary) {
      taskById.tasksalary = req.body.tasksalary
    } 

    if(req.body.status && req.body.status.statusid ){

        taskById.status.statusid = req.body.status.statusid
    }

    if(req.body.category && req.body.category.categorid){
        taskById.category.categorid = req.body.category.categorid

    }


    // validate updateWannabe
    validationResult = Task.validate(taskById);
    if (validationResult.error) throw { statusCode: 400, errorMessage: `Badly formatted request`, errorObj: validationResult.error }

    const task = await taskById.updateTask()

    return res.send(JSON.stringify(task));


  } catch (err) {
    if (err.statusCode) { 
      return res.status(err.statusCode).send(JSON.stringify(err));
      }
      return res.status(500).send(JSON.stringify(err));  
  }
})

router.delete('/:taskid', [autheticate, admin, check], async (req, res) => {
   try {
      const schema = Joi.object({
            taskid: Joi.number()
              .integer()
              .min(1)
              .required()
          })
          
      const {error} = schema.validate(req.params);
      if (error) throw {statusCode: 400, errorMessage: `Badly formatted request`, errorObj: error}

     
      const deleteApplication = await Application.deleteApplication(req.params.taskid)

      
      const task = await Task.readByTaskId(req.params.taskid);
  
      const deleteTask = await task.deleteTask();
      return res.send(JSON.stringify(deleteTask));


   } catch (err) { 
      if (err.statusCode) {
        return res.status(err.statusCode).send(JSON.stringify(err));
      }
      return res.status(500).send(JSON.stringify(err));
   }
    
})




module.exports = router;
