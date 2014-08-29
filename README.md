# Firebase iOS Module for Titanium #

Native iOS Module for using Firebase with Titanium apps.

## Compatibility ##

Module has been tested with the following versions of the Titanium SDK:

- Titanium 3.2.1
- Titanium 3.3.0

## Installation ##

- Download the latest build from the [releases page](https://github.com/LeftLaneLab/firebase-titanium/releases).
- Use [these instructions](http://docs.appcelerator.com/titanium/3.0/#!/guide/Using_a_Module) from Appcelerator to install the module file.

## Documentation ##

This module is constructed to mimic the official [Firebase JavaScript Library](https://www.firebase.com/docs/javascript/firebase/index.html). All functions available with the official library are also available on this module. All methods take the same arguments and return the same values where applicable.

**The only difference is the syntax for creating a new Firebase reference.**

```JavaScript
var Firebase = require('com.leftlanelab.firebase');

// WRONG: Official Firebase JavaScript library method
var firebaseReference = new Firebase('https://l3-appcelerator-demo.firebaseio.com/users');

// CORRECT: Method to use with this module
var firebaseReference = Firebase.new('https://l3-appcelerator-demo.firebaseio.com/users');

// CORRECT: ... when com.leftlanelab.firebase.forge is set in tiapp.xml
var firebaseReference = Firebase.new('/users');
```

## Tutorials ##

Traverse a Firebase location, and write some data.

```JavaScript
var Firebase = require('com.leftlanelab.firebase');

var sampleChatRef = Firebase.new('https://l3-appcelerator-demo.firebaseio.com');
var fredNameRef = sampleChatRef.child('users/fred/name');
fredNameRef.set({first: 'Fred', last: 'Flintstone'});
```

Now read the data back (and get notified whenever it changes).

```JavaScript
fredNameRef.on('value', function (nameSnapshot) {
  var y = nameSnapshot.val();
  // y now contains the object { first: 'Fred', last: 'Flintstone' }.
});
```

Let's add a new chat message child to the message_list location.

```JavaScript
var messageListRef = sampleChatRef.child('message_list');
messageListRef.push({'user_id': 'fred', 'text': 'Yabba Dabba Doo!'});
```

And let's listen for new children added to the message_list location. We'll be notified of our 'Yabba Dabba Doo!' message as well as any other messages that were added in the past, and any new messages that get added in the future.

```JavaScript
messageListRef.on('child_added', function(newMessageSnapshot) {
  var userId = newMessageSnapshot.child('user_id').val();
  var text = newMessageSnapshot.child('text').val();
  // Do something with user_id and text.
});
```

## Global Properties (tiapp.xml) ##

Global configuration options can be defined in the `tiapp.xml` file.

_NOTE: These are optional_

#### Properties ####

* **forge** : base value for new Firebase references. This value can always be overridden by specifying an absolute URL when calling `Firebase.new( )`.
* **persistence** : Enables the Firebase iOS Disk Persistence feature (default: `false`)

#### Usage ####

```XML
<?xml version="1.0" encoding="UTF-8"?>
<ti:app xmlns:ti="http://ti.appcelerator.org">
  ...
  <property name="com.leftlanelab.firebase.forge" type="string">https://l3-appcelerator-demo.firebaseio.com/</property>
  <property name="com.leftlanelab.firebase.persistence" type="bool">true</property>
  ...
</ti:app>
```
