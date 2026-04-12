# Creates a new Supabase cloud project (Management API).
# This does NOT modify or delete any existing project.
#
# 1) Create a personal access token: https://supabase.com/dashboard/account/tokens
#    Fine-grained token needs: organizations_read, organization_projects_create,
#    and permission to read API keys for the new project.
# 2) Run from this repo root:
#    cd c:\Users\amit2\.antigravity\eklavya-website
#    $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#    .\scripts\supabase-create-new-project.ps1 -ProjectName "my-app-name" -Region "ap-south-1"
#
# After success: put URL/keys in any app that uses Supabase (e.g. your-awesome-website\.env)
# and set project_ref in Cursor mcp.json (see script output).

param(
    [string]$ProjectName = "eklavya-website-new",
    [string]$OrgSlug = "",
    [string]$Region = "ap-south-1"
)

$ErrorActionPreference = "Stop"
$token = $env:SUPABASE_ACCESS_TOKEN
if (-not $token) {
    Write-Error "Set SUPABASE_ACCESS_TOKEN to a Supabase personal access token (Dashboard / Account / Access Tokens)."
}

$base = "https://api.supabase.com/v1"
$authHeaders = @{ Authorization = "Bearer $token" }
$postHeaders = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }

if (-not $OrgSlug) {
    $orgsRaw = Invoke-RestMethod -Uri "$base/organizations" -Headers $authHeaders
    $orgs = @($orgsRaw)
    if ($orgs.Count -eq 0) {
        Write-Error "No organizations found for this token. Ensure organizations_read permission."
    }
    $OrgSlug = $orgs[0].slug
    Write-Host "Using organization: $($orgs[0].name) (slug=$OrgSlug)"
}

$dbPass = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })

$bodyObj = [ordered]@{
    organization_slug = $OrgSlug
    name              = $ProjectName
    db_pass           = $dbPass
    region            = $Region
}
$body = $bodyObj | ConvertTo-Json

Write-Host "Creating project '$ProjectName' (region=$Region)..."
$created = Invoke-RestMethod -Uri "$base/projects" -Method Post -Headers $postHeaders -Body $body
$ref = $created.ref
Write-Host "Provision started. ref=$ref status=$($created.status)"

$anonKey = $null
for ($i = 0; $i -lt 48; $i++) {
    Start-Sleep -Seconds 15
    try {
        $keys = Invoke-RestMethod -Uri "$base/projects/$ref/api-keys?reveal=true" -Headers $authHeaders
        $keyList = @($keys)
        $anonKey = ($keyList | Where-Object { $_.name -eq "anon" } | Select-Object -First 1).api_key
        if ($anonKey) { break }
    } catch {
        Write-Host "($i) Waiting for API keys (project still provisioning)..."
    }
}

$url = "https://$ref.supabase.co"
Write-Host ""
Write-Host "Project URL: $url"
Write-Host "Dashboard: https://supabase.com/dashboard/project/$ref"
Write-Host "Database password (store securely; needed for direct DB access): $dbPass"
Write-Host ""

if ($anonKey) {
    Write-Host "For a Vite app (e.g. your-awesome-website), add to that project's .env:"
    Write-Host "VITE_SUPABASE_URL=$url"
    Write-Host "VITE_SUPABASE_ANON_KEY=$anonKey"
    Write-Host ""
    Write-Host "Update Supabase MCP in Cursor (e.g. %USERPROFILE%\.cursor\mcp.json): set project_ref=$ref in the supabase server URL."
} else {
    Write-Warning "Anon key not available via API yet. Copy it from Dashboard / Project Settings / API when the project is ready."
}
