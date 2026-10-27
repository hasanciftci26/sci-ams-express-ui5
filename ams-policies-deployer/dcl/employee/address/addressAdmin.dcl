@label: 'Employee Address Admin - Required Restriction'
@description: 'Grants full access to employee address records only when an administrator provides a country restriction.'
POLICY employeeAddressAdminRestricted {
    GRANT * ON EmployeeAddresses 
        WHERE countryCode IS RESTRICTED;
}

@label: 'Employee Address Admin - Optional Restriction'
@description: 'Grants full access to all employee address records by default and allows an administrator to optionally restrict access by country.'
POLICY employeeAddressAdminUnrestricted {
    GRANT * ON EmployeeAddresses 
        WHERE countryCode IS NOT RESTRICTED;
}