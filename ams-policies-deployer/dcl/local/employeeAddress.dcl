@label: 'Test - Employee Address Admin'
@description: 'Test policy granting unrestricted administrative access to all employee address records.'
POLICY testEmployeeAddressAdmin {
    USE employee.address.employeeAddressAdminUnrestricted;
}

@label: 'Test - Employee Address Viewer'
@description: 'Test policy granting unrestricted read access to all employee address records.'
POLICY testEmployeeAddressViewer {
    USE employee.address.employeeAddressViewerUnrestricted;
}

@label: 'Test - Türkiye Employee Address Admin'
@description: 'Test policy granting administrative access to employee address records restricted to Türkiye.'
POLICY testEmployeeAddressAdminTR {
    USE employee.address.employeeAddressAdminRestricted
        RESTRICT countryCode = 'TR';
}

@label: 'Test - Türkiye Employee Address Viewer'
@description: 'Test policy granting read access to employee address records restricted to Türkiye.'
POLICY testEmployeeAddressViewerTR {
    USE employee.address.employeeAddressViewerRestricted
        RESTRICT countryCode = 'TR';
}

@label: 'Test - Germany Employee Address Admin'
@description: 'Test policy granting administrative access to employee address records restricted to Germany.'
POLICY testEmployeeAddressAdminDE {
    USE employee.address.employeeAddressAdminRestricted
        RESTRICT countryCode = 'DE';
}

@label: 'Test - Germany Employee Address Viewer'
@description: 'Test policy granting read access to employee address records restricted to Germany.'
POLICY testEmployeeAddressViewerDE {
    USE employee.address.employeeAddressViewerRestricted
        RESTRICT countryCode = 'DE';
}