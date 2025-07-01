
#!/bin/bash

echo "🧪 SafePlay Testing Framework - Comprehensive Test Suite"
echo "======================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run command and check status
run_test() {
    local test_name="$1"
    local command="$2"
    
    echo -e "\n${BLUE}📋 Running: $test_name${NC}"
    echo "Command: $command"
    echo "----------------------------------------"
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $test_name - PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ $test_name - FAILED${NC}"
        return 1
    fi
}

# Counter for results
total_tests=0
passed_tests=0
failed_tests=0

# Test 1: TypeScript Compilation Check
echo -e "\n${YELLOW}🔍 Phase 1: TypeScript Compilation Check${NC}"
total_tests=$((total_tests + 1))
if run_test "TypeScript Compilation" "npx tsc --noEmit"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# Test 2: Jest Unit Tests
echo -e "\n${YELLOW}🔍 Phase 2: Unit Tests${NC}"
total_tests=$((total_tests + 1))
if run_test "Jest Unit Tests" "npx jest --passWithNoTests --verbose"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# Test 3: Component Tests
echo -e "\n${YELLOW}🔍 Phase 3: Component Tests${NC}"
total_tests=$((total_tests + 1))
if run_test "Component Tests" "npx jest --testPathPattern=components --passWithNoTests"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# Test 4: API Tests
echo -e "\n${YELLOW}🔍 Phase 4: API Integration Tests${NC}"
total_tests=$((total_tests + 1))
if run_test "API Tests" "npx jest --testPathPattern=api --passWithNoTests"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# Test 5: Library Tests
echo -e "\n${YELLOW}🔍 Phase 5: Library/Utility Tests${NC}"
total_tests=$((total_tests + 1))
if run_test "Library Tests" "npx jest --testPathPattern=lib --passWithNoTests"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# Test 6: Next.js Build Test
echo -e "\n${YELLOW}🔍 Phase 6: Next.js Build Test${NC}"
total_tests=$((total_tests + 1))
if run_test "Next.js Build" "yarn build"; then
    passed_tests=$((passed_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

# Summary
echo -e "\n${BLUE}📊 TEST SUMMARY${NC}"
echo "======================================================="
echo -e "Total Tests: ${BLUE}$total_tests${NC}"
echo -e "Passed: ${GREEN}$passed_tests${NC}"
echo -e "Failed: ${RED}$failed_tests${NC}"

if [ $failed_tests -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! Testing framework is ready.${NC}"
    exit 0
else
    echo -e "\n${RED}❌ Some tests failed. Please review the output above.${NC}"
    exit 1
fi
