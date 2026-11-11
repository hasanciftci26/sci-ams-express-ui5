@label: 'Employee Admin'
@description: 'Grants full administrative access to all employee master data and employee address records.'
POLICY employeeAdmin {
    USE employee.masterData.employeeMasterDataAdmin;
    USE employee.address.employeeAddressAdmin;
}

@label: 'Regional Employee Admin'
@description: 'Grants administrative access to employee master data records within the region assigned to the user and full access to employee address records.'
POLICY employeeAdminRegional {
    USE employee.masterData.employeeMasterDataAdminRegional;
    USE employee.address.employeeAddressAdmin;
}

@label: 'Türkiye Employee Admin'
@description: 'Grants administrative access to employee master data records restricted to Türkiye and full access to employee address records.'
POLICY employeeAdminTR {
    USE employee.masterData.employeeMasterDataAdminTR;
    USE employee.address.employeeAddressAdmin;
}

@label: 'Germany Employee Admin'
@description: 'Grants administrative access to employee master data records restricted to Germany and full access to employee address records.'
POLICY employeeAdminDE {
    USE employee.masterData.employeeMasterDataAdminDE;
    USE employee.address.employeeAddressAdmin;
}

@label: 'United States Employee Admin'
@description: 'Grants administrative access to employee master data records restricted to the United States and full access to employee address records.'
POLICY employeeAdminUS {
    USE employee.masterData.employeeMasterDataAdminRestricted
        RESTRICT countryCode = 'US';

    USE employee.address.employeeAddressAdmin;
}