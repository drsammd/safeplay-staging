
# Venue Demo Features

## Overview

mySafePlay™(TM)'s venue demo features provide a comprehensive simulation environment for showcasing venue management capabilities, real-time monitoring, and safety features without requiring actual camera hardware or live operations.

## Table of Contents

1. [Demo Venue Setup](#demo-venue-setup)
2. [Real-time Activity Simulation](#real-time-activity-simulation)
3. [Demo Alert System](#demo-alert-system)
4. [Interactive Dashboards](#interactive-dashboards)
5. [Stakeholder Demonstrations](#stakeholder-demonstrations)
6. [Configuration Management](#configuration-management)

## Demo Venue Setup

### Venue Configuration

```typescript
// lib/demo/venue-setup.ts
export class DemoVenueSetup {
  async createDemoVenue(venueType: VenueType): Promise<DemoVenue> {
    const venueConfig = this.getVenueTemplate(venueType);
    
    const venue = await this.venueRepository.create({
      name: venueConfig.name,
      type: venueType,
      address: venueConfig.address,
      capacity: venueConfig.capacity,
      isDemo: true,
      demoConfig: {
        simulationEnabled: true,
        activityLevel: 'MEDIUM',
        alertFrequency: 'NORMAL',
        scenarios: venueConfig.scenarios
      }
    });
    
    // Create demo zones
    const zones = await this.createDemoZones(venue.id, venueConfig.zones);
    
    // Create demo cameras
    const cameras = await this.createDemoCameras(venue.id, zones, venueConfig.cameras);
    
    // Create demo children and staff
    const children = await this.createDemoChildren(venue.id, venueConfig.childCount);
    const staff = await this.createDemoStaff(venue.id, venueConfig.staffCount);
    
    // Initialize activity simulation
    await this.initializeActivitySimulation(venue.id, children, staff);
    
    return {
      venue,
      zones,
      cameras,
      children,
      staff
    };
  }
  
  private getVenueTemplate(venueType: VenueType): VenueTemplate {
    const templates = {
      DAYCARE: {
        name: 'Sunshine Daycare Center',
        address: '123 Demo Street, Demo City, DC 12345',
        capacity: 50,
        childCount: 35,
        staffCount: 8,
        zones: [
          { name: 'Infant Room', type: 'INDOOR', capacity: 8, ageGroup: 'INFANT' },
          { name: 'Toddler Room', type: 'INDOOR', capacity: 12, ageGroup: 'TODDLER' },
          { name: 'Preschool Room', type: 'INDOOR', capacity: 15, ageGroup: 'PRESCHOOL' },
          { name: 'Playground', type: 'OUTDOOR', capacity: 25, ageGroup: 'ALL' },
          { name: 'Cafeteria', type: 'INDOOR', capacity: 30, ageGroup: 'ALL' },
          { name: 'Nap Room', type: 'INDOOR', capacity: 20, ageGroup: 'TODDLER_PRESCHOOL' }
        ],
        cameras: [
          { zone: 'Infant Room', count: 2, type: 'INDOOR' },
          { zone: 'Toddler Room', count: 3, type: 'INDOOR' },
          { zone: 'Preschool Room', count: 3, type: 'INDOOR' },
          { zone: 'Playground', count: 4, type: 'OUTDOOR' },
          { zone: 'Cafeteria', count: 2, type: 'INDOOR' },
          { zone: 'Nap Room', count: 2, type: 'INDOOR' }
        ],
        scenarios: [
          'NORMAL_DAY',
          'PICKUP_TIME',
          'MEAL_TIME',
          'NAP_TIME',
          'OUTDOOR_PLAY',
          'EMERGENCY_DRILL'
        ]
      },
      
      SCHOOL: {
        name: 'Demo Elementary School',
        address: '456 Education Ave, Learning City, LC 67890',
        capacity: 200,
        childCount: 180,
        staffCount: 25,
        zones: [
          { name: 'Kindergarten', type: 'INDOOR', capacity: 25, ageGroup: 'KINDERGARTEN' },
          { name: 'Grade 1 Classroom', type: 'INDOOR', capacity: 25, ageGroup: 'GRADE_1' },
          { name: 'Grade 2 Classroom', type: 'INDOOR', capacity: 25, ageGroup: 'GRADE_2' },
          { name: 'Library', type: 'INDOOR', capacity: 40, ageGroup: 'ALL' },
          { name: 'Gymnasium', type: 'INDOOR', capacity: 60, ageGroup: 'ALL' },
          { name: 'Playground', type: 'OUTDOOR', capacity: 100, ageGroup: 'ALL' },
          { name: 'Cafeteria', type: 'INDOOR', capacity: 80, ageGroup: 'ALL' }
        ],
        cameras: [
          { zone: 'Kindergarten', count: 2, type: 'INDOOR' },
          { zone: 'Grade 1 Classroom', count: 2, type: 'INDOOR' },
          { zone: 'Grade 2 Classroom', count: 2, type: 'INDOOR' },
          { zone: 'Library', count: 3, type: 'INDOOR' },
          { zone: 'Gymnasium', count: 4, type: 'INDOOR' },
          { zone: 'Playground', count: 6, type: 'OUTDOOR' },
          { zone: 'Cafeteria', count: 4, type: 'INDOOR' }
        ],
        scenarios: [
          'CLASS_TIME',
          'RECESS',
          'LUNCH_TIME',
          'ASSEMBLY',
          'DISMISSAL',
          'FIRE_DRILL'
        ]
      }
    };
    
    return templates[venueType] || templates.DAYCARE;
  }
  
  private async createDemoZones(venueId: string, zoneConfigs: ZoneConfig[]): Promise<DemoZone[]> {
    const zones = [];
    
    for (const config of zoneConfigs) {
      const zone = await this.zoneRepository.create({
        venueId,
        name: config.name,
        type: config.type,
        capacity: config.capacity,
        ageRestrictions: config.ageGroup,
        coordinates: this.generateZoneCoordinates(config),
        isDemo: true,
        demoConfig: {
          activityPatterns: this.generateActivityPatterns(config),
          alertScenarios: this.generateAlertScenarios(config)
        }
      });
      
      zones.push(zone);
    }
    
    return zones;
  }
  
  private async createDemoCameras(venueId: string, zones: DemoZone[], cameraConfigs: CameraConfig[]): Promise<DemoCamera[]> {
    const cameras = [];
    
    for (const config of cameraConfigs) {
      const zone = zones.find(z => z.name === config.zone);
      if (!zone) continue;
      
      for (let i = 0; i < config.count; i++) {
        const camera = await this.cameraRepository.create({
          venueId,
          zoneId: zone.id,
          name: `${config.zone} Camera ${i + 1}`,
          type: config.type,
          status: 'ONLINE',
          isDemo: true,
          demoConfig: {
            simulationEnabled: true,
            activityLevel: 'MEDIUM',
            detectionAccuracy: 0.95,
            frameRate: 30
          }
        });
        
        cameras.push(camera);
      }
    }
    
    return cameras;
  }
}
```

### Demo Data Generation

```typescript
// lib/demo/data-generator.ts
export class DemoDataGenerator {
  async generateDemoChildren(venueId: string, count: number): Promise<DemoChild[]> {
    const children = [];
    
    for (let i = 0; i < count; i++) {
      const child = {
        id: `demo-child-${i + 1}`,
        firstName: this.generateFirstName(),
        lastName: this.generateLastName(),
        dateOfBirth: this.generateBirthDate(),
        profilePhoto: this.generateProfilePhoto(),
        venueId,
        parentId: `demo-parent-${Math.floor(i / 2) + 1}`, // 2 children per parent
        isDemo: true,
        demoConfig: {
          activityLevel: this.randomChoice(['LOW', 'MEDIUM', 'HIGH']),
          behaviorPatterns: this.generateBehaviorPatterns(),
          preferences: this.generateChildPreferences()
        }
      };
      
      children.push(child);
    }
    
    return children;
  }
  
  async generateDemoStaff(venueId: string, count: number): Promise<DemoStaff[]> {
    const staff = [];
    const roles = ['TEACHER', 'ASSISTANT', 'SUPERVISOR', 'NURSE', 'ADMINISTRATOR'];
    
    for (let i = 0; i < count; i++) {
      const staffMember = {
        id: `demo-staff-${i + 1}`,
        name: this.generateStaffName(),
        role: this.randomChoice(roles),
        venueId,
        shift: this.generateShift(),
        zones: this.assignZones(i, count),
        isDemo: true,
        demoConfig: {
          responsiveness: this.randomFloat(0.7, 1.0),
          experience: this.randomChoice(['JUNIOR', 'SENIOR', 'EXPERT']),
          specializations: this.generateSpecializations()
        }
      };
      
      staff.push(staffMember);
    }
    
    return staff;
  }
  
  private generateBehaviorPatterns(): BehaviorPattern[] {
    const patterns = [
      {
        name: 'Active Player',
        activities: ['RUNNING', 'CLIMBING', 'PLAYING'],
        probability: 0.3,
        duration: { min: 10, max: 30 }
      },
      {
        name: 'Quiet Observer',
        activities: ['SITTING', 'WATCHING', 'READING'],
        probability: 0.2,
        duration: { min: 15, max: 45 }
      },
      {
        name: 'Social Butterfly',
        activities: ['INTERACTING', 'TALKING', 'GROUP_PLAY'],
        probability: 0.25,
        duration: { min: 5, max: 20 }
      },
      {
        name: 'Independent Explorer',
        activities: ['WALKING', 'EXPLORING', 'SOLO_PLAY'],
        probability: 0.25,
        duration: { min: 8, max: 25 }
      }
    ];
    
    return this.randomSample(patterns, this.randomInt(1, 3));
  }
  
  private generateActivityPatterns(zoneConfig: ZoneConfig): ActivityPattern[] {
    const basePatterns = {
      INDOOR: [
        { time: '09:00', activity: 'ARRIVAL', intensity: 0.8 },
        { time: '10:00', activity: 'STRUCTURED_PLAY', intensity: 0.6 },
        { time: '11:00', activity: 'LEARNING_TIME', intensity: 0.4 },
        { time: '12:00', activity: 'LUNCH', intensity: 0.7 },
        { time: '13:00', activity: 'NAP_TIME', intensity: 0.2 },
        { time: '15:00', activity: 'FREE_PLAY', intensity: 0.6 },
        { time: '16:00', activity: 'PICKUP', intensity: 0.9 }
      ],
      OUTDOOR: [
        { time: '10:00', activity: 'OUTDOOR_PLAY', intensity: 0.8 },
        { time: '11:00', activity: 'SPORTS', intensity: 0.7 },
        { time: '14:00', activity: 'NATURE_EXPLORATION', intensity: 0.5 },
        { time: '15:30', activity: 'GROUP_GAMES', intensity: 0.8 }
      ]
    };
    
    return basePatterns[zoneConfig.type] || basePatterns.INDOOR;
  }
}
```

## Real-time Activity Simulation

### Activity Engine

```typescript
// lib/demo/activity-engine.ts
export class DemoActivityEngine {
  private simulationState: Map<string, SimulationState> = new Map();
  private isRunning: boolean = false;
  
  async startSimulation(venueId: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Simulation already running');
    }
    
    const venue = await this.getDemoVenue(venueId);
    const children = await this.getDemoChildren(venueId);
    const staff = await this.getDemoStaff(venueId);
    const zones = await this.getDemoZones(venueId);
    
    // Initialize simulation state
    this.simulationState.set(venueId, {
      venue,
      children: new Map(children.map(c => [c.id, this.initializeChildState(c)])),
      staff: new Map(staff.map(s => [s.id, this.initializeStaffState(s)])),
      zones: new Map(zones.map(z => [z.id, this.initializeZoneState(z)])),
      currentTime: new Date(),
      simulationSpeed: 1.0
    });
    
    this.isRunning = true;
    this.runSimulationLoop(venueId);
  }
  
  private async runSimulationLoop(venueId: string): Promise<void> {
    while (this.isRunning) {
      const state = this.simulationState.get(venueId);
      if (!state) break;
      
      // Update simulation time
      state.currentTime = new Date(state.currentTime.getTime() + (60000 * state.simulationSpeed)); // 1 minute per cycle
      
      // Generate activities for each child
      for (const [childId, childState] of state.children) {
        await this.updateChildActivity(childId, childState, state);
      }
      
      // Update staff activities
      for (const [staffId, staffState] of state.staff) {
        await this.updateStaffActivity(staffId, staffState, state);
      }
      
      // Update zone states
      for (const [zoneId, zoneState] of state.zones) {
        await this.updateZoneState(zoneId, zoneState, state);
      }
      
      // Check for alert conditions
      await this.checkAlertConditions(state);
      
      // Broadcast updates to connected clients
      await this.broadcastSimulationUpdate(venueId, state);
      
      // Wait for next cycle
      await this.sleep(1000); // 1 second real-time
    }
  }
  
  private async updateChildActivity(childId: string, childState: ChildState, simulationState: SimulationState): Promise<void> {
    const currentTime = simulationState.currentTime;
    const timeOfDay = this.getTimeOfDay(currentTime);
    
    // Check if current activity should end
    if (childState.currentActivity && this.shouldEndActivity(childState.currentActivity, currentTime)) {
      await this.endChildActivity(childId, childState);
    }
    
    // Start new activity if needed
    if (!childState.currentActivity) {
      const newActivity = await this.selectNewActivity(childState, timeOfDay, simulationState);
      if (newActivity) {
        await this.startChildActivity(childId, childState, newActivity);
      }
    }
    
    // Update activity progress
    if (childState.currentActivity) {
      await this.updateActivityProgress(childId, childState, currentTime);
    }
  }
  
  private async selectNewActivity(childState: ChildState, timeOfDay: TimeOfDay, simulationState: SimulationState): Promise<Activity | null> {
    const child = childState.child;
    const availableZones = this.getAvailableZones(child, simulationState);
    
    // Get time-appropriate activities
    const timeBasedActivities = this.getTimeBasedActivities(timeOfDay, child.ageGroup);
    
    // Filter by child's behavior patterns
    const suitableActivities = timeBasedActivities.filter(activity =>
      child.demoConfig.behaviorPatterns.some(pattern =>
        pattern.activities.includes(activity.type)
      )
    );
    
    if (suitableActivities.length === 0) return null;
    
    // Select activity based on probability weights
    const selectedActivity = this.weightedRandomSelect(suitableActivities);
    
    // Assign zone
    const suitableZones = availableZones.filter(zone =>
      this.isActivitySuitableForZone(selectedActivity, zone)
    );
    
    if (suitableZones.length === 0) return null;
    
    const selectedZone = this.randomChoice(suitableZones);
    
    return {
      id: this.generateActivityId(),
      childId: child.id,
      type: selectedActivity.type,
      zoneId: selectedZone.id,
      startTime: simulationState.currentTime,
      expectedDuration: this.generateActivityDuration(selectedActivity),
      intensity: selectedActivity.intensity,
      coordinates: this.generateActivityCoordinates(selectedZone)
    };
  }
  
  private async startChildActivity(childId: string, childState: ChildState, activity: Activity): Promise<void> {
    childState.currentActivity = activity;
    childState.lastActivityChange = new Date();
    
    // Record activity in database
    await this.activityRepository.create({
      ...activity,
      isDemo: true,
      confidence: 0.95 // High confidence for demo data
    });
    
    // Update zone occupancy
    const zoneState = this.simulationState.get(childState.child.venueId)?.zones.get(activity.zoneId);
    if (zoneState) {
      zoneState.currentOccupancy++;
      zoneState.children.add(childId);
    }
  }
  
  async triggerScenario(venueId: string, scenarioType: ScenarioType): Promise<void> {
    const state = this.simulationState.get(venueId);
    if (!state) throw new Error('Simulation not running');
    
    const scenario = this.getScenario(scenarioType);
    
    // Execute scenario
    switch (scenarioType) {
      case 'EMERGENCY_DRILL':
        await this.executeEmergencyDrill(state);
        break;
      case 'PICKUP_TIME':
        await this.executePickupTime(state);
        break;
      case 'MEAL_TIME':
        await this.executeMealTime(state);
        break;
      case 'OUTDOOR_PLAY':
        await this.executeOutdoorPlay(state);
        break;
      default:
        throw new Error(`Unknown scenario type: ${scenarioType}`);
    }
  }
  
  private async executeEmergencyDrill(state: SimulationState): Promise<void> {
    // Move all children to designated safe zones
    const safeZones = Array.from(state.zones.values()).filter(z => z.zone.type === 'SAFE_ZONE');
    
    for (const [childId, childState] of state.children) {
      if (childState.currentActivity) {
        await this.endChildActivity(childId, childState);
      }
      
      const safeZone = this.randomChoice(safeZones);
      const evacuationActivity = {
        id: this.generateActivityId(),
        childId,
        type: 'EVACUATION',
        zoneId: safeZone.zone.id,
        startTime: state.currentTime,
        expectedDuration: 15, // 15 minutes
        intensity: 0.8,
        coordinates: this.generateActivityCoordinates(safeZone.zone)
      };
      
      await this.startChildActivity(childId, childState, evacuationActivity);
    }
    
    // Generate emergency drill alert
    await this.generateAlert(state.venue.id, {
      type: 'EMERGENCY_DRILL',
      severity: 'HIGH',
      title: 'Emergency Drill in Progress',
      description: 'Fire drill evacuation procedure initiated',
      autoResolve: true,
      resolveAfter: 15
    });
  }
}
```

### Activity Patterns

```typescript
// lib/demo/activity-patterns.ts
export class ActivityPatternManager {
  private readonly TIME_BASED_PATTERNS = {
    MORNING_ARRIVAL: {
      timeRange: { start: '07:00', end: '09:00' },
      activities: [
        { type: 'ARRIVAL', probability: 0.8, intensity: 0.7 },
        { type: 'GREETING', probability: 0.6, intensity: 0.5 },
        { type: 'SETTLING_IN', probability: 0.7, intensity: 0.4 }
      ]
    },
    
    STRUCTURED_TIME: {
      timeRange: { start: '09:00', end: '11:00' },
      activities: [
        { type: 'CIRCLE_TIME', probability: 0.9, intensity: 0.6 },
        { type: 'LEARNING_ACTIVITY', probability: 0.8, intensity: 0.7 },
        { type: 'ART_CRAFT', probability: 0.6, intensity: 0.5 }
      ]
    },
    
    FREE_PLAY: {
      timeRange: { start: '11:00', end: '12:00' },
      activities: [
        { type: 'BLOCK_PLAY', probability: 0.4, intensity: 0.6 },
        { type: 'DRAMATIC_PLAY', probability: 0.3, intensity: 0.7 },
        { type: 'READING', probability: 0.2, intensity: 0.3 },
        { type: 'PUZZLE', probability: 0.3, intensity: 0.4 }
      ]
    },
    
    LUNCH_TIME: {
      timeRange: { start: '12:00', end: '13:00' },
      activities: [
        { type: 'EATING', probability: 0.9, intensity: 0.5 },
        { type: 'SOCIALIZING', probability: 0.7, intensity: 0.6 },
        { type: 'CLEANUP', probability: 0.8, intensity: 0.4 }
      ]
    },
    
    NAP_TIME: {
      timeRange: { start: '13:00', end: '15:00' },
      activities: [
        { type: 'SLEEPING', probability: 0.8, intensity: 0.1 },
        { type: 'QUIET_REST', probability: 0.2, intensity: 0.2 }
      ]
    },
    
    AFTERNOON_PLAY: {
      timeRange: { start: '15:00', end: '16:00' },
      activities: [
        { type: 'OUTDOOR_PLAY', probability: 0.6, intensity: 0.8 },
        { type: 'INDOOR_GAMES', probability: 0.4, intensity: 0.6 },
        { type: 'MUSIC_MOVEMENT', probability: 0.3, intensity: 0.7 }
      ]
    },
    
    PICKUP_TIME: {
      timeRange: { start: '16:00', end: '18:00' },
      activities: [
        { type: 'WAITING', probability: 0.5, intensity: 0.3 },
        { type: 'DEPARTURE', probability: 0.8, intensity: 0.6 },
        { type: 'PARENT_INTERACTION', probability: 0.7, intensity: 0.5 }
      ]
    }
  };
  
  getActivitiesForTime(currentTime: Date, ageGroup: AgeGroup): ActivityOption[] {
    const timeString = currentTime.toTimeString().substring(0, 5);
    const applicablePatterns = [];
    
    for (const [patternName, pattern] of Object.entries(this.TIME_BASED_PATTERNS)) {
      if (this.isTimeInRange(timeString, pattern.timeRange)) {
        applicablePatterns.push(...pattern.activities);
      }
    }
    
    // Filter by age group appropriateness
    return applicablePatterns.filter(activity =>
      this.isActivityAppropriateForAge(activity.type, ageGroup)
    );
  }
  
  private isTimeInRange(currentTime: string, range: TimeRange): boolean {
    return currentTime >= range.start && currentTime <= range.end;
  }
  
  private isActivityAppropriateForAge(activityType: string, ageGroup: AgeGroup): boolean {
    const ageAppropriateActivities = {
      INFANT: ['SLEEPING', 'FEEDING', 'TUMMY_TIME', 'SENSORY_PLAY'],
      TODDLER: ['WALKING', 'SIMPLE_PLAY', 'EATING', 'SLEEPING', 'EXPLORATION'],
      PRESCHOOL: ['STRUCTURED_PLAY', 'LEARNING_ACTIVITY', 'ART_CRAFT', 'OUTDOOR_PLAY', 'SOCIALIZING'],
      SCHOOL_AGE: ['HOMEWORK', 'SPORTS', 'GROUP_PROJECTS', 'READING', 'COMPLEX_GAMES']
    };
    
    return ageAppropriateActivities[ageGroup]?.includes(activityType) || false;
  }
  
  generateWeeklySchedule(venueType: VenueType): WeeklySchedule {
    const schedule = {
      monday: this.generateDailySchedule(venueType, 'MONDAY'),
      tuesday: this.generateDailySchedule(venueType, 'TUESDAY'),
      wednesday: this.generateDailySchedule(venueType, 'WEDNESDAY'),
      thursday: this.generateDailySchedule(venueType, 'THURSDAY'),
      friday: this.generateDailySchedule(venueType, 'FRIDAY')
    };
    
    return schedule;
  }
  
  private generateDailySchedule(venueType: VenueType, dayOfWeek: string): DailySchedule {
    const baseSchedule = this.getBaseSchedule(venueType);
    
    // Add day-specific variations
    const variations = this.getDaySpecificVariations(dayOfWeek);
    
    return this.applyVariations(baseSchedule, variations);
  }
}
```

## Demo Alert System

### Alert Scenarios

```typescript
// lib/demo/alert-scenarios.ts
export class DemoAlertScenarios {
  private readonly ALERT_SCENARIOS = {
    CHILD_SEPARATION: {
      name: 'Child Separation Alert',
      type: 'CHILD_SEPARATION',
      severity: 'HIGH',
      probability: 0.05, // 5% chance per hour
      conditions: [
        'child_outside_designated_zone',
        'child_alone_for_extended_period',
        'child_in_restricted_area'
      ],
      duration: { min: 2, max: 8 }, // minutes
      autoResolve: true,
      requiredActions: ['LOCATE_CHILD', 'NOTIFY_STAFF', 'REUNITE_WITH_GROUP']
    },
    
    UNAUTHORIZED_ACCESS: {
      name: 'Unauthorized Area Access',
      type: 'UNAUTHORIZED_ACCESS',
      severity: 'MEDIUM',
      probability: 0.03,
      conditions: [
        'child_in_staff_only_area',
        'child_in_kitchen',
        'child_in_storage_room'
      ],
      duration: { min: 1, max: 5 },
      autoResolve: false,
      requiredActions: ['GUIDE_CHILD_OUT', 'CHECK_AREA_SECURITY']
    },
    
    UNUSUAL_BEHAVIOR: {
      name: 'Unusual Behavior Detected',
      type: 'BEHAVIOR_ANOMALY',
      severity: 'LOW',
      probability: 0.08,
      conditions: [
        'child_inactive_for_long_period',
        'aggressive_behavior_detected',
        'distress_indicators'
      ],
      duration: { min: 5, max: 15 },
      autoResolve: true,
      requiredActions: ['OBSERVE_CHILD', 'STAFF_INTERVENTION']
    },
    
    CAMERA_OFFLINE: {
      name: 'Camera Offline',
      type: 'TECHNICAL_ISSUE',
      severity: 'MEDIUM',
      probability: 0.02,
      conditions: [
        'camera_connection_lost',
        'camera_hardware_failure',
        'network_connectivity_issue'
      ],
      duration: { min: 10, max: 60 },
      autoResolve: false,
      requiredActions: ['CHECK_CAMERA', 'RESTART_SYSTEM', 'CONTACT_SUPPORT']
    },
    
    EMERGENCY_SITUATION: {
      name: 'Emergency Situation',
      type: 'EMERGENCY',
      severity: 'CRITICAL',
      probability: 0.001, // Very rare
      conditions: [
        'fire_alarm_triggered',
        'medical_emergency',
        'security_breach'
      ],
      duration: { min: 15, max: 45 },
      autoResolve: false,
      requiredActions: ['EVACUATE', 'CALL_EMERGENCY', 'ACCOUNT_FOR_ALL']
    }
  };
  
  async generateRandomAlert(venueId: string): Promise<DemoAlert | null> {
    const scenarios = Object.values(this.ALERT_SCENARIOS);
    
    for (const scenario of scenarios) {
      if (Math.random() < scenario.probability) {
        return await this.createAlert(venueId, scenario);
      }
    }
    
    return null; // No alert generated
  }
  
  async triggerSpecificAlert(venueId: string, scenarioType: string, childId?: string): Promise<DemoAlert> {
    const scenario = this.ALERT_SCENARIOS[scenarioType];
    if (!scenario) {
      throw new Error(`Unknown alert scenario: ${scenarioType}`);
    }
    
    return await this.createAlert(venueId, scenario, childId);
  }
  
  private async createAlert(venueId: string, scenario: AlertScenario, childId?: string): Promise<DemoAlert> {
    const venue = await this.getDemoVenue(venueId);
    const children = await this.getDemoChildren(venueId);
    
    // Select random child if not specified
    const selectedChild = childId 
      ? children.find(c => c.id === childId)
      : this.randomChoice(children);
    
    // Select random condition
    const condition = this.randomChoice(scenario.conditions);
    
    // Generate alert details
    const alert = {
      id: this.generateAlertId(),
      venueId,
      childId: selectedChild?.id,
      type: scenario.type,
      severity: scenario.severity,
      title: scenario.name,
      description: this.generateAlertDescription(scenario, condition, selectedChild),
      location: await this.getChildLocation(selectedChild?.id),
      timestamp: new Date(),
      isDemo: true,
      autoResolve: scenario.autoResolve,
      resolveAfter: scenario.autoResolve 
        ? this.randomInt(scenario.duration.min, scenario.duration.max)
        : null,
      requiredActions: scenario.requiredActions,
      metadata: {
        scenario: scenario.name,
        condition,
        confidence: this.randomFloat(0.8, 0.95)
      }
    };
    
    // Store alert
    await this.alertRepository.create(alert);
    
    // Schedule auto-resolution if applicable
    if (alert.autoResolve && alert.resolveAfter) {
      setTimeout(async () => {
        await this.resolveAlert(alert.id, 'Auto-resolved by system');
      }, alert.resolveAfter * 60 * 1000);
    }
    
    // Broadcast alert to connected clients
    await this.broadcastAlert(venueId, alert);
    
    return alert;
  }
  
  private generateAlertDescription(scenario: AlertScenario, condition: string, child?: DemoChild): string {
    const templates = {
      CHILD_SEPARATION: {
        child_outside_designated_zone: `${child?.firstName} has moved outside their designated play area`,
        child_alone_for_extended_period: `${child?.firstName} has been alone for an extended period`,
        child_in_restricted_area: `${child?.firstName} has entered a restricted area`
      },
      UNAUTHORIZED_ACCESS: {
        child_in_staff_only_area: `${child?.firstName} has accessed a staff-only area`,
        child_in_kitchen: `${child?.firstName} has entered the kitchen area`,
        child_in_storage_room: `${child?.firstName} has entered a storage room`
      },
      BEHAVIOR_ANOMALY: {
        child_inactive_for_long_period: `${child?.firstName} has been inactive for an unusually long time`,
        aggressive_behavior_detected: `Aggressive behavior detected involving ${child?.firstName}`,
        distress_indicators: `${child?.firstName} is showing signs of distress`
      },
      TECHNICAL_ISSUE: {
        camera_connection_lost: 'Camera connection has been lost',
        camera_hardware_failure: 'Camera hardware failure detected',
        network_connectivity_issue: 'Network connectivity issue affecting camera feed'
      },
      EMERGENCY: {
        fire_alarm_triggered: 'Fire alarm has been triggered',
        medical_emergency: 'Medical emergency situation detected',
        security_breach: 'Security breach detected'
      }
    };
    
    return templates[scenario.type]?.[condition] || `${scenario.name}: ${condition}`;
  }
  
  async resolveAlert(alertId: string, resolution: string): Promise<void> {
    await this.alertRepository.update(alertId, {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolution
    });
    
    // Broadcast resolution
    const alert = await this.alertRepository.findById(alertId);
    if (alert) {
      await this.broadcastAlertResolution(alert.venueId, alertId, resolution);
    }
  }
  
  async getAlertStatistics(venueId: string, period: DateRange): Promise<AlertStatistics> {
    const alerts = await this.getAlertsInPeriod(venueId, period);
    
    return {
      total: alerts.length,
      byType: this.groupAlertsByType(alerts),
      bySeverity: this.groupAlertsBySeverity(alerts),
      averageResolutionTime: this.calculateAverageResolutionTime(alerts),
      autoResolvedPercentage: this.calculateAutoResolvedPercentage(alerts),
      mostCommonScenarios: this.getMostCommonScenarios(alerts)
    };
  }
}
```

## Interactive Dashboards

### Real-time Dashboard

```typescript
// components/demo/demo-dashboard.tsx
export const DemoDashboard: React.FC
