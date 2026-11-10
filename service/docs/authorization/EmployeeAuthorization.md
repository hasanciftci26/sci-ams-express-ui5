# Employee Authorization

This document describes the authorization model used by the
employee-related Express routes and request handlers.

The application uses SAP Authorization Management Service (AMS) for
authorization. Authorization is intentionally split into two stages:

1.  **Route-level privilege prechecks** reject requests for which the
    authenticated user has no potentially applicable privilege.
2.  **Handler-level authorization checks** resolve conditional
    privileges against the concrete resource data required by the
    operation.

This separation allows requests that are conditionally authorized to
reach the handler while rejecting completely unauthorized requests as
early as possible.

## General Authorization Model

AMS authorization can effectively result in three cases:

### Unconditionally denied

The user has no applicable policy granting the requested privilege.

A route-level `precheckPrivilege` rejects this case with HTTP 403 before
the request handler is executed.

### Unconditionally granted

The user has an unrestricted privilege for the requested action and
resource, for example:

``` dcl
GRANT read ON Employees;
```

The request may proceed without requiring resource attributes to resolve
the privilege.

### Conditionally granted

The user has a privilege whose applicability depends on resource data,
for example:

``` dcl
GRANT read ON Employees
    WHERE countryCode = 'DE';
```

or:

``` dcl
GRANT read ON Employees
    WHERE countryCode = $user.userRegion;
```

A privilege precheck allows this case to continue because the privilege
is potentially applicable. The final decision is made later when the
handler can provide the authorization-relevant `$app` attributes.

For user-dependent policies, values such as `$user.userRegion` are
supplied through the AMS authorization context. The application supplies
the resource-side `$app` values and does not duplicate the policy logic
in TypeScript.

------------------------------------------------------------------------

## Read Authorization

### Route Configuration

Read routes apply:

``` ts
precheckPrivilege("read", "Employees")
```

before executing the corresponding request handler.

The precheck rejects users who have no applicable read authorization
while allowing both unconditionally and conditionally authorized users
to continue.

Conditional authorization is resolved differently depending on whether
the request targets one entity or a collection:

-   **Single-entity reads** retrieve the requested record and evaluate
    the authorization condition against that record.
-   **Collection reads** translate the remaining AMS authorization
    condition into a database filter so that only authorized records are
    retrieved.

### Reading a Single Employee

For:

``` http
GET /employee/:employeeId
```

the employee is first retrieved from the database.

Since the endpoint operates on one explicitly requested record,
retrieving that record before resolving the conditional authorization is
practical.

The handler provides the authorization-relevant attributes to AMS:

``` ts
{
    countryCode: employee.countryCode
}
```

AMS evaluates the concrete employee against the user's applicable
policies.

For example:

``` dcl
GRANT read ON Employees
    WHERE countryCode = 'DE';
```

results in access being granted for an employee with:

``` text
countryCode = "DE"
```

and denied for an employee with:

``` text
countryCode = "TR"
```

For a regional policy:

``` dcl
GRANT read ON Employees
    WHERE countryCode = $user.userRegion;
```

AMS resolves `$user.userRegion` from the user's authorization context.
The handler only supplies the employee's `countryCode`.

If the final decision is granted, the employee is returned. Otherwise,
the request is rejected with HTTP 403.

### Reading an Employee Collection

For:

``` http
GET /employee
```

the application must not retrieve every employee and subsequently filter
unauthorized records in application memory.

For example, this approach should be avoided:

``` text
SELECT * FROM Employees
        ↓
load every employee
        ↓
evaluate authorization per row
        ↓
discard unauthorized rows
```

It unnecessarily loads unauthorized records and becomes inefficient as
the data set grows.

Instead, the handler first obtains the AMS decision:

``` ts
req[AMS_AUTHORIZATIONS].checkPrivilege("read", "Employees")
```

If the decision is unconditionally granted, all employees can be
retrieved.

If the decision is conditional, the remaining AMS condition is
translated into a parameterized SQL expression by
`AuthorizationConditionTranslator`.

For example:

``` text
$app.countryCode = "DE"
```

is translated into:

``` sql
countryCode = ?
```

with:

``` ts
parameters: ["DE"]
```

A more complex condition such as:

``` text
$app.countryCode = "DE" OR $app.countryCode = "TR"
```

can become:

``` sql
(countryCode = ? OR countryCode = ?)
```

with:

``` ts
parameters: ["DE", "TR"]
```

The resulting expression is passed to `EmployeeService`, allowing SQLite
to retrieve only records satisfying the authorization condition.

### Mapping AMS Attributes to Database Fields

AMS conditions refer to application attributes such as:

``` text
$app.countryCode
```

while SQLite operates on columns such as:

``` text
countryCode
```

The translator receives an explicit reference-to-field mapping, for
example:

``` ts
new Map<string, string>([
    ["$app.countryCode", "countryCode"]
])
```

Only known AMS references are allowed to become SQL field names.

Literal authorization values are never interpolated directly into the
SQL string. They are represented by `?` placeholders and supplied
separately as bound parameters.

This keeps authorization values separate from executable SQL and allows
the database to perform the authorization filtering efficiently.

------------------------------------------------------------------------

## Create Authorization

### Route Configuration

Create routes apply both:

``` ts
precheckPrivilege("read", "Employees")
```

and:

``` ts
precheckPrivilege("create", "Employees")
```

before executing the create handler.

Create operations require both read and create authorization because the
application maintains the invariant that users may only create resources
that they are also allowed to read.

The route-level prechecks reject users who have no potentially
applicable read or create authorization. Conditional privileges are
allowed to continue because the resource data required to resolve those
conditions is not yet available.

### Request Validation

The request body is validated before entity-specific authorization or
database mutation occurs.

Validation ensures that the request represents a valid employee and
provides the authorization-relevant attributes required by AMS.

If validation fails, the request is rejected with HTTP 400.

### Entity-Specific Authorization

After validation, the handler supplies the authorization-relevant
attributes of the employee being created:

``` ts
{
    countryCode: result.data.countryCode
}
```

Two concrete privileges are evaluated:

-   `read` determines whether the user may read the resulting employee.
-   `create` determines whether the user may create the resulting
    employee.

Both decisions must be granted.

For example:

``` dcl
GRANT read ON Employees
    WHERE countryCode = 'DE';

GRANT create ON Employees
    WHERE countryCode = 'DE';
```

allows creation of an employee with:

``` text
countryCode = "DE"
```

but rejects creation of an employee with:

``` text
countryCode = "TR"
```

with HTTP 403.

The same mechanism applies to user-dependent policies such as:

``` dcl
GRANT create ON Employees
    WHERE countryCode = $user.userRegion;
```

AMS resolves the `$user` attributes while the handler supplies the
`$app` attributes belonging to the employee being created.

### Database Mutation

The employee is persisted only after:

1.  The request body has been successfully validated.
2.  The concrete read privilege has been granted.
3.  The concrete create privilege has been granted.

The flow is therefore:

``` text
read/create prechecks
        ↓
validate request
        ↓
check read against resulting employee
        ↓
check create against resulting employee
        ↓
both granted
        ↓
INSERT employee
        ↓
HTTP 201
```

No unauthorized database mutation occurs.

------------------------------------------------------------------------

## Update Authorization

### Route Configuration

Update routes apply both:

``` ts
precheckPrivilege("read", "Employees")
```

and:

``` ts
precheckPrivilege("update", "Employees")
```

before executing the update handler.

The prechecks reject users with no potentially applicable read or update
privilege while allowing conditional authorization to continue.

Unlike creation, update authorization must consider an existing resource
and may also need to consider the resource state produced by the update.

### PATCH Request Validation

The update endpoint uses PATCH semantics.

The request may contain only the fields that should be changed. Fields
not supplied by the request remain unchanged.

For example:

``` json
{
    "firstName": "Jane"
}
```

changes only `firstName`.

A request such as:

``` json
{
    "firstName": "Jane",
    "countryCode": "TR"
}
```

changes both fields while preserving all other employee attributes.

The PATCH body is validated before any database mutation occurs. Invalid
requests are rejected with HTTP 400.

### Authorization of the Current Resource State

An update operates on an existing employee.

The employee is therefore retrieved from the database before the final
authorization decision so that the handler knows its current
authorization-relevant attributes.

For example:

``` ts
{
    countryCode: employee.countryCode
}
```

The handler evaluates:

``` text
read Employees
update Employees
```

against the current employee state.

Both must be granted.

This prevents users from modifying resources that were already outside
their authorization scope before the update.

### Authorization of the Resulting Resource State

Additional authorization is required when the PATCH changes an attribute
that participates in an AMS policy condition.

Currently, employee authorization depends on `countryCode`.

If `countryCode` is not supplied by the PATCH request, the employee
remains in the same authorization scope with respect to the current
policies. The current-state authorization is therefore sufficient.

If `countryCode` changes, both sides of the transition must be
authorized.

For example:

``` text
Current employee:
countryCode = "DE"

PATCH:
countryCode = "TR"
```

The handler first verifies:

``` text
Can the user read the current DE employee?
Can the user update the current DE employee?
```

If both are granted, it then verifies:

``` text
Can the user read an employee in TR?
Can the user update an employee in TR?
```

Only if all required decisions are granted may the transition occur.

This prevents two authorization bypass scenarios:

1.  A user authorized for the new state but not the current state cannot
    take control of a resource that was previously outside their scope.
2.  A user authorized for the current state but not the new state cannot
    move a resource into an authorization scope they are not permitted
    to access.

### Why Both Read and Update Are Required

The application maintains the invariant that users may modify only
resources they are also allowed to read.

Therefore, both privileges are evaluated against the current employee
and, when an authorization-relevant attribute changes, against the
resulting authorization scope.

### Database Mutation

The service receives only the validated fields contained in the PATCH
request and changes only those fields.

The update occurs only after all required authorization decisions have
succeeded.

The flow is:

``` text
read/update prechecks
        ↓
validate PATCH
        ↓
retrieve current employee
        ↓
check read + update against current state
        ↓
authorization-relevant attribute changed?
        │
        ├── no ───────────────┐
        │                     │
        └── yes               │
             ↓                │
        check read + update   │
        against new state     │
             ↓                │
             └────────────────┘
                    ↓
             all checks granted
                    ↓
               UPDATE employee
                    ↓
          return updated employee
```

------------------------------------------------------------------------

## Delete Authorization

### Route Configuration

Delete routes apply both:

``` ts
precheckPrivilege("read", "Employees")
```

and:

``` ts
precheckPrivilege("delete", "Employees")
```

before executing the delete handler.

Delete operations require both read and delete authorization so that
users may delete only resources they are also allowed to access.

The prechecks reject users who have no potentially applicable
authorization while allowing conditional privileges to continue.

### Retrieving the Current Resource

A delete operation targets an existing resource.

The employee is first retrieved from the database for two reasons:

1.  To verify that the requested employee exists.
2.  To obtain the authorization-relevant attributes needed to resolve
    conditional AMS policies.

If the employee does not exist, the operation terminates with the
corresponding not-found response and no delete is attempted.

### Entity-Specific Authorization

The handler supplies the employee's current authorization-relevant
attributes:

``` ts
{
    countryCode: employee.countryCode
}
```

and evaluates:

-   `read` to determine whether the user may access the employee;
-   `delete` to determine whether the user may delete the employee.

Both decisions must be granted.

For example:

``` dcl
GRANT read ON Employees
    WHERE countryCode = 'DE';

GRANT delete ON Employees
    WHERE countryCode = 'DE';
```

allows a German employee to be deleted while rejecting deletion of an
employee outside that authorization scope.

### Difference from Update Authorization

Update authorization can involve two states:

``` text
current state → resulting state
```

because the operation may change an authorization-relevant attribute.

Delete has no resulting resource state:

``` text
current state → resource no longer exists
```

Therefore, delete authorization only needs to be evaluated against the
current resource state.

### Database Mutation

The employee is deleted only after:

1.  The employee has been successfully retrieved.
2.  The concrete read privilege has been granted.
3.  The concrete delete privilege has been granted.

If either privilege is denied, the request returns HTTP 403 and the
employee remains unchanged.

A successful deletion returns:

``` text
HTTP 204 No Content
```

The flow is:

``` text
read/delete prechecks
        ↓
retrieve employee
        ↓
check read against current state
        ↓
check delete against current state
        ↓
both granted
        ↓
DELETE employee
        ↓
HTTP 204
```

------------------------------------------------------------------------

## Authorization Strategy Summary

The authorization strategy differs slightly by operation:

  -----------------------------------------------------------------------
  Operation               State evaluated         Strategy
  ----------------------- ----------------------- -----------------------
  Read single             Current entity          Retrieve entity, then
                                                  evaluate `read`

  Read collection         Potential collection    Translate conditional
                          rows                    AMS decision into SQL

  Create                  Resulting entity        Evaluate `read` and
                                                  `create` before
                                                  insertion

  Update                  Current and potentially Evaluate `read` and
                          resulting entity        `update` before
                                                  transition

  Delete                  Current entity          Evaluate `read` and
                                                  `delete` before
                                                  deletion
  -----------------------------------------------------------------------

The common pattern is:

``` text
Route-level precheck
        ↓
reject completely unauthorized requests
        ↓
Handler obtains required resource data
        ↓
resolve conditional AMS authorization
        ↓
perform database operation only when authorized
```

This keeps authorization rules in AMS/DCL while the Express application
supplies the concrete resource attributes required to evaluate those
rules.