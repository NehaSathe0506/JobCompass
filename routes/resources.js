// Builds the deadlines, follow-ups and interviews routers from one factory.
const express = require('express');
const auth = require('../middleware/auth');
const makeController = require('../controllers/childController');

function buildRouter(config) {
  const router = express.Router();
  const c = makeController(config);
  router.use(auth);
  router.get('/', c.list);
  router.post('/', c.create);
  router.put('/:id', c.update);
  router.delete('/:id', c.remove);
  return router;
}

exports.deadlines = buildRouter({
  table: 'deadlines',
  fields: ['title', 'due_date', 'is_done'],
  required: ['title', 'due_date'],
  orderBy: 'due_date',
});

exports.followUps = buildRouter({
  table: 'follow_ups',
  fields: ['follow_up_date', 'method', 'note', 'is_done'],
  required: ['follow_up_date'],
  orderBy: 'follow_up_date',
});

exports.interviews = buildRouter({
  table: 'interviews',
  fields: ['round_name', 'interview_date', 'mode', 'result'],
  required: ['round_name', 'interview_date'],
  orderBy: 'interview_date',
});
