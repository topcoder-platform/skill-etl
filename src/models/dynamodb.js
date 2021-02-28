/**
 * This file defines methods and/or objects used to talk to DynamoDB.
 */

const config = require('config')
const dynamo = require('dynamodb')
const joi = require('joi')
dynamo.AWS.config.update(config.get('DYNAMODB'))

/**
 * The externals stackoverflow model.
 */
const ExternalsStackoverflow = dynamo.define('Externals.Stackoverflow', {
  hashKey: 'userId',
  timestamps: true,
  schema: {
    userId: joi.number().integer().required(),
    topTags: joi.string(),
    questions: joi.number().integer(),
    answers: joi.number().integer(),
    profileUrl: joi.string().uri(),
    name: joi.string(),
    socialId: joi.string(),
    reputation: joi.number().integer()
  },
  tableName: 'Externals.Stackoverflow'
})

/**
 * The member entered input model.
 */
const MemberEnteredSkills = dynamo.define('MemberEnteredSkills', {
  hashKey: 'userId',
  timestamps: true,
  schema: {
    userId: joi.number().integer().required(),
    skills: joi.string(),
    handleLower: joi.string(),
    updatedBy: joi.string(),
    userHandle: joi.string()
  },
  tableName: 'MemberEnteredSkills'
})

/**
 * The member aggregated input model.
 */
const MemberAggregatedSkills = dynamo.define("MemberAggregatedSkills", {
  hashKey: "userId",
  timestamps: true,
  schema: {
    userId: joi.number().integer().required(),
    skills: joi.string(),
  },
  tableName: "MemberAggregatedSkills",
});

module.exports = {
  ExternalsStackoverflow,
  MemberEnteredSkills,
  MemberAggregatedSkills,
  dynamo
}
