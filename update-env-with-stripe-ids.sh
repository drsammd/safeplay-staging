
#!/bin/bash

# Script to update .env file with new Stripe price IDs
# Usage: ./update-env-with-stripe-ids.sh

echo "🔧 Stripe Price ID Environment Updater"
echo "======================================"

ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found!"
    exit 1
fi

echo "📄 Current .env file found"
echo ""

echo "Please provide the new Stripe Price IDs from the admin interface:"
echo ""

# Starter Plan
read -p "🟢 Starter Monthly Price ID: " STARTER_MONTHLY
read -p "🟢 Starter Yearly Price ID: " STARTER_YEARLY

# Professional Plan  
read -p "🔵 Professional Monthly Price ID: " PROFESSIONAL_MONTHLY
read -p "🔵 Professional Yearly Price ID: " PROFESSIONAL_YEARLY

# Enterprise Plan
read -p "🟣 Enterprise Monthly Price ID: " ENTERPRISE_MONTHLY
read -p "🟣 Enterprise Yearly Price ID: " ENTERPRISE_YEARLY

echo ""
echo "📝 Updating .env file..."

# Update or add each environment variable
update_env_var() {
    local key=$1
    local value=$2
    
    if grep -q "^${key}=" "$ENV_FILE"; then
        # Update existing variable
        sed -i "s/^${key}=.*/${key}=\"${value}\"/" "$ENV_FILE"
        echo "✅ Updated $key"
    else
        # Add new variable
        echo "${key}=\"${value}\"" >> "$ENV_FILE"
        echo "➕ Added $key"
    fi
}

# Update all variables
update_env_var "STRIPE_STARTER_MONTHLY_PRICE_ID" "$STARTER_MONTHLY"
update_env_var "STRIPE_STARTER_YEARLY_PRICE_ID" "$STARTER_YEARLY"
update_env_var "STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID" "$PROFESSIONAL_MONTHLY"
update_env_var "STRIPE_PROFESSIONAL_YEARLY_PRICE_ID" "$PROFESSIONAL_YEARLY"
update_env_var "STRIPE_ENTERPRISE_MONTHLY_PRICE_ID" "$ENTERPRISE_MONTHLY"
update_env_var "STRIPE_ENTERPRISE_YEARLY_PRICE_ID" "$ENTERPRISE_YEARLY"

echo ""
echo "✅ Environment variables updated successfully!"
echo ""
echo "🔄 Please restart your development server for changes to take effect:"
echo "   npm run dev  or  yarn dev"
echo ""
echo "🧪 Test the new pricing structure at:"
echo "   http://localhost:3000/parent/subscription"
echo ""
echo "🎯 Summary of updated variables:"
echo "   STRIPE_STARTER_MONTHLY_PRICE_ID = $STARTER_MONTHLY"
echo "   STRIPE_STARTER_YEARLY_PRICE_ID = $STARTER_YEARLY"
echo "   STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID = $PROFESSIONAL_MONTHLY"
echo "   STRIPE_PROFESSIONAL_YEARLY_PRICE_ID = $PROFESSIONAL_YEARLY"
echo "   STRIPE_ENTERPRISE_MONTHLY_PRICE_ID = $ENTERPRISE_MONTHLY"
echo "   STRIPE_ENTERPRISE_YEARLY_PRICE_ID = $ENTERPRISE_YEARLY"
