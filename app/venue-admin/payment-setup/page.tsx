
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Building, 
  CheckCircle, 
  AlertCircle,
  DollarSign,
  Shield,
  Globe,
  FileText,
  Zap,
  Users,
  TrendingUp,
  Settings
} from 'lucide-react';

interface PaymentSetupStatus {
  accountCreated: boolean;
  businessVerified: boolean;
  bankAccountAdded: boolean;
  payoutsEnabled: boolean;
  completionPercentage: number;
}

interface PaymentSettings {
  processingFee: number;
  payoutSchedule: string;
  currency: string;
  minimumPayout: number;
  autoPayouts: boolean;
}

const SETUP_STATUS: PaymentSetupStatus = {
  accountCreated: true,
  businessVerified: false,
  bankAccountAdded: false,
  payoutsEnabled: false,
  completionPercentage: 25
};

const PAYMENT_SETTINGS: PaymentSettings = {
  processingFee: 2.9,
  payoutSchedule: 'daily',
  currency: 'USD',
  minimumPayout: 25,
  autoPayouts: true
};

export default function PaymentSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [setupStatus, setSetupStatus] = useState<PaymentSetupStatus>(SETUP_STATUS);
  const [activeTab, setActiveTab] = useState('overview');
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    taxId: '',
    businessAddress: '',
    businessPhone: '',
    businessEmail: '',
    accountHolderName: '',
    routingNumber: '',
    accountNumber: '',
    bankName: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    
    if (!['VENUE_ADMIN', 'SUPER_ADMIN', 'ADMIN'].includes(session.user?.role)) {
      router.push('/unauthorized');
      return;
    }

    // Prefill form with session data
    setFormData(prev => ({
      ...prev,
      businessEmail: session.user?.email || '',
      businessName: session.user?.name || ''
    }));
  }, [session, status, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSetupStatus(prev => ({
        ...prev,
        businessVerified: true,
        completionPercentage: 50
      }));
      
      alert('Business information submitted successfully!');
    } catch (error) {
      alert('Error submitting business information');
    } finally {
      setLoading(false);
    }
  };

  const handleBankAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSetupStatus(prev => ({
        ...prev,
        bankAccountAdded: true,
        payoutsEnabled: true,
        completionPercentage: 100
      }));
      
      alert('Bank account added successfully!');
    } catch (error) {
      alert('Error adding bank account');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (completed: boolean) => {
    if (completed) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <AlertCircle className="h-5 w-5 text-gray-400" />;
  };

  const getStatusColor = (completed: boolean) => {
    return completed ? 'text-green-600' : 'text-gray-600';
  };

  if (status === 'loading') {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading payment setup...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Setup</h1>
          <p className="text-gray-600">Configure your venue's payment processing and payouts</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={setupStatus.completionPercentage === 100 ? "default" : "secondary"}>
            {setupStatus.completionPercentage}% Complete
          </Badge>
        </div>
      </div>

      {/* Setup Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Setup Progress
          </CardTitle>
          <CardDescription>
            Complete these steps to start accepting payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{setupStatus.completionPercentage}%</span>
            </div>
            <Progress value={setupStatus.completionPercentage} className="h-2" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="flex items-center space-x-3">
                {getStatusIcon(setupStatus.accountCreated)}
                <div>
                  <p className={`font-medium ${getStatusColor(setupStatus.accountCreated)}`}>
                    Account Created
                  </p>
                  <p className="text-xs text-gray-500">Stripe Connect account</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {getStatusIcon(setupStatus.businessVerified)}
                <div>
                  <p className={`font-medium ${getStatusColor(setupStatus.businessVerified)}`}>
                    Business Verified
                  </p>
                  <p className="text-xs text-gray-500">Tax ID and details</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {getStatusIcon(setupStatus.bankAccountAdded)}
                <div>
                  <p className={`font-medium ${getStatusColor(setupStatus.bankAccountAdded)}`}>
                    Bank Account
                  </p>
                  <p className="text-xs text-gray-500">For payouts</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {getStatusIcon(setupStatus.payoutsEnabled)}
                <div>
                  <p className={`font-medium ${getStatusColor(setupStatus.payoutsEnabled)}`}>
                    Payouts Enabled
                  </p>
                  <p className="text-xs text-gray-500">Ready to receive</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="business">Business Info</TabsTrigger>
          <TabsTrigger value="banking">Banking</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
                <CardDescription>Steps to complete your payment setup</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Provide Business Information</h4>
                      <p className="text-sm text-gray-600">
                        Tell us about your venue, including tax information and business details
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Add Bank Account</h4>
                      <p className="text-sm text-gray-600">
                        Connect your bank account to receive payouts from transactions
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-blue-600">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Start Accepting Payments</h4>
                      <p className="text-sm text-gray-600">
                        Once verified, you can start processing customer payments
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Features</CardTitle>
                <CardDescription>What you get with SafePlay payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Secure Processing</p>
                      <p className="text-sm text-gray-600">Bank-level security and fraud protection</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Fast Payouts</p>
                      <p className="text-sm text-gray-600">Daily automatic payouts to your bank</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Multi-Currency</p>
                      <p className="text-sm text-gray-600">Accept payments in multiple currencies</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium">Analytics</p>
                      <p className="text-sm text-gray-600">Detailed transaction and revenue reports</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Business Information</CardTitle>
              <CardDescription>
                Provide your business details for payment processing verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBusinessInfoSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="Your Venue Name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Input
                      id="businessType"
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      placeholder="e.g., Entertainment Venue, Family Entertainment"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / EIN *</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => handleInputChange('taxId', e.target.value)}
                      placeholder="12-3456789"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessPhone">Business Phone *</Label>
                    <Input
                      id="businessPhone"
                      value={formData.businessPhone}
                      onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                    placeholder="123 Main St, City, State 12345"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessEmail">Business Email *</Label>
                  <Input
                    id="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                    placeholder="business@venue.com"
                    required
                  />
                </div>

                <Alert>
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Your business information will be verified with tax authorities and may take 1-2 business days to complete.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  disabled={loading || setupStatus.businessVerified}
                  className="w-full"
                >
                  {loading ? 'Submitting...' : 
                   setupStatus.businessVerified ? 'Business Information Verified' : 
                   'Submit Business Information'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banking" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Bank Account Information</CardTitle>
              <CardDescription>
                Connect your bank account to receive payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleBankAccountSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="accountHolderName">Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={(e) => handleInputChange('accountHolderName', e.target.value)}
                    placeholder="Business Name or Owner Name"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="routingNumber">Routing Number *</Label>
                    <Input
                      id="routingNumber"
                      value={formData.routingNumber}
                      onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                      placeholder="123456789"
                      maxLength={9}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      placeholder="1234567890"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder="Bank of America"
                    required
                  />
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Your bank account information is encrypted and securely stored. We'll verify your account with small deposits.
                  </AlertDescription>
                </Alert>

                <Button 
                  type="submit" 
                  disabled={loading || setupStatus.bankAccountAdded || !setupStatus.businessVerified}
                  className="w-full"
                >
                  {loading ? 'Adding Account...' : 
                   setupStatus.bankAccountAdded ? 'Bank Account Added' : 
                   'Add Bank Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Payment Settings</CardTitle>
                <CardDescription>Configure your payment processing options</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Processing Fee</p>
                      <p className="text-sm text-gray-600">Standard rate for all transactions</p>
                    </div>
                    <Badge variant="outline">{PAYMENT_SETTINGS.processingFee}%</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Payout Schedule</p>
                      <p className="text-sm text-gray-600">How often you receive payments</p>
                    </div>
                    <Badge variant="outline">
                      {PAYMENT_SETTINGS.payoutSchedule === 'daily' ? 'Daily' : 'Weekly'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Currency</p>
                      <p className="text-sm text-gray-600">Primary currency for transactions</p>
                    </div>
                    <Badge variant="outline">{PAYMENT_SETTINGS.currency}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Minimum Payout</p>
                      <p className="text-sm text-gray-600">Minimum amount for automatic payouts</p>
                    </div>
                    <Badge variant="outline">${PAYMENT_SETTINGS.minimumPayout}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>Current status of your payment account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Account Status</span>
                    <Badge className={setupStatus.completionPercentage === 100 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                      {setupStatus.completionPercentage === 100 ? 'Active' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Payouts</span>
                    <Badge className={setupStatus.payoutsEnabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {setupStatus.payoutsEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Last Payout</span>
                    <span className="text-sm text-gray-600">
                      {setupStatus.payoutsEnabled ? 'Never' : 'Setup required'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Available Balance</span>
                    <span className="text-sm text-gray-600">$0.00</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
