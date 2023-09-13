# Setting up optional login and document level access control

## Table of Contents

- [Requirements](#requirements)
- [Setting up Azure AD Apps](#setting-up-azure-ad-apps)
  - [Manual Setup](#manual-setup)
    - [Server App](#server-app)
    - [Client App](#client-app)
- [Optional Scripts](#optional-scripts)
  - [Azure Data Lake Storage Gen2 Setup](#azure-data-lake-storage-gen2-setup)
  - [Azure Data Lake Storage Gen2 Prep Docs](#azure-data-lake-storage-gen2-prep-docs)
  - [Manually managing Document Level Access Control](#manually-managing-document-level-access-control)
- [Environment Variables Reference](#environment-variables-reference)

This guide demonstrates how to add an optional login and document level access control system to the sample. This system can be used to restrict access to indexed data to specific users based on what [Azure Active Directory (Azure AD) groups](https://learn.microsoft.com/azure/active-directory/fundamentals/how-to-manage-groups) they are a part of, or their [user object id](https://learn.microsoft.com/partner-center/find-ids-and-domain-names#find-the-user-object-id).

![AppLoginArchitecture](./docs/applogincomponents.png)

## Requirements

**IMPORTANT:** In order to add optional login and document level access control, you'll need the following in addition to the normal sample requirements

* **Azure account permissions**: Your Azure account must have [permission to manage applications in Azure AD](https://learn.microsoft.com/azure/active-directory/develop/quickstart-register-app#prerequisites).

## Setting up Azure AD Apps

Two Azure AD apps must be registered in order to make the optional login and document level access control system work correctly.

### Automatic Setup

1. Run `azd env set AZURE_USE_AUTHENTICATION true`.
1. (Optional) Run `azd env set AZURE_SERVER_APP_DISPLAY_NAME <desired_display_name>`. This sets the desired display name for the Azure AD app used by the API server. If this variable is not set, a default name is automatically chosen that matches the pattern `azure-search-openai-demo-server-<number>`.
1. (Optional) Run `azd env set AZURE_CLIENT_APP_DISPLAY_NAME <desired_display_name>`. This sets the desired display name for the Azure AD app used by the client UI. If this variable is not set, a default name is automatically chosen that matches the pattern `azure-search-openai-demo-client-<number>`.
1. (Optional) Run `azd env set AZURE_ADLS_GEN2_STORAGE_ACCOUNT <existing Data Lake Storage Gen2 account name>` to add [sample access control](#azure-data-lake-storage-gen2-setup) to the data. Skip this if you are customizing your data and do not want to use the sample access control values.
1. Run `azd up`.

When `AZURE_USE_AUTHENTICATION` is set to true, `azd up` to automatically provision the two required Azure AD apps using the following steps:

* Using a preprovision hook to call [auth_init.ps1](./scripts/auth_init.ps1) to create two app registrations. That script also sets all the [required variables](#environment-variables-reference) for authentication.
* Using a postprovision hook to call [auth_update.ps1](./scripts/auth_update.ps1) to update the client app registration with the correct [redirect URI](https://learn.microsoft.com/azure/active-directory/develop/reply-url).

### Manual Setup

The following instructions explain how to setup the two apps using the Azure Portal.

#### Setting up the Server App

1. Sign in to the [Azure portal](https://portal.azure.com/).
1. Select the Azure AD Service.
1. In the left hand menu, select **Application Registrations**.
1. Select **New Registration**.
  1. In the **Name** section, enter a meaningful application name. This name will be displayed to users of the app, for example `Azure Search OpenAI Demo API`.
  1. Under **Supported account types**, select **Accounts in this organizational directory only**.
1. Select **Register** to create the application
1. In the app's registration screen, find the **Application (client) ID**.
  1. Run the following `azd` command to save this ID: `azd env set AZURE_SERVER_APP_ID <Application (client) ID>`.
1. Select **Certificates & secrets** in the left hand menu.
1. In the **Client secrets** section, select **New client secret**.
  1. Type a description, for example `Azure Search OpenAI Demo Key`.
  1. Select one of the available key durations.
  1. The generated key value will be displayed after you select **Add**.
  1. Copy the generated ke value and run the following `azd` command to save this ID: `azd env set AZURE_SERVER_APP_SECRET <generated key value>`.
1. Select **API Permissions** in the left hand menu. By default, the [delegated `User.Read`](https://learn.microsoft.com/graph/permissions-reference#user-permissions) permission should be present. This permission is required to read the signed-in user's profile to get the security information used for document level access control. If this permission is not present, it needs to be added to the application.
  1. Select **Add a permission**, and then **Microsoft Graph**.
  1. Select **Delegated permissions**.
  1. Search for and and select `User.Read`.
  1. Select **Add permissions**.
1. Select **Expose an API** in the left hand menu. The server app works by using the [https://learn.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow#protocol-diagram](On-Behalf-Of Flow), which requires the server app to expose at least 1 API.
  1. The application must define a URI to expose APIs. Select **Add** next to **Application ID URI**.
  1. By default, the Application ID URI is set to `api://<application client id>`. Accept the default by selecting **Save**.
  1. Under **Scopes defined by this API**, select **Add a scope**.
  1. Fill in the values as indicated:
    1. For **Scope name**, use **access_as_user**.
    1. For **Who can consent?**, select **Admins and users**.
    1. For **Admin consent display name**, type **Access Azure Search OpenAI Demo API**.
    1. For **Admin consent description**, type **Allows the app to access Azure Search OpenAI Demo API as the signed-in user.**.
    1. For **User consent display name**, type **Access Azure Search OpenAI Demo API**.
    1. For **User consent description**, type **Allow the app to access Azure Search OpenAI Demo API on your behalf**.
    1. Leave **State** set to **Enabled**.
    1. Select **Add scope** at the bottom to save the scope.

#### Client App

1. Sign in to the [Azure portal](https://portal.azure.com/).
1. Select the Azure AD Service.
1. In the left hand menu, select **Application Registrations**.
1. Select **New Registration**.
  1. In the **Name** section, enter a meaningful application name. This name will be displayed to users of the app, for example `Azure Search OpenAI Demo Web App`.
  1. Under **Supported account types**, select **Accounts in this organizational directory only**.
  1. Under `Redirect URI (optional)` section, select `Single-page application (SPA)` in the combo-box and enter the following redirect URI:
    1. If you are running the sample locally, use `http://localhost:50505/redirect`.
    1. If you are running the sample, use the endpoint provided by `azd up`: `https://<your-endpoint>.azurewebsites.net/redirect`.
1. Select **Register** to create the application
1. In the app's registration screen, find the **Application (client) ID**.
  1. Run the following `azd` command to save this ID: `azd env set AZURE_CLIENT_APP_ID <Application (client) ID>`.
1. In the left hand menu, select **API permissions**. You will add permission to access the **access_as_user** API on the server app. This permission is required for the [https://learn.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow#protocol-diagram](On-Behalf-Of Flow) to work.
  1. Select **Add a permission**, and then **My APIs**.
  1. In the list of applications, select your server application **Azure Search OpenAI Demo API**
  1. Ensure **Delegated permissions** is selected.
  1. In the **Select permissions** section, select the **access_as_user** permission
  1. Select **Add permissions**.

#### Configure Server App Authorized Client Applications

Consent from the user must be obtained for use of the client and server app. The client app can prompt the user for consent through a dialog when they log in. The server app has no ability to show a dialog for consent. Client apps can be [pre-authorized](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow#gaining-consent-for-the-middle-tier-application) to access the server app, so a consent dialog is not required for the server app when it's used from the client app.

1. Navigate to the server app registration
1. In the left hand menu, select **Expose an API**
1. Under **Authorized client applications**, select **Add a client application**
1. For **Client ID**, enter the client application ID.
1. Check the `api://<server application id>/access_as_user` scope under **Authorized scopes**.
1. Select **Add application**

## Optional scripts

Two optional scripts are provided that allow easier setup of sample data with document level access control.

### Azure Data Lake Storage Gen2 Setup

[Azure Data Lake Storage Gen2](https://learn.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-introduction) implements an [access control model](https://learn.microsoft.com/en-us/azure/storage/blobs/data-lake-storage-access-control) that can be used for document level access control. The [adlsgen2setup.ps1](./scripts/adlsgen2setup.ps1) script uploads the sample data included in the [data](./data) folder to a Data Lake Storage Gen2 storage account.

In order to use this script, an existing Data Lake Storage Gen2 storage account. Run `azd env set AZURE_ADLS_GEN2_STORAGE_ACCOUNT <your-storage-account>` prior to running the script.

To run the script, run the following command: `./scripts/adlsgen2setup.ps1`. The script performs the following steps:
1. Creates 3 example [groups](https://learn.microsoft.com/azure/active-directory/fundamentals/how-to-manage-groups): `GPTKB_AdminTest`, `GPTKB_EmployeeTest`, `GPTKB_HRTest`
1. Creates a filesystem / container `gptkbcontainer` in the storage account.
1. Creates two directories, `benefitinfo` and `employeeinfo` in the `gptkbcontainer` filesystem / container.
1. Uploads the sample PDFs into both directories.
1. [Recursively sets Access Control Lists (ACLs)](https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-acl-cli) on the `benefitinfo` and `employeeinfo` for the following groups:
   1. `GPTKB_AdminTest`: Can read all files in `gptkbcontainer`.
   1. `GPTKB_EmployeeTest`: Can only read files in `employeeinfo`.
   1. `GPTKB_HRTest`: Can read files in both `employeeinfo` and `benefitinfo`.

In order to use the sample access control, you need to join these groups in your Azure AD tenant.

### Azure Data Lake Storage Gen2 Prep Docs

Once a Data Lake Storage Gen2 storage account has been setup with sample data and access control lists, the [prepdocs-adlsgen2.ps1](./scripts/adlsgen2setup.ps1) can be used to automatically process PDFs in the storage account and store them with their [access control lists in the search index](https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-access-control).

To run this script, first set the following environment variables:

1. `AZURE_ADLS_GEN2_STORAGE_ACCOUNT`: Name of existing [Data Lake Storage Gen2 storage account](https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-introduction).
1. (Optional) `AZURE_ADLS_GEN2_FILESYSTEM`: Name of existing Data Lake Storage Gen2 filesystem / container in the storage account. If empty, `gptkbcontainer` is used.
1. (Optional) `AZURE_ADLS_GEN2_FILESYSTEM_PATH`: Specific path in the Data Lake Storage Gen2 filesystem / container to process. Only PDFs contained in this path will be processed.

Once the environment variables are set, run the script using the following command: `./scripts/prepdocs-adlsgen2.ps1`.

### Manually managing Document Level Access Control

Manually enable document level access control on a search index and manuall set access control values using the [manageacl.ps1](./scripts/manageacl.ps1) script.

Run `azd up` or manually set the `AZURE_SEARCH_SERVICE` and `AZURE_SEARCH_INDEX` environment variables prior to running the script.

To run the script, the following parameters are used:
1. `./scripts/manageacls.ps1 --enable-acls`: Creates the required `oids` (User ID) and `groups` (Group IDs) [security filter](https://learn.microsoft.com/azure/search/search-security-trimming-for-azure-search) fields for document level access control on your index. Does nothing if these fields already exist
1. `./scripts/manageacls.ps1 --document [name-of-pdf.pdf] --acl-type [oids or groups]--acl-action view`: Prints access control values associated with either User IDs or Group IDs for a specific document. Example to view all Group IDs from the Benefit_Options PDF: `./scripts/manageacls.ps1 --document Benefit_Options.pdf --acl-type oids --acl-action view`.
1. `./scripts/manageacls.ps1 --document [name-of-pdf.pdf] --acl-type [oids or groups]--acl-action add --acl [ID of group or user]`: Adds an access control value associated with either User IDs or Group IDs for a specific document. Example to add a Group ID to the Benefit_Options PDF: `./scripts/manageacls.ps1 --document Benefit_Options.pdf --acl-type groups --acl-action add --acl xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.
1. `./scripts/manageacls.ps1 --document [name-of-pdf.pdf] --acl-type [oids or groups]--acl-action remove_all`: Removes all access control values associated with either User IDs or Group IDs for a specific document. Example to remove all Group IDs from the Benefit_Options PDF: `./scripts/manageacls.ps1 --document Benefit_Options.pdf --acl-type groups --acl-action remove_all`.
1. `./scripts/manageacls.ps1 --document [name-of-pdf.pdf] --acl-type [oids or groups]--acl-action remove --acl [ID of group or user]`: Removes an access control value associated with either User IDs or Group IDs for a specific document. Example to remove a specific User ID from the Benefit_Options PDF: `./scripts/manageacls.ps1 --document Benefit_Options.pdf --acl-type oids --acl-action remove --acl xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

### Environment Variables Reference

The following environment variables are used to setup the optional login and document level access control:

1. `AZURE_USE_AUTHENTICATION`: Enables Azure AD based optional login and document level access control. Set to true before running `azd up` to ensure all other environment variables are set and the necessary Azure AD apps are provisioned.
1. `AZURE_SERVER_APP_ID`: Application ID of the Azure AD app for the API server. If `AZURE_SERVER_APP_ID` is empty prior to running `azd up`, a new Azure AD app will be created.
1. `AZURE_SERVER_APP_DISPLAY_NAME`: Display name of the Azure AD app for the API server. If `AZURE_SERVER_APP_ID` is referencing an existing Azure AD app, this variable is not used. If `AZURE_SERVER_APP_ID` is empty, a new Azure AD app is created that uses this display name. If the display name is not set prior to running `azd up`, a default value is automatically chosen.
1. `AZURE_SERVER_APP_SECRET`: [Client secret](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow) used by the API server to authenticate using the Azure AD API server app. If `AZURE_SERVER_APP_SECRET` is empty prior to running `azd up`, a new client secret is generated.
1. `AZURE_CLIENT_APP_ID`: Application ID of the Azure AD app for the client UI. If `AZURE_CLIENT_APP_ID` is empty prior to running `azd up`, a new Azure AD app will be created.
1. `AZURE_CLIENT_APP_DISPLAY_NAME`: Display name of the Azure AD app for the client UI. If `AZURE_CLIENT_APP_ID` is referencing an existing Azure AD app, this variable is not used. If `AZURE_CLIENT_APP_ID` is empty, a new Azure AD app is created using this display name. If the display name is not set prior to running `azd up`, a default value is automatically chosen.
1. `AZURE_TENANT_ID`: [Tenant ID](https://learn.microsoft.com/azure/active-directory/fundamentals/how-to-find-tenant) associated with the Azure AD used for login and document level access control. This is set automatically by `azd up`.
1. `AZURE_ADLS_GEN2_STORAGE_ACCOUNT`: (Optional) Name of existing [Data Lake Storage Gen2 storage account](https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-introduction) for storing sample data with [access control lists](https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-access-control). Only used with the optional Data Lake Storage Gen2 [setup](#azure-data-lake-storage-gen2-setup) and [prep docs](#azure-data-lake-storage-gen2-prep-docs) scripts.
1. `AZURE_ADLS_GEN2_STORAGE_FILESYSTEM`: (Optional) Name of existing [Data Lake Storage Gen2 filesystem](https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-introduction) for storing sample data with [access control lists](https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-access-control). Only used with the optional Data Lake Storage Gen2 [setup](#azure-data-lake-storage-gen2-setup) and [prep docs](#azure-data-lake-storage-gen2-prep-docs) scripts.
1. `AZURE_ADLS_GEN2_STORAGE_FILESYSTEM_PATH`: (Optional) Name of existing path in a [Data Lake Storage Gen2 filesystem](https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-introduction) for storing sample data with [access control lists](https://learn.microsoft.com/azure/storage/blobs/data-lake-storage-access-control). Only used with the optional Data Lake Storage Gen2 [prep docs](#azure-data-lake-storage-gen2-prep-docs) scrip..