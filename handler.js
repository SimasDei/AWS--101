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
    .catch(err => response(null, response(err.statusCode, err)));
};
