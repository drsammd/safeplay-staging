
import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Payment Setup Complete | SafePlay Venue Admin',
  description: 'Your Stripe Connect account has been set up',
};

export const dynamic = 'force-dynamic';

export default async function PaymentSetupCompletePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold">Payment Setup Complete!</h1>
              <p className="text-gray-600 mt-2">
                Your Stripe Connect account has been successfully configured. 
                You'll start receiving revenue sharing payments based on your venue's activity.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Revenue sharing is now active for your venue</li>
                <li>• Payments are processed weekly by default</li>
                <li>• You can track earnings in your venue dashboard</li>
                <li>• Payouts will appear in your connected bank account</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <Button asChild>
                <Link href="/venue-admin">
                  Go to Dashboard
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/venue-admin/payment-setup">
                  View Payment Settings
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
