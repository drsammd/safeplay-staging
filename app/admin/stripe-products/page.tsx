
"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  DollarSign, 
  Archive, 
  RefreshCw, 
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface StripeProduct {
  id: string;
  name: string;
  description: string;
  active: boolean;
  created: string;
  metadata: Record<string, string>;
  prices: {
    id: string;
    amount: number | null;
    currency: string;
    recurring: {
      interval: string;
    } | null;
    type: string;
  }[];
}

interface CreatedProduct {
  productId: string;
  name: string;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
  lifetimePriceId?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  lifetimePrice?: number;
}

export default function StripeProductsPage() {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [newProducts, setNewProducts] = useState<CreatedProduct[]>([]);
  const [envVariables, setEnvVariables] = useState<Record<string, string>>({});
  const [showEnvVariables, setShowEnvVariables] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/stripe/products/list');
      const data = await response.json();
      
      if (data.success) {
        setProducts(data.products);
        toast.success(`Loaded ${data.products.length} products from Stripe`);
      } else {
        toast.error(data.error || 'Failed to load products');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const createNewPricingStructure = async () => {
    try {
      setCreating(true);
      
      toast.info('Creating new pricing structure in Stripe...');
      
      const response = await fetch('/api/admin/stripe/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setNewProducts(data.products);
        setEnvVariables(data.envVariables);
        
        toast.success(
          `✅ Created ${data.products.length} products with ${data.summary.totalPrices} prices!`
        );
        
        // Refresh the products list
        await fetchProducts();
      } else {
        toast.error(data.error || 'Failed to create pricing structure');
      }
    } catch (error) {
      console.error('Error creating pricing structure:', error);
      toast.error('Failed to create pricing structure');
    } finally {
      setCreating(false);
    }
  };

  const archiveSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Please select products to archive');
      return;
    }

    try {
      setArchiving(true);
      
      const response = await fetch('/api/admin/stripe/products/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds: selectedProducts
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Archived ${selectedProducts.length} products`);
        setSelectedProducts([]);
        await fetchProducts();
      } else {
        toast.error(data.error || 'Failed to archive products');
      }
    } catch (error) {
      console.error('Error archiving products:', error);
      toast.error('Failed to archive products');
    } finally {
      setArchiving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const copyAllEnvVariables = () => {
    const envText = Object.entries(envVariables)
      .map(([key, value]) => `${key}="${value}"`)
      .join('\n');
    
    navigator.clipboard.writeText(envText);
    toast.success('All environment variables copied to clipboard!');
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatPrice = (amount: number | null, currency: string = 'usd') => {
    if (amount === null) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stripe Product Management</h1>
          <p className="text-gray-600 mt-2">
            Manage subscription products and pricing programmatically
          </p>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={fetchProducts}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={createNewPricingStructure}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {creating ? 'Creating...' : 'Create New Structure'}
          </Button>
        </div>
      </div>

      {/* New Products Created */}
      {newProducts.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">New Pricing Structure Created!</CardTitle>
            </div>
            <CardDescription className="text-green-700">
              Successfully created {newProducts.length} products with new pricing structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {newProducts.map((product, index) => (
                <div key={product.productId} className="p-4 bg-white rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      New
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {product.monthlyPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monthly:</span>
                        <span className="font-medium">${product.monthlyPrice}/mo</span>
                      </div>
                    )}
                    {product.yearlyPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Yearly:</span>
                        <span className="font-medium">${product.yearlyPrice}/yr</span>
                      </div>
                    )}
                    {product.lifetimePrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Lifetime:</span>
                        <span className="font-medium">${product.lifetimePrice}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Environment Variables */}
            {Object.keys(envVariables).length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Environment Variables</h4>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowEnvVariables(!showEnvVariables)}
                      variant="outline"
                      size="sm"
                    >
                      {showEnvVariables ? (
                        <><EyeOff className="h-4 w-4 mr-2" /> Hide</>
                      ) : (
                        <><Eye className="h-4 w-4 mr-2" /> Show</>
                      )}
                    </Button>
                    <Button
                      onClick={copyAllEnvVariables}
                      variant="outline"
                      size="sm"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy All
                    </Button>
                  </div>
                </div>
                
                {showEnvVariables && (
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm space-y-1 max-h-64 overflow-y-auto">
                    {Object.entries(envVariables).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between group">
                        <span>{key}="{value}"</span>
                        <Button
                          onClick={() => copyToClipboard(`${key}="${value}"`)}
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 text-green-400 hover:text-green-300 h-6 w-6 p-0"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing Products */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Existing Stripe Products</span>
              </CardTitle>
              <CardDescription>
                {products.length} products found in your Stripe account
              </CardDescription>
            </div>
            
            {selectedProducts.length > 0 && (
              <Button
                onClick={archiveSelectedProducts}
                disabled={archiving}
                variant="outline"
                className="text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Selected ({selectedProducts.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading products...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-4">Create your first pricing structure to get started</p>
              <Button onClick={createNewPricingStructure} disabled={creating}>
                <Plus className="h-4 w-4 mr-2" />
                Create Pricing Structure
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    selectedProducts.includes(product.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProducts([...selectedProducts, product.id]);
                          } else {
                            setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                          }
                        }}
                        className="mt-1"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{product.name}</h4>
                          <Badge variant={product.active ? "default" : "secondary"}>
                            {product.active ? 'Active' : 'Inactive'}
                          </Badge>
                          {product.metadata?.managedBy === 'SafePlay' && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              SafePlay Managed
                            </Badge>
                          )}
                        </div>
                        
                        {product.description && (
                          <p className="text-gray-600 text-sm mb-3">{product.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {product.prices.map((price) => (
                            <div key={price.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                                <span className="font-medium text-gray-900">
                                  {formatPrice(price.amount, price.currency)}
                                </span>
                                {price.recurring && (
                                  <span className="text-gray-500 text-sm ml-1">
                                    /{price.recurring.interval}
                                  </span>
                                )}
                              </div>
                              <Button
                                onClick={() => copyToClipboard(price.id)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                          <span>Created: {formatDate(product.created)}</span>
                          <span className="font-mono">{product.id}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => copyToClipboard(product.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <span>How to Use</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Creating New Structure:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Click "Create New Structure" to generate Sam's 4-tier pricing</li>
                <li>Copy the generated environment variables</li>
                <li>Update your .env file with the new price IDs</li>
                <li>Deploy the updated configuration</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Managing Existing Products:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li>Select products you want to archive</li>
                <li>Click "Archive Selected" to hide them from new signups</li>
                <li>Existing customers keep their current plans</li>
                <li>Copy price IDs as needed for configuration</li>
              </ol>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Sam's New Pricing Structure:</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">Free Plan</div>
                <div className="text-gray-600">$0 - Basic features</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">Starter Plan</div>
                <div className="text-gray-600">$9.99/mo | $100/yr</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">Professional Plan</div>
                <div className="text-gray-600">$19.99/mo | $200/yr</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="font-medium text-gray-900">Enterprise Plan</div>
                <div className="text-gray-600">$29.99/mo | $300/yr</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
