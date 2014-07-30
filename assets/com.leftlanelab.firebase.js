/**
 * @author vstross
 */

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
 ******************************************************************************/
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
 * Local Firebase API interface object
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
 * Local FirebaseQuery API interface object
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
 * FirebaseQuery instance manager
 *
 ******************************************************************************/
//FirebaseQuery.prototype.instances = {'next' : 0};

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
 * Local Firebase onDisconnect API controller
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
	'name' : function ()
	{
		// Simple Safety Net (already at the top)
		if (! url.match(/^https\:\/\/([\S]*[^\/])\/[\S][^\/]*/i)) {return null;}

		// Pop the [child] off and you have the [name]
		return url.replace(/^https\:\/\/[\S]+\/([^\/]+)[\/]?/i, "$1");
	},

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

/*
 * FirebaseTokenGenerator
 *
 * Source: https://cdn.firebase.com/v0/firebase-token-generator.js
 ******************************************************************************/
(function() {var k=null,m=!1,n=this;
function q(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";else if("function"==
b&&"undefined"==typeof a.call)return"object";return b}Math.floor(2147483648*Math.random()).toString(36);var r={};function aa(){this.i=void 0}
function s(a,b,c){switch(typeof b){case "string":t(b,c);break;case "number":c.push(isFinite(b)&&!isNaN(b)?b:"null");break;case "boolean":c.push(b);break;case "undefined":c.push("null");break;case "object":if(b==k){c.push("null");break}if("array"==q(b)){var d=b.length;c.push("[");for(var e="",f=0;f<d;f++)c.push(e),e=b[f],s(a,a.i?a.i.call(b,String(f),e):e,c),e=",";c.push("]");break}c.push("{");d="";for(f in b)Object.prototype.hasOwnProperty.call(b,f)&&(e=b[f],"function"!=typeof e&&(c.push(d),t(f,c),
c.push(":"),s(a,a.i?a.i.call(b,f,e):e,c),d=","));c.push("}");break;case "function":break;default:throw Error("Unknown type: "+typeof b);}}var u={'"':'\\"',"\\":"\\\\","/":"\\/","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t","\x0B":"\\u000b"},ba=/\uffff/.test("\uffff")?/[\\\"\x00-\x1f\x7f-\uffff]/g:/[\\\"\x00-\x1f\x7f-\xff]/g;
function t(a,b){b.push('"',a.replace(ba,function(a){if(a in u)return u[a];var b=a.charCodeAt(0),e="\\u";16>b?e+="000":256>b?e+="00":4096>b&&(e+="0");return u[a]=e+b.toString(16)}),'"')};function w(a){if("undefined"!==typeof JSON&&void 0!==JSON.stringify)a=JSON.stringify(a);else{var b=[];s(new aa,a,b);a=b.join("")}return a};function x(a,b,c){var d;1>c?d="at least 1":c>b&&(d=0===b?"none":"no more than "+b);if(d)throw Error(a+" failed: Was called with "+c+(1===c?" argument.":" arguments.")+" Expects "+d+".");}function ca(a,b,c){var d="";switch(b){case 1:d=c?"first":"First";break;case 2:d=c?"second":"Second";break;case 3:d=c?"third":"Third";break;case 4:d=c?"fourth":"Fourth";break;default:r.L.Q.U.assert(m,"errorPrefix_ called with argumentNumber > 4.  Need to update it?")}return a+" failed: "+(d+" argument ")};var y=Math,z={},A=z.p={};function da(){}
var B=A.r={extend:function(a){da.prototype=this;var b=new da;a&&b.P(a);b.q=this;return b},create:function(){var a=this.extend();a.h.apply(a,arguments);return a},h:function(){},P:function(a){for(var b in a)a.hasOwnProperty(b)&&(this[b]=a[b]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},c:function(){return this.q.extend(this)}},C=A.A=B.extend({h:function(a,b){a=this.b=a||[];this.a=void 0!=b?b:4*a.length},toString:function(a){return(a||ea).stringify(this)},concat:function(a){var b=this.b,
c=a.b,d=this.a,a=a.a;this.K();if(d%4)for(var e=0;e<a;e++)b[d+e>>>2]|=(c[e>>>2]>>>24-8*(e%4)&255)<<24-8*((d+e)%4);else if(65535<c.length)for(e=0;e<a;e+=4)b[d+e>>>2]=c[e>>>2];else b.push.apply(b,c);this.a+=a;return this},K:function(){var a=this.b,b=this.a;a[b>>>2]&=4294967295<<32-8*(b%4);a.length=y.ceil(b/4)},c:function(){var a=B.c.call(this);a.b=this.b.slice(0);return a},random:function(a){for(var b=[],c=0;c<a;c+=4)b.push(4294967296*y.random()|0);return C.create(b,a)}}),D=z.N={},ea=D.S={stringify:function(a){for(var b=
a.b,a=a.a,c=[],d=0;d<a;d++){var e=b[d>>>2]>>>24-8*(d%4)&255;c.push((e>>>4).toString(16));c.push((e&15).toString(16))}return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d+=2)c[d>>>3]|=parseInt(a.substr(d,2),16)<<24-4*(d%8);return C.create(c,b/2)}},fa=D.T={stringify:function(a){for(var b=a.b,a=a.a,c=[],d=0;d<a;d++)c.push(String.fromCharCode(b[d>>>2]>>>24-8*(d%4)&255));return c.join("")},parse:function(a){for(var b=a.length,c=[],d=0;d<b;d++)c[d>>>2]|=(a.charCodeAt(d)&255)<<24-8*(d%
4);return C.create(c,b)}},ga=D.z={stringify:function(a){try{return decodeURIComponent(escape(fa.stringify(a)))}catch(b){throw Error("Malformed UTF-8 data");}},parse:function(a){return fa.parse(unescape(encodeURIComponent(a)))}},E=A.R=B.extend({reset:function(){this.f=C.create();this.k=0},l:function(a){"string"==typeof a&&(a=ga.parse(a));this.f.concat(a);this.k+=a.a},m:function(a){var b=this.f,c=b.b,d=b.a,e=this.o,f=d/(4*e),f=a?y.ceil(f):y.max((f|0)-this.I,0),a=f*e,d=y.min(4*a,d);if(a){for(var g=0;g<
a;g+=e)this.F(c,g);g=c.splice(0,a);b.a-=d}return C.create(g,d)},c:function(){var a=B.c.call(this);a.f=this.f.c();return a},I:0});A.t=E.extend({h:function(){this.reset()},reset:function(){E.reset.call(this);this.G()},update:function(a){this.l(a);this.m();return this},e:function(a){a&&this.l(a);this.D();return this.g},c:function(){var a=E.c.call(this);a.g=this.g.c();return a},o:16,B:function(a){return function(b,c){return a.create(c).e(b)}},C:function(a){return function(b,c){return ha.s.create(a,c).e(b)}}});
for(var ha=z.n={},F=Math,G=z.p,ia=G.A,G=G.t,H=z.n,ja=[],ka=[],I=2,J=0;64>J;){var K;a:{for(var la=I,ma=F.sqrt(la),L=2;L<=ma;L++)if(!(la%L)){K=m;break a}K=!0}K&&(8>J&&(ja[J]=4294967296*(F.pow(I,0.5)-(F.pow(I,0.5)|0))|0),ka[J]=4294967296*(F.pow(I,1/3)-(F.pow(I,1/3)|0))|0,J++);I++}
var M=[],H=H.w=G.extend({G:function(){this.g=ia.create(ja.slice(0))},F:function(a,b){for(var c=this.g.b,d=c[0],e=c[1],f=c[2],g=c[3],h=c[4],i=c[5],v=c[6],R=c[7],j=0;64>j;j++){if(16>j)M[j]=a[b+j]|0;else{var l=M[j-15],p=M[j-2];M[j]=((l<<25|l>>>7)^(l<<14|l>>>18)^l>>>3)+M[j-7]+((p<<15|p>>>17)^(p<<13|p>>>19)^p>>>10)+M[j-16]}l=R+((h<<26|h>>>6)^(h<<21|h>>>11)^(h<<7|h>>>25))+(h&i^~h&v)+ka[j]+M[j];p=((d<<30|d>>>2)^(d<<19|d>>>13)^(d<<10|d>>>22))+(d&e^d&f^e&f);R=v;v=i;i=h;h=g+l|0;g=f;f=e;e=d;d=l+p|0}c[0]=c[0]+
d|0;c[1]=c[1]+e|0;c[2]=c[2]+f|0;c[3]=c[3]+g|0;c[4]=c[4]+h|0;c[5]=c[5]+i|0;c[6]=c[6]+v|0;c[7]=c[7]+R|0},D:function(){var a=this.f,b=a.b,c=8*this.k,d=8*a.a;b[d>>>5]|=128<<24-d%32;b[(d+64>>>9<<4)+15]=c;a.a=4*b.length;this.m()}});z.w=G.B(H);z.u=G.C(H);var na=z.N.z;
z.n.s=z.p.r.extend({h:function(a,b){a=this.j=a.create();"string"==typeof b&&(b=na.parse(b));var c=a.o,d=4*c;b.a>d&&(b=a.e(b));for(var e=this.J=b.c(),f=this.H=b.c(),g=e.b,h=f.b,i=0;i<c;i++)g[i]^=1549556828,h[i]^=909522486;e.a=f.a=d;this.reset()},reset:function(){var a=this.j;a.reset();a.update(this.H)},update:function(a){this.j.update(a);return this},e:function(a){var b=this.j,a=b.e(a);b.reset();return b.e(this.J.c().concat(a))}});function N(a,b,c){var d=o;if(typeof a!==b)throw Error("FirebaseTokenGenerator.createToken option "+d+" must be "+c);};Math.random();var O,P,Q,S;function oa(){return n.navigator?n.navigator.userAgent:k}S=Q=P=O=m;var T;if(T=oa()){var pa=n.navigator;O=0==T.indexOf("Opera");P=!O&&-1!=T.indexOf("MSIE");Q=!O&&-1!=T.indexOf("WebKit");S=!O&&!Q&&"Gecko"==pa.product}var qa=P,ra=S,sa=Q;var U;if(O&&n.opera){var ta=n.opera.version;"function"==typeof ta&&ta()}else ra?U=/rv\:([^\);]+)(\)|;)/:qa?U=/MSIE\s+([^\);]+)(\)|;)/:sa&&(U=/WebKit\/(\S+)/),U&&U.exec(oa());var V=k,W=k;
function ua(a){var b=q(a);if(!("array"==b||"object"==b&&"number"==typeof a.length))throw Error("encodeByteArray takes an array as a parameter");if(!V){V={};W={};for(b=0;65>b;b++)V[b]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(b),W[b]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.".charAt(b)}for(var b=W,c=[],d=0;d<a.length;d+=3){var e=a[d],f=d+1<a.length,g=f?a[d+1]:0,h=d+2<a.length,i=h?a[d+2]:0,v=e>>2,e=(e&3)<<4|g>>4,g=(g&15)<<2|i>>6,i=i&63;h||(i=
64,f||(g=64));c.push(b[v],b[e],b[g],b[i])}return c.join("")};function X(a){x("new FirebaseTokenGenerator",1,arguments.length);if("string"!=typeof a)throw Error(ca("new FirebaseTokenGenerator",1,m)+"must be a valid firebase namespace secret.");this.O=a}var Y=["FirebaseTokenGenerator"],Z=n;!(Y[0]in Z)&&Z.execScript&&Z.execScript("var "+Y[0]);for(var $;Y.length&&($=Y.shift());)!Y.length&&void 0!==X?Z[$]=X:Z=Z[$]?Z[$]:Z[$]={};
X.prototype.M=function(a,b){x("FirebaseTokenGenerator.createToken",2,arguments.length);if(void 0!==b&&(b==k||"object"!=typeof b))throw Error(ca("FirebaseTokenGenerator.createToken",2,!0)+"must be a dictionary of token options.");b=b||{};if(va(a)&&va(b))throw Error("FirebaseTokenGenerator.createToken: data is empty and no options are set.  This token will have no effect on Firebase.");var c=b,d={};for(o in c)switch(o){case "expires":N(c[o],"number","a number.");d.exp=c[o];break;case "notBefore":N(c[o],
"number","a number.");d.nbf=c[o];break;case "admin":N(c[o],"boolean","a boolean.");d.admin=c[o];break;case "debug":N(c[o],"boolean","a boolean.");d.debug=c[o];break;case "simulate":N(c[o],"boolean","a boolean.");d.simulate=c[o];break;default:throw Error("FirebaseTokenGenerator.createToken unrecognized option: "+o);}d.v=0;d.iat=Math.floor((new Date).getTime()/1E3);d.d=a;for(var c=wa(w({typ:"JWT",alg:"HS256"})),d=wa(w(d)),e=z.u(c+"."+d,this.O).toString(),f=[],g=0;g<e.length;g+=2)f.push(parseInt(e.substr(g,
2),16));e=ua(f);e=xa(e);return c+"."+d+"."+e};X.prototype.createToken=X.prototype.M;function wa(a){for(var b=[],c=0,d=0;d<a.length;d++){var e=a.charCodeAt(d);55296<=e&&56319>=e&&(e-=55296,d++,r.L.Q.assert(d<a.length,"Surrogate pair missing trail surrogate."),e=65536+(e<<10)+(a.charCodeAt(d)-56320));128>e?b[c++]=e:(2048>e?b[c++]=e>>6|192:(65536>e?b[c++]=e>>12|224:(b[c++]=e>>18|240,b[c++]=e>>12&63|128),b[c++]=e>>6&63|128),b[c++]=e&63|128)}a=ua(b);return xa(a)}
function xa(a){var b=a.indexOf(".");return 0<=b?a.substring(0,b):a}function va(a){if("object"!==typeof a)return m;if(a===k)return!0;for(var b in a)if(Object.prototype.hasOwnProperty.call(a,b))return m;return!0};}());