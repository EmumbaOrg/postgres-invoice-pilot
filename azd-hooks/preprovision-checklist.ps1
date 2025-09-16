param()

$ErrorActionPreference = 'Stop'

# (Removed) Ensure Azure CLI rdbms extension function

# Simple cleanup and exit function
function Exit-WithError {
    param($message, $statusCode = 1, $errorType = "general")

    Write-Host "ERROR: $message" -ForegroundColor Red

    if ($errorType -eq "auth") {
    Write-Host "" 
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host "   DEPLOYMENT STOPPED - AUTHENTICATION REQUIRED" -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host "Run 'az login' to authenticate, then re-run 'azd up'." -ForegroundColor Cyan
    Write-Host "(Environment resources were not created, so no cleanup was needed.)" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Red
    }
    elseif ($errorType -eq "env_name") {
        # Environment name validation failure: show next steps first, then clear local env config
        Write-Host "Run 'azd env new' to create a new environment with a valid name (letters, numbers, hyphens, <=50 chars)." -ForegroundColor Green
        Write-Host "Then run 'azd up' again to provision resources." -ForegroundColor Green
        Write-Host "Clearing invalid environment configuration..." -ForegroundColor Yellow
        if (Test-Path ".azure") {
            Remove-Item ".azure" -Recurse -Force
            Write-Host "Removed .azure folder" -ForegroundColor Yellow
        }
        if (Test-Path ".env") {
            Remove-Item ".env" -Force
            Write-Host "Removed .env file" -ForegroundColor Yellow
        }
    } else {
        # General error - completely clean up the environment
        Write-Host "Cleaning up failed deployment environment..." -ForegroundColor Yellow

        try {
            # Get current environment info
            $envName = azd env get-value "AZURE_ENV_NAME" 2>$null
            $resourceGroup = azd env get-value "AZURE_RESOURCE_GROUP" 2>$null

            if ($resourceGroup) {
                $rgExists = az group exists -n $resourceGroup -o tsv 2>$null
                if ($rgExists -eq 'true') {
                    Write-Host "Deleting resource group: $resourceGroup" -ForegroundColor Yellow
                    az group delete --name $resourceGroup --yes --no-wait 2>$null
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "Resource group deletion initiated (running in background)" -ForegroundColor Green
                    } else {
                        Write-Host "Resource group delete command did not start successfully" -ForegroundColor Yellow
                    }
                } else {
                    Write-Host "Resource group $resourceGroup not found (likely not created yet) - skipping deletion" -ForegroundColor Gray
                }
            }

            # Remove environment folder
            if ($envName -and (Test-Path ".azure/$envName")) {
                Remove-Item ".azure/$envName" -Recurse -Force
                Write-Host "Removed environment folder: .azure/$envName" -ForegroundColor Yellow
            }

            # Remove .env file
            if (Test-Path ".env") {
                Remove-Item ".env" -Force
                Write-Host "Removed .env file" -ForegroundColor Yellow
            }

        } catch {
            Write-Host "Error during cleanup: $($_.Exception.Message)" -ForegroundColor Yellow
        }

        Write-Host ""
        Write-Host "=============================================" -ForegroundColor Red
        Write-Host "   DEPLOYMENT STOPPED - QUOTA VALIDATION FAILED" -ForegroundColor Red
        Write-Host "=============================================" -ForegroundColor Red
        Write-Host "Environment has been completely cleaned up!" -ForegroundColor Green
        Write-Host ""
        Write-Host "TO CONTINUE:" -ForegroundColor Cyan
        Write-Host "  1. Run 'azd env new' and create a new environment" -ForegroundColor Yellow
        Write-Host "  2. Run 'azd up' and choose one of the recommended regions" -ForegroundColor Yellow
        Write-Host "=============================================" -ForegroundColor Red
        Write-Host ""
    }

    exit $statusCode
}

# Authentication validation: ensure the user is logged into Azure CLI (top-level)
function Test-AzureAuthentication {
    Write-Host "Validating Azure CLI authentication..." -ForegroundColor Cyan
    try {
        $accountJson = az account show -o json 2>$null
        if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($accountJson)) {
            # Use centralized error handler for consistent cleanup & banner
            Exit-WithError "You are not logged into Azure." 1 "auth"
        }
        $acct = $accountJson | ConvertFrom-Json
        if (-not $acct.id) {
            Exit-WithError "Azure CLI authentication invalid." 1 "auth"
        }
        Write-Host "Azure CLI authentication: OK (Subscription: $($acct.name) / $($acct.id))" -ForegroundColor Green
    } catch {
        Exit-WithError "Failed to verify Azure authentication." 1 "auth"
    }
}

function Test-EnvironmentName {
    Write-Host "Validating environment name..." -ForegroundColor Cyan

    try {
        $envName = azd env get-value "AZURE_ENV_NAME" 2>$null
    } catch {
        Exit-WithError "Failed to get environment name. Please ensure azd is properly configured." "general"
    }

    if ($envName) {
        Write-Host "Environment name: $envName" -ForegroundColor Yellow
        # Check for invalid characters in environment name
        if ($envName -match '[^a-zA-Z0-9-]' -or $envName.Length -gt 50) {
            Write-Host "Invalid environment name detected!" -ForegroundColor Red
            Write-Host "Environment names must:" -ForegroundColor Yellow
            Write-Host "  - Only contain letters, numbers, and hyphens" -ForegroundColor Yellow
            Write-Host "  - Be 50 characters or less" -ForegroundColor Yellow
            Write-Host "  - Current name: '$envName'" -ForegroundColor Red
            # Pass proper arguments so errorType is not mistaken for statusCode
            Exit-WithError -message "Environment name '$envName' contains invalid characters or is too long" -statusCode 1 -errorType "env_name"
        }

        Write-Host "Environment name is valid" -ForegroundColor Green
    }
}

function Get-InfraLocation {
    # Check azd environment values first (this is where azd stores the location)
    try {
        $location = azd env get-value "AZURE_LOCATION" 2>$null
        if ($location -and $location.Trim() -ne "") {
            return $location.Trim()
        }
    } catch { }

    # Check azd environment config
    try {
        $envName = azd env get-value "AZURE_ENV_NAME" 2>$null
        if ($envName -and (Test-Path ".azure/$envName/config.json")) {
            $config = Get-Content ".azure/$envName/config.json" -Raw | ConvertFrom-Json
            if ($config.infra.parameters.location) {
                return $config.infra.parameters.location
            }
        }
    } catch { }

    # Check environment variable
    if ($env:AZURE_LOCATION) {
        return $env:AZURE_LOCATION
    }

    # Check parameters file
    if (Test-Path "infra/main.parameters.json") {
        try {
            $params = Get-Content "infra/main.parameters.json" -Raw | ConvertFrom-Json
            if ($params.parameters.location.value) {
                $location = $params.parameters.location.value
                if ($location -match '\$\{([^}]+)\}') {
                    # Extract environment variable name and get its value
                    $envVar = $matches[1] -replace '=.*$', ''
                    return [Environment]::GetEnvironmentVariable($envVar)
                }
                return $location
            }
        } catch { }
    }

    Exit-WithError "Cannot determine infrastructure location"
}

# Get allowed regions (general function for both PostgreSQL and Container Apps) - enhanced with debug + resilient parsing
function Get-AllowedRegions {
    param($failedRegion)

    if (-not (Test-Path "infra/main.bicep")) {
        Exit-WithError "Cannot find infra/main.bicep file"
    }

    # Multi-regex pass supporting intervening decorators
    try {
        $bicepContent = Get-Content "infra/main.bicep" -Raw
        $regexAttempts = @(
            '(?s)@allowed\(\[(?<list>.*?)\]\).*?\bparam\s+location\s+string\b',
            '(?s)@allowed\(\[(?<list>.*?)\]\)\s*(?:@[a-zA-Z0-9_]+\([^)]*\)\s*)*param\s+location\s+string\b'
        )
        $attemptIndex = 0
        foreach ($pattern in $regexAttempts) {
            $m = [regex]::Match($bicepContent, $pattern)
            if ($m.Success) {
                $list = $m.Groups['list'].Value
                $regionMatches = [regex]::Matches($list, "'([^']+)'")
                $regionsRegex = @()
                foreach ($rm in $regionMatches) { $regionsRegex += $rm.Groups[1].Value }
                if ($regionsRegex.Count -gt 0) {
                    Write-Host "[Get-AllowedRegions] Regex attempt $attemptIndex succeeded: $($regionsRegex.Count) regions" -ForegroundColor Cyan
                    if ($failedRegion) { return $regionsRegex | Where-Object { $_ -ne $failedRegion.ToLower() } }
                    return $regionsRegex
                } else {
                    Write-Host "[Get-AllowedRegions] Regex attempt $attemptIndex matched but 0 regions extracted" -ForegroundColor Yellow
                }
            } else {
                Write-Host "[Get-AllowedRegions] Regex attempt $attemptIndex no match" -ForegroundColor Gray
            }
            $attemptIndex++
        }
        Write-Host "[Get-AllowedRegions] Falling back to line-based parsing" -ForegroundColor Yellow
    } catch {
        Write-Host "[Get-AllowedRegions] Regex parsing error: $($_.Exception.Message) - fallback to line parsing" -ForegroundColor Yellow
    }

    # Line-by-line fallback
    try {
        $bicepLines = Get-Content "infra/main.bicep"
        $regions = @()
        $inAllowedSection = $false
        $foundLocationParam = $false

        for ($i = 0; $i -lt $bicepLines.Count; $i++) {
            $line = $bicepLines[$i].Trim()

            if ($line -match '^@allowed\(\[') {
                $inAllowedSection = $true
                continue
            }

            if ($inAllowedSection) {
                if ($line -match '^\]\)') {
                    $inAllowedSection = $false
                    for ($j = $i+1; $j -le [Math]::Min($i+20, $bicepLines.Count); $j++) {
                        $nextLine = $bicepLines[$j].Trim()
                        if ($nextLine -match '^param location string') {
                            $foundLocationParam = $true
                            Write-Host "[Get-AllowedRegions] Line parse located location param at line $($j+1)" -ForegroundColor Green
                            break
                        }
                    }
                    if ($foundLocationParam) { break }
                    $regions = @()
                    continue
                }

                if ($line -match "^\s*'([^']+)'") {
                    $regions += $matches[1]
                }
            }
        }

        if ($regions.Count -gt 0 -and $foundLocationParam) {
            Write-Host "[Get-AllowedRegions] Line parsing succeeded: $($regions.Count) regions" -ForegroundColor Cyan
            return $regions | Where-Object { $_ -ne $failedRegion.ToLower() }
        } else {
            Write-Host "[Get-AllowedRegions] Line parsing failed (regions: $($regions.Count), foundLocationParam: $foundLocationParam)" -ForegroundColor Yellow
            Exit-WithError "Failed to parse allowed regions from main.bicep file"
        }
    } catch {
        Exit-WithError "Error parsing main.bicep file: $($_.Exception.Message)"
    }
}# Check Container Apps quota for a specific region
function Test-ContainerAppsQuotaInRegion {
    param($region)

    try {
        # Check if Container Apps provider is registered and available in the region
        $providerInfo = az provider show --namespace Microsoft.App --query "registrationState" -o tsv 2>$null

        if ($providerInfo -ne "Registered") {
            Write-Host "Microsoft.App provider is not registered: $providerInfo" -ForegroundColor Yellow
            return $false
        }

        # Check if the region supports Container Apps by listing available locations
        $locations = az provider show --namespace Microsoft.App --query "resourceTypes[?resourceType=='managedEnvironments'].locations[]" -o tsv 2>$null

        if ($locations) {
            $locationsList = $locations -split "`n" | ForEach-Object { $_.Trim().ToLower().Replace(' ', '') }
            $regionNormalized = $region.ToLower().Replace(' ', '')

            # Check if region is in the supported locations
            $isSupported = $locationsList -contains $regionNormalized

            if ($isSupported) {
                Write-Host "Container Apps is supported in $region" -ForegroundColor Green
                return $true
            } else {
                Write-Host "Container Apps is not supported in $region" -ForegroundColor Yellow
                return $false
            }
        } else {
            Write-Host "Could not retrieve Container Apps location information" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "Error checking Container Apps availability: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}


# Get PostgreSQL SKU configuration from parameters file
function Get-PostgreSQLSkuConfig {
    # Simplified: only read from module definition in main.bicep; no legacy overrides
    $result = [PSCustomObject]@{ Name='Standard_B2ms'; Tier=$null; Source='default' }
    $bicepPath = 'infra/main.bicep'
    if (Test-Path $bicepPath) {
        try {
            $bicepContent = Get-Content $bicepPath -Raw
            if ($bicepContent -match "module\s+postgresql\s+'[^']*postgresql.bicep'\s*=\s*\{[^{]*?params:\s*\{([\s\S]*?)\}\s*\}\s*") {
                $paramsBlock = $matches[1]
                if ($paramsBlock -match "skuName:\s*'([^']+)'") { $result.Name = $matches[1]; $result.Source='module' }
                elseif ($paramsBlock -match 'skuName:\s*"([^"]+)"') { $result.Name = $matches[1]; $result.Source='module' }
                if ($paramsBlock -match "skuTier:\s*'([^']+)'") { $result.Tier = $matches[1] }
                elseif ($paramsBlock -match 'skuTier:\s*"([^"]+)"') { $result.Tier = $matches[1] }
            } else {
                Write-Host '[PostgreSQLSku] Module params block not found; using default' -ForegroundColor Gray
            }
        } catch {
            Write-Host "[PostgreSQLSku] Error reading bicep file: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
    Write-Host "[PostgreSQLSku] Using SKU: $($result.Name) Tier: $($result.Tier ?? 'n/a') Source: $($result.Source)" -ForegroundColor Gray
    return $result
}
 
# Check a specific PostgreSQL SKU in a region (restored & cleaned)
function Test-PostgreSQLSkuInRegion {
    param(
        [string]$region,
        [string]$targetSku
    )

    # Use temp files to capture stdout/stderr reliably
    $tempStdOut = New-TemporaryFile
    $tempStdErr = New-TemporaryFile

    try {
        # Execute the command and capture both stdout and stderr
        pwsh /c "az postgres flexible-server list-skus --location $region --output json --only-show-errors 1>$tempStdOut 2>$tempStdErr" | Out-Null
        $exitCode = $LASTEXITCODE

        $capabilitiesJson = if (Test-Path $tempStdOut) { Get-Content $tempStdOut -Raw -ErrorAction SilentlyContinue } else { '' }
        $errorOutput      = if (Test-Path $tempStdErr) { Get-Content $tempStdErr -Raw -ErrorAction SilentlyContinue } else { '' }

        if ($exitCode -ne 0) {
            # Distinguish unsupported region from transient errors
            if (($errorOutput -match "NoRegisteredProviderFound" -and $errorOutput -match $region) -or
                $errorOutput -match "No registered resource provider found for location.*$region" -or
                $errorOutput -match "Location.*$region.*is not supported" -or
                $errorOutput -match "not available in.*$region") {
                Write-Host "Region $region does not support PostgreSQL Flexible Server" -ForegroundColor Red
                return @{
                    Available = $false
                    VCores    = $null
                    Memory    = $null
                    Edition   = $null
                    AllSkus   = $null
                    Reason    = "Region $region does not support PostgreSQL Flexible Server"
                }
            } else {
                Write-Host "Could not query PostgreSQL capabilities for $region" -ForegroundColor Yellow
                if ($errorOutput.Length -gt 0) {
                    Write-Host "Error details: $($errorOutput.Substring(0, [Math]::Min(150, $errorOutput.Length)))" -ForegroundColor Gray
                }
                return @{
                    Available = $true   # Assume available to avoid blocking deployments
                    VCores    = "Unknown"
                    Memory    = "Unknown"
                    Edition   = "Unknown"
                    AllSkus   = $null
                    Reason    = "Could not verify SKU availability"
                }
            }
        }

        if ([string]::IsNullOrWhiteSpace($capabilitiesJson)) {
            Write-Host "No capabilities data returned" -ForegroundColor Yellow
            return @{
                Available = $true
                VCores    = "Unknown"
                Memory    = "Unknown"
                Edition   = "Unknown"
                AllSkus   = $null
                Reason    = "Could not verify SKU availability - proceeding with deployment"
            }
        }

        $capabilities = $capabilitiesJson | ConvertFrom-Json

        if ($capabilities -and $capabilities.Count -gt 0 -and $capabilities[0].supportedServerEditions) {
            $allServerEditions = $capabilities[0].supportedServerEditions
            $allSkus = @()
            foreach ($edition in $allServerEditions) {
                if ($edition.supportedServerSkus) {
                    foreach ($sku in $edition.supportedServerSkus) {
                        $allSkus += [PSCustomObject]@{
                            name              = $sku.name
                            vCores            = $sku.vCores
                            memoryPerVcoreMb  = $sku.supportedMemoryPerVcoreMb
                            tier              = $edition.name
                            supportedZones    = $sku.supportedZones
                        }
                    }
                }
            }
            Write-Host "Found $($allSkus.Count) total server SKUs across all editions" -ForegroundColor Gray

            $targetSkuObj = $allSkus | Where-Object { $_.name -eq $targetSku }
            if ($targetSkuObj) {
                Write-Host "Found target SKU: $targetSku in $($targetSkuObj.tier) edition" -ForegroundColor Green
                return @{
                    Available = $true
                    VCores    = $targetSkuObj.vCores
                    Memory    = "$($targetSkuObj.memoryPerVcoreMb)MB per vCore"
                    Edition   = $targetSkuObj.tier
                    AllSkus   = $null
                    Reason    = $null
                }
            } else {
                Write-Host "Target SKU $targetSku not found" -ForegroundColor Yellow
                # Prefer showing SKUs from same tier (if target declared tier known later) — here we don't yet know declared tier; show burstable first if present
                $burstableSkus = $allSkus | Where-Object { $_.tier -eq 'Burstable' } | Select-Object -First 5
                if ($burstableSkus -and $burstableSkus.Count -gt 0) {
                    Write-Host "Available Burstable SKUs:" -ForegroundColor Gray
                    $burstableSkus | ForEach-Object { Write-Host "   $($_.name) ($($_.vCores) vCores, $($_.memoryPerVcoreMb)MB/vCore)" -ForegroundColor Gray }
                } else {
                    $sampleSkus = $allSkus | Where-Object { $_.tier -eq 'GeneralPurpose' } | Select-Object -First 5
                    if ($sampleSkus) {
                        Write-Host "Available GeneralPurpose SKUs:" -ForegroundColor Gray
                        $sampleSkus | ForEach-Object { Write-Host "   $($_.name) ($($_.vCores) vCores, $($_.memoryPerVcoreMb)MB/vCore)" -ForegroundColor Gray }
                    }
                }
                return @{
                    Available = $false
                    VCores    = $null
                    Memory    = $null
                    Edition   = $null
                    AllSkus   = $allSkus
                    Reason    = "SKU $targetSku not found in available configurations"
                }
            }
        } else {
            if ($capabilities -and $capabilities.Count -gt 0 -and $capabilities[0].reason) {
                Write-Host "Region has restrictions: $($capabilities[0].reason)" -ForegroundColor Yellow
                return @{
                    Available = $true
                    VCores    = "Unknown"
                    Memory    = "Unknown"
                    Edition   = "Unknown"
                    AllSkus   = $null
                    Reason    = "Region temporarily restricted"
                }
            } else {
                Write-Host "No server capabilities returned, proceeding with deployment" -ForegroundColor Yellow
                return @{
                    Available = $true
                    VCores    = "Unknown"
                    Memory    = "Unknown"
                    Edition   = "Unknown"
                    AllSkus   = $null
                    Reason    = "Could not verify SKU availability - proceeding with deployment"
                }
            }
        }
    } catch {
        Write-Host "Error parsing capabilities data: $($_.Exception.Message)" -ForegroundColor Yellow
        return @{
            Available = $true
            VCores    = "Unknown"
            Memory    = "Unknown"
            Edition   = "Unknown"
            AllSkus   = $null
            Reason    = "JSON parsing error - proceeding with deployment"
        }
    } finally {
        if (Test-Path $tempStdOut) { Remove-Item $tempStdOut -ErrorAction SilentlyContinue }
        if (Test-Path $tempStdErr) { Remove-Item $tempStdErr -ErrorAction SilentlyContinue }
    }
}

# Find alternative regions with PostgreSQL SKU availability
function Find-PostgreSQLAlternativeRegions {
    param($failedRegion, $targetSku)

    $alternativeRegions = Get-AllowedRegions -failedRegion $failedRegion
    $availableRegions = [System.Collections.ArrayList]::new()

    Write-Host "Checking alternative regions for PostgreSQL SKU availability..." -ForegroundColor Yellow

    foreach ($region in $alternativeRegions) {
        $skuCheck = Test-PostgreSQLSkuInRegion -region $region -targetSku $targetSku

        if ($skuCheck.Available) {
            # Only include regions where we definitively verified availability
            # Exclude regions with "Could not verify", or "Region temporarily restricted" status
            if (-not ($skuCheck.Reason -and ($skuCheck.Reason -match "Could not verify" -or $skuCheck.Reason -match "Region temporarily restricted"))) {
                $null = $availableRegions.Add($region)
                Write-Host "$region has $targetSku available" -ForegroundColor Green
            } else {
                Write-Host "${region}: $($skuCheck.Reason) - excluding from alternatives" -ForegroundColor Gray
            }
        }
    }

    return $availableRegions.ToArray()
}

# Find alternative regions with Container Apps quota
function Find-ContainerAppsAlternativeRegions {
    param($failedRegion)

    $alternativeRegions = Get-AllowedRegions -failedRegion $failedRegion
    $availableRegions = [System.Collections.ArrayList]::new()

    Write-Host "Checking alternative regions for Container Apps quota..." -ForegroundColor Yellow

    foreach ($region in $alternativeRegions) {
        $quotaCheck = Test-ContainerAppsQuotaInRegion -region $region

        if ($quotaCheck) {
            $null = $availableRegions.Add($region)
            Write-Host "$region has sufficient Container Apps quota" -ForegroundColor Green
        } else {
            Write-Host "${region}: Container Apps not available - excluding from alternatives" -ForegroundColor Gray
        }
    }

    return $availableRegions.ToArray()
}

function Test-ContainerAppsQuota {
    Write-Host "Checking Azure Container Apps availability..." -ForegroundColor Cyan

    $infraLocation = Get-InfraLocation
    Write-Host "Checking region: $infraLocation" -ForegroundColor Yellow

    try {
        # Check if Container Apps is available in the region
        $quotaCheck = Test-ContainerAppsQuotaInRegion -region $infraLocation

        if ($quotaCheck) {
            Write-Host "Container Apps availability confirmed in $infraLocation" -ForegroundColor Green
            return
        } else {
            Write-Host "Insufficient Container Apps quota in $infraLocation" -ForegroundColor Red

            # Look for alternative regions
            $alternatives = Find-ContainerAppsAlternativeRegions -failedRegion $infraLocation

            if ($alternatives.Count -gt 0) {
                Write-Host ""
                Write-Host "Alternative regions with sufficient Container Apps quota:" -ForegroundColor Green
                $alternatives | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
                Write-Host ""
                Exit-WithError "Please use one of the above alternative regions for your deployment"
            }
        }
    } catch {
        Write-Host "Could not retrieve Container Apps quota information" -ForegroundColor Yellow
        Write-Host "This might indicate that Container Apps is not available in this region" -ForegroundColor Yellow

        # Still try to find alternative regions
        $alternatives = Find-ContainerAppsAlternativeRegions -failedRegion $infraLocation

        if ($alternatives.Count -gt 0) {
            Write-Host ""
            Write-Host "Alternative regions with Container Apps available:" -ForegroundColor Green
            $alternatives | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
            Write-Host ""
            Exit-WithError "Please use one of the above alternative regions for your deployment"
        }
    }

    Write-Host "Could not retrieve Container Apps quota information" -ForegroundColor Yellow
    Exit-WithError "Error checking Container Apps quota: $($_.Exception.Message)"
}

function Test-PostgreSQLSku {
    Write-Host "Checking PostgreSQL SKU availability..." -ForegroundColor Cyan

    $infraLocation = Get-InfraLocation
    $skuConfig = Get-PostgreSQLSkuConfig
    $targetSku = $skuConfig.Name

    Write-Host "Checking region: $infraLocation" -ForegroundColor Yellow
    Write-Host "Target SKU: $targetSku (Tier: $($skuConfig.Tier ?? 'n/a'), Source: $($skuConfig.Source))" -ForegroundColor Yellow

    $skuCheck = Test-PostgreSQLSkuInRegion -region $infraLocation -targetSku $targetSku

    if ($skuCheck.Available) {
        # Check if this is truly available or just "proceeding despite issues"
        if ($skuCheck.Reason -and ($skuCheck.Reason -match "Could not verify" -or $skuCheck.Reason -match "Region temporarily restricted")) {
            # This is not truly available - it's restricted/unverified
            if ($skuCheck.Reason -match "Region temporarily restricted") {
                # For temporarily restricted regions, search for alternatives like we do for unsupported regions
                Write-Host "PostgreSQL is temporarily restricted in $infraLocation" -ForegroundColor Red
                Write-Host "   Reason: Region has temporary restrictions" -ForegroundColor Red

                # Search for alternative regions
                Write-Host "Searching for alternative regions with $targetSku availability..." -ForegroundColor Yellow
                $alternativeRegions = Find-PostgreSQLAlternativeRegions -failedRegion $infraLocation -targetSku $targetSku

                if ($alternativeRegions.Count -gt 0) {
                    Write-Host ""
                    Write-Host "Alternative regions with $targetSku available:" -ForegroundColor Green
                    $alternativeRegions | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
                    Write-Host ""
                    Exit-WithError "Please use one of the above alternative regions for your deployment"
                } else {
                    Write-Host ""
                    Write-Host "No alternative regions found with $targetSku available" -ForegroundColor Red
                    Write-Host ""
                    Write-Host "Suggestions:" -ForegroundColor Cyan
                    Write-Host "  1. Check Azure documentation for PostgreSQL SKU availability by region" -ForegroundColor Yellow
                    Write-Host "  2. Consider using a different PostgreSQL SKU with similar specifications" -ForegroundColor Yellow
                    Write-Host "  3. Request SKU availability in your preferred region through Azure support" -ForegroundColor Yellow
                    Write-Host ""
                    Exit-WithError "PostgreSQL SKU $targetSku is not available in any supported regions"
                }
            } else {
                # Could not verify - proceed with deployment but don't search alternatives
                Write-Host "PostgreSQL SKU $targetSku status in ${infraLocation}: Proceeding with deployment" -ForegroundColor Yellow
                Write-Host "   Note: Could not verify availability but deployment will be attempted" -ForegroundColor Yellow
                return
            }
        } else {
            # This is truly available; validate declared tier vs actual edition if both known
            $declaredTier = $skuConfig.Tier
            $actualEdition = $skuCheck.Edition
            $tierMismatch = $false
            if ($declaredTier -and $actualEdition -and ($declaredTier -ne $actualEdition)) {
                $tierMismatch = $true
            }

            if ($tierMismatch) {
                Write-Host "PostgreSQL SKU $targetSku is available in $infraLocation BUT tier mismatch detected" -ForegroundColor Red
                Write-Host "   Declared tier : $declaredTier" -ForegroundColor Red
                Write-Host "   Actual edition: $actualEdition" -ForegroundColor Red
                Write-Host "Recommendation:" -ForegroundColor Yellow
                Write-Host "  • Update skuTier in main.bicep to '$actualEdition' for skuName '$targetSku'" -ForegroundColor Yellow
                Write-Host "  • Or choose a skuName that belongs to tier '$declaredTier'" -ForegroundColor Yellow
                Exit-WithError "Tier mismatch: skuName $targetSku belongs to $actualEdition but $declaredTier was specified"
            } else {
                Write-Host "PostgreSQL SKU $targetSku is available in $infraLocation" -ForegroundColor Green
                if ($skuCheck.VCores -ne "Unknown") {
                    Write-Host "   Specs: $($skuCheck.VCores) vCores, $($skuCheck.Memory), $($skuCheck.Edition) edition" -ForegroundColor Green
                }
            }
            return
        }
    }

    # Check if this is a definitive "not available" vs "couldn't verify"
    $isDefinitivelyUnavailable = ($skuCheck.Reason -eq "SKU $targetSku not found in available configurations") -or
                                ($skuCheck.Reason -match "Region .* does not support PostgreSQL Flexible Server") -or
                                ($skuCheck.Reason -match "Region temporarily restricted")

    if ($isDefinitivelyUnavailable) {
        # SKU was definitively not found OR region doesn't support PostgreSQL OR region is temporarily restricted - search alternative regions
        if ($skuCheck.Reason -match "Region .* does not support PostgreSQL Flexible Server") {
            # Don't duplicate the message - it was already shown by Test-PostgreSQLSkuInRegion
        } elseif ($skuCheck.Reason -match "Region temporarily restricted") {
            Write-Host "PostgreSQL is temporarily restricted in $infraLocation" -ForegroundColor Red
        } else {
            Write-Host "PostgreSQL SKU $targetSku is not available in $infraLocation" -ForegroundColor Red
        }

        if ($skuCheck.Reason) {
            Write-Host "   Reason: $($skuCheck.Reason)" -ForegroundColor Red
        }

        # Show same-tier alternatives (if declared tier known) else fallback to Burstable then GeneralPurpose
        if ($skuCheck.AllSkus -and $skuCheck.AllSkus.Count -gt 0) {
            $declaredTier = $skuConfig.Tier
            $shown = $false
            if ($declaredTier) {
                $sameTier = $skuCheck.AllSkus | Where-Object { $_.tier -eq $declaredTier } | Select-Object -First 8
                if ($sameTier -and $sameTier.Count -gt 0) {
                    Write-Host "Available $declaredTier SKUs in ${infraLocation}:" -ForegroundColor Yellow
                    $sameTier | ForEach-Object {
                        Write-Host "   $($_.name) ($($_.vCores) vCores, $($_.memoryPerVcoreMb)MB/vCore)" -ForegroundColor Yellow
                    }
                    $shown = $true
                }
            }
            if (-not $shown) {
                $burstable = $skuCheck.AllSkus | Where-Object { $_.tier -eq 'Burstable' } | Select-Object -First 5
                if ($burstable -and $burstable.Count -gt 0) {
                    Write-Host "Available Burstable SKUs in ${infraLocation}:" -ForegroundColor Yellow
                    $burstable | ForEach-Object {
                        Write-Host "   $($_.name) ($($_.vCores) vCores, $($_.memoryPerVcoreMb)MB/vCore)" -ForegroundColor Yellow
                    }
                    $shown = $true
                }
            }
            if (-not $shown) {
                $general = $skuCheck.AllSkus | Where-Object { $_.tier -eq 'GeneralPurpose' } | Select-Object -First 5
                if ($general) {
                    Write-Host "Available GeneralPurpose SKUs in ${infraLocation}:" -ForegroundColor Yellow
                    $general | ForEach-Object {
                        Write-Host "   $($_.name) ($($_.vCores) vCores, $($_.memoryPerVcoreMb)MB/vCore)" -ForegroundColor Yellow
                    }
                }
            }
        }

        # Look for alternative regions (same logic as Container Apps)
        Write-Host "Searching for alternative regions with $targetSku availability..." -ForegroundColor Yellow
        $alternativeRegions = Find-PostgreSQLAlternativeRegions -failedRegion $infraLocation -targetSku $targetSku

        if ($alternativeRegions.Count -gt 0) {
            Write-Host ""
            Write-Host "Alternative regions with $targetSku available:" -ForegroundColor Green
            $alternativeRegions | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
            Write-Host ""
            Exit-WithError "Please use one of the above alternative regions for your deployment"
        } else {
            Write-Host ""
            Write-Host "No alternative regions found with $targetSku available" -ForegroundColor Red
            Write-Host ""
            Write-Host "Suggestions:" -ForegroundColor Cyan
            Write-Host "  1. Check Azure documentation for PostgreSQL SKU availability by region" -ForegroundColor Yellow
            Write-Host "  2. Consider using a different PostgreSQL SKU with similar specifications" -ForegroundColor Yellow
            Write-Host "  3. Request SKU availability in your preferred region through Azure support" -ForegroundColor Yellow
            Write-Host ""
            Exit-WithError "PostgreSQL SKU $targetSku is not available in any supported regions"
        }
    } else {
        # Couldn't verify (API issues, etc.) - preserve existing behavior (proceed with deployment)
        Write-Host "PostgreSQL SKU $targetSku could not be verified in $infraLocation" -ForegroundColor Yellow
        if ($skuCheck.Reason) {
            Write-Host "   Details: $($skuCheck.Reason)" -ForegroundColor Yellow
        }

        # Show some available SKUs for debugging if we have them
        if ($skuCheck.AllSkus -and $skuCheck.AllSkus.Count -gt 0) {
            $sampleSkus = $skuCheck.AllSkus | Where-Object { $_.tier -eq "GeneralPurpose" } | Select-Object -First 5
            if ($sampleSkus) {
                Write-Host "Available GeneralPurpose SKUs in ${infraLocation}:" -ForegroundColor Yellow
                $sampleSkus | ForEach-Object {
                    Write-Host "   $($_.name) ($($_.vCores) vCores, $($_.memoryPerVcoreMb)MB/vCore)" -ForegroundColor Yellow
                }
            }
        }

        Write-Host ""
        Write-Host "Proceeding with deployment - Azure will validate the actual SKU availability during provisioning." -ForegroundColor Cyan
        Write-Host ""
    }
}# Run the checks
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Azure Deployment Validation" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Validate Azure CLI login first
Test-AzureAuthentication

# Validate environment name
Test-EnvironmentName

Write-Host ""

# Check PostgreSQL SKU availability first
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "PostgreSQL SKU Availability Check" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

Test-PostgreSQLSku

Write-Host ""

# Check Container Apps quota
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Container Apps Quota Check" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

Test-ContainerAppsQuota

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "All infrastructure validations successful!" -ForegroundColor Green
Write-Host "Note: OpenAI quota checking is handled automatically by azd" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Green
