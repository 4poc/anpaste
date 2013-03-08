SyntaxHighlighter.brushes.Lsl = function()
{
	var keywords = 'do else for if jump return state while';
	
	var types = 'float integer key list rotation string vector';

	var events = 'at_rot_target at_target attach changed collision collision_end collision_start control dataserver ' +
		'email land_collision land_collision_end land_collision_start link_message listen money ' +
		'moving_end moving_start no_sensor not_at_rot_target not_at_target object_rez on_rez ' +
		'remote_data run_time_permissions sensor state_entry state_exit timer touch touch_end touch_start';
        
	var constants = 'ACTIVE AGENT AGENT_ALWAYS_RUN AGENT_ATTACHMENTS AGENT_AWAY AGENT_BUSY AGENT_CROUCHING ' +
		'AGENT_FLYING AGENT_IN_AIR AGENT_MOUSELOOK AGENT_ON_OBJECT AGENT_SCRIPTED AGENT_SITTING ' +
		'AGENT_TYPING AGENT_WALKING ALL_SIDES ANIM_ON ATTACH_BACK ATTACH_BELLY ATTACH_CHEST ' +
		'ATTACH_CHIN ATTACH_HEAD ATTACH_LEAR ATTACH_LEYE ATTACH_LFOOT ATTACH_LHAND ATTACH_LHIP ' +
		'ATTACH_LLARM ATTACH_LLLEG ATTACH_LPEC ATTACH_LSHOULDER ATTACH_LUARM ATTACH_LULEG ' +
		'ATTACH_MOUTH ATTACH_NOSE ATTACH_PELVIS ATTACH_REAR ATTACH_REYE ATTACH_RFOOT ATTACH_RHAND ' +
		'ATTACH_RHIP ATTACH_RLARM ATTACH_RLLEG ATTACH_RPEC ATTACH_RSHOULDER ATTACH_RUARM ATTACH_RULEG ' +
		'CHANGED_ALLOWED_DROP CHANGED_COLOR CHANGED_INVENTORY CHANGED_LINK CHANGED_SCALE ' +
		'CHANGED_SHAPE CHANGED_TEXTURE CONTROL_BACK CONTROL_DOWN CONTROL_FWD CONTROL_LBUTTON ' +
		'CONTROL_LEFT CONTROL_ML_LBUTTON CONTROL_RIGHT CONTROL_ROT_LEFT CONTROL_ROT_RIGHT CONTROL_UP ' +
		'DATA_BORN DATA_NAME DATA_ONLINE DATA_RATING DATA_SIM_POS DATA_SIM_STATUS DEG_TO_RAD EOF ' +
		'FALSE INVENTORY_ALL INVENTORY_ANIMATION INVENTORY_BODYPART INVENTORY_CLOTHING ' +
		'INVENTORY_GESTURE INVENTORY_LANDMARK INVENTORY_NOTECARD INVENTORY_OBJECT INVENTORY_SCRIPT ' +
		'INVENTORY_SOUND INVENTORY_TEXTURE LAND_LARGE_BRUSH LAND_LEVEL LAND_LOWER LAND_MEDIUM_BRUSH ' +
		'LAND_NOISE LAND_RAISE LAND_REVERT LAND_SMALL_BRUSH LAND_SMOOTH LINK_ALL_CHILDREN ' +
		'LINK_ALL_OTHERS LINK_ROOT LINK_SET LINK_THIS LOOP MASK_BASE MASK_EVERYONE MASK_GROUP ' +
		'MASK_NEXT MASK_OWNER NULL_KEY PARCEL_MEDIA_COMMAND_AGENT PARCEL_MEDIA_COMMAND_AUTO_ALIGN ' +
		'PARCEL_MEDIA_COMMAND_LOOP PARCEL_MEDIA_COMMAND_PAUSE PARCEL_MEDIA_COMMAND_PLAY ' +
		'PARCEL_MEDIA_COMMAND_STOP PARCEL_MEDIA_COMMAND_TEXTURE PARCEL_MEDIA_COMMAND_TIME ' +
		'PARCEL_MEDIA_COMMAND_UNLOAD PARCEL_MEDIA_COMMAND_URL PASSIVE PERM_ALL PERM_COPY PERM_MODIFY ' +
		'PERM_MOVE PERM_TRANSFER PERMISSION_ATTACH PERMISSION_CHANGE_LINKS PERMISSION_DEBIT ' +
		'PERMISSION_TAKE_CONTROLS PERMISSION_TRIGGER_ANIMATION PI PI_BY_TWO PING_PONG ' +
		'PRIM_BUMP_BARK PRIM_BUMP_BLOBS PRIM_BUMP_BRICKS PRIM_BUMP_BRIGHT PRIM_BUMP_CHECKER ' +
		'PRIM_BUMP_CONCRETE PRIM_BUMP_DARK PRIM_BUMP_DISKS PRIM_BUMP_GRAVEL PRIM_BUMP_LARGETILE ' +
		'PRIM_BUMP_NONE PRIM_BUMP_SHINY PRIM_BUMP_SIDING PRIM_BUMP_STONE PRIM_BUMP_STUCCO ' +
		'PRIM_BUMP_SUCTION PRIM_BUMP_TILE PRIM_BUMP_WEAVE PRIM_BUMP_WOOD PRIM_COLOR PRIM_HOLE_CIRCLE ' +
		'PRIM_HOLE_DEFAULT PRIM_HOLE_SQUARE PRIM_HOLE_TRIANGLE PRIM_MATERIAL PRIM_MATERIAL_FLESH ' +
		'PRIM_MATERIAL_GLASS PRIM_MATERIAL_LIGHT PRIM_MATERIAL_METAL PRIM_MATERIAL_PLASTIC ' +
		'PRIM_MATERIAL_RUBBER PRIM_MATERIAL_STONE PRIM_MATERIAL_WOOD PRIM_PHANTOM PRIM_PHYSICS ' +
		'PRIM_POSITION PRIM_ROTATION PRIM_SHINY_HIGH PRIM_SHINY_LOW PRIM_SHINY_MEDIUM PRIM_SHINY_NONE ' +
		'PRIM_SIZE PRIM_TEMP_ON_REZ PRIM_TEXTURE PRIM_TYPE PRIM_TYPE_BOX PRIM_TYPE_CYLINDER ' +
		'PRIM_TYPE_PRISM PRIM_TYPE_RING PRIM_TYPE_SPHERE PRIM_TYPE_TORUS PRIM_TYPE_TUBE ' +
		'PSYS_PART_BOUNCE_MASK PSYS_PART_EMISSIVE_MASK PSYS_PART_END_ALPHA PSYS_PART_END_COLOR ' +
		'PSYS_PART_END_SCALE PSYS_PART_FLAGS PSYS_PART_FOLLOW_SRC_MASK PSYS_PART_FOLLOW_VELOCITY_MASK ' +
		'PSYS_PART_INTERP_COLOR_MASK PSYS_PART_INTERP_SCALE_MASK PSYS_PART_MAX_AGE ' +
		'PSYS_PART_START_ALPHA PSYS_PART_START_COLOR PSYS_PART_START_SCALE ' +
		'PSYS_PART_TARGET_LINEAR_MASK PSYS_PART_TARGET_POS_MASK PSYS_PART_WIND_MASK ' +
		'PSYS_SRC_ACCEL PSYS_SRC_ANGLE_BEGIN PSYS_SRC_ANGLE_END PSYS_SRC_BURST_PART_COUNT ' +
		'PSYS_SRC_BURST_RADIUS PSYS_SRC_BURST_RATE PSYS_SRC_BURST_SPEED_MAX PSYS_SRC_BURST_SPEED_MIN ' +
		'PSYS_SRC_INNERANGLE PSYS_SRC_MAX_AGE PSYS_SRC_OMEGA PSYS_SRC_OUTERANGLE PSYS_SRC_PATTERN ' +
		'PSYS_SRC_PATTERN_ANGLE PSYS_SRC_PATTERN_ANGLE_CONE PSYS_SRC_PATTERN_ANGLE_CONE_EMPTY ' +
		'PSYS_SRC_PATTERN_DROP PSYS_SRC_PATTERN_EXPLODE PSYS_SRC_TARGET_KEY PSYS_SRC_TEXTURE ' +
		'RAD_TO_DEG REMOTE_DATA_CHANNEL REMOTE_DATA_REPLY REMOTE_DATA_REQUEST REVERSE ROTATE ' +
		'SCALE SCRIPTED SMOOTH SQRT2 STATUS_BLOCK_GRAB STATUS_DIE_AT_EDGE STATUS_PHANTOM ' +
		'STATUS_PHYSICS STATUS_RETURN_AT_EDGE STATUS_ROTATE_X STATUS_ROTATE_Y STATUS_ROTATE_Z ' +
		'STATUS_SANDBOX TRUE TWO_PI TYPE_FLOAT TYPE_INTEGER TYPE_INVALID TYPE_KEY TYPE_ROTATION ' +
		'TYPE_STRING TYPE_VECTOR VEHICLE_ANGULAR_DEFLECTION_EFFICIENCY ' +
		'VEHICLE_ANGULAR_DEFLECTION_TIMESCALE VEHICLE_ANGULAR_FRICTION_TIMESCALE ' +
		'VEHICLE_ANGULAR_MOTOR_DECAY_TIMESCALE VEHICLE_ANGULAR_MOTOR_DIRECTION ' +
		'VEHICLE_ANGULAR_MOTOR_TIMESCALE VEHICLE_BANKING_EFFICIENCY VEHICLE_BANKING_MIX ' +
		'VEHICLE_BANKING_TIMESCALE VEHICLE_BUOYANCY VEHICLE_FLAG_CAMERA_DECOUPLED ' +
		'VEHICLE_FLAG_HOVER_GLOBAL_HEIGHT VEHICLE_FLAG_HOVER_TERRAIN_ONLY ' +
		'VEHICLE_FLAG_HOVER_UP_ONLY VEHICLE_FLAG_HOVER_WATER_ONLY VEHICLE_FLAG_LIMIT_MOTOR_UP ' +
		'VEHICLE_FLAG_LIMIT_ROLL_ONLY VEHICLE_FLAG_MOUSELOOK_BANK VEHICLE_FLAG_MOUSELOOK_STEER ' +
		'VEHICLE_FLAG_NO_DEFLECTION_UP VEHICLE_HOVER_EFFICIENCY VEHICLE_HOVER_HEIGHT ' +
		'VEHICLE_HOVER_TIMESCALE VEHICLE_LINEAR_DEFLECTION_EFFICIENCY ' +
		'VEHICLE_LINEAR_DEFLECTION_TIMESCALE VEHICLE_LINEAR_FRICTION_TIMESCALE ' +
		'VEHICLE_LINEAR_MOTOR_DECAY_TIMESCALE VEHICLE_LINEAR_MOTOR_DIRECTION ' +
		'VEHICLE_LINEAR_MOTOR_OFFSET VEHICLE_LINEAR_MOTOR_TIMESCALE VEHICLE_REFERENCE_FRAME ' +
		'VEHICLE_TYPE_AIRPLANE VEHICLE_TYPE_BALLOON VEHICLE_TYPE_BOAT VEHICLE_TYPE_CAR ' +
		'VEHICLE_TYPE_NONE VEHICLE_TYPE_SLED VEHICLE_VERTICAL_ATTRACTION_EFFICIENCY ' +
		'VEHICLE_VERTICAL_ATTRACTION_TIMESCALE ZERO_ROTATION ZERO_VECTOR';

	var functions = 'llAbs llAcos llAddToLandBanList llAddToLandPassList llAdjustSoundVolume llAllowInventoryDrop ' +
		'llAngleBetween llApplyImpulse llApplyRotationalImpulse llAsin llAtan2 llAttachToAvatar llAvatarOnSitTarget ' +
		'llAxes2Rot llAxisAngle2Rot llBase64ToInteger llBase64ToString llBreakAllLinks llBreakLink llCeil ' +
		'llClearCameraParams llCloseRemoteDataChannel llCloud llCollisionFilter llCollisionSound ' +
		'llCollisionSprite llCos llCreateLink llCSV2List llDeleteSubList llDeleteSubString llDetachFromAvatar ' +
		'llDetectedGrab llDetectedGroup llDetectedKey llDetectedLinkNumber llDetectedName llDetectedOwner ' +
		'llDetectedPos llDetectedRot llDetectedType llDetectedVel llDialog llDie llDumpList2String llEdgeOfWorld ' +
		'llEjectFromLand llEmail llEscapeURL llEuler2Rot llFabs llFloor llForceMouselook llFrand llGetAccel ' +
		'llGetAgentInfo llGetAgentSize llGetAlpha llGetAndResetTime llGetAnimation llGetAnimationList ' +
		'llGetAttached llGetBoundingBox llGetCameraPos llGetCameraRot llGetCenterOfMass llGetCreator llGetColor ' +
		'llGetDate llGetEnergy llGetForce llGetFreeMemory llGetGeometricCenter llGetGMTclock llGetInventoryCreator ' +
		'llGetInventoryKey llGetInventoryName llGetInventoryNumber llGetInventoryPermMask llGetInventoryType ' +
		'llGetKey llGetLandOwnerAt llGetLinkKey llGetLinkName llGetLinkNumber llGetListEntryType llGetListLength ' +
		'llGetLocalPos llGetLocalRot llGetMass llGetNextEmail llGetNotecardLine llGetNumberOfNotecardLines ' +
		'llGetNumberOfPrims llGetNumberOfSides llGetObjectDetails llGetObjectDesc llGetObjectMass llGetObjectName ' +
		'llGetObjectPermMask llGetObjectPrimCount llGetOmega llGetOwner llGetOwnerKey llGetParcelDetails ' +
		'llGetParcelFlags llGetParcelMaxPrims llGetParcelPrimCount llGetParcelPrimOwners llGetPermissions ' +
		'llGetPermissionsKey llGetPos llGetPrimitiveParams llGetRegionCorner llGetRegionFlags llGetRegionFPS ' +
		'llGetRegionName llGetRegionTimeDilation llGetRootPosition llGetRootRotation llGetRot llGetScale ' +
		'llGetScriptName llGetScriptState llGetSimulatorHostname llGetStartParameter llGetStatus ' +
		'llGetSubString llGetSunDirection llGetTexture llGetTextureOffset llGetTextureRot llGetTextureScale ' +
		'llGetTime llGetTimeOfDay llGetTimestamp llGetTorque llGetUnixTime llGetVel llGetWallclock llGiveInventory ' +
		'llGiveInventoryList llGiveMoney llGodLikeRezObject llGround llGroundContour llGroundNormal llGroundRepel ' +
		'llGroundSlope llHTTPRequest llInsertString llInstantMessage llIntegerToBase64 llKey2Name llList2CSV ' +
		'llList2Float llList2Integer llList2Key llList2List llList2ListStrided llList2Rot llList2String ' +
		'llList2Vector llListFindList llListInsertList llListRandomize llListReplaceList llListSort ' +
		'llListStatistics llListen llListenControl llListenRemove llLoadURL llLog llLog10 llLookAt llLoopSound ' +
		'llLoopSoundMaster llLoopSoundSlave llMakeExplosion llMakeFire llMakeFountain llMakeSmoke ' +
		'llMapDestination llMD5String llMessageLinked llMinEventDelay llModifyLand llModPow llMoveToTarget ' +
		'llOffsetTexture llOpenRemoteDataChannel llOverMyLand llOwnerSay llParcelMediaCommandList ' +
		'llParcelMediaQuery llParseString2List llParseStringKeepNulls llParticleSystem llPassCollisions ' +
		'llPassTouches llPlaySound llPlaySoundSlave llPointAt llPow llPreloadSound llPushObject ' +
		'llRefreshPrimURL llRegionSay llReleaseCamera llReleaseControls llRemoteDataReply llRemoteDataSetRegion ' +
		'llRemoteLoadScript llRemoteLoadScriptPin llRemoveFromLandBanList llRemoveFromLandPassList ' +
		'llRemoveInventory llRemoveVehicleFlags llRequestAgentData llRequestInventoryData llRequestPermissions ' +
		'llRequestSimulatorData llResetOtherScript llResetScript llResetTime llRezAtRoot llRezObject llRot2Angle ' +
		'llRot2Axis llRot2Euler llRot2Fwd llRot2Left llRot2Up llRotBetween llRotLookAt llRotTarget ' +
		'llRotTargetRemove llRotateTexture llRound llSameGroup llSay llScaleTexture llScriptDanger ' +
		'llSendRemoteData llSensor llSensorRemove llSensorRepeat llSetAlpha llSetBuoyancy llSetCameraAtOffset ' +
		'llSetCameraEyeOffset llSetCameraParams llSetColor llSetDamage llSetForce llSetForceAndTorque ' +
		'llSetHoverHeight llSetLinkAlpha llSetLinkColor llSetLinkPrimitiveParams llSetLinkTexture llSetLocalRot ' +
		'llSetObjectDesc llSetObjectName llSetParcelMusicURL llSetPayPrice llSetPos llSetPrimURL ' +
		'llSetPrimitiveParams llSetRemoteScriptAccessPin llSetRot llSetScale llSetScriptState llSetSitText ' +
		'llSetSoundQueueing llSetSoundRadius llSetStatus llSetText llSetTexture llSetTextureAnim ' +
		'llSetTimerEvent llSetTorque llSetTouchText llSetVehicleFlags llSetVehicleFloatParam ' +
		'llSetVehicleRotationParam llSetVehicleType llSetVehicleVectorParam llShout llSin llSitTarget ' +
		'llSleep llSound llSoundPreload llSqrt llStartAnimation llStopAnimation llStopHover llStopLookAt ' +
		'llStopMoveToTarget llStopPointAt llStopSound llStringLength llStringToBase64 llStringTrim ' +
		'llSubStringIndex llTakeCamera llTakeControls llTan llTarget llTargetOmega llTargetRemove ' +
		'llTeleportAgentHome llToLower llToUpper llTriggerSound llTriggerSoundLimited llUnescapeURL llUnSit ' +
		'llVecDist llVecMag llVecNorm llVolumeDetect llWater llWhisper llWind llXorBase64StringsCorrect llXorBase64Strings';

	this.regexList = [
		{ regex: SyntaxHighlighter.regexLib.singleLineCComments,		css: 'comments' },
		{ regex: SyntaxHighlighter.regexLib.multiLineCComments,			css: 'comments' },
		{ regex: SyntaxHighlighter.regexLib.multiLineDoubleQuotedString,css: 'string' },
		{ regex: new RegExp(this.getKeywords(constants), 'gm'),	css: 'constants' },
		{ regex: new RegExp(this.getKeywords(functions), 'gm'),	css: 'functions' },
		{ regex: new RegExp(this.getKeywords(keywords), 'gm'),	css: 'keyword' },
		{ regex: new RegExp(this.getKeywords(types), 'gm'),		css: 'color1' },
		{ regex: new RegExp(this.getKeywords(events), 'gm'),	css: 'color2' }
		];
};

SyntaxHighlighter.brushes.Lsl.prototype	= new SyntaxHighlighter.Highlighter();
SyntaxHighlighter.brushes.Lsl.aliases	= ['lsl'];
