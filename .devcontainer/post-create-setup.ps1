# Make sure PowerShell 7 is available
pwsh --version

# Install Azure CLI extensions
# az config set extension.use_dynamic_install=yes_without_prompt
az extension add --name ml
az extension add --name "rdbms-connect"

# Upgrade Azure CLI just in case
az upgrade --yes

# Confirm azd installed
azd version

# Confirm Python version
python3 --version

# Confirm pip version
pip3 --version

# Install API Python dependencies
pip3 install -r /workspaces/postgres-sa-byoac/src/api/requirements.txt

# Confirm Node.js version
$node_version = node --version
Write-Host "node version: $node_version"

# Confirm npm version
$npm_version = npm --version
Write-Host "npm version: $npm_version"

# Install Frontend Node.js dependencies
Write-Host "Installing frontend dependencies..."
Set-Location /workspaces/postgres-sa-byoac/src/userportal
npm install
Write-Host "✅ Frontend dependencies installed"

# Check if Docker works
Write-Host "Checking Docker access..."
try {
    $dockerResult = docker ps
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker is working inside the dev container."
    } else {
        Write-Error "❌ Docker is NOT working! You must fix this before continuing."
        exit 1
    }
} catch {
    Write-Error "❌ Docker threw an unexpected error! Please fix it."
    exit 1
}