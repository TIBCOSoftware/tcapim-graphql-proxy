# GraphQL Proxy for TIBCO Cloud™ API Management
Proxy Server for enforcing GraphQL Policies

---
**GraphQL Proxy for TIBCO Cloud™ API Management** is a Node.js application that is deployed on TIBCO Cloud™ Integration (TCI) and invoked as a preprocessor from TIBCO Cloud™ API Management.
This application can help enforce below policies -

* **Max Query Depth** - Specify the maximum allowed depth for the graphQL query
* **Allow Introspection** - Option to allow/restrict introspection queries
* **Allow Mutation** - Option to allow/restrict mutation queries
* **Restricted Objects** - Control and restrict access to top-level objects

>:exclamation: **DISCLAIMER**: The application provided in this repository is intended as an accelerator and should therefore be tested and verified independently prior to deployment into any production usage.

## Table of Contents
1. [Overview](#overview)
2. [Building the Application](#building-the-application)
3. [Configuring Application on TCI](#configuring-application-on-tci)  
4. [Configuring TIBCO Cloud API Management](#configuring-tibco-cloud-api-management)
    1. [Area Level Configurations](#area-level-configurations)
    2. [Endpoint Configuration](#endpoint-configuration)
5. [Demo](#demo)
6. [Known Limitations](#known-limitations)

## Overview

The inline-proxy orchestrator capability of TIBCO Cloud™ API Management enables users to invoke any TCI application to pre- or post-process an API request. The **tcapim-graphql-proxy** application leverages the pre-processor functionality to validate the incoming graphql query.  API Product Managers can define the graphql policies at Package Keys in TIBCO Cloud™ API Management. These policies are sourced to the Inline-proxy pre-processor for validation.

![graphql-proxy-overview](https://user-images.githubusercontent.com/29055956/148952202-74d830de-85ef-4cfe-9499-83d039b59459.png)


The requests that fail to pass the validation rules are rejected by the Inline-proxy orchestrator, thus safeguarding the GraphQL backend from receiving any invalid queries.

## Building the Application

This section describes the steps for building the application.

>**Prerequisites**: GraphQL Schema  
Application needs a schema of the graphql backend to validate the graphql query. This repository includes a Countries schema for a quick setup and can be used to test against the graphql service available at  https://countries.trevorblades.com/graphql

1. Clone this repository - `git clone https://github.com/TIBCOSoftware/tcapim-graphql-proxy.git`
2. Rename your GraphQL Schema to _schema.graphql_
3. Move _schema.graphql_ to `/package/src/config/`
4. Create the deployable package by executing -  
`zip -r tcapim-graphql-proxy.zip package -x package/node_modules/\*`
5. Update the text `tcapim-graphql-proxy` in _manifest.json_ to change the application and service name on TCI  

This creates _tcapim-graphql-proxy.zip_ artifacts needed for deployment along with the updated _manifest.json_

A short clip showing the above configurations -

https://user-images.githubusercontent.com/29055956/156973954-363260c7-d22c-4032-a0b1-ce8544b83ad1.mp4

## Configuring Application on TCI

This section describes the steps to deploy and configure the application on TIBCO Cloud Integration.

1. Login to cloud.tibco.com and navigate to integration capability
2. Use Create/Import option to create a new nodejs application
3. Upload the _tcapim-graphql-proxy.zip_ and _manifest.json_ files
4. Once the application is created, you can rename it or change the description as required
5. Scale the application to bring it in Running State
6. Update endpoint visibility to TIBCO Cloud™ Mesh. This ensures that the application can be discovered by TIBCO Cloud API Management

## Configuring TIBCO Cloud API Management

Configuring TIBCO Cloud™ API Management for using the GraphQL Proxy application and configuring EAVs.

### Area Level Configurations

> :exclamation: These configurations can be performed only by a TIBCO administrator. Please reach out to your Account Partner or Customer Success team to help with these configurations.

1. Ensure that the area is enabled to use Inline-proxy Orchestrator
2. Update the **Package Keys** Data Model to include the below EAVs

| Name | Label | Type | Description | Default Value |
|---|---|---|---|---|
|max_query_depth| Max Query Depth |int | Define Max Query Depth for Graphql endpoint. Set value as '0' to skip this validation. | 3|
|allow_introspection| Allow Introspection |bool | Enable introspection queries to the graphql backend | false |
|allow_mutation| Allow Mutations |bool |Enable mutations to the graphql backend | false |
|restricted_objects| Restricted Objects|varchar | Restrict access to the Objects (Comma Separated)| |

### Endpoint Configuration

These configurations can be done by API Product Manager on the Endpoint exposing graphql backend. The high-level steps are -  
1. Configure the Pre-processor by discovering the inline-proxy orchestrator application
2. Select headers & body in API Request Elements
3. Configure EAVs to include max_query_depth, allow_introspection, allow_mutation and restricted_objects in Package Key fields
4. Optionally update timeout settings  

Below video demonstrates the configurations -

https://user-images.githubusercontent.com/29055956/151753888-76baa4a2-2405-4e46-b440-9648fa2c9f1f.mp4


## Demo

Checkout this awesome demo that shows policies in action for the API requests from GraphQL playground!

https://user-images.githubusercontent.com/29055956/151754070-b0ff232b-5788-4a51-ab4d-18018eef1797.mp4

## Known Limitations

Inline-proxy orchestrator supports payload size of 1 Mb. Requests containing more than 1 Mb payload will be rejected.

## License
This repository is governed by the license specified in the [license file](LICENSE.md). 

## Help
This repository is a collaborative space for sharing samples for TIBCO Cloud API Management products. The samples provided here are maintained and supported by the user community. For raising any issues or questions related to the samples provided here please create a GitHub issue.

If you would like to contribute, please send us a note at tcapim-pm@tibco.com
