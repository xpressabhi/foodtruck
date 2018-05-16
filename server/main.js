// Server entry point, imports all server code

import '/imports/startup/server';
import '/imports/startup/both';

const postSignUp = function postSignUp(userId, info) {
  //  console.log(userId);
  //  console.log(info);
  if (info.profile && info.profile.type && info.profile.type === 'truck') {
    Roles.addUsersToRoles(userId, ['truck']);
    if(info.email.split('+')[0]==='akmnitt' || info.email.split('+')[0]==='kushwahasatyam20'){
      Roles.addUsersToRoles(userId, ['verified-truck']);
    }
  } else {
    Roles.addUsersToRoles(userId, ['user']);
  }
  const count = Meteor.users.find().count();
  if (count === 1) {
    Roles.addUsersToRoles(userId, ['admin']);
  }
};

AccountsTemplates.configure({postSignUpHook: postSignUp});

import {Mongo} from 'meteor/mongo';
Meteor.otps = new Mongo.Collection('otps');
Meteor.otps._ensureIndex({phone: 1, purpose: 1}, {unique: true, name: 'phoneAndPurpose'});

var otpPurpose = '__login__';

///
/// ERROR HANDLER
///
var handleError = (msg, throwError) => {
	throwError = typeof throwError === 'undefined' ? true : throwError;
	var error = new Meteor.Error(
		403,
		Accounts._options.ambiguousErrorMessages
			? 'Login failure. Please check your login credentials.'
			: msg
	);
	if (throwError) {
		throw error;
	}
	return error;
};

///
/// ERROR HANDLER
///
Accounts.sanitizePhone = function(phone) {
	check(phone, String);
	if (!phone) return null;

	var nums = phone.split(/,|;/);
	for (var i = 0; i < nums.length; i++) {
		// trim and remove all hyphens, spaces
		var ph = nums[i].replace(/[^\d^+]/g, '').replace(/^0+/g, '');
		if (!ph) continue;
		if (ph.indexOf('+') !== 0) {
			if (ph.length === 10 && !!~['7', '8', '9'].indexOf(ph.substr(0, 1))) ph = '+91' + ph;
			else ph = '+' + ph;
		}
		const {parse} = require('libphonenumber-js');
		var res = parse(ph, {country: {default: 'IN'}});
		if (!res.country) continue;
		return ph;
	}
	return null;
};


///
/// LOGIN
///
/**
 * @summary finds user by doing a phone number search. Throws error if multiple found.
 * @param {String} phone phone number.
 * @return {Object} user document
 */
Accounts.findUserByPhone = function(phone) {
	check(phone, String);
	phone = Accounts.sanitizePhone(phone);
	if (!phone) return null;
	var users = Meteor.users.find({phones: {$elemMatch: {number: phone, verified: true}}}).fetch();
	if (users.length > 1) throw new Meteor.Error(403, 'Multiple users with same phone');
	return users[0] || null;
};

// Handler to login with a phone and otp.
/**
 * @summary adds a login handler for phone or an Object into an array,if not already present
 * @param {Object/String} value to be added.
 * @return {Object} object with user_id, and data that is to be inserted while creating user
 */
Accounts.registerLoginHandler('phone', function(options) {
	if (!options.phone || !options.otp) return undefined; // eslint-disable-line no-undefined

	try {
		check(options, {phone: String, otp: String});
		options.phone = Accounts.sanitizePhone(options.phone);
		var user = Accounts.findUserByPhone(options.phone);
		if (!user) {
			user = Meteor.call('createUserWithPhone', {phone: options.phone, otp: options.otp});
			user._id = user.id;
			delete user.id;
		}
		else Accounts.verifyPhoneOtp(options.phone, options.otp);
		return {userId: user._id};
	}
	catch (e) {
		console.error('Phone login failed:', e); // eslint-disable-line no-console
		return {userId: null, error: handleError(e.reason || JSON.stringify(e))};
	}
});

/**
 * @summary Set the otp for a user.
 * @locus Server
 * @param {String} phone phone number.
 * @param {String} otp OTP
 * @returns {Void} null
 */
Accounts.setPhoneOtp = function(phone, otp) {
	check([phone, otp], [String]);
	phone = Accounts.sanitizePhone(phone);
	if (!phone) throw new Meteor.Error(403, 'Improper phone number');
	Meteor.otps.remove({phone, purpose: otpPurpose});
	Meteor.otps.insert({phone, otp, purpose: otpPurpose, createdAt: new Date()});
};

/**
 * @summary Verify the otp for a user.
 * @locus Server
 * @param {String} phone phone number.
 * @param {String} otp OTP
 * @returns {String} Sanitized phone number
 */
Accounts.verifyPhoneOtp = function(phone, otp) {
	check([phone, otp], [String]);
	phone = Accounts.sanitizePhone(phone);
	if (!phone) throw new Meteor.Error(500, 'Invalid phone number');

	var otpDoc = Meteor.otps.findOne({phone, purpose: otpPurpose});
	if (!otpDoc) throw new Meteor.Error(403, 'User has no otp set');
	if (otpDoc.otp !== otp) throw new Meteor.Error(403, 'Incorrect otp');
	Meteor.otps.remove({phone: phone, purpose: otpPurpose});
	return phone;
};

/**
 * @summary Add a phone number for a user. Use this instead of directly
 * updating the database. The operation will fail if there is a different user
 * with same phone.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} newPhone A new phone number for the user.
 * @param {Boolean} [verified] Optional - whether the new phone number should
 * be marked as verified. Defaults to false.
 * @returns {Void} null
 */
Accounts.addPhone = function(userId, newPhone, verified) {
	verified = typeof verified === 'undefined' ? false : verified;

	check(userId, String);
	check(newPhone, String);
	check(verified, Boolean);

	var user = Meteor.users.findOne(userId);
	if (!user) throw new Meteor.Error(403, 'User not found');

	newPhone = Accounts.sanitizePhone(newPhone);
	if (!newPhone) throw new Meteor.Error(500, 'Invalid phone number');
	if (Meteor.users.findOne({'phones.number': newPhone})) throw new Meteor.Error(500, 'User exists with given phone number');
	Meteor.users.update({_id: user._id}, {$addToSet: {phones: {number: newPhone, verified}}});
};

/**
 * @summary Remove an phone number for a user. Use this instead of updating
 * the database directly.
 * @locus Server
 * @param {String} userId The ID of the user to update.
 * @param {String} phone The phone number to remove.
 * @returns {Void} null
 */
Accounts.removePhone = function(userId, phone) {
	check(userId, String);
	check(phone, String);

	var user = Meteor.users.findOne(userId);
	if (!user) throw new Meteor.Error(403, 'User not found');

	phone = Accounts.sanitizePhone(phone);
	if (!phone) throw new Meteor.Error(500, 'Invalid phone number');
	Meteor.users.update({_id: user._id}, {$pull: {phones: {number: phone}}});
};

///
/// CREATING USERS
///

// Shared createUser function called from the createUser method, both
// if originates in client or server code. Calls user provided hooks,
// does the actual user insertion.
//
// returns the user id
var createUser = function(options) {
	// Unknown keys allowed, because a onCreateUserHook can take arbitrary
	// options.
	check(options, {phone: String, otp: String});

	options.phone = Accounts.verifyPhoneOtp(options.phone, options.otp);
	var user = {username: options.phone, services: {phone: {number: options.phone}}, phones: [{number: options.phone, verified: true}]};

	var userId = Accounts.insertUserDoc({phone: options.phone}, user);
	// Perform another check after insert, in case a matching user has been
	// inserted in the meantime
	if (Meteor.users.findOne({_id: {$ne: userId}, 'phones.number': options.phone})) {
		// Remove inserted user if the check fails
		Meteor.users.remove(userId);
		throw new Meteor.Error(500, 'User exists with given phone number');
	}
	return userId;
};

// method for create user. Requests come from the client.
Meteor.methods({
	createUserWithPhone: function(options) {
		var self = this;
		return Accounts._loginMethod(self, 'createUser', arguments, 'phone', function() {
			// createUser() above does more checking.
			check(options, Object);
		//	if (Accounts._options.forbidClientAccountCreation) return {error: new Meteor.Error(403, 'Signups forbidden')};

			// Create user. result contains id and token.
			var userId = createUser(options);
			if (!userId) throw new Meteor.Error(500, 'Failed to insert new user');

			// client gets logged in as the new user afterwards.
			return {userId: userId};
		});
	}
});

/**
 * @summary Create a user directly on the server. Unlike the client version, this does not log you in as this user after creation.
 * @locus Server
 * @param {Object} options Object with arguments. Needs just {phone: String} for now.
 * @returns {String} userId The newly created user's _id
 */
Accounts.createUserWithPhone = createUser;

///
/// PASSWORD-SPECIFIC INDEXES ON USERS
///
// Meteor.users._ensureIndex('phones.number', {unique: 1, sparse: 1});
