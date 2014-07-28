/**
 * Your Copyright Here
 *
 * Appcelerator Titanium is Copyright (c) 2009-2010 by Appcelerator, Inc.
 * and licensed under the Apache Public License (version 2)
 */
#import "TiModule.h"
#import <Firebase/Firebase.h>

@interface ComLeftlanelabFirebaseModule : TiModule {}

@property (nonatomic, strong) NSString * url;
@property (nonatomic, strong) NSMutableDictionary * gInstances;
@property (nonatomic, strong) NSMutableDictionary * gQuery;
@property (nonatomic, strong) NSArray * gEventTypes;
@property (nonatomic, strong) NSMutableDictionary * gListeners;

@end
