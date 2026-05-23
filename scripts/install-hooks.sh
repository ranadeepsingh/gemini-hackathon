#!/bin/bash

# Ensure we are in the root of the git repo
GIT_DIR=$(git rev-parse --git-dir 2>/dev/null)
if [ -z "$GIT_DIR" ]; then
  echo "Error: Not a git repository or not in the root directory."
  exit 1
fi

HOOK_PATH="$GIT_DIR/hooks/pre-commit"

echo "Installing local pre-commit hook..."

# Create pre-commit hook
cat << 'EOF' > "$HOOK_PATH"
#!/bin/bash

# Pre-commit hook to prevent secret leaks and sensitive file commits.

# 1. Check for specific highly sensitive files being staged
SENSITIVE_FILES=(".env.local" "gcp-key.json" "service-account.json" "credentials.json")
STAGED_FILES=$(git diff --cached --name-only)

for file in $STAGED_FILES; do
  for sensitive in "${SENSITIVE_FILES[@]}"; do
    if [[ "$file" == *"$sensitive"* ]]; then
      echo -e "\033[1;31mError: You are trying to commit a highly sensitive file: $file\033[0m"
      echo -e "\033[1;33mPlease remove it from staging using: git restore --staged $file\033[0m"
      exit 1
    fi
  done
done

# 2. Check staged content for potential secrets or active keys
# Look for "-----BEGIN PRIVATE KEY-----" in staged changes (excluding scripts and workflow files)
STAGED_DIFFS=$(git diff --cached -- . ':!scripts/*' ':!.github/*')
if echo "$STAGED_DIFFS" | grep -q -e '-----BEGIN .*PRIVATE KEY-----'; then
  echo -e "\033[1;31mError: Staged changes contain a Private Key!\033[0m"
  exit 1
fi

# Look for Google AI / Gemini API keys (AIzaSy followed by 30-45 valid chars) in staged files
# Skip .env.example, scripts, and workflows
STAGED_TEXT_FILES=$(git diff --cached --name-only | grep -E -v '^scripts/|^.github/|\.env\.example$')
for file in $STAGED_TEXT_FILES; do
  if [ -f "$file" ]; then
    # Match additions containing AIzaSy keys
    if git diff --cached "$file" | grep -E '^\+[^+]' | grep -E -q 'AIzaSy[A-Za-z0-9_-]{30,45}'; then
      echo -e "\033[1;31mError: Staged file '$file' contains a potential Gemini API Key!\033[0m"
      echo -e "\033[1;33mPlease remove the key before committing.\033[0m"
      exit 1
    fi
  fi
done

exit 0
EOF

# Make the pre-commit hook executable
chmod +x "$HOOK_PATH"
echo "Success: Local pre-commit hook installed successfully in $HOOK_PATH."
