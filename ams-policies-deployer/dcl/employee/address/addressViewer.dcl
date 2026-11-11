@label: 'Employee Address Viewer'
@description: 'Grants read access to all employee address records.'
POLICY employeeAddressViewer {
    GRANT read ON EmployeeAddresses;
}