@label: 'Employee Viewer Policy'
@description: 'Grants read access to all employee master data and employee address records.'
POLICY employeeViewer {
    USE employee.masterData.employeeMasterDataViewer;
    USE employee.address.employeeAddressViewerUnrestricted;
}


@label: 'Türkiye Employee Viewer Policy'
@description: 'Grants read access to employee master data and employee address records with country code TR.'
POLICY employeeViewerTR {
    USE employee.masterData.employeeMasterDataViewerTR;

    USE employee.address.employeeAddressViewerRestricted
        RESTRICT countryCode = 'TR';
}


@label: 'Germany Employee Viewer Policy'
@description: 'Grants read access to employee master data and employee address records with country code DE.'
POLICY employeeViewerDE {
    USE employee.masterData.employeeMasterDataViewerDE;

    USE employee.address.employeeAddressViewerRestricted
        RESTRICT countryCode = 'DE';
}


@label: 'Regional Employee Viewer Policy'
@description: 'Grants read access to employee master data and employee address records within the region assigned to the user.'
POLICY employeeViewerRegional {
    USE employee.masterData.employeeMasterDataViewerRegional;

    USE employee.address.employeeAddressViewerRestricted
        RESTRICT countryCode = $user.userRegion;
}