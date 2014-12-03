/*
 * TSB - Survey/Retrieve.JS file
 * API call to retrieve a survey as JSON given a campaign ID. 
 */


var mongoose = require('mongoose');
var SurveyPrototype = require('./models').SurveyPrototype;
var Survey = require('./models').Survey;
var Campaign = require('./models').SurveyCampaign;
var User = require('../user/models').User;

// import crontab here too

exports.retrieve = function (session_token, campaign_id, callback) {

	var campaign;
	var user;
	var survey_prototype;

	var user_query = User.where({session_token : session_token});
	user_query.findOne(function(err, found){
		if (err) {
			callback({'response' : 'SURVEY_RETRIEVE_DATABASE_ERROR'}, 500);
		}
		if (found) {
			user = found;

			var campaign_query = Campaign.where({campaign_id:campaign_id});
			campaign_query.findOne(function(err, found) {
				if (err) {
					callback({'response' : 'SURVEY_RETRIEVE_DATABASE_ERROR'}, 500);
				}
				if (found) {
					campaign = found;

					var survey_query = SurveyPrototype.where({ _id : campaign.prototype_survey_id });

					console.log('id: ' + campaign.prototype_survey_id );
					survey_query.findOne(function(err, found) {
						if (err) {
							callback({'response' : 'SURVEY_RETRIEVE_DATABASE_ERROR'}, 500);
						}
						console.log('found :' + found);
						if (found) {
							var survey_prototype = found;
							var survey_prototype_body = [];

							for (i=0; i<survey_prototype.survey_body.length;i++) {
								survey_prototype_body.push({
									'question_id' : survey_prototype.survey_body[i].question_id,
									'question_title' : survey_prototype.survey_body[i].question_title,
									'question' : survey_prototype.survey_body[i].question,
									'response' : survey_prototype.survey_body[i].response,
								});
							}

							// add the user to the pending list
							// find by document id and update

							campaign.eligible_users.pull(user._id);
							campaign.pending_users.push(user._id);
							campaign.save(function(err){
								if(err) {
									console.log('in retrieve (54): '+ err);
								}
							});

							// return the survey in the response as JSON + campaign ID 
							// so they know what they're posting back to
							callback({'response' : 'SURVEY_RETRIEVE_SUCCESS',
								 'campaign_id' : campaign.campaign_id, 
								 'survey_body' : survey_prototype_body,
								}, 200);

						} else {
							callback({'response' : 'SURVEY_RETRIEVE_ERROR_SURVEY_NOT_FOUND'}, 404);
						}
					});
				}
				else {
					callback({'response' : 'SURVEY_RETRIEVE_ERROR_CAMPAIGN_NOT_FOUND'}, 404);
				}
			});
		} else {
			callback({'response' : 'SURVEY_RETRIEVE_USER_NOT_FOUND'}, 403);
		}
	});

}






