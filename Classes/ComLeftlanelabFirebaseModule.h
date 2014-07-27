/**
 * Your Copyright Here
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
 */
#import "TiModule.h"
#import <Firebase/Firebase.h>

@interface ComLeftlanelabFirebaseModule : TiModule {}

@property (nonatomic, retain) NSString * url;
@property (nonatomic, retain) NSMutableDictionary * gInstances;
@property (nonatomic, retain) NSMutableDictionary * gQuery;
@property (nonatomic, retain) NSArray * gEventTypes;
@property (nonatomic, retain) NSMutableDictionary * gListeners;
@property (nonatomic, retain) NSMutableDictionary * gQueryListeners;

@end
