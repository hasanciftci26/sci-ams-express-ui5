@label: 'Employee Admin Policy'
@description: 'Grants full access to all employee master data and employee address records.'
POLICY employeeAdmin {
    USE employee.masterData.employeeMasterDataAdmin;
    USE employee.address.employeeAddressAdminUnrestricted;
}


@label: 'Türkiye Employee Admin Policy'
@description: 'Grants full access to employee master data and employee address records with country code TR.'
POLICY employeeAdminTR {
    USE employee.masterData.employeeMasterDataAdminTR;

    USE employee.address.employeeAddressAdminRestricted
        RESTRICT countryCode = 'TR';
}


@label: 'Germany Employee Admin Policy'
@description: 'Grants full access to employee master data and employee address records with country code DE.'
POLICY employeeAdminDE {
    USE employee.masterData.employeeMasterDataAdminDE;

    USE employee.address.employeeAddressAdminRestricted
        RESTRICT countryCode = 'DE';
}


@label: 'Regional Employee Admin Policy'
@description: 'Grants full access to employee master data and employee address records within the region assigned to the user.'
POLICY employeeAdminRegional {
    USE employee.masterData.employeeMasterDataAdminRegional;

    USE employee.address.employeeAddressAdminRestricted
        RESTRICT countryCode = $user.userRegion;
}