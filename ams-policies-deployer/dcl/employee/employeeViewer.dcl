@label: 'Employee Viewer'
@description: 'Grants read access to all employee master data and employee address records.'
POLICY employeeViewer {
    USE employee.masterData.employeeMasterDataViewerUnrestricted;
    USE employee.address.employeeAddressViewer;
}

@label: 'Regional Employee Viewer'
@description: 'Grants read access to employee master data records within the region assigned to the user and read access to employee address records.'
POLICY employeeViewerRegional {
    USE employee.masterData.employeeMasterDataViewerRegional;
    USE employee.address.employeeAddressViewer;
}

@label: 'Türkiye Employee Viewer'
@description: 'Grants read access to employee master data records restricted to Türkiye and read access to employee address records.'
POLICY employeeViewerTR {
    USE employee.masterData.employeeMasterDataViewerTR;
    USE employee.address.employeeAddressViewer;
}

@label: 'Germany Employee Viewer'
@description: 'Grants read access to employee master data records restricted to Germany and read access to employee address records.'
POLICY employeeViewerDE {
    USE employee.masterData.employeeMasterDataViewerDE;
    USE employee.address.employeeAddressViewer;
}

@label: 'United States Employee Viewer'
@description: 'Grants read access to employee master data records restricted to the United States and read access to employee address records.'
POLICY employeeViewerUS {
    USE employee.masterData.employeeMasterDataViewerUnrestricted
        RESTRICT countryCode = 'US';
    
    USE employee.address.employeeAddressViewer;
}