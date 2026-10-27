@label: 'Employee Master Data Viewer Policy'
@description: 'Grants read access to all employee master data records.'
POLICY employeeMasterDataViewer {
    GRANT read ON Employees;
}

@label: 'Türkiye Employee Master Data Viewer Policy'
@description: 'Grants read access to employee master data records with country code TR.'
POLICY employeeMasterDataViewerTR {
    GRANT read ON Employees 
        WHERE countryCode = 'TR';
}

@label: 'Germany Employee Master Data Viewer Policy'
@description: 'Grants read access to employee master data records with country code DE.'
POLICY employeeMasterDataViewerDE {
    GRANT read ON Employees 
        WHERE countryCode = 'DE';
}

@label: 'Regional Employee Master Data Viewer Policy'
@description: 'Grants read access to employee master data records within the region assigned to the user.'
POLICY employeeMasterDataViewerRegional {
    GRANT read ON Employees 
        WHERE countryCode = $user.userRegion;
}