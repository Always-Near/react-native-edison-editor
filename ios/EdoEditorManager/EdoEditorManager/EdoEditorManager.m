//
//  EdoEditorManager.m
//  EdoEditorManager
//
//  Created by Near on 1/5/21.
//  Copyright © 2021 Near. All rights reserved.
//

#import "EdoEditorManager.h"
#import <MapKit/MapKit.h>

@implementation EdoEditorManager

RCT_EXPORT_MODULE(EdoEditor)

- (UIView *)view
{
  return [[MKMapView alloc] init];
}

@end
