# SCI AMS Express UI5

A full-stack SAP BTP sample application demonstrating how to combine
**SAPUI5**, a standalone **SAP Application Router**, an **Express.js
REST API**, **SAP Cloud Identity Services**, and **Authorization
Management Service (AMS)** in a Multi-Target Application (MTA).

The application uses SAP Cloud Identity Services for user authentication
and AMS for policy-based authorization. Authorization rules are defined
using **Data Control Language (DCL)** policies and enforced by the
Express.js backend before protected application resources are accessed
or modified.

## Architecture

The application consists of the following main components:

-   **SAPUI5 Application** -- Provides the user interface and consumes
    the REST API exposed by the Express.js backend.
-   **Application Router** -- Serves as the application entry point and
    authenticates users through SAP Cloud Identity Services.
-   **Express.js Backend** -- Exposes the REST API, performs database
    operations, and evaluates authorization before protected resources
    are accessed or modified.
-   **SAP Cloud Identity Services** -- Provides identity and
    authentication capabilities for the Application Router and backend.
-   **Authorization Management Service (AMS)** -- Evaluates the
    authorization policies applicable to the authenticated user and
    determines which actions are allowed on application resources.
-   **DCL Authorization Policies** -- Define the application's
    authorization model, including actions, resources, reusable
    policies, and instance-based restrictions.
-   **HTML5 Application Repository** -- Stores and serves the built
    SAPUI5 application consumed through the Application Router.
-   **MTA Deployment Descriptor** -- Defines the complete deployable
    application, its modules, SAP BTP services, dependencies, bindings,
    build steps, and deployment tasks.

A simplified request flow is:

``` text
                         SAP Cloud Identity Services
                                  |
                                  | authentication
                                  v
Browser -------------------> Application Router
                                  |
                     +------------+------------+
                     |                         |
                     v                         v
          HTML5 Application Repository     Express.js API
                     |                         |
                     v                         v
                SAPUI5 App            Authorization Management
                                          Service (AMS)
                                               |
                                               v
                                      DCL Policy Evaluation
                                               |
                                               v
                                        SQLite Database
```

The Application Router is the public entry point. It authenticates the
user with SAP Cloud Identity Services and serves the SAPUI5 application
from the HTML5 Application Repository. Requests from the UI to the
backend are routed to the Express.js service, where AMS authorization is
evaluated before protected data is returned or modified.

## Authentication and Authorization

Authentication and authorization are intentionally separated.

### Authentication

The standalone Application Router authenticates users through **SAP
Cloud Identity Services / Identity Authentication (IAS)**. The Identity
Service instance is bound to the Application Router using generated
X.509 credentials.

Routes protected with IAS use:

``` json
"authenticationType": "ias"
```

The HTML5 Application Repository can therefore be consumed through an
IAS-authenticated Application Router without requiring XSUAA as the
application's primary authentication service.

### Authorization

The Express.js backend uses **Authorization Management Service (AMS)**
to determine whether the authenticated user may perform an action on a
resource.

Authorization policies are written in DCL and deployed as **Base
Authorization Policies** to SAP Cloud Identity Services.

Policies can grant unconditional access:

``` dcl
GRANT read ON Departments;
```

or conditional, instance-based access:

``` dcl
GRANT read ON Employees
    WHERE countryCode = 'DE';
```

For conditional employee authorization, the backend supplies
authorization-relevant resource attributes to AMS. Collection
authorization can be translated into parameterized SQL conditions so
unauthorized records do not need to be loaded into application memory.

This keeps the authorization model in AMS/DCL rather than duplicating
policy rules in application code.

## Application Resources

### Employees

Employee authorization can be conditional on authorization-relevant
employee attributes such as `countryCode`.

The backend supports reading all authorized employees, reading a
specific employee, creating an employee, partially updating an employee,
and deleting an employee.

Collection authorization is translated into database filters where
required, while single-resource operations evaluate AMS decisions
against the concrete employee.

### Employee Addresses

Employee addresses are modeled as child resources of an employee:

``` text
/employee/:employeeId/address
/employee/:employeeId/address/:addressId
```

Access to address data requires authorization to access the parent
employee as well as the corresponding privilege on `EmployeeAddresses`.

The employee policy determines **which employee** the user may access,
while the Employee Address policy determines **which address operation**
the user may perform.

### Departments

Department policies are unconditional, so AMS can make a complete
privilege decision without requiring department-specific resource
attributes.

The backend supports standard CRUD operations for departments.

## Project Structure

``` text
.
├── ams-policies-deployer/
├── approuter/
├── html5-build-result/
├── mta_archives/
├── service/
├── ui/
├── .gitignore
├── ias-config.json
├── ias-service-key-config.json
├── mta.yaml
├── package-lock.json
└── package.json
```

### `ams-policies-deployer/`

Contains the DCL schema and authorization policies used by AMS.

This module is responsible for deploying the application's **Base
Authorization Policies** to SAP Cloud Identity Services.

The DCL sources define application resources, actions, reusable
policies, and optional instance-based restrictions. During local
development, the DCL sources can also be compiled into DCN artifacts for
local AMS evaluation.

Generated DCN content is local build output and is not required as a
deployed application artifact.

### `approuter/`

Contains the standalone SAP Application Router.

The Application Router:

-   Acts as the public entry point to the application.
-   Authenticates users through SAP Cloud Identity Services.
-   Serves the SAPUI5 application from the HTML5 Application Repository.
-   Routes backend requests to the Express.js service.
-   Maintains the authenticated browser session.

The Application Router is bound to the Identity Service using generated
X.509 credentials.

### `service/`

Contains the Express.js backend implementation.

Its responsibilities include:

-   Exposing the application's REST API.
-   Validating incoming request payloads.
-   Performing CRUD operations against SQLite.
-   Resolving AMS authorization decisions.
-   Enforcing conditional and unconditional privileges.
-   Translating conditional AMS decisions into parameterized SQL where
    collection filtering is required.

The service contains the application's routers, request handlers,
database services, schemas, authorization helpers, and supporting types.

### `ui/`

Contains the SAPUI5 frontend application.

The UI provides the user interface, communicates with the Express.js
backend, is built into `ui/dist`, is packaged as an HTML5 application
artifact during the MTA build, and is deployed to the HTML5 Application
Repository.

### `html5-build-result/`

Generated staging directory used during the MTA build.

The SAPUI5 HTML5 module is first built into `ui/dist`. The MTA builder
packages that output as a ZIP artifact and copies it into
`html5-build-result/` for the `com.sap.application.content` module.

``` text
ui/
  |
  | npm run build:prod
  v
ui/dist/
  |
  | MTA HTML5 module packaging
  v
HTML5 application ZIP
  |
  | application-content build dependency
  v
html5-build-result/
  |
  v
HTML5 Application Repository
```

This directory contains generated build output and should not be treated
as maintained source code.

### `mta_archives/`

Contains generated `.mtar` archives produced by the MTA build process.

An MTAR packages the deployable modules and deployment metadata required
to deploy the application to Cloud Foundry. This directory is generated
output and should normally be excluded from version control.

### `ias-config.json`

Contains the configuration parameters used when creating the SAP Cloud
Identity Services Identity Service application instance.

The configuration enables the capabilities required by the application,
including Authorization Management Service and OAuth/OIDC settings
required by the Application Router.

For IAS authentication through the standalone Application Router, the
Identity Service configuration must allow the Application Router
callback URI:

``` text
https://<approuter-host>/login/callback?authType=ias
```

### `ias-service-key-config.json`

Contains the configuration parameters used to create a service key for
the SAP Cloud Identity Services instance with **generated X.509
credentials**.

The certificate-based credentials are used during local development to
deploy DCL authorization policies without first deploying the complete
MTAR application.

### `mta.yaml`

The Multi-Target Application deployment descriptor for the complete
application.

It defines:

-   Application modules
-   SAP BTP managed services
-   Module dependencies
-   Service bindings
-   X.509 binding configuration
-   HTML5 application packaging
-   HTML5 Application Repository deployment
-   AMS policy deployment
-   Build commands
-   Deployment tasks
-   Cloud Foundry runtime configuration

The descriptor connects the independently developed frontend,
Application Router, backend, policy deployer, and SAP BTP services into
one deployable application.

### `package.json`

Contains root-level Node.js dependencies and npm scripts used for
development, build, and deployment operations.

### `package-lock.json`

Locks the exact Node.js dependency versions used by the project to
provide reproducible installations.

## HTML5 Application Build and Deployment

The SAPUI5 application is defined as an MTA `html5` module.

During the MTA build:

1.  The builder enters the `ui/` module.
2.  The configured production UI build is executed.
3.  The final SAPUI5 application is written to `ui/dist`.
4.  The MTA builder packages the HTML5 module output as a ZIP artifact.
5.  The application-content module consumes that ZIP as a build
    dependency.
6.  The ZIP is staged under `html5-build-result/`.
7.  During deployment, the application-content module uploads the ZIP to
    the HTML5 Application Repository `app-host` service instance.

The HTML5 module itself is therefore a build-time module rather than a
standalone Cloud Foundry application.

## Local Authorization Development

AMS policies are maintained as DCL sources under
`ams-policies-deployer/`.

For local development, the policies can be compiled into DCN and loaded
by the backend using the local AMS integration. Mock policy assignments
and user inputs can then simulate different authorization scenarios
without requiring a complete cloud deployment.

This is useful for testing unrestricted access, country-restricted
access, regional employee access, viewer versus administrator
privileges, conditional collection filtering, and parent-resource
authorization for employee addresses.

Local-only authorization policies can simulate administrator-created
restrictions without deploying those test policies as productive Base
Authorization Policies.

## REST API

Typical routes include:

``` text
GET    /employee
GET    /employee/:employeeId
POST   /employee
PATCH  /employee/:employeeId
DELETE /employee/:employeeId

GET    /employee/:employeeId/address
GET    /employee/:employeeId/address/:addressId
POST   /employee/:employeeId/address
PATCH  /employee/:employeeId/address/:addressId
DELETE /employee/:employeeId/address/:addressId

GET    /department
GET    /department/:departmentId
POST   /department
PATCH  /department/:departmentId
DELETE /department/:departmentId
```

The exact API prefix is determined by the Application Router and backend
routing configuration.

## Database

The backend uses SQLite for persistence.

The main tables are:

-   `Employees`
-   `EmployeeAddresses`
-   `Departments`

Relationships are enforced with database constraints. Employee addresses
reference their parent employee, and employees reference departments.

The service layer executes database operations, while request handlers
coordinate validation, authorization, HTTP status codes, and responses.

## Security Design

The application follows several security principles:

-   Authentication is delegated to SAP Cloud Identity Services.
-   Authorization rules are defined centrally in AMS/DCL.
-   The backend does not trust frontend authorization decisions.
-   Protected operations are authorized server-side before database
    mutations occur.
-   Conditional authorization is evaluated against concrete resource
    attributes.
-   Collection authorization is pushed into SQL where appropriate.
-   SQL literal values are supplied through bound parameters rather than
    string interpolation.
-   Child resources such as employee addresses cannot be accessed
    independently of their parent employee authorization.
-   X.509 credentials are used for Identity Service bindings where
    required.

## Deployment

The complete application is deployed as an SAP BTP Multi-Target
Application to a Cloud Foundry space.

At a high level:

``` text
Build SAPUI5 application
        |
        v
Package HTML5 artifact
        |
        v
Build Express backend
        |
        v
Package Application Router
        |
        v
Prepare AMS policy deployer
        |
        v
Create/update required SAP BTP services
        |
        v
Bind modules to services
        |
        v
Deploy HTML5 content
        |
        v
Deploy DCL Base Authorization Policies
        |
        v
Start application runtime modules
```

The exact module definitions, service plans, bindings, and deployment
tasks are defined in `mta.yaml`.

## Deployment to SAP BTP Cloud Foundry

The application is ready to be deployed to a Cloud Foundry environment
in an SAP BTP subaccount using the Multi-Target Application deployment
model.

### Prerequisites

Before deploying the application, ensure that the following
prerequisites are met:

1.  **SAP BTP Subaccount with Cloud Foundry enabled**

    A Cloud Foundry environment must be activated in the target SAP BTP
    subaccount, and a target organization and space must be available.

2.  **Required SAP BTP services are entitled and available**

    The SAP BTP subaccount must provide the services required by the
    application, including:

    -   SAP Cloud Identity Services
    -   SAP Authorization Management Service (AMS)
    -   SAP HTML5 Application Repository
    -   SAP Destination service

    The exact service instances, service plans, and bindings required by
    the application are defined in `mta.yaml`.

3.  **Cloud MTA Build Tool (MBT)**

    The `mbt` npm package must be installed to build the Multi-Target
    Application archive.

    ``` bash
    npm install -g mbt
    ```

4.  **Cloud Foundry CLI with MultiApps plugin**

    The Cloud Foundry CLI must be installed and configured with the
    MultiApps plugin, which provides the `cf deploy` command used to
    deploy MTAR archives.

### Deployment

First, log in to the target SAP BTP Cloud Foundry environment and select
the organization and space where the application should be deployed:

``` bash
cf login
```

Build the Multi-Target Application from the project root:

``` bash
mbt build
```

The generated MTAR archive is written to:

``` text
mta_archives/
```

Deploy the generated archive to the currently targeted Cloud Foundry
space:

``` bash
cf deploy mta_archives/<mtar_file_name>.mtar
```

The deployment process uses `mta.yaml` to create or update the required
SAP BTP service instances, establish service bindings, deploy the
application modules, upload the SAPUI5 application to the HTML5
Application Repository, and execute the configured AMS policy deployment
task.

After a successful deployment, the application can be accessed through
the route assigned to the standalone Application Router.

## Technology Stack

-   SAPUI5
-   TypeScript
-   Node.js
-   Express.js
-   SAP Application Router (`@sap/approuter`)
-   SAP Cloud Identity Services
-   SAP Authorization Management Service (`@sap/ams`)
-   SAP HTML5 Application Repository
-   SQLite / `better-sqlite3`
-   Zod
-   SAP BTP Cloud Foundry
-   Multi-Target Applications (MTA)
-   Data Control Language (DCL)

## Purpose

The project demonstrates an end-to-end SAP BTP architecture in which
authentication, policy-based authorization, frontend hosting, REST APIs,
persistence, and deployment are cleanly separated.

A central goal is to demonstrate how **SAP Cloud Identity Services and
AMS can be used with a standalone Application Router, an SAPUI5 frontend
hosted in the HTML5 Application Repository, and a custom Express.js
backend**, including both unconditional privileges and instance-based
authorization restrictions.
