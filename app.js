const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')
var isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperties = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperties = requestQuery => {
  return requestQuery.status !== undefined
}

const hasCatagoryAndStatus = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  )
}

const hasCatagoryAndPriority = requestQuery => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  )
}

const hasSearchProperties = requestQuery => {
  return requestQuery.search_q !== undefined
}

const hasCatagoryProperties = requestQuery => {
  return requestQuery.category !== undefined
}

const outputResult = dbObject => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  }
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status, category} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `select * from todo where status='${status}' and priority='${priority}'`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break
    case hasCatagoryAndStatus(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          status === 'TO DO' ||
          status === 'IN PROGRESS' ||
          status === 'DONE'
        ) {
          getTodosQuery = `select * from todo where status='${status}' and category='${category}'`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Status')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break
    case hasCatagoryAndPriority(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (
          priority === 'HIGH' ||
          priority === 'MEDIUM' ||
          priority === 'LOW'
        ) {
          getTodosQuery = `select * from todo where priority='${priority}' and category='${category}'`
          data = await db.all(getTodosQuery)
          response.send(data.map(eachItem => outputResult(eachItem)))
        } else {
          response.status(400)
          response.send('Invalid Todo Priority')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case hasPriorityProperties(request.query):
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        getTodosQuery = `select * from todo where priority='${priority}'`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case hasStatusProperties(request.query):
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        getTodosQuery = `select * from todo where status='${status}'`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case hasSearchProperties(request.query):
      getTodosQuery = `select * from todo where todo like '%${search_q}%'`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
      break

    case hasCatagoryProperties(request.query):
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        getTodosQuery = `select * from todo where category='${category}'`
        data = await db.all(getTodosQuery)
        response.send(data.map(eachItem => outputResult(eachItem)))
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    default:
      getTodosQuery = `select * from todo`
      data = await db.all(getTodosQuery)
      response.send(data.map(eachItem => outputResult(eachItem)))
  }
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getIdPlayerQuery = `select * from todo where id=${todoId}`
  const getIdPlayerArray = await db.get(getIdPlayerQuery)
  response.send(outputResult(getIdPlayerArray))
})

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  if (date === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    if (isValid(new Date(date))) {
      const newDate = format(new Date(date), 'yyyy-MM-dd')
      const requestQuery = `select * from todo where due_date='${newDate}'`
      const responseResult = await db.all(requestQuery)
      response.send(responseResult.map(eachItem => outputResult(eachItem)))
    } else {
      response.status(400)
      response.send('Invalid Due Date')
    }
  }
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
    if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        if (isValid(new Date(dueDate))) {
          const postNewDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
          const postTodoQuery = `insert into todo(id,todo,category,priority,status,due_date) values('${id}','${todo}','${category}','${priority}','${status}','${postNewDueDate}')`
          await db.run(postTodoQuery)
          response.send('Todo Successfully Added')
        } else {
          response.status(400)
          response.send('Invalid Due Date')
        }
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
    }
  } else {
    response.status(400)
    response.send('Invalid Todo Priority')
  }
})
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const {todo, priority, status, category, dueDate} = request.body

  let updateTodoQuery
  switch (true) {
    case status !== undefined:
      if (status === 'TO DO' || status === 'IN PROGRESS' || status === 'DONE') {
        updateTodoQuery = `update todo set status='${status}' where id=${todoId}`
        await db.run(updateTodoQuery)
        response.send('Status Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Status')
      }
      break

    case priority !== undefined:
      if (priority === 'HIGH' || priority === 'MEDIUM' || priority === 'LOW') {
        updateTodoQuery = `update todo set priority='${priority}' where id=${todoId}`
        await db.run(updateTodoQuery)
        response.send('Priority Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Priority')
      }
      break

    case category !== undefined:
      if (
        category === 'WORK' ||
        category === 'HOME' ||
        category === 'LEARNING'
      ) {
        updateTodoQuery = `update todo set category='${category}' where id=${todoId}`
        await db.run(updateTodoQuery)
        response.send('Category Updated')
      } else {
        response.status(400)
        response.send('Invalid Todo Category')
      }
      break

    case todo !== undefined:
      updateTodoQuery = `update todo set todo='${todo}' where id=${todoId}`
      await db.run(updateTodoQuery)
      response.send('Todo Updated')
      break

    case dueDate !== undefined:
      if (isValid(new Date(dueDate))) {
        const newDueDate = format(new Date(dueDate), 'yyyy-MM-dd')
        updateTodoQuery = `update todo set due_date='${newDueDate}' where id=${todoId}`
        await db.run(updateTodoQuery)
        response.send('Due Date Updated')
      } else {
        response.status(400)
        response.send('Invalid Due Date')
      }
      break
  }
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `delete from todo where id=${todoId}`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
