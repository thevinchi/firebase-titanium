/**
 * @author vstross
 */

/*
 * Public API Endpoint for getting a [firebase] reference
 */
exports.new = function (url)
{
	// Safety Net
	if (! _.isString(url)) {return false;}

	// Return the new [firebase]
	return new Firebase(url, this);
};

/*
 * Local Firebase API interface class
 */
function Firebase (url, module)
{
	// Global Variables
	this.firebase = module;
	this.listeners = {};

	// Try to set the [forge] from App Properties
	this.forge = (Ti.App.Properties.hasProperty('com.leftlanelab.firebase.forge') ? Ti.App.Properties.getString('com.leftlanelab.firebase.forge') : false);

	// Safety Net
	if (! this.forge && (_.isUndefined(url) || _.isEmpty(url))) {return false;}

	// Set the [url] (allows for absolute &| empty [forge])
	this.url = (url.indexOf('https://') === 0 ? url : (this.forge || '') + url);			

	// Return the new [Firebase] pseudo-reference 
	return this;
}

/*
 * Returns a new Firebase reference
 */
Firebase.prototype.child = function (path)
{
	// Safety Net
	if (! _.isString(path)) {return false;}

	// Create the [child] reference
	return this.firebase.new(this.url + '/' + (path.indexOf('/') === 0 ? path.substring(1) : path));
};

/*
 * Returns a new Firebase reference
 */
Firebase.prototype.parent = function ()
{
	// Simple Safety Net (already at the top)
	if (! this.url.match(/^https:\/\/([\S]+)\/[\S][^\/]*/g)) {return null;}

	// Pop the [child] off and the new reference is the [parent]
	return this.firebase.new(this.url.replace(/^https:\/\/([\S]*[^\/])\/[\S][^\/]*/g, "$1"));
};

/*
 * Set/overwrite [value] in Firebase
 */
Firebase.prototype.set = function (value, callback, callbackContext)
{
	// Safety Net
	if (_.isUndefined(value)) {return false;}

	// Set [value] in [firebase] through TiProxy
	this.firebase.set(this.url, value,
		(_.isFunction(callback) ? callback : null),
		(_.isObject(callbackContext) ? callbackContext : null)
	);

	return;
};

/*
 * Update [value] in Firebase
 */
Firebase.prototype.update = function (value, callback, callbackContext, onComplete, onCompleteContext)
{
	// Prepare to handle the [callback]
	if (_.isFunction(onComplete))
	{	
		// Save [this] reference for local [callback]
		var _this = this;
	
		// Set the local [callback]
		var _callback = function ()
		{
			// Remove [listener]
			_this.once('value', onComplete, (_.isObject(onCompleteContext) ? onCompleteContext : null));

			// Garbage Collection
			_this = null, _callback = null;
		};
	}

	// Update the existing [firebase] key(s)
	this.firebase.update(this.url, value,
		(_.isFunction(callback) ? callback : null),
		(_.isObject(callbackContext) ? callbackContext : null),
		(_.isFunction(onComplete) ? _callback : null)
	);

	return;
};

/*
 * Add a new [child] (w/[value] if supplied)
 */
Firebase.prototype.push = function (value, callback)
{
	// Clean the input
	callback = (_.isFunction(callback) ? callback : 0);

	// Get new [id] from [firebase]
	var _id = this.firebase.childByAutoId();

	// Just return [id] if no [value] is supplied
	if (_.isUndefined(value)) {return _id;}

	// Initialize the new [child] reference
	var _child = this.child(_id);

	// Prepare to handle the [callback]
	if (_.isFunction(callback))
	{	
		// Set the local [callback]
		var _callback = function ()
		{
			// Remove [listener]
			_child.once('value', callback);
	
			// Garbage Collection
			_child = null, _callback = null;
		};

		// Set the new [child] reference with [value] && [callback]
		_child.set(value, _callback);
	}

	// Just walk away...
	else
	{
		// Set the new [child] reference with [value]
		_child.set(value);
		
		// Garbage Collection
		_child = null;
	}

	// Garbage Collection
	_id = null;
};

/*
 * Add a listener of [type] and listen for one event
 */
Firebase.prototype.once = function (type, callback, callbackContext)
{
	// Safety Net
	if (! _.isString(type) || ! _.isFunction(callback)) {return false;}

	// Save [this] reference for local [callback]
	var _this = this;

	// Inform the [firebase] we are listening
	var _handle = null;

	// Set the local [callback]
	_handle = this.on(type, function (snapshot)
	{
		// Remove [listener]
		_this.off(type, _handle);

		// Execute remote [callback]
		callback(snapshot);

		// Garbage Collection
		_this = null, _handle = null;
	}, (_.isObject(callbackContext) ? callbackContext : null));

	return;
};

/*
 * Create a [listener] of [type]
 */
Firebase.prototype.on = function (type, callback, callbackContext)
{
	// Safety Net
	if (! _.isString(type)) {return false;}
	if (! _.isFunction(callback)) {return false;}

	// Initialize [listeners] collector for this [type]
	if (_.isUndefined(this.listeners[type])) {this.listeners[type] = [];}

	// Set the [handle] 
	var _handle = this.firebase.on(this.url, type, callback, (_.isObject(callbackContext) ? callbackContext : null));

	// Record [callback] for off(*) requests
	this.listeners[type].push(_handle);

	// Return the [handle] for future reference
	return _handle;
};

/*
 * Remove one or more [listeners]
 */
Firebase.prototype.off = function (type, handle)
{
	// Unregister ALL [listeners] OR all [listeners] for a [type]
	if (_.isUndefined(type) || _.isUndefined(handle))
	{
		// Safety Net
		if (_.isEmpty(this.listeners)) {return;}
		if (! _.isUndefined(type) && (! _.isString(type) || _.isUndefined(this.listeners[type]))) {return;}

		// Remove ALL [listeners]
		_.each(_.keys(this.listeners), function (kType)
		{
			// Safety Net
			if (_.isEmpty(this.listeners[kType])) {return;}

			// Check for [type] filter
			if (! _.isUndefined(type) && type != kType) {return;}

			// Remove the [listener] from [Firebase]
			_.each(this.listeners[kType], function (vHandle)
			{
				this.firebase.off(this.url, kType, vHandle);
			}, this);
		}, this);

		// Clean the [listeners]
		if (! _.isUndefined(type)) {_.omit(this.listeners, type);}
		else {this.listeners = {};}

		return;
	}

	// Safety Net
	if (! _.isString(type) || ! _.isNumber(handle)) {return false;}

	// Ensure the [callback] is registered with [listeners]
	if (_.indexOf(this.listeners[type], handle) < 0) {return false;}

	// Remove the [listener] for [type]
	this.firebase.off(this.url, type, handle);

	// Remove [callback] from [listeners]
	this.listeners[type] = _.without(this.listeners[type], handle);

	// Remove [type] from [listeners] if EMPTY
	if (! this.listeners[type].length) {_.omit(this.listeners, type);}
};

/*
 * Public API Endpoint for Backbone Sync Adapter
 */
exports.sync = function (method, model, options)
{
	// Safety Net
	if (! _.isString(method) || ! _.isObject(model)) {return;}

	// Verify this is a Firebase Model
	if (! _.isObject(this.Firebase)
		|| ! _.isObject(model.config.firebase)
		|| ! _.isString(model.config.firebase.path)) {return;}

	// Respect the [options]
	if (_.isObject(options))
	{
		var _successCallback = (_.isFunction(options.success) ? options.success : false);
		var _errorCallback = (_.isFunction(options.error) ? options.error : false);
	}

	// Initialize the [payload] container
	var _payload;

	// Manage the [method]
	switch (method)
	{
		/*
		 * Get data from [firebase]
		 * - Initiated from Model.fetch() and Collection.fetch()
		 */
		case 'read':

			// Single Model
			if (! _.isArray(model.toJSON()))
			{
				// Safety Net
				if (! _.isString(model.get(model.idAttribute))) {return;}

				var _callback = function (event)
				{
					// ERROR Condition
					// TODO: Needs defined!!
					if (1 == 2)
					{
						// Execute ERROR [callback]					
						(_errorCallback ? _errorCallback(event.snapshot, JSON.stringify(event.snapshot), options) : 0);
						return;
					}

					// Execute SUCCESS [callback]
					(_successCallback ?	_successCallback(event.snapshot, JSON.stringify(event.snapshot), options) :	0);
				};

				// Initialize the [firebase] and listen for ONE return
				if (! _.isString(model.config.firebase.live) || model.config.firebase.live == 'collection')
				{
					this.Firebase.new(model.config.firebase.path + '/' + model.get(model.idAttribute)).once('value', _callback);
				}

				// Initialize the [firebase] and leave the door open
				else
				{
					// Ensure the [listener] is not already set
					if (model.config.firebase.listeners.model === false)
					{
						model.config.firebase.listeners.model = this.Firebase.new(model.config.firebase.path + '/' + model.get(model.idAttribute));
						model.config.firebase.listeners.model.on('value', _callback);
					}
				}
			}

			// Collection
			else
			{
				// Create the local [callback]
				var _callback = function (event)
				{
					// ERROR Condition
					// TODO: Needs defined!
					if (1 == 2)
					{
						// Execute ERROR [callback]					
						(_errorCallback ? _errorCallback([],JSON.stringify([]),options) : 0);
						return;
					}

					// Initialize the [dictionary] of SNAPSHOTS
					var dictionary = [];

					// SUCCESS Condition
					if (event.snapshot.childrenCount)
					{
						// Populate the [dictionary]
						_.each(_.keys(event.snapshot.value), function (child)
						{
							// Add each [child] SNAPSHOT to the [dictionary]
							dictionary.push(event.snapshot.value[child]);
						});
					}

					// Execute SUCCESS [callback]
					(_successCallback ?	_successCallback(dictionary, JSON.stringify(dictionary), options) : 0);

					// Garbage Collection
					dictionary = null;
				};

				// Initialize the [firebase] and listen for return
				if (! _.isString(model.config.firebase.live) || model.config.firebase.live == 'model')
				{
					this.Firebase.new(model.config.firebase.path).once('value', _callback);
				}

				// Initialize the [firebase] and leave the door open
				else
				{
					// Ensure the [listener] is not already set
					if (model.config.firebase.listeners.collection === false)
					{
						model.config.firebase.listeners.collection = this.Firebase.new(model.config.firebase.path);
						model.config.firebase.listeners.collection.on('value', _callback);
					}
				}
			}
			break;

		/*
		 * Add new data to [firebase]
		 * - Initiated from Model.save() and Collection.create() when empty(model.idAttribute)
		 */
		case 'create':
console.log('Creating... untested.');
return;
			// Filter: Set the [payload] omitting the [model.config.blacklist]
			if (_.isArray(model.config.firebase.blacklist))
			{_payload = _.omit(model.toJSON(), model.config.firebase.blacklist);}

			// Simple: Set the [payload] from the [model]
			else
			{_payload = model.toJSON();}

			// Allow [firebase] to generate a unique [model.idAttribute] value
			new FirebaseAPI(model.config.firebase.path, model.config.module)
			.push(_payload, function (event)
			{			
				// Extract the new [id] from [firebase] response 
				var id = _.keys(event.snapshot)[0];

				// Add the new [id] to the [snapshot]
				event.snapshot[id][model.idAttribute] = id;

				// Execute the [callback]
				(_successCallback ?	_successCallback(
					event.snapshot[id],
					JSON.stringify(event.snapshot[id]),
					options
				) :	0);

				// Garbage Collection
				id = null;
			});
			break;

		/*
		 * Update existing [payload] in [firebase]
		 * - Initiated from Model.save() and Collection.create() when !empty(model.idAttribute)
		 */
		case 'update':

			// The [model.idAttribute] is required
			if (! _.isString(model.get(model.idAttribute))) {break;}

			// Filter: Set the [payload] from [model.changed] omitting the [model.config.blacklist]
			if (_.isArray(model.config.firebase.blacklist))
			{_payload = _.omit(model.changed, model.config.firebase.blacklist);}

			// Simple: Set the [payload] from the [model.changed]
			else
			{_payload = model.changed;}

			// No sense in updating unless something is changed
			if (_.isEmpty(_payload)) {break;}

			// Send the [payload] and listen for ONE return (! LIVE or ! LISTENING)
			if (! _.isString(model.config.firebase.live) || (! model.config.firebase.listeners.collection && ! model.config.firebase.listeners.model))
			{
				this.Firebase.new(model.config.firebase.path + '/' + model.get(model.idAttribute))
				.update(_payload, null, null, function (event)
				{
					// ERROR Condition
					// TODO: Needs defined!!
					if (1 == 2)
					{
						// Execute ERROR [callback]					
						(_errorCallback ? _errorCallback(event.snapshot, JSON.stringify(event.snapshot), options) : 0);
						return;
					}
	
					// Execute the [callback]
					(_successCallback ?	_successCallback(event.snapshot, JSON.stringify(event.snapshot), options) : 0);
				});
			}

			// Only send the [payload] because Model is LIVE and listening for updates on another channel
			else
			{
				this.Firebase.new(model.config.firebase.path + '/' + model.get(model.idAttribute)).update(_payload);
			}

			break;

		/*
		 * Remove [payload] from [firebase]
		 * - Initiated from Model.destroy()
		 */
		case 'delete':
console.log('Backbone: deleting (NOT CONFIGURED)');

/*
			// The [payload].[model.idAttribute] is required
			if (_.isString(_payload[model.idAttribute]))
			{
				// Initialize the [child]
				var _child = _firebase.child(_payload[model.idAttribute]);

				// Remove the [child] from [firebase]
				_child.remove(_cb);
			}
*/
			break;

	}

	return true;
};

/*
 * Firebase Snapshot Converter
 */
function FirebaseSnapshot (snapshot)
{
	if (! _.isObject(snapshot)) {return false;}

	// No [children] && No [priority]
	if (! snapshot.childrenCount)
	{return {'data':snapshot.value, 'priority':(! _.isNull(snapshot.priority) ? snapshot.priority : null)};}

	// Initialize the [dictionary]
	var dictionary = {
		'data' : {},
		'priority' : {}
	};

	// Recursively evaluate the [value] as a key:value tree
	_.each(_.keys(snapshot.value), function (key)
	{
		var payload = FirebaseSnapshot(snapshot.value[key]);

		dictionary.data[key] = payload.data;
		dictionary.priority[key] = payload.priority;
	});

	// Set the [priority] (if applicable)
	if (_.isEmpty(dictionary.priority) && ! _.isNull(snapshot.priority))
	{dictionary.priority[snapshot.name] = snapshot.priority;}

	return dictionary;
}

/*
 * Public API Endpoint for Backbone Sync Adapter
 * 
 * 	Extend the MODEL
 */
exports.setupModel = function (Model, type)
{
	_.extend(Model.prototype,
	{
		'firebase' : {
			'priority' : {}
		},

		'initialize' : function ()
		{
			// Initialize [listeners] for LIVE Models
			if (_.isString(this.config.firebase.live) && this.config.firebase.live != 'collection')
			{
				this.config.firebase.listeners = {
					'model' : false
				};
			}
		},

		'parse' : function (snapshot)
		{
			// Parse the [snapshot]
			if (snapshot.childrenCount)
			{var dictionary = FirebaseSnapshot(snapshot);}

			// Initialize empty [dictionary]
			else {var dictionary = {data : {}, priority : {}};}

			// Inject [id] into the [data]
			dictionary.data[this.idAttribute] = snapshot.name;

			// Inject the ROOT [priority]
			dictionary.priority['this'] = snapshot.priority;

			// Store the [priority]
			this.firebase.priority[snapshot.name] = dictionary.priority;

			// Return the [data]
			return dictionary.data;
		},

		'$priority' : function (key, value)
		{
			// Safety Net
			if (_.isEmpty(this.firebase.priority)) {return null;}

			// Simple Top-Level Request
			if (! _.isString(key)) {return this.firebase.priority[this.get(this.idAttribute)]['this'];}

			// Getting [priority]
			if (! _.isNumber(value))
			{
				// Set the initial [priority]
				var _priority = this.firebase.priority[this.get(this.idAttribute)];

				// Walk through the [key]
				_.each(key.split('.'), function (x)
				{_priority = (! _.isUndefined(_priority[x]) ? _priority[x] : _priority);});

				// Send the [priority] back
				return (! _.isObject(_priority) ? _priority : null);
			}

			// Setting [priority]
			else
			{
				
			}
		},

		'$getByPriority' : function (key)
		{
			// Safety Net
			if (! _.isString(key)) {return false;}
			if (! _.isObject(this.firebase) || ! _.isObject(this.firebase.priority)) {return false;}

			// Set the initial [value]
			var _value = this.toJSON();
			if (_.isEmpty(_value)) {return null;}

			// Walk through the [key]
			_.each(key.split('.'), function (x)
			{_value = (! _.isUndefined(_value[x]) ? _value[x] : _value);});

			// Simple
			if (! _.isObject(_value)) {return _value;}

			// Initialize the [index]
			var _this = this;
			var _index = _.sortBy(_.keys(_value), function (_key)
			{
				return _this.$priority(key + '.' + _key);
			});
			_this = null;

			// Rebuild the [value] using [index]
			var _rebuild = [];
			_.each(_index, function (_key)
			{
				// Define the [key]:[value] Object
				var _x = {};
				_x[_key] = _value[_key];

				// Add to the [rebuild]
				_rebuild.push(_x);
			});

			// Return [value]
			return _rebuild;
		},

		'$get' : function (id)
		{
			// Initialize the Q
			var _deferred = Q.defer();

			try
			{
				// Safety Net
				if (! _.isString(id)) {throw new Error('No ID Provided');}

				// Create a blank slate
				if (_.keys(this.attributes).length) {this.$clear();}

				// Set the [id] 
				this.set(this.idAttribute, id);

				// Go Get the [Model]
				this.fetch({
					success: function (model)
					{
						_deferred.resolve(model);
					},
					error: function ()
					{
						_deferred.reject(new Error('Unable to Fetch Model'));
					}
				});
			}
			catch (ex)
			{
				_deferred.reject(new Error('$get: ' + (ex.message || 'Unspecified Exception')));
				return;
			}
			finally {return _deferred.promise;}
		},

		'$clear' : function ()
		{
			// Safety Net
			if (_.isString(this.config.firebase.live)
				&& this.config.firebase.live != 'collection'
				&& _.isObject(this.config.firebase.listeners.model))
			{
				// Kill the [listener]
				this.config.firebase.listeners.model.off();

				// Clear the slate
				this.config.firebase.listeners.model = false;
			}

			// Clear the [Model]
			this.clear();
		}
	});

	return Model;
};

/*
 * Public API Endpoint for Backbone Sync Adapter
 * 
 * 	Extend the COLLECTION
 */
exports.setupCollection = function (Collection)
{
	_.extend(Collection.prototype,
	{
		'comparator' : function (Model)
		{return Model.$priority();},

		'initialize' : function ()
		{
			// Initialize [listeners] for LIVE Collections
			if (_.isString(this.config.firebase.live) && this.config.firebase.live != 'model')
			{
				this.config.firebase.listeners = {
					'collection' : false
				};

				// Open the Pipe
				this.fetch();
			}
		},

		'$clear' : function ()
		{
			// Safety Net
			if (! _.isString(this.config.firebase.live) || this.config.firebase.live == 'model')
			{return false;}

			// Close the Pipe
			this.$stop();

			// Clear the Collection
			this.reset();
		},

		'$stop' : function ()
		{
			// Safety Net
			if (! _.isString(this.config.firebase.live) || this.config.firebase.live == 'model')
			{return false;}

			// Verify a [listener] is set
			if (! this.config.firebase.listeners.collection) {return false;}

			// Kill the [listener](s)
			this.config.firebase.listeners.collection.off();

			// Clear the slate
			this.config.firebase.listeners.collection = false;
		},

		'$play' : function ()
		{
			// Safety Net
			if (! _.isString(this.config.firebase.live) || this.config.firebase.live == 'model')
			{return false;}

			// Verify a [listener] is not already set
			if (this.config.firebase.listeners.collection) {return false;}

			// Open the Pipe
			this.fetch();
		}
	});

	return Collection;
};