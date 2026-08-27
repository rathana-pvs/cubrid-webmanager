#!/usr/bin/env bash
set -euo pipefail

# Configuration
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPSTREAM_URL="${UPSTREAM_URL:-git@github.com:CUBRID/cubrid-webmanager-e2e.git}"
UPSTREAM_BRANCH="${UPSTREAM_BRANCH:-main}"
CACHE_DIR="${TMPDIR:-/tmp}/cubrid-webmanager-e2e-sync"

LOCAL_TESTS_DIR="$REPO_ROOT/e2e/shared/tests"
LOCAL_PAGES_DIR="$REPO_ROOT/e2e/shared/pages"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}======================================================${NC}"
echo -e "${CYAN}   CUBRID Web Manager E2E Upstream Sync Checker       ${NC}"
echo -e "${CYAN}======================================================${NC}"

# Fetch or clone upstream
if [ -d "$CACHE_DIR/.git" ]; then
  echo -e "Updating cached upstream repository in ${YELLOW}$CACHE_DIR${NC}..."
  (cd "$CACHE_DIR" && git fetch origin "$UPSTREAM_BRANCH" --quiet && git checkout "$UPSTREAM_BRANCH" --quiet && git reset --hard "origin/$UPSTREAM_BRANCH" --quiet)
else
  echo -e "Cloning upstream repository from ${YELLOW}$UPSTREAM_URL${NC}..."
  rm -rf "$CACHE_DIR"
  git clone --branch "$UPSTREAM_BRANCH" --depth 1 "$UPSTREAM_URL" "$CACHE_DIR" --quiet
fi

UPSTREAM_TESTS_DIR="$CACHE_DIR/tests"
UPSTREAM_PAGES_DIR="$CACHE_DIR/pages"

echo ""
echo -e "${CYAN}--- Test Specs Status ---${NC}"

NEW_SPECS=()
for file in "$UPSTREAM_TESTS_DIR"/*.spec.js; do
  [ -e "$file" ] || continue
  filename="$(basename "$file")"
  if [ ! -f "$LOCAL_TESTS_DIR/$filename" ]; then
    NEW_SPECS+=("$filename")
    echo -e "  [${GREEN}NEW IN UPSTREAM${NC}]  $filename"
  fi
done

if [ ${#NEW_SPECS[@]} -eq 0 ]; then
  echo -e "  ${GREEN}✓ All upstream test specs exist locally in e2e/shared/tests/${NC}"
fi

LOCAL_ONLY_SPECS=()
for file in "$LOCAL_TESTS_DIR"/*.spec.js; do
  [ -e "$file" ] || continue
  filename="$(basename "$file")"
  if [ ! -f "$UPSTREAM_TESTS_DIR/$filename" ]; then
    LOCAL_ONLY_SPECS+=("$filename")
    echo -e "  [${YELLOW}LOCAL ONLY${NC}]       $filename"
  fi
done

echo ""
echo -e "${CYAN}--- Page Objects Comparison ---${NC}"

for file in "$UPSTREAM_PAGES_DIR"/*.js; do
  [ -e "$file" ] || continue
  filename="$(basename "$file")"
  local_file="$LOCAL_PAGES_DIR/$filename"
  if [ ! -f "$local_file" ]; then
    echo -e "  [${RED}MISSING LOCAL PAGE${NC}] $filename"
  else
    if diff -q "$file" "$local_file" > /dev/null 2>&1; then
      echo -e "  [${GREEN}IDENTICAL${NC}]          $filename"
    else
      echo -e "  [${YELLOW}DIVERGED${NC}]           $filename (has local adaptations)"
    fi
  fi
done

echo ""
echo -e "${CYAN}======================================================${NC}"
echo -e "Summary:"
echo -e "  - Upstream specs count: $(find "$UPSTREAM_TESTS_DIR" -name "*.spec.js" | wc -l)"
echo -e "  - Local shared specs:   $(find "$LOCAL_TESTS_DIR" -name "*.spec.js" | wc -l)"
echo -e "  - New specs to port:    ${#NEW_SPECS[@]}"
echo -e "${CYAN}======================================================${NC}"
