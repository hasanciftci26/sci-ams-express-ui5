# Employee Address Authorization

Employee addresses are child resources of an employee and are accessed
only through `/employee/:employeeId/address` or
`/employee/:employeeId/address/:addressId`.

## General Authorization Model

Authorization is split between two resources:

-   `Employees` determines which parent employees the user may access.
    This authorization may be conditional on `countryCode`.
-   `EmployeeAddresses` determines which address operations the user may
    perform. These privileges are unconditional.

Routes therefore use `precheckPrivilege("read", "Employees")` for the
conditional parent privilege and `checkPrivilege` for the required
`EmployeeAddresses` action. The handler retrieves the parent employee
and resolves its concrete read privilege with its `countryCode`.

This ensures that address data cannot be accessed independently of an
authorized parent employee.

## Read Authorization

Read routes require `precheckPrivilege("read", "Employees")` and
`checkPrivilege("read", "EmployeeAddresses")`.

The handler retrieves the parent employee and evaluates `read` on
`Employees` using `{ countryCode: employee.countryCode }`. Only after
that decision is granted are addresses retrieved.

### Reading All Addresses of an Employee

`GET /employee/:employeeId/address` retrieves all addresses belonging to
the authorized parent employee.

### Reading a Single Employee Address

`GET /employee/:employeeId/address/:addressId` performs the same parent
authorization. The database query uses both `employeeID` and
`addressID`, ensuring that the address actually belongs to the employee
specified by the route.

## Create Authorization

Create routes require:

``` ts
precheckPrivilege("read", "Employees")
checkPrivilege("read", "EmployeeAddresses")
checkPrivilege("create", "EmployeeAddresses")
```

The handler validates the address payload, retrieves the parent
employee, and resolves the concrete Employee read privilege. The address
is created only after all required privileges are granted.

The `employeeID` comes exclusively from the route and is not accepted in
the payload, avoiding two competing sources for the parent relationship.

## Update Authorization

Update routes require:

``` ts
precheckPrivilege("read", "Employees")
checkPrivilege("read", "EmployeeAddresses")
checkPrivilege("update", "EmployeeAddresses")
```

The handler validates the PATCH payload, retrieves and authorizes the
parent employee, and then updates the address.

EmployeeAddress policies are unconditional, so changing address
attributes does not require current-state/resulting-state AMS checks.
Parent scope remains controlled by the parent Employee authorization.

Only supplied PATCH fields are changed. `employeeID` and `addressID` are
established by the route and are not updateable through the payload.

## Delete Authorization

Delete routes require:

``` ts
precheckPrivilege("read", "Employees")
checkPrivilege("read", "EmployeeAddresses")
checkPrivilege("delete", "EmployeeAddresses")
```

The handler retrieves and authorizes the parent employee before deleting
the address. The delete query uses both `employeeID` and `addressID`.

A successful deletion returns HTTP 204 No Content.

## Authorization Strategy Summary

  -----------------------------------------------------------------------
  Operation               Parent Employee         EmployeeAddresses
                          authorization           authorization
  ----------------------- ----------------------- -----------------------
  Read collection         precheck + concrete     `read`
                          `read` check            

  Read single             precheck + concrete     `read`
                          `read` check            

  Create                  precheck + concrete     `read` + `create`
                          `read` check            

  Update                  precheck + concrete     `read` + `update`
                          `read` check            

  Delete                  precheck + concrete     `read` + `delete`
                          `read` check            
  -----------------------------------------------------------------------

The core separation is:

``` text
Employees -> determines WHICH parent employees are accessible
EmployeeAddresses -> determines WHAT address operations are permitted
```