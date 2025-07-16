
// @ts-nocheck

import { stripe } from './config';

export interface ProductDefinition {
  name: string;
  description: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  lifetimePrice?: number;
  features: string[];
  metadata: Record<string, string>;
}

export interface CreatedProduct {
  productId: string;
  name: string;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
  lifetimePriceId?: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  lifetimePrice?: number;
}

export class ProductManagementService {
  
  /**
   * Create or update a product and its prices in Stripe
   */
  async createOrUpdateProduct(definition: ProductDefinition): Promise<CreatedProduct> {
    try {
      console.log('🏭 Creating/updating product:', definition.name);
      
      // Create the product
      const product = await stripe.products.create({
        name: definition.name,
        description: definition.description,
        metadata: {
          ...definition.metadata,
          managedBy: 'SafePlay',
          createdAt: new Date().toISOString()
        }
      });

      console.log('✅ Product created:', product.id);

      const result: CreatedProduct = {
        productId: product.id,
        name: product.name
      };

      // Create monthly price if specified
      if (definition.monthlyPrice) {
        const monthlyPrice = await stripe.prices.create({
          product: product.id,
          currency: 'usd',
          unit_amount: Math.round(definition.monthlyPrice * 100), // Convert to cents
          recurring: {
            interval: 'month'
          },
          metadata: {
            planType: definition.metadata.planType || 'UNKNOWN',
            billingInterval: 'MONTHLY'
          }
        });
        
        result.monthlyPriceId = monthlyPrice.id;
        result.monthlyPrice = definition.monthlyPrice;
        console.log('✅ Monthly price created:', monthlyPrice.id);
      }

      // Create yearly price if specified
      if (definition.yearlyPrice) {
        const yearlyPrice = await stripe.prices.create({
          product: product.id,
          currency: 'usd',
          unit_amount: Math.round(definition.yearlyPrice * 100), // Convert to cents
          recurring: {
            interval: 'year'
          },
          metadata: {
            planType: definition.metadata.planType || 'UNKNOWN',
            billingInterval: 'YEARLY'
          }
        });
        
        result.yearlyPriceId = yearlyPrice.id;
        result.yearlyPrice = definition.yearlyPrice;
        console.log('✅ Yearly price created:', yearlyPrice.id);
      }

      // Create lifetime price if specified
      if (definition.lifetimePrice) {
        const lifetimePrice = await stripe.prices.create({
          product: product.id,
          currency: 'usd',
          unit_amount: Math.round(definition.lifetimePrice * 100), // Convert to cents
          metadata: {
            planType: definition.metadata.planType || 'UNKNOWN',
            billingInterval: 'LIFETIME'
          }
        });
        
        result.lifetimePriceId = lifetimePrice.id;
        result.lifetimePrice = definition.lifetimePrice;
        console.log('✅ Lifetime price created:', lifetimePrice.id);
      }

      return result;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      throw error;
    }
  }

  /**
   * Create Sam's new 4-tier pricing structure
   */
  async createNewPricingStructure(): Promise<{
    products: CreatedProduct[];
    envVariables: Record<string, string>;
  }> {
    try {
      console.log('🚀 Creating Sam\'s new 4-tier pricing structure...');

      const productDefinitions: ProductDefinition[] = [
        {
          name: 'Free Plan',
          description: 'Basic safety monitoring for getting started',
          features: [
            'Basic safety monitoring',
            'Up to 1 child',
            'Essential alerts',
            'Mobile app access'
          ],
          metadata: {
            planType: 'FREE',
            tier: '1'
          }
        },
        {
          name: 'Starter Plan',
          description: 'Perfect for small families with enhanced features',
          monthlyPrice: 9.99,
          yearlyPrice: 100.00,
          features: [
            'Up to 2 children',
            'Enhanced safety alerts',
            'Photo/video downloads (25/month)',
            'Email support',
            'Real-time tracking'
          ],
          metadata: {
            planType: 'STARTER',
            tier: '2'
          }
        },
        {
          name: 'Professional Plan',
          description: 'Advanced features for active families',
          monthlyPrice: 19.99,
          yearlyPrice: 200.00,
          features: [
            'Up to 5 children',
            'Premium alerts & insights',
            'AI-powered safety analysis',
            'Unlimited downloads',
            'Priority support',
            'Advanced analytics'
          ],
          metadata: {
            planType: 'PROFESSIONAL',
            tier: '3'
          }
        },
        {
          name: 'Enterprise Plan',
          description: 'Comprehensive solution for large families',
          monthlyPrice: 29.99,
          yearlyPrice: 300.00,
          features: [
            'Unlimited children',
            'All premium features',
            'Family sharing & management',
            'Biometric features',
            'White-glove support',
            'Custom integrations'
          ],
          metadata: {
            planType: 'ENTERPRISE',
            tier: '4'
          }
        }
      ];

      console.log('📋 Creating products in Stripe...');
      const products: CreatedProduct[] = [];
      
      for (const definition of productDefinitions) {
        const product = await this.createOrUpdateProduct(definition);
        products.push(product);
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Generate environment variables for the new price IDs
      const envVariables: Record<string, string> = {};
      
      products.forEach(product => {
        const planType = product.name.replace(' Plan', '').toUpperCase();
        
        if (product.monthlyPriceId) {
          envVariables[`STRIPE_${planType}_MONTHLY_PRICE_ID`] = product.monthlyPriceId;
        }
        if (product.yearlyPriceId) {
          envVariables[`STRIPE_${planType}_YEARLY_PRICE_ID`] = product.yearlyPriceId;
        }
        if (product.lifetimePriceId) {
          envVariables[`STRIPE_${planType}_LIFETIME_PRICE_ID`] = product.lifetimePriceId;
        }
      });

      console.log('✅ All products created successfully!');
      console.log('📝 Generated environment variables:', envVariables);

      return {
        products,
        envVariables
      };
    } catch (error) {
      console.error('❌ Error creating pricing structure:', error);
      throw error;
    }
  }

  /**
   * List all existing products in Stripe
   */
  async listExistingProducts(): Promise<any[]> {
    try {
      console.log('📋 Fetching existing Stripe products...');
      
      const products = await stripe.products.list({
        limit: 100,
        expand: ['data.default_price']
      });

      const productDetails = await Promise.all(
        products.data.map(async (product) => {
          // Get all prices for this product
          const prices = await stripe.prices.list({
            product: product.id,
            limit: 10
          });

          return {
            id: product.id,
            name: product.name,
            description: product.description,
            active: product.active,
            created: new Date(product.created * 1000).toISOString(),
            metadata: product.metadata,
            prices: prices.data.map(price => ({
              id: price.id,
              amount: price.unit_amount ? price.unit_amount / 100 : null,
              currency: price.currency,
              recurring: price.recurring,
              type: price.type
            }))
          };
        })
      );

      console.log('✅ Retrieved', productDetails.length, 'products from Stripe');
      return productDetails;
    } catch (error) {
      console.error('❌ Error listing products:', error);
      throw error;
    }
  }

  /**
   * Archive old products (keep for existing customers, hide from new signups)
   */
  async archiveProducts(productIds: string[]): Promise<void> {
    try {
      console.log('📦 Archiving products:', productIds);
      
      for (const productId of productIds) {
        await stripe.products.update(productId, {
          active: false,
          metadata: {
            archived: 'true',
            archivedAt: new Date().toISOString(),
            reason: 'Replaced by new pricing structure'
          }
        });
        console.log('✅ Archived product:', productId);
      }
    } catch (error) {
      console.error('❌ Error archiving products:', error);
      throw error;
    }
  }

  /**
   * Generate plan configuration for application
   */
  generatePlanConfiguration(products: CreatedProduct[]): any {
    const plans: any = {};
    
    products.forEach(product => {
      const planKey = product.name.toLowerCase().replace(' plan', '').replace(' ', '_');
      
      plans[planKey] = {
        id: planKey,
        name: product.name,
        productId: product.productId,
        monthlyPriceId: product.monthlyPriceId,
        yearlyPriceId: product.yearlyPriceId,
        lifetimePriceId: product.lifetimePriceId,
        monthlyPrice: product.monthlyPrice,
        yearlyPrice: product.yearlyPrice,
        lifetimePrice: product.lifetimePrice
      };
    });
    
    return plans;
  }
}

export const productManagementService = new ProductManagementService();
