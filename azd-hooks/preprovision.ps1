# Run azd auth login --check-status and capture the output
$userOutput = azd auth login --check-status

# Extract the first email address found in the output
# The reason for this is because some users may have multiple Entra ID principals
# associated to their logged in account, and this way we get the exact principal name
# from which azd is logged in with.  It takes the string of the return text of the command and
# extracts the first email address it finds in the string.
if ($userOutput -match "[\w\.\-]+@[\w\.\-]+\.\w+")
{
    $email = $matches[0]
    $env:AZURE_PRINCIPAL_NAME = $email

    Write-Host "Extracted email: $env:AZURE_PRINCIPAL_NAME"

    # Write to azd env
    azd env set "AZURE_PRINCIPAL_NAME" "$env:AZURE_PRINCIPAL_NAME"

    Write-Host "User Principal Name Set: $env:AZURE_PRINCIPAL_NAME"
}
else
{
    $errorMessage = "ERROR: No email address found in azd auth output."
    Write-Host $errorMessage
    throw $errorMessage
}

# GenAI Framework Selection
Write-Host ""
Write-Host "=== GenAI Framework Selection ===" -ForegroundColor Cyan
Write-Host "Select GenAI framework for the backend? (enter 1 or 2) [default: 1]"
Write-Host "1 - AgentFramework"
Write-Host "2 - LangChain"

$frameworkChoice = Read-Host "Enter your choice"
if ([string]::IsNullOrWhiteSpace($frameworkChoice)) {
    $frameworkChoice = "1"  # default
}

switch ($frameworkChoice) {
    "1" { 
        $genaiFramework = "agent-framework"
        Write-Host "Selected: AgentFramework" -ForegroundColor Green
    }
    "2" { 
        $genaiFramework = "langchain"
        Write-Host "Selected: LangChain" -ForegroundColor Green
    }
    default { 
        $genaiFramework = "agent-framework"  # fallback to default
        Write-Host "Invalid choice. Defaulting to: AgentFramework" -ForegroundColor Yellow
    }
}

# Set environment variable
azd env set "GENAI_FRAMEWORK" "$genaiFramework"
Write-Host "GenAI Framework configured: $genaiFramework" -ForegroundColor Green