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
var dotenv_1 = require("dotenv");
var client_1 = require("@prisma/client");
// Load environment variables
(0, dotenv_1.config)();
var prisma = new client_1.PrismaClient();
function seedSubscriptionPlans() {
    return __awaiter(this, void 0, void 0, function () {
        var plans, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🌱 Seeding subscription plans...');
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, 8, 10]);
                    // Create Basic Plan
                    return [4 /*yield*/, prisma.subscriptionPlan.upsert({
                            where: { name: 'Basic Plan' },
                            update: {
                                trialDays: 7, // Ensure 7-day trial
                            },
                            create: {
                                name: 'Basic Plan',
                                description: 'Perfect for families with 1-2 children. Essential safety features included.',
                                planType: client_1.SubscriptionPlanType.BASIC,
                                price: 9.99,
                                yearlyPrice: 99.99,
                                currency: 'USD',
                                billingInterval: client_1.BillingInterval.MONTHLY,
                                trialDays: 7,
                                // Feature limits
                                maxChildren: 2,
                                maxVenues: 3,
                                maxPhotoDownloads: 25,
                                maxVideoDownloads: 10,
                                maxMemoryStorage: 1000,
                                maxAlerts: 50,
                                // Feature flags
                                unlimitedDownloads: false,
                                premiumAlerts: false,
                                aiInsights: false,
                                prioritySupport: false,
                                customBranding: false,
                                advancedAnalytics: false,
                                biometricFeatures: true,
                                realTimeTracking: true,
                                emergencyFeatures: true,
                                familySharing: false,
                                isActive: true,
                                displayOrder: 1,
                            }
                        })];
                case 2:
                    // Create Basic Plan
                    _a.sent();
                    // Create Premium Plan  
                    return [4 /*yield*/, prisma.subscriptionPlan.upsert({
                            where: { name: 'Premium Plan' },
                            update: {
                                trialDays: 7, // Ensure 7-day trial
                            },
                            create: {
                                name: 'Premium Plan',
                                description: 'Enhanced features for active families. AI insights and premium alerts included.',
                                planType: client_1.SubscriptionPlanType.PREMIUM,
                                price: 19.99,
                                yearlyPrice: 199.99,
                                currency: 'USD',
                                billingInterval: client_1.BillingInterval.MONTHLY,
                                trialDays: 7,
                                // Feature limits
                                maxChildren: 5,
                                maxVenues: 10,
                                maxPhotoDownloads: 100,
                                maxVideoDownloads: 50,
                                maxMemoryStorage: 5000,
                                maxAlerts: 200,
                                // Feature flags
                                unlimitedDownloads: false,
                                premiumAlerts: true,
                                aiInsights: true,
                                prioritySupport: false,
                                customBranding: false,
                                advancedAnalytics: true,
                                biometricFeatures: true,
                                realTimeTracking: true,
                                emergencyFeatures: true,
                                familySharing: true,
                                isActive: true,
                                displayOrder: 2,
                            }
                        })];
                case 3:
                    // Create Premium Plan  
                    _a.sent();
                    // Create Family Plan
                    return [4 /*yield*/, prisma.subscriptionPlan.upsert({
                            where: { name: 'Family Plan' },
                            update: {
                                trialDays: 7, // Ensure 7-day trial
                            },
                            create: {
                                name: 'Family Plan',
                                description: 'Unlimited access for large families. All features included with priority support.',
                                planType: client_1.SubscriptionPlanType.FAMILY,
                                price: 39.99,
                                yearlyPrice: 399.99,
                                currency: 'USD',
                                billingInterval: client_1.BillingInterval.MONTHLY,
                                trialDays: 7,
                                // Feature limits (unlimited)
                                maxChildren: -1,
                                maxVenues: -1,
                                maxPhotoDownloads: -1,
                                maxVideoDownloads: -1,
                                maxMemoryStorage: -1,
                                maxAlerts: -1,
                                // Feature flags (all enabled)
                                unlimitedDownloads: true,
                                premiumAlerts: true,
                                aiInsights: true,
                                prioritySupport: true,
                                customBranding: false,
                                advancedAnalytics: true,
                                biometricFeatures: true,
                                realTimeTracking: true,
                                emergencyFeatures: true,
                                familySharing: true,
                                isActive: true,
                                displayOrder: 3,
                            }
                        })];
                case 4:
                    // Create Family Plan
                    _a.sent();
                    // Create Lifetime Plan
                    return [4 /*yield*/, prisma.subscriptionPlan.upsert({
                            where: { name: 'Lifetime Plan' },
                            update: {
                                trialDays: 7, // Add 7-day trial to lifetime plan
                            },
                            create: {
                                name: 'Lifetime Plan',
                                description: 'One-time payment for lifetime access. All features forever with no recurring fees.',
                                planType: client_1.SubscriptionPlanType.LIFETIME,
                                price: 0,
                                yearlyPrice: 0,
                                lifetimePrice: 599.99,
                                currency: 'USD',
                                billingInterval: client_1.BillingInterval.LIFETIME,
                                trialDays: 7,
                                // Feature limits (unlimited)
                                maxChildren: -1,
                                maxVenues: -1,
                                maxPhotoDownloads: -1,
                                maxVideoDownloads: -1,
                                maxMemoryStorage: -1,
                                maxAlerts: -1,
                                // Feature flags (all enabled)
                                unlimitedDownloads: true,
                                premiumAlerts: true,
                                aiInsights: true,
                                prioritySupport: true,
                                customBranding: true,
                                advancedAnalytics: true,
                                biometricFeatures: true,
                                realTimeTracking: true,
                                emergencyFeatures: true,
                                familySharing: true,
                                isActive: true,
                                displayOrder: 4,
                            }
                        })];
                case 5:
                    // Create Lifetime Plan
                    _a.sent();
                    console.log('✅ Subscription plans seeded successfully!');
                    return [4 /*yield*/, prisma.subscriptionPlan.findMany({
                            orderBy: { displayOrder: 'asc' }
                        })];
                case 6:
                    plans = _a.sent();
                    console.log('\n📋 Created Plans:');
                    plans.forEach(function (plan) {
                        console.log("  ".concat(plan.name, " - $").concat(plan.price, "/month (").concat(plan.planType, ")"));
                    });
                    return [3 /*break*/, 10];
                case 7:
                    error_1 = _a.sent();
                    console.error('❌ Error seeding subscription plans:', error_1);
                    throw error_1;
                case 8: return [4 /*yield*/, prisma.$disconnect()];
                case 9:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    });
}
// Run the seed function if this file is executed directly
if (require.main === module) {
    seedSubscriptionPlans()
        .then(function () {
        console.log('🎉 Subscription plans seeding completed!');
        process.exit(0);
    })
        .catch(function (error) {
        console.error('💥 Subscription plans seeding failed:', error);
        process.exit(1);
    });
}
exports.default = seedSubscriptionPlans;
