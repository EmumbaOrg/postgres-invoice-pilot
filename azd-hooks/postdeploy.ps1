# If env:RUN_POSTDEPLOY_SCRIPT is set to false, exit the script
if ($env:RUN_POSTDEPLOY_SCRIPT -eq $False) {
    Write-Host "Skipping Post-Deployment Script"
    exit 0
}

$ErrorActionPreference = "Stop"

# ##############################################################################
# Set Azure CLI Context
# ##############################################################################
az account set --subscription "${env:AZURE_SUBSCRIPTION_ID}"


# ##############################################################################
# Install Required Azure CLI Extensions
# ##############################################################################
az config set extension.use_dynamic_install=yes_without_prompt
az extension add -y -n "rdbms-connect"

# ##############################################################################
# Get the current user's name and access token to connect to the PostgreSQL Server
# ##############################################################################
$username=(az account show -o tsv --query "user.name")
$token=(az account get-access-token --resource=https://ossrdbms-aad.database.windows.net -o tsv --query "accessToken")
Write-Host "Access Token Retrieved for $username"

# ##############################################################################
# Add local Public IP Address to PostgreSQL Firewall,
# so we can connect to the PostgreSQL Server and run scripts
# ##############################################################################
Write-Host "Adding Firewall Rule for Local Machine IP Address..."

# Use HTTPS for IP lookup
$publicIpAddress =  (Invoke-RestMethod -Uri "https://ipinfo.io/ip")
az postgres flexible-server firewall-rule create `
    --resource-group "${env:AZURE_RESOURCE_GROUP}" `
    --name "${env:POSTGRESQL_SERVER_NAME}" `
    --rule-name "AllowAZDLocalMachine" `
    --start-ip-address $publicIpAddress `
    --end-ip-address $publicIpAddress

Write-Host "Added Firewall Rule for $publicIpAddress"
Start-Sleep -Seconds 5

# ##############################################################################
# Allow-list required PostgreSQL extensions (merge with existing)
# ##############################################################################
try {
    $requiredExtensions = @('azure_ai','vector','pg_diskann','age','azure_storage')
    $currentExtensions = az postgres flexible-server parameter show `
        --resource-group "${env:AZURE_RESOURCE_GROUP}" `
        --server-name "${env:POSTGRESQL_SERVER_NAME}" `
        --name azure.extensions `
        --query value -o tsv

    $currentList = @()
    if ($currentExtensions) {
        $currentList = $currentExtensions -split '\s*,\s*' |
            Where-Object { $_ -and $_.Trim() -ne '' } |
            ForEach-Object { $_.Trim().ToLower() } |
            Select-Object -Unique
    }

    $merged = ($currentList + $requiredExtensions) |
        ForEach-Object { $_.ToLower() } |
        Select-Object -Unique

    $newValue = ($merged -join ',')

    $currentExtensionsValue = if ($null -ne $currentExtensions) { $currentExtensions } else { '' }
    if ($newValue -ne $currentExtensionsValue) {
        Write-Host "Updating azure.extensions to: $newValue"
        az postgres flexible-server parameter set `
            --resource-group "${env:AZURE_RESOURCE_GROUP}" `
            --server-name "${env:POSTGRESQL_SERVER_NAME}" `
            --name azure.extensions `
            --value $newValue | Out-Null
    } else {
        Write-Host "azure.extensions already includes required values: $newValue"
    }
} catch {
    Write-Warning "Failed to ensure azure.extensions allow-list: $($_.Exception.Message)"
}

# ##############################################################################
# Set shared_preload_libraries parameter in PostgreSQL (required libraries)
# ##############################################################################
az postgres flexible-server parameter set `
    --resource-group "${env:AZURE_RESOURCE_GROUP}" `
    --server-name "${env:POSTGRESQL_SERVER_NAME}" `
    --subscription "${env:AZURE_SUBSCRIPTION_ID}" `
    --name shared_preload_libraries `
    --value "age,azure_storage,pg_cron,pg_stat_statements" | Out-Null

# ##############################################################################
# Get workspace key 
# ##############################################################################

az extension add -n ml -y | Out-Null

if ($env:DEPLOY_AML_MODEL -and $env:DEPLOY_AML_MODEL -ne 'none') {
  $amlKey = az ml online-endpoint get-credentials `
    -g $env:AZURE_RESOURCE_GROUP `
    -w $env:AZURE_AML_WORKSPACE_NAME `
    -n $env:AZURE_AML_ENDPOINT_NAME `
    --query primaryKey -o tsv

}

# Prepare AML key (escape single quotes for SQL); empty if not set
$amlKeyEscaped = ""
if ($amlKey) { $amlKeyEscaped = $amlKey -replace "'", "''" }

# Derive AML scoring endpoint URL (needed by SQL) and escape
$amlScoringUri = ""
try {
    if ($env:DEPLOY_AML_MODEL -and $env:DEPLOY_AML_MODEL -ne 'none' -and $env:AZURE_AML_ENDPOINT_NAME) {
        $amlScoringUri = az ml online-endpoint show `
            -g $env:AZURE_RESOURCE_GROUP `
            -w $env:AZURE_AML_WORKSPACE_NAME `
            -n $env:AZURE_AML_ENDPOINT_NAME `
            --query scoring_uri -o tsv
    }
} catch { }

$openaiEndpointEscaped   = ($env:AZURE_OPENAI_ENDPOINT   | ForEach-Object { $_ -replace "'","''" })
$openaiKeyEscaped        = ($env:AZURE_OPENAI_KEY        | ForEach-Object { $_ -replace "'","''" })
$amlScoringUriEscaped    = ($amlScoringUri               | ForEach-Object { $_ -replace "'","''" })
$languageEndpointEscaped = ($env:LANGUAGE_SERVICE_ENDPOINT | ForEach-Object { $_ -replace "'","''" })
$languageKeyEscaped      = ($env:LANGUAGE_SERVICE_KEY      | ForEach-Object { $_ -replace "'","''" })
$deployAmlModel          = ($env:DEPLOY_AML_MODEL        | ForEach-Object { $_ -replace "'","''" })
$azureStorageAccountName = ($env:AZURE_STORAGE_ACCOUNT_NAME | ForEach-Object { $_ -replace "'","''" })
$azureStorageAccountKey  = ($env:AZURE_STORAGE_ACCOUNT_KEY | ForEach-Object { $_ -replace "'","''" })


# ##############################################################################
# Create Database Schema
# ##############################################################################
Write-Host "Configuring Database Schema..."

# Token-replace ${AML_ENDPOINT_KEY} in the schema script and execute
$dbSqlPath = "$PSScriptRoot/../scripts/sql/deploy-database-tables.sql"
$dbSql = Get-Content -Path $dbSqlPath -Raw
$dbSql = $dbSql.Replace('${AML_ENDPOINT_KEY}', $amlKeyEscaped)
$dbSql = $dbSql.Replace('${AML_SCORING_ENDPOINT}', $amlScoringUriEscaped)
$dbSql = $dbSql.Replace('${OPENAI_ENDPOINT}', $openaiEndpointEscaped)
$dbSql = $dbSql.Replace('${OPENAI_KEY}', $openaiKeyEscaped)
$dbSql = $dbSql.Replace('${LANGUAGE_ENDPOINT}', $languageEndpointEscaped)
$dbSql = $dbSql.Replace('${LANGUAGE_KEY}', $languageKeyEscaped)
$dbTempPath = "$PSScriptRoot/../scripts/sql/deploy-database-tables.tmp.sql"
Set-Content -Path $dbTempPath -Value $dbSql

az postgres flexible-server execute `
          --admin-user "$username" `
          --admin-password "$token" `
          --name "${env:POSTGRESQL_SERVER_NAME}" `
          --database-name "${env:POSTGRESQL_DATABASE_NAME}" `
          --file-path $dbTempPath

#Remove-Item -Path $dbTempPath -ErrorAction SilentlyContinue

# Create triggers and semantic_reranker function.
$dbSqlPath = "$PSScriptRoot/../scripts/sql/create-functions-and-triggers.sql"
$dbSql = Get-Content -Path $dbSqlPath -Raw
$dbSql = $dbSql.Replace('${DEPLOY_AML_MODEL}', $deployAmlModel)
$dbTempPathT = "$PSScriptRoot/../scripts/sql/create-functions-and-triggers.tmp.sql"
Set-Content -Path $dbTempPathT -Value $dbSql

az postgres flexible-server execute `
          --admin-user "$username" `
          --admin-password "$token" `
          --name "${env:POSTGRESQL_SERVER_NAME}" `
          --database-name "${env:POSTGRESQL_DATABASE_NAME}" `
          --file-path $dbTempPathT

Write-Host "Database Schema Configured"

Write-Host "Export Graph Data"
# Export Graph Data Into CSV Files from vendor, invoice, sow tables
$dbSqlPath = "$PSScriptRoot/../scripts/sql/export-graph-data.sql"
$dbSql = Get-Content -Path $dbSqlPath -Raw
$dbSql = $dbSql.Replace('${AZURE_STORAGE_ACCOUNT_NAME}', $azureStorageAccountName)
$dbSql = $dbSql.Replace('${AZURE_STORAGE_ACCOUNT_KEY}', $azureStorageAccountKey)
$dbTempPath = "$PSScriptRoot/../scripts/sql/export-graph-data.tmp.sql"
Set-Content -Path $dbTempPath -Value $dbSql

az postgres flexible-server execute `
          --admin-user "$username" `
          --admin-password "$token" `
          --name "${env:POSTGRESQL_SERVER_NAME}" `
          --database-name "${env:POSTGRESQL_DATABASE_NAME}" `
          --file-path $dbTempPath

Write-Host "Graph Data Exported"

# Clean up temp file
#Remove-Item -Path $dbTempPath -ErrorAction SilentlyContinue

Write-Host "Load Graph Data"
# Load Graph Data from tables into Apache AGE graph
$dbSqlPath = "$PSScriptRoot/../scripts/sql/load-graph-from-tables.sql"
az postgres flexible-server execute `
          --admin-user "$username" `
          --admin-password "$token" `
          --name "${env:POSTGRESQL_SERVER_NAME}" `
          --database-name "${env:POSTGRESQL_DATABASE_NAME}" `
          --file-path $dbSqlPath

Write-Host "Graph Data Loaded"

# ##############################################################################
# Grant Database Permissions to API Identity
# ##############################################################################
Write-Host "Granting Database Permissions to API App Managed Identity..."

Write-Host "Writing grant-permissions.tmp.sql script with API App managed identity name..."

# Read sql script with environment variable placeholders
$sqlScript = Get-Content -Path "$PSScriptRoot/../scripts/sql/grant-permissions.sql" -Raw

# Replace environment variable placeholders
$sqlScript = $sqlScript.Replace('${env:POSTGRESQL_DATABASE_NAME}', $env:POSTGRESQL_DATABASE_NAME)
$sqlScript = $sqlScript.Replace('${env:SERVICE_API_IDENTITY_PRINCIPAL_NAME}', $env:SERVICE_API_IDENTITY_PRINCIPAL_NAME)

# Write sql file 
Set-Content -Path "$PSScriptRoot/../scripts/sql/grant-permissions.tmp.sql" -Value $sqlScript

# Run script
az postgres flexible-server execute `
          --admin-user "$username" `
          --admin-password "$token" `
          --name "${env:POSTGRESQL_SERVER_NAME}" `
          --database-name "${env:POSTGRESQL_DATABASE_NAME}" `
          --file-path "$PSScriptRoot/../scripts/sql/grant-permissions.tmp.sql"

Write-Host "Database Permissions Granted to API App Managed Identity"


#Remove-Item -Path $dbTempPath -ErrorAction SilentlyContinue
# ##############################################################################
# Upload Sample Files to Blob Storage
# ##############################################################################

Write-Host "Uploading Sample Files to Blob Storage..."

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "1/sow/Statement_of_Work_TailWind_Cloud_Solutions_Woodgrove_Bank_20241101.pdf" `
#     --file "./data/sample_docs/model_training/Statement_of_Work_TailWind_Cloud_Solutions_Woodgrove_Bank_20241101.pdf"

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "2/sow/Statement_of_Work_Contoso_DevOps_Services_Woodgrove_Bank_20240601.pdf" `
#     --file "./data/sample_docs/model_training/Statement_of_Work_Contoso_DevOps_Services_Woodgrove_Bank_20240601.pdf"

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "3/sow/Statement_of_Work_Lucerne_Publishing_Woodgrove_Bank_20241201.pdf" `
#     --file "./data/sample_docs/model_training/Statement_of_Work_Lucerne_Publishing_Woodgrove_Bank_20241201.pdf"

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "4/sow/Statement_of_Work_Wide_World_Engineering_Woodgrove_Bank_20241001.pdf" `
#     --file "./data/sample_docs/model_training/Statement_of_Work_Wide_World_Engineering_Woodgrove_Bank_20241001.pdf"

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "5/sow/Statement_of_Work_Trey_Research_Inc_Woodgrove_Bank_20240501.pdf" `
#     --file "./data/sample_docs/model_training/Statement_of_Work_Trey_Research_Inc_Woodgrove_Bank_20240501.pdf"

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "1/invoice/INV-TWC2024-001.pdf" `
#     --file "./data/sample_docs/model_training/INV-TWC2024-001.pdf"

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "2/invoice/INV-TWC2024-002.pdf" `
#     --file "./data/sample_docs/model_training/INV-TWC2024-002.pdf"

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "3/invoice/INV-TWC2024-003.pdf" `
#     --file "./data/sample_docs/model_training/INV-TWC2024-003.pdf"

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "4/invoice/INV-TWC2024-004.pdf" `
#     --file "./data/sample_docs/model_training/INV-TWC2024-004.pdf"

# az storage blob upload `
#     --auth-mode login `
#     --overwrite true `
#     --account-name "${env:AZURE_STORAGE_ACCOUNT_NAME}" `
#     --container-name "${env:AZURE_STORAGE_CONTAINER_NAME}" `
#     --name "5/invoice/INV-WWE2024-001.pdf" `
#     --file "./data/sample_docs/model_training/INV-WWE2024-001.pdf"

Write-Host "Sample Files Uploaded to Blob Storage"

# # ##############################################################################
# # Create Event Grid Subscription with BlobCreated & BlobUpdated Webhook
# # - this must be created after the app is deployed, otherwise the webhook validation will fail
# # ##############################################################################
# Write-Host "Creating Event Grid 'StorageBlob' Subscription with BlobCreated & BlobUpdated Webhook..."

# $eventGridStorageBlobSubscriptionExists = az eventgrid system-topic event-subscription list `
#     --resource-group "${env:AZURE_RESOURCE_GROUP}" `
#     --system-topic-name "${env:STORAGE_EVENTGRID_SYSTEM_TOPIC_NAME}" `
#     --query "[?name=='StorageBlob']" `
#     --output tsv

# if (-not $eventGridStorageBlobSubscriptionExists) {
#     az eventgrid system-topic event-subscription create `
#         --name "StorageBlob" `
#         --system-topic-name "${env:STORAGE_EVENTGRID_SYSTEM_TOPIC_NAME}" `
#         --endpoint "${env:SERVICE_API_ENDPOINT_URL}/webhooks/storage-blob" `
#         --included-event-types "Microsoft.Storage.BlobCreated" "Microsoft.Storage.BlobUpdated" `
#         --subject-begins-with "/blobServices/default/containers/${env:AZURE_STORAGE_CONTAINER_NAME}/blobs/" `
#         --resource-group "${env:AZURE_RESOURCE_GROUP}"
# }

# Write-Host "Event Grid Subscription 'StorageBlob' Created"


# ##############################################################################
# Deploy Chosen Cross Encoder Model to the Azure ML Workspace
# ##############################################################################

# Capture start time of model deploy
$startTime = [datetime]::Now
Write-Host "Model Deploy Start Time: $startTime"

Write-Host "If a model was chosen, now deploying Cross Encoder Model to the Azure ML Workspace..."
Write-Host "Chosen model is: $env:DEPLOY_AML_MODEL"

switch ($env:DEPLOY_AML_MODEL) {
    "mini"  { & (Resolve-Path "$PSScriptRoot\..\scripts\aml\deploy_model_mini.ps1") -ErrorAction Stop }
    "bge"   { & (Resolve-Path "$PSScriptRoot\..\scripts\aml\deploy_model_bge.ps1") -ErrorAction Stop }
    "none"  { Write-Host "Skipping Semantic Re-ranker post-deployment script." }
    default { Write-Error "Unknown DEPLOY_AML_MODEL value: $env:DEPLOY_AML_MODEL" }
}

# Capture end time of model deploy and calculate duration
$endTime = [datetime]::Now
$duration = $endTime - $startTime

# Write out the duration of the model deploy
Write-Host "Model Deploy End Time: $endTime"
Write-Host ("Model Deploy Total Duration: {0} hours {1} minutes {2} seconds" -f $duration.Hours, $duration.Minutes, $duration.Seconds)

# ##############################################################################
# Update .env file to prevent postdeploy script from running again (this ensures that the script runs only once)
# ##############################################################################

azd env set "RUN_POSTDEPLOY_SCRIPT" "false"

# ##############################################################################
# Write completion message
# ##############################################################################

Write-Host "***"
Write-Host "Deployment Completed! Please read the docs at https://aka.ms/pg-byoac-docs for next steps."
Write-Host "***"
