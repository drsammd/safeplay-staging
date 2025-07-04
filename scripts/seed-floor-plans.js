"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var dotenv_1 = require("dotenv");
// Load environment variables
dotenv_1.default.config();
var prisma = new client_1.PrismaClient();
function seedFloorPlansAndCameras() {
    return __awaiter(this, void 0, void 0, function () {
        var venue, venueAdmin, floorPlan, zones, cameras, onlineCameras, _i, onlineCameras_1, camera, coveragePolygon, cameraEvents, recommendations, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Seeding floor plans and cameras...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 13, , 14]);
                    return [4 /*yield*/, prisma.venue.findFirst({
                            where: {
                                admin: {
                                    email: 'venue@mysafeplay.ai'
                                }
                            }
                        })];
                case 2:
                    venue = _a.sent();
                    if (!venue) {
                        console.log('Demo venue not found. Please run the main seed script first.');
                        return [2 /*return*/];
                    }
                    console.log("Found venue: ".concat(venue.name));
                    return [4 /*yield*/, prisma.user.findUnique({
                            where: { email: 'venue@mysafeplay.ai' }
                        })];
                case 3:
                    venueAdmin = _a.sent();
                    if (!venueAdmin) {
                        console.log('Venue admin not found.');
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, prisma.floorPlan.create({
                            data: {
                                name: 'Main Play Area Floor Plan',
                                description: 'Primary floor plan showing the main play area, entrance, and safety zones',
                                fileUrl: '/backgrounds/venue_bg.png',
                                fileType: 'PNG',
                                originalFileName: 'main_floor_plan.png',
                                fileSize: 1024000,
                                dimensions: {
                                    width: 1200,
                                    height: 800,
                                    scale: 0.01 // 1cm per pixel
                                },
                                metadata: {
                                    uploadType: 'sample',
                                    version: '1.0'
                                },
                                version: 1,
                                isActive: true,
                                venueId: venue.id,
                                uploadedBy: venueAdmin.id
                            }
                        })];
                case 4:
                    floorPlan = _a.sent();
                    console.log("Created floor plan: ".concat(floorPlan.name));
                    return [4 /*yield*/, Promise.all([
                            prisma.floorPlanZone.create({
                                data: {
                                    name: 'Main Entrance',
                                    type: 'ENTRANCE',
                                    coordinates: [
                                        { x: 100, y: 100 },
                                        { x: 300, y: 100 },
                                        { x: 300, y: 200 },
                                        { x: 100, y: 200 }
                                    ],
                                    color: '#10B981',
                                    description: 'Primary entrance for guests',
                                    floorPlanId: floorPlan.id
                                }
                            }),
                            prisma.floorPlanZone.create({
                                data: {
                                    name: 'Play Area',
                                    type: 'PLAY_AREA',
                                    coordinates: [
                                        { x: 350, y: 150 },
                                        { x: 900, y: 150 },
                                        { x: 900, y: 600 },
                                        { x: 350, y: 600 }
                                    ],
                                    color: '#3B82F6',
                                    description: 'Main children play area',
                                    floorPlanId: floorPlan.id
                                }
                            }),
                            prisma.floorPlanZone.create({
                                data: {
                                    name: 'Emergency Exit',
                                    type: 'EMERGENCY_EXIT',
                                    coordinates: [
                                        { x: 950, y: 300 },
                                        { x: 1100, y: 300 },
                                        { x: 1100, y: 400 },
                                        { x: 950, y: 400 }
                                    ],
                                    color: '#EF4444',
                                    description: 'Emergency exit route',
                                    floorPlanId: floorPlan.id
                                }
                            }),
                            prisma.floorPlanZone.create({
                                data: {
                                    name: 'Food Court',
                                    type: 'FOOD_COURT',
                                    coordinates: [
                                        { x: 100, y: 600 },
                                        { x: 300, y: 600 },
                                        { x: 300, y: 750 },
                                        { x: 100, y: 750 }
                                    ],
                                    color: '#F59E0B',
                                    description: 'Food and beverage area',
                                    floorPlanId: floorPlan.id
                                }
                            })
                        ])];
                case 5:
                    zones = _a.sent();
                    console.log("Created ".concat(zones.length, " floor plan zones"));
                    return [4 /*yield*/, Promise.all([
                            // Entrance Camera
                            prisma.camera.create({
                                data: {
                                    name: 'Entrance Camera 1',
                                    model: 'SafeCam Pro 4K',
                                    serialNumber: 'SC-ENT-001',
                                    ipAddress: '192.168.1.101',
                                    streamUrl: 'rtsp://192.168.1.101:554/stream1',
                                    status: 'ONLINE',
                                    position: { x: 200, y: 80 },
                                    viewAngle: 90,
                                    viewDistance: 15,
                                    rotation: 45,
                                    height: 3.0,
                                    isRecordingEnabled: true,
                                    isRecognitionEnabled: true,
                                    recognitionThreshold: 0.90,
                                    specifications: {
                                        resolution: '4K',
                                        fps: 30,
                                        nightVision: true,
                                        weatherProof: true
                                    },
                                    configuration: {
                                        motionDetection: true,
                                        audioRecording: false,
                                        alertsEnabled: true
                                    },
                                    venueId: venue.id,
                                    floorPlanId: floorPlan.id,
                                    lastPing: new Date()
                                }
                            }),
                            // Play Area Camera 1
                            prisma.camera.create({
                                data: {
                                    name: 'Play Area Camera 1',
                                    model: 'SafeCam Standard HD',
                                    serialNumber: 'SC-PA-001',
                                    ipAddress: '192.168.1.102',
                                    streamUrl: 'rtsp://192.168.1.102:554/stream1',
                                    status: 'ONLINE',
                                    position: { x: 500, y: 200 },
                                    viewAngle: 110,
                                    viewDistance: 20,
                                    rotation: 135,
                                    height: 4.0,
                                    isRecordingEnabled: true,
                                    isRecognitionEnabled: true,
                                    recognitionThreshold: 0.85,
                                    specifications: {
                                        resolution: '1080p',
                                        fps: 25,
                                        nightVision: false,
                                        weatherProof: false
                                    },
                                    configuration: {
                                        motionDetection: true,
                                        audioRecording: true,
                                        alertsEnabled: true
                                    },
                                    venueId: venue.id,
                                    floorPlanId: floorPlan.id,
                                    lastPing: new Date()
                                }
                            }),
                            // Play Area Camera 2
                            prisma.camera.create({
                                data: {
                                    name: 'Play Area Camera 2',
                                    model: 'SafeCam Standard HD',
                                    serialNumber: 'SC-PA-002',
                                    ipAddress: '192.168.1.103',
                                    streamUrl: 'rtsp://192.168.1.103:554/stream1',
                                    status: 'ONLINE',
                                    position: { x: 750, y: 450 },
                                    viewAngle: 100,
                                    viewDistance: 18,
                                    rotation: 270,
                                    height: 3.5,
                                    isRecordingEnabled: true,
                                    isRecognitionEnabled: true,
                                    recognitionThreshold: 0.88,
                                    specifications: {
                                        resolution: '1080p',
                                        fps: 25,
                                        nightVision: false,
                                        weatherProof: false
                                    },
                                    configuration: {
                                        motionDetection: true,
                                        audioRecording: false,
                                        alertsEnabled: true
                                    },
                                    venueId: venue.id,
                                    floorPlanId: floorPlan.id,
                                    lastPing: new Date()
                                }
                            }),
                            // Emergency Exit Camera
                            prisma.camera.create({
                                data: {
                                    name: 'Emergency Exit Camera',
                                    model: 'SafeCam Pro 4K',
                                    serialNumber: 'SC-EX-001',
                                    ipAddress: '192.168.1.104',
                                    streamUrl: 'rtsp://192.168.1.104:554/stream1',
                                    status: 'MAINTENANCE',
                                    position: { x: 1000, y: 350 },
                                    viewAngle: 70,
                                    viewDistance: 12,
                                    rotation: 180,
                                    height: 2.8,
                                    isRecordingEnabled: true,
                                    isRecognitionEnabled: true,
                                    recognitionThreshold: 0.92,
                                    specifications: {
                                        resolution: '4K',
                                        fps: 30,
                                        nightVision: true,
                                        weatherProof: true
                                    },
                                    configuration: {
                                        motionDetection: true,
                                        audioRecording: true,
                                        alertsEnabled: true
                                    },
                                    venueId: venue.id,
                                    floorPlanId: floorPlan.id,
                                    lastPing: new Date(Date.now() - 300000) // 5 minutes ago
                                }
                            }),
                            // Food Court Camera
                            prisma.camera.create({
                                data: {
                                    name: 'Food Court Camera',
                                    model: 'SafeCam Compact',
                                    serialNumber: 'SC-FC-001',
                                    ipAddress: '192.168.1.105',
                                    status: 'OFFLINE',
                                    position: { x: 200, y: 675 },
                                    viewAngle: 80,
                                    viewDistance: 10,
                                    rotation: 315,
                                    height: 2.5,
                                    isRecordingEnabled: false,
                                    isRecognitionEnabled: false,
                                    recognitionThreshold: 0.80,
                                    specifications: {
                                        resolution: '720p',
                                        fps: 20,
                                        nightVision: false,
                                        weatherProof: false
                                    },
                                    configuration: {
                                        motionDetection: false,
                                        audioRecording: false,
                                        alertsEnabled: false
                                    },
                                    venueId: venue.id,
                                    floorPlanId: floorPlan.id
                                }
                            })
                        ])];
                case 6:
                    cameras = _a.sent();
                    console.log("Created ".concat(cameras.length, " cameras"));
                    onlineCameras = cameras.filter(function (camera) { return camera.status === 'ONLINE'; });
                    _i = 0, onlineCameras_1 = onlineCameras;
                    _a.label = 7;
                case 7:
                    if (!(_i < onlineCameras_1.length)) return [3 /*break*/, 10];
                    camera = onlineCameras_1[_i];
                    coveragePolygon = calculateCoveragePolygon(camera.position, camera.viewAngle || 60, camera.viewDistance || 10, camera.rotation || 0);
                    return [4 /*yield*/, prisma.cameraCoverageArea.create({
                            data: {
                                cameraId: camera.id,
                                area: coveragePolygon,
                                confidence: 0.95,
                                metadata: {
                                    calculatedAt: new Date().toISOString(),
                                    algorithm: 'geometric_projection',
                                    area: calculatePolygonArea(coveragePolygon)
                                }
                            }
                        })];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    _i++;
                    return [3 /*break*/, 7];
                case 10:
                    console.log("Created coverage areas for ".concat(onlineCameras.length, " online cameras"));
                    return [4 /*yield*/, Promise.all([
                            prisma.cameraEvent.create({
                                data: {
                                    type: 'ONLINE',
                                    description: 'Camera came online',
                                    severity: 'INFO',
                                    cameraId: cameras[0].id,
                                    venueId: venue.id,
                                    metadata: {
                                        timestamp: new Date().toISOString(),
                                        previousStatus: 'OFFLINE'
                                    }
                                }
                            }),
                            prisma.cameraEvent.create({
                                data: {
                                    type: 'MAINTENANCE_REQUIRED',
                                    description: 'Camera requires scheduled maintenance',
                                    severity: 'WARNING',
                                    cameraId: cameras[3].id,
                                    venueId: venue.id,
                                    metadata: {
                                        maintenanceType: 'lens_cleaning',
                                        scheduledDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
                                    }
                                }
                            }),
                            prisma.cameraEvent.create({
                                data: {
                                    type: 'OFFLINE',
                                    description: 'Camera connection lost',
                                    severity: 'ERROR',
                                    cameraId: cameras[4].id,
                                    venueId: venue.id,
                                    metadata: {
                                        lastSeen: new Date(Date.now() - 3600000).toISOString(),
                                        reason: 'network_timeout'
                                    }
                                }
                            })
                        ])];
                case 11:
                    cameraEvents = _a.sent();
                    console.log("Created ".concat(cameraEvents.length, " camera events"));
                    return [4 /*yield*/, Promise.all([
                            prisma.cameraRecommendation.create({
                                data: {
                                    venueId: venue.id,
                                    floorPlanId: floorPlan.id,
                                    recommendationType: 'COVERAGE_GAP',
                                    suggestedPosition: { x: 600, y: 300 },
                                    reasoning: 'Large uncovered area detected in central play zone',
                                    priority: 'HIGH',
                                    coverageArea: [
                                        { x: 600, y: 300 },
                                        { x: 650, y: 280 },
                                        { x: 700, y: 300 },
                                        { x: 650, y: 320 }
                                    ],
                                    estimatedCost: 1500,
                                    status: 'PENDING',
                                    metadata: {
                                        uncoveredArea: 120,
                                        expectedImprovement: 0.15
                                    }
                                }
                            }),
                            prisma.cameraRecommendation.create({
                                data: {
                                    venueId: venue.id,
                                    floorPlanId: floorPlan.id,
                                    recommendationType: 'BLIND_SPOT',
                                    suggestedPosition: { x: 450, y: 500 },
                                    reasoning: 'Blind spot created by play equipment obstacle',
                                    priority: 'MEDIUM',
                                    coverageArea: [
                                        { x: 450, y: 500 },
                                        { x: 480, y: 485 },
                                        { x: 510, y: 500 },
                                        { x: 480, y: 515 }
                                    ],
                                    estimatedCost: 1200,
                                    status: 'PENDING',
                                    metadata: {
                                        obstacleType: 'play_structure',
                                        blindSpotSize: 25
                                    }
                                }
                            })
                        ])];
                case 12:
                    recommendations = _a.sent();
                    console.log("Created ".concat(recommendations.length, " camera recommendations"));
                    console.log('✅ Floor plans and cameras seeded successfully!');
                    console.log('\nSample Data Created:');
                    console.log("- 1 Floor Plan: \"".concat(floorPlan.name, "\""));
                    console.log("- ".concat(zones.length, " Zones: Entrance, Play Area, Emergency Exit, Food Court"));
                    console.log("- ".concat(cameras.length, " Cameras: Various statuses and configurations"));
                    console.log("- ".concat(onlineCameras.length, " Coverage Areas for online cameras"));
                    console.log("- ".concat(cameraEvents.length, " Camera Events"));
                    console.log("- ".concat(recommendations.length, " Camera Recommendations"));
                    console.log('\n🎯 Test the system by:');
                    console.log('1. Login as venue@mysafeplay.ai / venue123');
                    console.log('2. Navigate to "Floor Plans & Cameras" in the venue admin dashboard');
                    console.log('3. View the sample floor plan and interact with cameras');
                    console.log('4. Try placing new cameras and viewing coverage analysis');
                    return [3 /*break*/, 14];
                case 13:
                    error_1 = _a.sent();
                    console.error('Error seeding floor plans and cameras:', error_1);
                    throw error_1;
                case 14: return [2 /*return*/];
            }
        });
    });
}
// Helper function to calculate coverage polygon
function calculateCoveragePolygon(position, viewAngle, viewDistance, rotation) {
    var points = [position]; // Start with camera position
    var startAngle = rotation - (viewAngle / 2);
    var endAngle = rotation + (viewAngle / 2);
    var angleStep = viewAngle / 8; // 8 points for coverage
    // Generate arc points
    for (var angle = startAngle; angle <= endAngle; angle += angleStep) {
        var radians = (angle * Math.PI) / 180;
        var x = position.x + Math.cos(radians) * viewDistance * 10; // Scale for screen coordinates
        var y = position.y + Math.sin(radians) * viewDistance * 10;
        points.push({ x: x, y: y });
    }
    // Close the polygon
    points.push(position);
    return points;
}
// Helper function to calculate polygon area
function calculatePolygonArea(polygon) {
    if (polygon.length < 3)
        return 0;
    var area = 0;
    for (var i = 0; i < polygon.length - 1; i++) {
        area += (polygon[i].x * polygon[i + 1].y) - (polygon[i + 1].x * polygon[i].y);
    }
    return Math.abs(area) / 2;
}
// Main execution
if (require.main === module) {
    seedFloorPlansAndCameras()
        .catch(function (e) {
        console.error(e);
        process.exit(1);
    })
        .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.$disconnect()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
}
exports.default = seedFloorPlansAndCameras;
