
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkActiveAccounts() {
    try {
        console.log('🔍 CHECKING ACTIVE ACCOUNTS AND LOGIN AVAILABILITY\n');
        
        // Get all users with basic authentication details
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
                password: true,
                phoneVerified: true,
                identityVerified: true,
                twoFactorEnabled: true,
                children: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                managedVenues: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        console.log(`📊 TOTAL USERS FOUND: ${users.length}\n`);
        
        // Categorize users
        const activeUsers = users.filter(user => user.isActive);
        const inactiveUsers = users.filter(user => !user.isActive);
        const usersWithPassword = users.filter(user => user.password && user.password.length > 0);
        const usersWithoutPassword = users.filter(user => !user.password || user.password.length === 0);
        
        console.log('🔐 AUTHENTICATION STATUS SUMMARY:');
        console.log(`├── Active Users: ${activeUsers.length}`);
        console.log(`├── Inactive Users: ${inactiveUsers.length}`);
        console.log(`├── Users with Password: ${usersWithPassword.length}`);
        console.log(`└── Users without Password: ${usersWithoutPassword.length}\n`);
        
        // Demo accounts (known demo emails)
        const demoEmails = [
            'admin@mysafeplay.ai',
            'john@mysafeplay.ai', 
            'venue@mysafeplay.ai',
            'parent@mysafeplay.ai'
        ];
        
        const demoAccounts = users.filter(user => demoEmails.includes(user.email));
        const regularAccounts = users.filter(user => !demoEmails.includes(user.email));
        
        console.log('🎭 ACCOUNT CATEGORIZATION:');
        console.log(`├── Demo Accounts: ${demoAccounts.length}`);
        console.log(`└── Regular Accounts: ${regularAccounts.length}\n`);

        // Function to get login status
        function getLoginStatus(user) {
            if (!user.isActive) return '❌ INACTIVE';
            if (!user.password || user.password.length === 0) return '🔴 NO PASSWORD';
            return '✅ READY FOR LOGIN';
        }

        // Function to format last login
        function formatLastLogin(lastLoginAt) {
            if (!lastLoginAt) return 'Never';
            return new Date(lastLoginAt).toLocaleDateString();
        }

        // Function to format child name
        function formatChildName(child) {
            return `${child.firstName} ${child.lastName}`;
        }

        // Display Demo Accounts
        console.log('🎭 DEMO ACCOUNTS:');
        console.log('================');
        if (demoAccounts.length === 0) {
            console.log('❌ No demo accounts found');
        } else {
            demoAccounts.forEach(user => {
                console.log(`\n📧 ${user.email}`);
                console.log(`   ├── Status: ${getLoginStatus(user)}`);
                console.log(`   ├── Name: ${user.name || 'N/A'}`);
                console.log(`   ├── Role: ${user.role}`);
                console.log(`   ├── Last Login: ${formatLastLogin(user.lastLoginAt)}`);
                console.log(`   ├── 2FA Enabled: ${user.twoFactorEnabled ? 'Yes' : 'No'}`);
                console.log(`   ├── Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
                console.log(`   ├── Identity Verified: ${user.identityVerified ? 'Yes' : 'No'}`);
                console.log(`   ├── Children: ${user.children?.length || 0}`);
                if (user.children && user.children.length > 0) {
                    user.children.forEach(child => {
                        console.log(`   │   └── ${formatChildName(child)}`);
                    });
                }
                console.log(`   └── Managed Venues: ${user.managedVenues?.length || 0}`);
                if (user.managedVenues && user.managedVenues.length > 0) {
                    user.managedVenues.forEach(venue => {
                        console.log(`       └── ${venue.name}`);
                    });
                }
            });
        }

        // Display Regular Accounts
        console.log('\n\n👥 REGULAR ACCOUNTS:');
        console.log('====================');
        if (regularAccounts.length === 0) {
            console.log('❌ No regular accounts found');
        } else {
            regularAccounts.forEach(user => {
                console.log(`\n📧 ${user.email}`);
                console.log(`   ├── Status: ${getLoginStatus(user)}`);
                console.log(`   ├── Name: ${user.name || 'N/A'}`);
                console.log(`   ├── Role: ${user.role}`);
                console.log(`   ├── Last Login: ${formatLastLogin(user.lastLoginAt)}`);
                console.log(`   ├── 2FA Enabled: ${user.twoFactorEnabled ? 'Yes' : 'No'}`);
                console.log(`   ├── Phone Verified: ${user.phoneVerified ? 'Yes' : 'No'}`);
                console.log(`   ├── Identity Verified: ${user.identityVerified ? 'Yes' : 'No'}`);
                console.log(`   ├── Children: ${user.children?.length || 0}`);
                if (user.children && user.children.length > 0) {
                    user.children.forEach(child => {
                        console.log(`   │   └── ${formatChildName(child)}`);
                    });
                }
                console.log(`   └── Managed Venues: ${user.managedVenues?.length || 0}`);
                if (user.managedVenues && user.managedVenues.length > 0) {
                    user.managedVenues.forEach(venue => {
                        console.log(`       └── ${venue.name}`);
                    });
                }
            });
        }

        // Summary of accounts ready for login
        const readyForLogin = users.filter(user => user.isActive && user.password && user.password.length > 0);
        
        console.log('\n\n🚀 ACCOUNTS READY FOR LOGIN:');
        console.log('============================');
        console.log(`Total Ready: ${readyForLogin.length}\n`);
        
        if (readyForLogin.length === 0) {
            console.log('❌ No accounts ready for login');
        } else {
            readyForLogin.forEach(user => {
                const accountType = demoEmails.includes(user.email) ? '[DEMO]' : '[REGULAR]';
                console.log(`✅ ${user.email} ${accountType}`);
                console.log(`   ├── Role: ${user.role}`);
                console.log(`   ├── Name: ${user.name || 'N/A'}`);
                console.log(`   └── Last Login: ${formatLastLogin(user.lastLoginAt)}`);
            });
        }

        // Summary by role
        console.log('\n\n📊 ACCOUNTS BY ROLE:');
        console.log('====================');
        const roleGroups = {};
        readyForLogin.forEach(user => {
            if (!roleGroups[user.role]) {
                roleGroups[user.role] = [];
            }
            roleGroups[user.role].push(user);
        });

        Object.keys(roleGroups).forEach(role => {
            console.log(`\n${role}: ${roleGroups[role].length} accounts`);
            roleGroups[role].forEach(user => {
                const accountType = demoEmails.includes(user.email) ? '[DEMO]' : '[REGULAR]';
                console.log(`   └── ${user.email} ${accountType}`);
            });
        });

        // Quick login reference
        console.log('\n\n🎯 QUICK LOGIN REFERENCE FOR TESTING:');
        console.log('=====================================');
        
        if (readyForLogin.length === 0) {
            console.log('❌ No accounts ready for login');
        } else {
            console.log('The following accounts are active and ready for login:\n');
            
            readyForLogin.forEach(user => {
                const accountType = demoEmails.includes(user.email) ? 'DEMO' : 'REGULAR';
                console.log(`🔑 ${user.email} (${accountType})`);
                console.log(`   ├── Role: ${user.role}`);
                console.log(`   ├── Name: ${user.name || 'N/A'}`);
                console.log(`   ├── 2FA: ${user.twoFactorEnabled ? 'Enabled' : 'Disabled'}`);
                console.log(`   └── Type: ${accountType === 'DEMO' ? 'Demo account with test data' : 'Regular user account'}`);
                console.log('');
            });
        }

        // Testing instructions
        console.log('\n📝 TESTING INSTRUCTIONS:');
        console.log('========================');
        console.log('1. Use any account marked as "✅ READY FOR LOGIN"');
        console.log('2. Demo accounts contain test data for demonstration');
        console.log('3. Regular accounts are real user accounts');
        console.log('4. If 2FA is enabled, you\'ll need the authenticator app');
        console.log('5. Access the app at: http://localhost:3000/auth/signin');

    } catch (error) {
        console.error('❌ Error checking active accounts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkActiveAccounts();
