#Requires -RunAsAdministrator
param(
    [string] $HttpsBase = "https://ontech12.github.io/youtube-insert-blocker-host"
)

$ErrorActionPreference = "Stop"
$HttpsBase = $HttpsBase.TrimEnd("/")
if ($HttpsBase -notmatch '^https://') {
    throw "HttpsBase must start with https:// (Chrome will not install from http or file paths)."
}

$ExtensionId = "jhnfgifegdmhefpkbpnefelblhgipfjf"
$UpdateUrl = "$HttpsBase/updates.xml"
$ForcelistValue = "$ExtensionId;$UpdateUrl"
$SettingsJson = (@{
    $ExtensionId = @{
        installation_mode = "force_installed"
        update_url        = $UpdateUrl
    }
} | ConvertTo-Json -Compress)

function Set-SelfHostPolicy {
    param([string] $PolicyRoot)
    $forcelistKey = Join-Path $PolicyRoot "ExtensionInstallForcelist"
    $sourcesKey = Join-Path $PolicyRoot "ExtensionInstallSources"
    New-Item -Path $PolicyRoot -Force | Out-Null
    New-Item -Path $forcelistKey -Force | Out-Null
    New-Item -Path $sourcesKey -Force | Out-Null
    New-ItemProperty -Path $forcelistKey -Name "1" -Value $ForcelistValue -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $sourcesKey -Name "1" -Value "$HttpsBase/*" -PropertyType String -Force | Out-Null
    New-ItemProperty -Path $PolicyRoot -Name "ExtensionSettings" -Value $SettingsJson -PropertyType String -Force | Out-Null
}

Set-SelfHostPolicy -PolicyRoot "HKLM:\SOFTWARE\Policies\Google\Chrome"
Set-SelfHostPolicy -PolicyRoot "HKLM:\SOFTWARE\Policies\Microsoft\Edge"

Write-Host "Force-install policy set."
Write-Host "Update URL: $UpdateUrl"
Write-Host "Restart Chrome/Edge, then open chrome://policy"
Write-Host "Kids must be standard users, not Administrators."
