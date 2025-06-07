#!/bin/bash

# Script to run tests inside Docker
echo "🧪 Running tests in Docker..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if .env.test exists, if not copy from .env.example
if [ ! -f .env.test ]; then
    echo -e "${YELLOW}Creating .env.test from .env.example...${NC}"
    cp .env.example .env.test
    # Update some values for testing
    sed -i 's/ENVIRONMENT=.*/ENVIRONMENT=test/' .env.test
    sed -i 's/DEBUG=.*/DEBUG=True/' .env.test
fi

# Build the test Docker image
echo -e "${GREEN}Building test Docker image...${NC}"
docker-compose -f docker-compose.test.yml build

# Run the tests
echo -e "${GREEN}Running tests...${NC}"
docker-compose -f docker-compose.test.yml up --abort-on-container-exit --exit-code-from tests

# Capture the exit code
TEST_EXIT_CODE=$?

# Clean up
echo -e "${GREEN}Cleaning up...${NC}"
docker-compose -f docker-compose.test.yml down -v

# Exit with the test exit code
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Tests failed!${NC}"
fi

exit $TEST_EXIT_CODE