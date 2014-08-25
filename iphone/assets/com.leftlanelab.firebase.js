/**
 * @author vstross
 */

// Load the [underscore] library (try for both test & studio environments)
try {var _ = require('com.leftlanelab.firebase.underscore')}
catch (err) {var _ = require('modules/com.leftlanelab.firebase/0.1.10/platform/iphone/com.leftlanelab.firebase.underscore');}

var _instances = {'Firebase':0, 'FirebaseQuery':0},
	_firebase = false,
	_forge = false;

/**
 * Public API Endpoint for getting a [Firebase] reference or module proxy
 *
 ******************************************************************************/
exports.new = function (url)
{
	// Only execute on the first Firebase...
	if (! _instances.Firebase++)
	{
		// Set the global [firebase] handle
		_firebase = this;

		// Local Disk Persistence
		if (Ti.App.Properties.getBool('com.leftlanelab.firebase.persistence', false))
		{
			_firebase.persistence();
		}

		// Try to set the [forge] from App Properties
		_forge = Ti.App.Properties.getString('com.leftlanelab.firebase.forge', false);
	}

	// Return a new Firebase API Controller
	return new Firebase(url);
};

/**
 * Public API Endpoint for getting a [firebase] token
 *
 ******************************************************************************
exports.token = function (payload, options, secret)
{
	// Safety Net
	if (! _.isObject(payload)) {return false;}
	if (! _.isString(secret) && ! Ti.App.Properties.hasProperty('com.leftlanelab.firebase.secret')) {return false;}

	// Generate and return a [token]
	return new FirebaseTokenGenerator(secret || Ti.App.Properties.getString('com.leftlanelab.firebase.secret')).createToken(payload, options || {});
};

/*
===============================================================================>
	Firebase
===============================================================================>
*/
/*
 * Firebase API Controller
 *
 ******************************************************************************/
function Firebase (url)
{
	// Global Variables
	this.listeners = {};

	// Safety Net
	if (! _forge && (_.isUndefined(url) || _.isEmpty(url))) {return false;}

	// Set the [url] (allows for absolute &| empty [forge]), then strip trailing "/" for the sloppy types...
	this.url = (! _.isUndefined(url) && url.indexOf('https://') === 0 ? url : (_forge || '') + (url || '')).replace(/^https\:\/\/([\S]+[^\/])[\/]?/i, "https://$1");

	// Return the new [Firebase] pseudo-reference
	return this;
}

/*
 * Quick & Easy Class detection hack
 *
 ******************************************************************************/
Firebase.prototype.id = 'com.leftlanelab.firebase';
Firebase.prototype.version = '0.1.10';

/*
 * Authenticates a Firebase client
 *
 * 	- Matches Firebase Library (VS: 2014-07-23)
 ******************************************************************************/
Firebase.prototype.auth = function (authToken, onComplete, onCancel)
{
	// Safety Net
	if (! _.isString(authToken)) {return false;}

	// Kick the [firebase]
	_firebase.auth(this.url, authToken,
		(_.isFunction(onComplete) ? onComplete : null),
		(_.isFunction(onCancel) ? onCancel : null)
	);

	return this;
};

/*
 * De-Authenticates a Firebase client
 *
 * 	- Matches Firebase Library (VS: 2014-07-23)
 ******************************************************************************/
Firebase.prototype.unauth = function (onComplete)
{
	// Kick the [firebase]
	_firebase.unauth(this.url, (_.isFunction(onComplete) ? onComplete : null));

	return this;
};

/*
 * Returns a new Firebase reference
 *
 * 	- Matches Firebase Library (VS: 2014-07-23)
 ******************************************************************************/
Firebase.prototype.child = function (path)
{
	// Safety Net
	if (! _.isString(path)) {return false;}

	// Create the [child] reference
	return _firebase.new(this.url + '/' + (path.indexOf('/') === 0 ? path.substring(1) : path));
};

/*
 * Returns a new Firebase reference
 *
 * 	- Matches Firebase Library (VS: 2014-07-23)
 ******************************************************************************/
Firebase.prototype.parent = function ()
{
	// Simple Safety Net (already at the top)
	if (! this.url.match(/^https\:\/\/([\S]*[^\/])\/[\S][^\/]*/i)) {return null;}

	// Pop the [child] off and the new reference is the [parent]
	return _firebase.new(this.url.replace(/^https\:\/\/([\S]*[^\/])\/[\S][^\/]*/i, "https://$1"));
};

/*
 * Returns a new Firebase reference
 *
 * 	- Matches Firebase Library (VS: 2014-07-23)
 ******************************************************************************/
Firebase.prototype.root = function ()
{
	// Pop the [children] off and the new reference is the [root]
	return _firebase.new(this.url.replace(/^https\:\/\/([^\/?#]+)[\/]?([\S]+)?/i, "https://$1"));
};

/*
 * Returns a the last token of this location as a string
 *
 * 	- Matches Firebase Library (VS: 2014-07-23)
 ******************************************************************************/
Firebase.prototype.name = function ()
{
	// Simple Safety Net (already at the top)
	if (! this.url.match(/^https\:\/\/([\S]*[^\/])\/[\S][^\/]*/i)) {return null;}

	// Pop the [child] off and you have the [name]
	return this.url.replace(/^https\:\/\/[\S]+\/([^\/]+)[\/]?/i, "$1");
};

/*
 * Returns the current full [url] property as a string
 *
 * 	- Matches Firebase Library (VS: 2014-07-23)
 ******************************************************************************/
Firebase.prototype.toString = function ()
{
	// You can't handle the truth!
	return this.url;
};

/*
 * Set/overwrite [value] in Firebase
 *
 * 	- Matches Firebase Library (VS: 2014-07-23)
 ******************************************************************************/
Firebase.prototype.set = function (value, onComplete)
{
	// Safety Net
	if (_.isUndefined(value)) {return this;}

	// Set [value] in [firebase]
	_firebase.set(this.url, value, (! _.isFunction(onComplete) ? null : function (error)
	{
		onComplete(error);
	}));

	return this;
};

/*
 * Update [value] in Firebase
 *
 * 	- Matches Firebase Library (VS: 2014-07-24)
 ******************************************************************************/
Firebase.prototype.update = function (value, onComplete)
{
	// Safety Net
	if (_.isUndefined(value)) {return this;}

	// Update [firebase] with [value]
	_firebase.update(this.url, value, (! _.isFunction(onComplete) ? null : function (error)
	{
		onComplete(error);
	}));

	return this;
};

/*
 * Remove all data from the current [firebase]
 *
 * 	- Matches Firebase Library (VS: 2014-07-24)
 ******************************************************************************/
Firebase.prototype.remove = function (onComplete)
{
	// Remove all data from [firebase]
	_firebase.remove(this.url, (! _.isFunction(onComplete) ? null : function (error)
	{
		onComplete(error);
	}));

	return this;
};

/*
 * Generate new child w/unique [id] and return a new [firebase]
 *
 * 	- Matches Firebase Library (VS: 2014-07-24)
 ******************************************************************************/
Firebase.prototype.push = function (value, onComplete)
{
	return (_.isUndefined(value) ?

		// Ask for a new [name] from [firebase] and return
		// a new [firebase] reference
		this.child(_firebase.push(this.url))
	:
		// Generate a new [child], set [value]/[onComplete]
		// and return a new [firebase] reference
		this.child(_firebase.push(this.url)).set(value, onComplete)
	);
};

/*
 * Set/overwrite [value] && [priority] in Firebase
 *
 * 	- Matches Firebase Library (VS: 2014-07-24)
 ******************************************************************************/
Firebase.prototype.setWithPriority = function (value, priority, onComplete)
{
	// Safety Net
	if (_.isUndefined(value) || (! _.isString(priority) && ! _.isNumber(priority))) {return this;}

	// Set [value] && [priority] in [firebase]
	_firebase.setWithPriority(this.url, value, priority, (! _.isFunction(onComplete) ? null : function (error)
	{
		onComplete(error);
	}));

	return this;
};

/*
 * Set [priority] for the data at this Firebase location
 *
 * 	- Matches Firebase Library (VS: 2014-07-24)
 ******************************************************************************/
Firebase.prototype.setPriority = function (priority, onComplete)
{
	// Safety Net
	if (! _.isString(priority) && ! _.isNumber(priority)) {return this;}

	// Set [value] && [priority] in [firebase]
	_firebase.setPriority(this.url, priority, (! _.isFunction(onComplete) ? null : function (error)
	{
		onComplete(error);
	}));

	return this;
};

/*
 * Atomically modify the data at this Firebase location
 *
 * 	- Matches Firebase Library (VS: 2014-07-24)
 ******************************************************************************/
Firebase.prototype.transaction = function (updateFunction, onComplete, applyLocally)
{
	// Safety Net
	if (! _.isFunction(updateFunction)) {return this;}

	// Initiate a [transaction] in [firebase]
	_firebase.transaction(this.url,

		// Exectute the [updateFunction]
		function (currentData)
		{
			// Preserve the [priority] of the root node
			var _priority = currentData.priority;

			// Run the [updateFunction] over [currentData] as simple Object
			currentData = updateFunction(FirebaseData(currentData));

			// Cancelled / Aborting Transaction
			if (_.isUndefined(currentData)) {return;}

			// Return [currentData] as [priority]/[value] to Firebase
			return (_.isObject(currentData) && ! _.isUndefined(currentData['.priority']) && ! _.isUndefined(currentData['.value'])

				// [priority] and [value] already seperated by [updateFunction]
				? currentData

				// Include preserved [priority] w/[value]
				: {'.priority' : _priority, '.value' : currentData}
			);
		},

		// Set the [applyLocally] flag to allow/suppress event triggers
		// during [updateFunction] runs
		(_.isBoolean(applyLocally) ? applyLocally : true),

		// Attach the [onComplete] callback (if supplied)
		(! _.isFunction(onComplete) ? null : _.bind(function (error, committed, data)
		{
			onComplete(error, committed, new FirebaseSnapshot(data, this.url));
		}, this))
	);

	return this;
};

/*
 * Manually disconnect the Firebase client(s)
 *
 * 	- Matches Firebase Library (VS: 2014-07-25)
 ******************************************************************************/
Firebase.prototype.goOffline = function ()
{
	// Kick the Firebase
	_firebase.goOffline();
};

/*
 * Manually reconnect the Firebase client(s)
 *
 * 	- Matches Firebase Library (VS: 2014-07-25)
 ******************************************************************************/
Firebase.prototype.goOnline = function ()
{
	// Kick the Firebase
	_firebase.goOnline();
};

/*
 * Create a listener for data changes at this location.
 *
 ******************************************************************************/
Firebase.prototype.on = function (eventType, callback, cancelCallback, context)
{
	// Safety Net
	if (! _.isString(eventType)) {throw Error('Firebase.on: Invalid Arguments');}
	if (! _.isFunction(callback)) {throw Error('Firebase.on: Invalid Arguments');}

	// Initialize [listeners] collector for this [type]
	if (_.isUndefined(this.listeners[eventType])) {this.listeners[eventType] = [];}

	// Set the [listener], and save the [handle]
	this.listeners[eventType].push({
		'callback' : callback,
		'handle' : _firebase.on(this.url, eventType,

			// Kroll Bridge Wrapper for [callback]
			_.bind(function (data, prevChildName)
			{
				// Bind to [context] (if supplied)
				if (_.isObject(context))
				{_.bind(callback, context)(new FirebaseSnapshot(data, this.url), prevChildName);}

				// The context is not important
				else
				{callback(new FirebaseSnapshot(data, this.url), prevChildName);}

			}, this),

			// Kroll Bridge Wrapper for [cancelCallback] (if supplied)
			(! _.isFunction(cancelCallback) ? null : _.bind(function (error)
			{
				// Bind to [context] (if supplied)
				if (_.isObject(context))
				{_.bind(cancelCallback, context)(error);}

				// The context is not important
				else
				{cancelCallback(error);}

			}, this))
		)
	});

	// Return the [callback] for future de-referencing purposes
	return callback;
};

/*
 * Remove listeners for data changes at this location.
 *
 ******************************************************************************/
Firebase.prototype.off = function (eventType, callback, context)
{
	// Unregister ALL [listeners] OR all [listeners] for a [type]
	if (_.isUndefined(eventType) || _.isUndefined(callback))
	{
		// Safety Net
		if (_.isEmpty(this.listeners)) {return;}
		if (! _.isUndefined(eventType) && (! _.isString(eventType) || _.isUndefined(this.listeners[eventType]))) {return;}

		// Remove ALL [listeners]
		_.each(_.keys(this.listeners), function (kType)
		{
			// Safety Net
			if (_.isEmpty(this.listeners[kType])) {return;}

			// Check for [type] filter
			if (! _.isUndefined(eventType) && eventType != kType) {return;}

			// Remove the [listener] from [Firebase]
			_.each(this.listeners[kType], function (vListener)
			{
				_firebase.off(this.url, vListener.handle);
			}, this);
		}, this);

		// Clean the [listeners]
		if (! _.isUndefined(eventType)) {_.omit(this.listeners, eventType);}
		else {this.listeners = {};}

		return;
	}

	// Safety Net
	if (! _.isString(eventType) || ! _.isFunction(callback) || _.isUndefined(this.listeners[eventType])) {return false;}

	// Remove the first occurrence of [callback] from [listeners]
	_.every(this.listeners[eventType], function (vListener, key)
	{
		if (vListener.callback === callback)
		{
			// Remove [listener] from [firebase] by [handle]
			_firebase.off(this.url, vListener.handle);

			// Remove from [listeners] array
			this.listeners[eventType].splice(key, 1);

			// Finished
			return false;
		}

		// Keep searching
		return true;
	}, this);

	// Remove [type] from [listeners] if EMPTY
	if (! this.listeners[eventType].length) {_.omit(this.listeners, eventType);}
};

/*
 * Listen for exactly one event of the specified event type
 *
 ******************************************************************************/
Firebase.prototype.once = function (eventType, successCallback, failureCallback, context)
{
	// Safety Net
	if (! _.isString(eventType)) {throw Error('Firebase.once: Invalid Arguments');}
	if (! _.isFunction(successCallback)) {throw Error('Firebase.once: Invalid Arguments');}
	if (! _.isUndefined(failureCallback) && ! _.isFunction(failureCallback)) {throw Error('Firebase.once: Invalid Arguments');}
	if (! _.isUndefined(context) && ! _.isObject(context)) {throw Error('Firebase.once: Invalid Arguments');}

	// Kick the [Firebase]
	_firebase.once(this.url, eventType,

		// Kroll Bridge Wrapper for [successCallback]
		_.bind(function (data, prevChildName)
		{
			// Bind to [context] (if supplied)
			if (_.isObject(context))
			{_.bind(successCallback, context)(new FirebaseSnapshot(data, this.url), prevChildName);}

			// The context is not important
			else
			{successCallback(new FirebaseSnapshot(data, this.url), prevChildName);}

		}, this),

		// Kroll Bridge Wrapper for [failureCallback] (if supplied)
		(! _.isFunction(failureCallback) ? null : _.bind(function (error)
		{
			// Bind to [context] (if supplied)
			if (_.isObject(context)) {_.bind(failureCallback, context)(error);}

			// The context is not important
			else {failureCallback(error);}

		}, this))
	);
};

/*
 * Return a new FirebaseQuery limited to the specified number of children
 *
 ******************************************************************************/
Firebase.prototype.limit = function (limit)
{
	return new FirebaseQuery (this.url).limit(limit);
};

/*
 * Return a new FirebaseQuery with the specified starting point
 *
 ******************************************************************************/
Firebase.prototype.startAt = function (priority, name)
{
	return new FirebaseQuery (this.url).startAt(priority, name);
};

/*
 * Return a new FirebaseQuery with the specified ending point
 *
 ******************************************************************************/
Firebase.prototype.endAt = function (priority, name)
{
	return new FirebaseQuery (this.url).endAt(priority, name);
};

/*
 * Return a new FirebaseOnDisconnect Object for this [url]
 *
 ******************************************************************************/
Firebase.prototype.onDisconnect = function ()
{
	return new FirebaseOnDisconnect(this.url);
};

/*
===============================================================================>
	FirebaseQuery
===============================================================================>
*/
/*
 * FirebaseQuery API Controller
 *
 * 	- expects to be created from an existing [Firebase] instance
 ******************************************************************************/
function FirebaseQuery (url)
{
	// Safety Net
	if (! _.isString(url) || ! _.isObject(_firebase)) {return false;}

	// Global Variables
	this.url = url;
	this.listeners = {};
	this.query = {};

	// Register the new [instance]
	this.instance = _instances.FirebaseQuery++;

	// Return the new [FirebaseQuery] pseudo-reference
	return this;
}

/*
 * Create a listener for data changes at this location.
 *
 ******************************************************************************/
FirebaseQuery.prototype.on = function (eventType, callback, cancelCallback, context)
{
	// Safety Net
	if (! _.isString(eventType)) {throw Error('Query.on: Invalid Arguments');}
	if (! _.isFunction(callback)) {throw Error('Query.on: Invalid Arguments');}

	// Require at least 1 Query element is already set
	if (_.keys(this.query).length < 1) {throw Error ('Query.on: Must set startAt(), endAt(), or limit() first');}

	// Initialize [listeners] collector for this [type]
	if (_.isUndefined(this.listeners[eventType])) {this.listeners[eventType] = [];}

	// Set the [listener], and save the [handle]
	this.listeners[eventType].push({
		'callback' : callback,
		'handle' : _firebase.queryOn(this.instance, eventType,

			// Kroll Bridge Wrapper for [callback]
			_.bind(function (data, prevChildName)
			{
				// Bind to [context] (if supplied)
				if (_.isObject(context))
				{_.bind(callback, context)(new FirebaseSnapshot(data, this.url), prevChildName);}

				// The context is not important
				else
				{callback(new FirebaseSnapshot(data, this.url), prevChildName);}

			}, this),

			// Kroll Bridge Wrapper for [cancelCallback] (if supplied)
			(! _.isFunction(cancelCallback) ? null : _.bind(function (error)
			{
				// Bind to [context] (if supplied)
				if (_.isObject(context))
				{_.bind(cancelCallback, context)(error);}

				// The context is not important
				else
				{cancelCallback(error);}

			}, this))
		)
	});

	// Return the [callback] for future de-referencing purposes
	return callback;
};

/*
 * Remove listeners for data changes at this location.
 *
 ******************************************************************************/
FirebaseQuery.prototype.off = function (eventType, callback, context)
{
	// Unregister ALL [listeners] OR all [listeners] for a [type]
	if (_.isUndefined(eventType) || _.isUndefined(callback))
	{
		// Safety Net
		if (_.isEmpty(this.listeners)) {return;}
		if (! _.isUndefined(eventType) && (! _.isString(eventType) || _.isUndefined(this.listeners[eventType]))) {return;}

		// Remove ALL [listeners]
		_.each(_.keys(this.listeners), function (kType)
		{
			// Safety Net
			if (_.isEmpty(this.listeners[kType])) {return;}

			// Check for [type] filter
			if (! _.isUndefined(eventType) && eventType != kType) {return;}

			// Remove the [listener] from [Firebase]
			_.each(this.listeners[kType], function (vListener)
			{
				_firebase.queryOff(this.instance, vListener.handle);
			}, this);
		}, this);

		// Clean the [listeners]
		if (! _.isUndefined(eventType)) {_.omit(this.listeners, eventType);}
		else {this.listeners = {};}

		return;
	}

	// Safety Net
	if (! _.isString(eventType) || ! _.isFunction(callback) || _.isUndefined(this.listeners[eventType])) {return false;}

	// Remove the first occurrence of [callback] from [listeners]
	_.every(this.listeners[eventType], function (vListener, key)
	{
		if (vListener.callback === callback)
		{
			// Remove [listener] from [firebase] by [handle]
			_firebase.queryOff(this.instance, vListener.handle);

			// Remove from [listeners] array
			this.listeners[eventType].splice(key, 1);

			// Finished
			return false;
		}

		// Keep searching
		return true;
	}, this);

	// Remove [type] from [listeners] if EMPTY
	if (! this.listeners[eventType].length) {_.omit(this.listeners, eventType);}
};

/*
 * Listen for exactly one event of the specified event type
 *
 ******************************************************************************/
FirebaseQuery.prototype.once = function (eventType, successCallback, failureCallback, context)
{
	// Safety Net
	if (! _.isString(eventType)) {throw Error('Query.once: Invalid Arguments');}
	if (! _.isFunction(successCallback)) {throw Error('Query.once: Invalid Arguments');}
	if (! _.isUndefined(failureCallback) && ! _.isFunction(failureCallback)) {throw Error('Query.once: Invalid Arguments');}
	if (! _.isUndefined(context) && ! _.isObject(context)) {throw Error('Query.once: Invalid Arguments');}

	// Require at least 1 Query element is already set
	if (_.keys(this.query).length < 1) {throw Error ('Query.once: Must set startAt(), endAt(), or limit() first');}

	// Kick the [Firebase]
	_firebase.queryOnce(this.instance, eventType,

		// Kroll Bridge Wrapper for [successCallback]
		_.bind(function (data, prevChildName)
		{
			// Bind to [context] (if supplied)
			if (_.isObject(context))
			{_.bind(successCallback, context)(new FirebaseSnapshot(data, this.url), prevChildName);}

			// The context is not important
			else
			{successCallback(new FirebaseSnapshot(data, this.url), prevChildName);}

		}, this),

		// Kroll Bridge Wrapper for [failureCallback] (if supplied)
		(! _.isFunction(failureCallback) ? null : _.bind(function (error)
		{
			// Bind to [context] (if supplied)
			if (_.isObject(context)) {_.bind(failureCallback, context)(error);}

			// The context is not important
			else {failureCallback(error);}

		}, this))
	);
};

/*
 * Generate a new Query limited to the specified number of children
 *
 ******************************************************************************/
FirebaseQuery.prototype.limit = function (limit)
{
	// Safety Net
	if (! _.isNumber(limit)) {throw Error ('Query.limit: Invalid arguments');}

	// Only allow 2 Query elements
	if (_.keys(this.query).length > 2) {throw Error ('Query.limit: Can\'t combine startAt(), endAt(), and limit()');}

	// Prevent Orphaned Query objects on the other side of the Kroll Bridge
	if (_.keys(this.listeners).length) {throw Error ('Query.limit: query locked due to active listeners (use off() to remove listeners or create a new query object)');}

	// Register the [query] element
	this.query['limit'] = true;

	// Kick the Firebase
	_firebase.limit(this.instance, this.url, limit);

	return this;
};

/*
 * Generate a new Query with the specified starting point
 *
 ******************************************************************************/
FirebaseQuery.prototype.startAt = function (priority, name)
{
	// Safety Net
	if (_.isUndefined(priority) || (! _.isNull(priority) && ! _.isNumber(priority) && ! _.isString(priority))) {throw Error ('Query.startAt: Invalid priority (integer, string, or null)');}
	if (! _.isUndefined(name) && ! _.isString(name)) {throw Error ('Query.startAt: Invalid name (string)');}

	// Only allow 2 Query elements
	if (_.keys(this.query).length > 2) {throw Error ('Query.startAt: Can\'t combine startAt(), endAt(), and limit()');}

	// Prevent Orphaned Query objects on the other side of the Kroll Bridge
	if (_.keys(this.listeners).length) {throw Error ('Query.startAt: query locked due to active listeners (use off() to remove listeners or create a new query object)');}

	// Register the query element
	this.query['startAt'] = true;

	// Kick the Firebase
	_firebase.startAt(this.instance, this.url, priority, (_.isString(name) ? name : null));

	return this;
};

/*
 * Generate a new Query with the specified ending point
 *
 ******************************************************************************/
FirebaseQuery.prototype.endAt = function (priority, name)
{
	// Safety Net
	if (_.isUndefined(priority) || (! _.isNull(priority) && ! _.isNumber(priority) && ! _.isString(priority))) {throw Error ('Query.endAt: Invalid priority (integer, string, or null)');}
	if (! _.isUndefined(name) && ! _.isString(name)) {throw Error ('Query.endAt: Invalid name (string)');}

	// Only allow 2 Query elements
	if (_.keys(this.query).length > 2) {throw Error ('Query.endAt: Can\'t combine startAt(), endAt(), and limit()');}

	// Prevent Orphaned Query objects on the other side of the Kroll Bridge
	if (_.keys(this.listeners).length) {throw Error ('Query.endAt: query locked due to active listeners (use off() to remove listeners or create a new query object)');}

	// Register the query element
	this.query['endAt'] = true;

	// Kick the Firebase
	_firebase.endAt(this.instance, this.url, priority, (_.isString(name) ? name : null));

	return this;
};

/*
 * Get a Firebase reference to the Query's location.
 *
 ******************************************************************************/
FirebaseQuery.prototype.ref = function () {return _firebase.new(this.url);};

/*
===============================================================================>
	Firebase onDisconnect
===============================================================================>
*/
/*
 * Firebase onDisconnect API Controller
 *
 * 	- expects to be created from an existing [Firebase] instance
 ******************************************************************************/
function FirebaseOnDisconnect (url)
{
	// Safety Net
	if (! _.isString(url) || ! _.isObject(_firebase)) {return false;}

	return {

		/*
		 * Cancel all previously queued events for this location and children
		 *
		 **********************************************************************/
		'cancel' : function (onComplete)
		{
			// Kick the Firebase
			_firebase.onDisconnectCancel(url, (! _.isFunction(onComplete) ? null : function (error)
			{
				onComplete(error);
			}));
		},

		/*
		 * Ensure the data at this location is deleted onDisconnect
		 **********************************************************************/
		'remove' : function (onComplete)
		{
			// Kick the Firebase
			_firebase.onDisconnectRemove(url, (! _.isFunction(onComplete) ? null : function (error)
			{
				onComplete(error);
			}));
		},

		/*
		 * Ensure the data at this location is set onDisconnect
		 *
		 **********************************************************************/
		'set' : function (value, onComplete)
		{
			// Safety Net
			if (_.isUndefined(value)) {return;}

			// Kick the Firebase
			_firebase.onDisconnectSet(url, value, (! _.isFunction(onComplete) ? null : function (error)
			{
				onComplete(error);
			}));
		},

		/*
		 * Ensure the data at this location is set w/[priority] onDisconnect
		 *
		 **********************************************************************/
		'setWithPriority' : function (value, priority, onComplete)
		{
			// Safety Net
			if (_.isUndefined(value) || _.isUndefined(priority) || (! _.isNumber(priority) && ! _.isString(priority) && ! _.isNull(priority))) {return;}

			// Kick the Firebase
			_firebase.onDisconnectSetWithPriority(url, value, priority, (! _.isFunction(onComplete) ? null : function (error)
			{
				onComplete(error);
			}));
		},

		/*
		 * Write the enumerated children at this location onDisconnect
		 *
		 **********************************************************************/
		'update' : function (value, onComplete)
		{
			// Safety Net
			if (_.isUndefined(value)) {return;}

			// Kick the Firebase
			_firebase.onDisconnectUpdate(url, value, (! _.isFunction(onComplete) ? null : function (error)
			{
				onComplete(error);
			}));
		}
	};
};

/*
===============================================================================>
	Shared Utility Functions & Objects
===============================================================================>
*/

/*
 * Firebase Snapshot->Data Recursion Tool
 *
 ******************************************************************************/
function FirebaseData (data, priority)
{
	if (! _.isObject(data) || _.isNull(data)) {return null;}

	// No [children], just return [value] OR [value] w/[priority]
	if (! data.childrenCount) {return (! priority || priority && ! data.priority ? data.value : {'.priority' : data.priority, '.value' : data.value});}

	// Initialize the [dictionary] OR [dictionary] w/[priority]
	var dictionary = (! priority || ! data.priority ? {} : {'.priority' : data.priority});

	// Recursively evaluate the [value] as a key:value tree
	_.each(_.keys(data.value), function (key)
	{
		dictionary[key] = FirebaseData(data.value[key], priority);

		// Inject [priority]
		if (priority && data.value[key].priority)
		{
			_.extend(dictionary[key], {'.priority' : data.value[key].priority});
		}
	});

	return dictionary;
}

/*
 * Firebase Snapshot Object
 *
 ******************************************************************************/
function FirebaseSnapshot (data, url)
{
	return {

	/*
	 * Return a simple Object version of [data].[value]
	 *
	 **************************************************************************/
	'val' : function () {return FirebaseData(data);},

	/*
	 * Return a new FirebaseSnapshot @ [childPath]
	 *
	 **************************************************************************/
	'child' : function (childPath)
	{
		// Safety Net
		if (! _.isString(childPath)) {return null;}

		// Clean the input (remove leading slash)
		childPath = (childPath.indexOf('/') === 0 ? childPath.substring(1) : childPath);

		// Initialize the [child]
		var _child = data;

		// Walk through the [childPath]
		_.each(childPath.split('/'), function (x)
		{_child = (_.isObject(_child) && ! _.isUndefined(_child.value[x]) ? _child.value[x] : null);});

		// Return a new FirebaseSnapshot @ [childPath]
		return new FirebaseSnapshot(_child, url + '/' + childPath);
	},

	/*
	 * Iterate over [children] by [priority]
	 *
	 **************************************************************************/
	'forEach' : function (childAction)
	{
		// Safety Net
		if (! _.isFunction(childAction) || ! _.isObject(data) || ! data.childrenCount) {return;}

		// Prepare the handbrake
		var _stop = false;

		// Iterate over the [keys] of [data].[value] by [priority]
		_.each(_.sortBy(_.keys(data.value), function (key) {return data.value[key].priority || 0;}), function (key)
		{
			_stop = (_stop || childAction(my.child(key)) === true);
		});

		return (_stop);
	},

	/*
	 * Return a new Firebase for [url]
	 *
	 **************************************************************************/
	'hasChild' : function (childPath)
	{
		// Safety Net & Simple Fail
		if (! _.isString(childPath) || ! my.hasChildren()) {return false;}

		// Clean the input (remove leading slash)
		childPath = (childPath.indexOf('/') === 0 ? childPath.substring(1) : childPath);

		// Initialize the [child]
		var _child = data;

		// Walk through the [childPath]
		_.each(childPath.split('/'), function (x)
		{_child = (_.isObject(_child) && ! _.isUndefined(_child.value[x]) ? _child.value[x] : null);});

		// Return a new FirebaseSnapshot @ [childPath]
		return (! _.isNull(_child));
	},

	/*
	 * Evalute [data].[childrenCount] as BOOLEAN
	 *
	 **************************************************************************/
	'hasChildren' : function () {return (_.isObject(data) && data.childrenCount ? true : false);},

	/*
	 * Return the [data].[name]
	 *
	 **************************************************************************/
	'name' : function () {return data.name;},

	/*
	 * Evalute [data].[childrenCount] as INT
	 *
	 **************************************************************************/
	'numChildren' : function () {return (_.isObject(data) ? data.childrenCount : 0);},

	/*
	 * Return a new Firebase for [url]
	 *
	 **************************************************************************/
	'ref' : function () {return _firebase.new(url);},

	/*
	 * Return [data].[getPriority] or NULL
	 *
	 **************************************************************************/
	'getPriority' : function () {return (_.isObject(data) ? data.priority : null);},

	/*
	 * Return a simple Object version of [data].[value] w/[priority] notations
	 *
	 **************************************************************************/
	'exportVal' : function () {return FirebaseData(data, true);}

	};
};