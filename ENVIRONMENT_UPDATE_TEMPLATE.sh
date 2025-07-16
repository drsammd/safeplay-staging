
#!/bin/bash

# SafePlay™ Environment Variable Update Script
# This script will update the .env file with real Stripe price IDs

echo "🔧 SafePlay™ Stripe Configuration Update"
echo "========================================"

# Backup current .env file
echo "📋 Creating backup of current .env file..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
echo "✅ Backup created"

# Function to update environment variable
update_env_var() {
    local var_name=$1
    local new_value=$2
    local file_path=".env"
    
    if grep -q "^${var_name}=" "$file_path"; then
        # Variable exists, update it
        sed -i "s|^${var_name}=.*|${var_name}=\"${new_value}\"|" "$file_path"
        echo "✅ Updated ${var_name}"
    else
        # Variable doesn't exist, add it
        echo "${var_name}=\"${new_value}\"" >> "$file_path"
        echo "✅ Added ${var_name}"
    fi
}

echo ""
echo "📝 Please provide your real Stripe price IDs:"
echo "   (Find these in your Stripe Dashboard > Products > [Product Name])"
echo ""

# Option A: Update with existing products
read -p "📦 Basic Plan Monthly Price ID (price_...): " BASIC_MONTHLY
read -p "📦 Premium Plan Monthly Price ID (price_...): " PREMIUM_MONTHLY  
read -p "📦 Family Plan Monthly Price ID (price_...): " FAMILY_MONTHLY
read -p "📦 Lifetime Plan Price ID (price_...): " LIFETIME

echo ""
echo "🔄 Updating environment variables..."

# Update the environment variables
update_env_var "STRIPE_BASIC_MONTHLY_PRICE_ID" "$BASIC_MONTHLY"
update_env_var "STRIPE_PREMIUM_MONTHLY_PRICE_ID" "$PREMIUM_MONTHLY"
update_env_var "STRIPE_ENTERPRISE_MONTHLY_PRICE_ID" "$FAMILY_MONTHLY"
update_env_var "STRIPE_LIFETIME_PRICE_ID" "$LIFETIME"

echo ""
echo "✅ Environment variables updated successfully!"
echo ""
echo "📊 Updated Configuration:"
echo "========================"
echo "Basic Plan Monthly: $BASIC_MONTHLY"
echo "Premium Plan Monthly: $PREMIUM_MONTHLY"
echo "Family Plan Monthly: $FAMILY_MONTHLY" 
echo "Lifetime Plan: $LIFETIME"
echo ""
echo "🚀 Next Steps:"
echo "1. Restart your development server: yarn dev"
echo "2. Test subscription creation in the application"
echo "3. Verify payments work in Stripe dashboard"
echo ""
echo "🔍 To verify the updates:"
echo "   cat .env | grep STRIPE_.*_PRICE_ID"
echo ""
echo "📁 Backup file location:"
echo "   .env.backup.$(date +%Y%m%d_%H%M%S)"
