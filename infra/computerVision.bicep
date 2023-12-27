targetScope = 'subscription'

param keyVaultResourceGroupName string
param keyVaultName string
param computerVisionResourceGroupName string
param computerVisionName string
param computerVisionSecretName string
param computerVisionResourceGroupLocation string
param tags object
param computerVisionSkuName string
param resourceGroupName string

resource computerVisionResourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' existing = if (!empty(computerVisionResourceGroupName)) {
  name: !empty(computerVisionResourceGroupName) ? computerVisionResourceGroupName : resourceGroupName
}

resource keyVaultResourceGroup 'Microsoft.Resources/resourceGroups@2021-04-01' existing = if (!empty(keyVaultResourceGroupName)) {
  name: !empty(keyVaultResourceGroupName) ? keyVaultResourceGroupName : resourceGroupName
}

module computerVisionAccount 'core/ai/cognitiveservices.bicep' = {
  name: 'computerVisionAccount'
  scope: computerVisionResourceGroup
  params: {
    name: computerVisionName
    kind: 'ComputerVision'
    location: computerVisionResourceGroupLocation
    tags: tags
    sku: {
      name: computerVisionSkuName
    }
  }
}

module computerVisionSecrets 'computerVisionSecrets.bicep' = {
  name: 'computerVisionSecrets'
  scope: keyVaultResourceGroup
  params: {
    keyVaultName: keyVaultName
    computerVisionId: computerVisionAccount.outputs.id
    computerVisionSecretName: computerVisionSecretName
  }
}

output endpoint string = computerVisionAccount.outputs.endpoint
