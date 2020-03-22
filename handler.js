'use strict';
const AWS = require('aws-sdk');
const uuid = require('uuid/v4');

const db = new AWS.DynamoDB.documentClient();

const postsTable = process.env.POST_TABLE;

const response = (statusCode, message) => {
  return {
    statusCode,
    body: JSON.stringify(message),
  };
};

const sortByDate = (a, b) => {
  if (a.createdAt > b.createdAt) return -1;
  return 1;
};

module.exports.createPost = (event, context, callback) => {
  const reqBody = JSON.parse(event.body);

  const post = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    userId: 1,
    title: reqBody.title,
    body: reqBody.body,
  };

  return db
    .put({
      TableName: postsTable,
      Item: post,
    })
    .promise()
    .then(() => {
      callback(null, response(201, post));
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};

module.exports.getAllPosts = (event, context, callback) => {
  return db
    .scan({
      TableName: postsTable,
    })
    .promise()
    .then(res => callback(null, res.Items.sort(sortByDate)))
    .catch(err => callback(null, response(err.statusCode, err)));
};

module.exports.getPosts = (event, context, callback) => {
  const numOfPosts = event.pathParameters.number;
  const params = {
    Table: postsTable,
    Limit: numOfPosts,
  };
  return db
    .scan(params)
    .promise()
    .then(res => callback(null, res.Items.sort(sortByDate)))
    .catch(err => callback(null, response(err.statusCode, err)));
};

module.exports.getPost = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id,
    },
    TableName: postsTable,
  };

  return db
    .get(params)
    .promise()
    .then(res => {
      if (res.Item) return callback(null, res.Item);
      return callback(null, response(404, { error: 'Post not found' }));
    })
    .catch(err => callback(null, response(err.statusCode, err)));
};

module.exports.updatePost = (event, context, callback) => {
  const id = event.pathParameters.id;
  const { paramName, paramValue } = JSON.parse(event.body);
  const params = {
    Key: {
      id,
    },
    TableName: postsTable,
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpressiont: `set ${paramName} = :v`,
    ExpressiontAttributeValues: {
      ':v': paramValue,
    },
    ReturnValue: 'All_NEW',
  };

  return db
    .update(params)
    .promise()
    .then(res => callback(null, response(200, res)))
    .catch(err => callback(null, response(err.statusCode, err)));
};

module.exports.deletePost = (event, context, callback) => {
  const id = event.pathParameters.id;
  const params = {
    Key: {
      id,
    },
    TableName: postsTable,
  };

  return db
    .delete(params)
    .promise()
    .then(() => callback(null, response(200, { message: 'Successfully deleted' })))
    .catch(err => callback(null, response(err.statusCode, err)));
};
