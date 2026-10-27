@label: 'Employee Address Viewer - Required Restriction'
@description: 'Grants read access to employee address records only when an administrator provides a country restriction.'
POLICY employeeAddressViewerRestricted {
    GRANT read ON EmployeeAddresses 
        WHERE countryCode IS RESTRICTED;
}

@label: 'Employee Address Viewer - Optional Restriction'
@description: 'Grants read access to all employee address records by default and allows an administrator to optionally restrict access by country.'
POLICY employeeAddressViewerUnrestricted {
    GRANT read ON EmployeeAddresses 
        WHERE countryCode IS NOT RESTRICTED;
}