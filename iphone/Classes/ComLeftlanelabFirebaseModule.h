/**
 * Firebase iOS Module
 *
 * Created by Left Lane Lab
 * Copyright (c) 2014 Your Company. All rights reserved.
 */

#import "TiModule.h"

@interface ComLeftlanelabFirebaseModule : TiModule {}

@property (nonatomic, strong) NSString * url;
@property (nonatomic, strong) NSMutableDictionary * gInstances;
@property (nonatomic, strong) NSMutableDictionary * gQuery;
@property (nonatomic, strong) NSArray * gEventTypes;
@property (nonatomic, strong) NSMutableDictionary * gListeners;

@end
