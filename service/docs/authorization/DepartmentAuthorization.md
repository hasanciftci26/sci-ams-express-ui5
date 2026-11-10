# Department Authorization

This document describes authorization for department-related Express
routes.

Department authorization does not depend on resource attributes. AMS
policies grant or deny privileges unconditionally, so routes use
`checkPrivilege` directly and handlers do not perform additional
entity-specific authorization checks.

## General Authorization Model

Department routes use AMS `checkPrivilege` middleware, for example:

``` ts
Authorization.getMiddleware().checkPrivilege("read", "Departments")
```

Because department policies are unconditional, the middleware makes the
complete authorization decision before the handler executes.

``` text
Request
  -> checkPrivilege(action, "Departments")
  -> denied: HTTP 403
  -> granted: execute handler
```

This differs from employee routes that use `precheckPrivilege` when
authorization may depend on resource data such as `countryCode`.

## Read Authorization

Read routes require:

``` ts
checkPrivilege("read", "Departments")
```

After authorization succeeds, `GET /department` returns all departments
and `GET /department/:departmentId` returns the requested department. No
department data is required to resolve authorization.

## Create Authorization

Create routes require:

``` ts
checkPrivilege("create", "Departments")
```

Authorization completes before request validation or database mutation.
The handler then validates the request body and inserts the department.

``` text
POST /department
  -> check create privilege
  -> validate request body
  -> INSERT department
  -> HTTP 201
```

## Update Authorization

Update routes require:

``` ts
checkPrivilege("update", "Departments")
```

The endpoint uses PATCH semantics: only supplied fields are changed and
omitted fields remain unchanged.

``` json
{
    "name": "Human Resources"
}
```

No current-state or resulting-state AMS check is required because
department authorization is not conditional on department data.

## Delete Authorization

Delete routes require:

``` ts
checkPrivilege("delete", "Departments")
```

After authorization succeeds, the service deletes the department
identified by the route parameter. A successful deletion returns HTTP
204 No Content.

## Authorization Strategy Summary

  Operation   AMS middleware                              Handler-level AMS check
  ----------- ------------------------------------------- -------------------------
  Read        `checkPrivilege("read", "Departments")`     Not required
  Create      `checkPrivilege("create", "Departments")`   Not required
  Update      `checkPrivilege("update", "Departments")`   Not required
  Delete      `checkPrivilege("delete", "Departments")`   Not required

The common pattern is:

``` text
Route-level checkPrivilege
  -> complete authorization decision
  -> handler
  -> validation / database operation
```

This model is intentionally simpler than conditional employee
authorization because no department attribute participates in an AMS
policy condition.