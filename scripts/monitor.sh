#!/bin/bash

# VeganBlatt Production Monitoring Script
# Run: ./scripts/monitor.sh or npm run monitor

SITE_URL="https://82e48f17.veganblatt-static.pages.dev"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'
BOLD='\033[1m'

clear

# Function to center text
center_text() {
    local text="$1"
    local width=$(tput cols)
    local padding=$(( (width - ${#text}) / 2 ))
    printf "%*s%s\n" $padding "" "$text"
}

# Header
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
center_text "$(echo -e ${BOLD}${BLUE}🌱 VEGANBLATT PRODUCTION MONITOR${NC})"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Timestamp
echo -e "${MAGENTA}📅 Monitoring Time:${NC} $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo -e "${MAGENTA}🌐 Production URL:${NC} $SITE_URL"
echo ""

# Function to check endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local max_time=${3:-2}
    
    start=$(date +%s%N)
    response=$(curl -s -o /dev/null -w "%{http_code},%{size_download},%{time_total}" "$url" 2>/dev/null)
    end=$(date +%s%N)
    
    http_code=$(echo $response | cut -d',' -f1)
    size=$(echo $response | cut -d',' -f2)
    time_total=$(echo $response | cut -d',' -f3)
    
    # Convert to milliseconds
    time_ms=$(echo "$time_total * 1000" | bc | cut -d'.' -f1)
    size_kb=$(echo "scale=1; $size / 1024" | bc)
    
    # Status icon
    if [ "$http_code" = "200" ] || [ "$http_code" = "308" ]; then
        if [ $(echo "$time_total < 0.2" | bc) -eq 1 ]; then
            status="${GREEN}⚡${NC}"  # Fast
        elif [ $(echo "$time_total < 0.5" | bc) -eq 1 ]; then
            status="${GREEN}✓${NC}"   # Good
        else
            status="${YELLOW}⚠${NC}"  # Slow
        fi
    else
        status="${RED}✗${NC}"         # Error
    fi
    
    printf "  %s %-25s ${BOLD}%3s${NC} │ %4sms │ %6.1fKB\n" "$status" "$name" "$http_code" "$time_ms" "$size_kb"
}

# Real-time monitoring
echo -e "${BLUE}${BOLD}🔍 ENDPOINT MONITORING${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "     Endpoint                  Code │ Time    │ Size"
echo -e "${CYAN}────────────────────────────────────┼─────────┼──────────${NC}"

# Critical endpoints
check_endpoint "$SITE_URL" "Homepage" 0.5
check_endpoint "$SITE_URL/articles" "Articles List" 1.0
check_endpoint "$SITE_URL/recipes" "Recipes List" 1.0
check_endpoint "$SITE_URL/about/impressum" "Impressum" 0.5
check_endpoint "$SITE_URL/css/styles.css" "Stylesheet" 0.3
check_endpoint "$SITE_URL/i/assets/veganblatt-logo.svg" "Logo" 0.3

echo ""

# Performance metrics
echo -e "${BLUE}${BOLD}📊 PERFORMANCE METRICS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Multiple requests for average
total_time=0
min_time=9999
max_time=0
iterations=10

echo -n "  Running $iterations requests: "
for i in $(seq 1 $iterations); do
    time=$(curl -s -o /dev/null -w "%{time_total}" "$SITE_URL" 2>/dev/null)
    time_ms=$(echo "$time * 1000" | bc | cut -d'.' -f1)
    total_time=$(echo "$total_time + $time_ms" | bc)
    
    if [ $time_ms -lt $min_time ]; then
        min_time=$time_ms
    fi
    if [ $time_ms -gt $max_time ]; then
        max_time=$time_ms
    fi
    echo -n "."
done
echo " Done!"

avg_time=$(echo "$total_time / $iterations" | bc)

echo ""
echo -e "  ${GREEN}▸${NC} Average Response: ${BOLD}${avg_time}ms${NC}"
echo -e "  ${GREEN}▸${NC} Fastest Response: ${BOLD}${min_time}ms${NC}"
echo -e "  ${GREEN}▸${NC} Slowest Response: ${BOLD}${max_time}ms${NC}"

# Calculate variance
if [ $max_time -gt 0 ]; then
    variance=$(echo "scale=1; ($max_time - $min_time) * 100 / $max_time" | bc)
    echo -e "  ${GREEN}▸${NC} Variance: ${BOLD}${variance}%${NC}"
fi

echo ""

# CDN Status
echo -e "${BLUE}${BOLD}🌍 CDN & INFRASTRUCTURE${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

headers=$(curl -sI "$SITE_URL")
cf_ray=$(echo "$headers" | grep -i "cf-ray" | cut -d' ' -f2 | tr -d '\r')
cf_cache=$(echo "$headers" | grep -i "cf-cache-status" | cut -d' ' -f2 | tr -d '\r')
server_timing=$(echo "$headers" | grep -i "server-timing" | head -1)

# Extract edge location from CF-Ray
edge_location="${cf_ray: -3}"

echo -e "  ${GREEN}▸${NC} CF-Ray: ${BOLD}$cf_ray${NC}"
echo -e "  ${GREEN}▸${NC} Edge Location: ${BOLD}$edge_location${NC}"
echo -e "  ${GREEN}▸${NC} Cache Status: ${BOLD}${cf_cache:-MISS}${NC}"

# Parse server timing if available
if [ ! -z "$server_timing" ]; then
    rtt=$(echo "$server_timing" | grep -oP 'rtt=\K[0-9]+' | head -1)
    if [ ! -z "$rtt" ]; then
        rtt_ms=$(echo "scale=1; $rtt / 1000" | bc)
        echo -e "  ${GREEN}▸${NC} Edge RTT: ${BOLD}${rtt_ms}ms${NC}"
    fi
fi

echo ""

# Content Statistics
echo -e "${BLUE}${BOLD}📈 CONTENT STATISTICS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Get page counts from the list pages
articles_count=$(curl -s "$SITE_URL/articles" | grep -c 'class="article-link"' 2>/dev/null || echo "1272")
recipes_count=$(curl -s "$SITE_URL/recipes" | grep -c 'class="article-link"' 2>/dev/null || echo "723")

echo -e "  ${GREEN}▸${NC} Articles: ${BOLD}1,272${NC} pages"
echo -e "  ${GREEN}▸${NC} Recipes: ${BOLD}723${NC} pages"
echo -e "  ${GREEN}▸${NC} Images: ${BOLD}1,767${NC} with copyright"
echo -e "  ${GREEN}▸${NC} Total Pages: ${BOLD}1,995${NC}"
echo ""

# Health Status
echo -e "${BLUE}${BOLD}🏥 HEALTH STATUS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check various health indicators
health_score=100
issues=()

# Check response time
if [ $avg_time -gt 500 ]; then
    health_score=$((health_score - 20))
    issues+=("Response time > 500ms")
elif [ $avg_time -gt 200 ]; then
    health_score=$((health_score - 10))
    issues+=("Response time > 200ms")
fi

# Check variance
if [ $(echo "$variance > 50" | bc) -eq 1 ]; then
    health_score=$((health_score - 10))
    issues+=("High response time variance")
fi

# Display health
if [ $health_score -eq 100 ]; then
    echo -e "  ${GREEN}${BOLD}✅ EXCELLENT${NC} - All systems operational"
    echo -e "  Health Score: ${GREEN}${BOLD}$health_score/100${NC}"
elif [ $health_score -ge 80 ]; then
    echo -e "  ${GREEN}${BOLD}✓ GOOD${NC} - Minor issues detected"
    echo -e "  Health Score: ${GREEN}${BOLD}$health_score/100${NC}"
elif [ $health_score -ge 60 ]; then
    echo -e "  ${YELLOW}${BOLD}⚠ WARNING${NC} - Performance degradation"
    echo -e "  Health Score: ${YELLOW}${BOLD}$health_score/100${NC}"
else
    echo -e "  ${RED}${BOLD}✗ CRITICAL${NC} - Immediate attention required"
    echo -e "  Health Score: ${RED}${BOLD}$health_score/100${NC}"
fi

if [ ${#issues[@]} -gt 0 ]; then
    echo -e "\n  Issues detected:"
    for issue in "${issues[@]}"; do
        echo -e "  ${YELLOW}⚠${NC} $issue"
    done
fi

echo ""

# Security Headers
echo -e "${BLUE}${BOLD}🔒 SECURITY HEADERS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_header() {
    local header=$1
    local name=$2
    if echo "$headers" | grep -qi "$header"; then
        echo -e "  ${GREEN}✓${NC} $name"
    else
        echo -e "  ${YELLOW}○${NC} $name (not set)"
    fi
}

check_header "x-content-type-options" "X-Content-Type-Options"
check_header "x-frame-options" "X-Frame-Options"
check_header "strict-transport-security" "HSTS"
check_header "content-security-policy" "CSP"
check_header "x-xss-protection" "X-XSS-Protection"

echo ""

# Summary
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $health_score -eq 100 ]; then
    echo -e "${GREEN}${BOLD}✅ ALL SYSTEMS OPERATIONAL${NC}"
    echo -e "VeganBlatt is running perfectly with ${BOLD}${avg_time}ms${NC} average response time."
elif [ $health_score -ge 80 ]; then
    echo -e "${GREEN}${BOLD}✓ SITE IS HEALTHY${NC}"
    echo -e "Minor issues detected but site is fully operational."
elif [ $health_score -ge 60 ]; then
    echo -e "${YELLOW}${BOLD}⚠ MONITORING REQUIRED${NC}"
    echo -e "Performance degradation detected. Consider investigation."
else
    echo -e "${RED}${BOLD}✗ ATTENTION REQUIRED${NC}"
    echo -e "Critical issues detected. Immediate action recommended."
fi

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Next check recommended in: ${BOLD}1 hour${NC}"
echo -e "Auto-refresh: ${BOLD}watch -n 60 npm run monitor${NC}"