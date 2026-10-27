@label: 'Employee Master Data Admin Policy'
@description: 'Grants full access to all employee master data records.'
POLICY employeeMasterDataAdmin {
    GRANT * ON Employees;
}

@label: 'Türkiye Employee Master Data Admin Policy'
@description: 'Grants full access to employee master data records with country code TR.'
POLICY employeeMasterDataAdminTR {
    GRANT * ON Employees 
        WHERE countryCode = 'TR';
}

@label: 'Germany Employee Master Data Admin Policy'
@description: 'Grants full access to employee master data records with country code DE.'
POLICY employeeMasterDataAdminDE {
    GRANT * ON Employees 
        WHERE countryCode = 'DE';
}

@label: 'Regional Employee Master Data Admin Policy'
@description: 'Grants full access to employee master data records within the region assigned to the user.'
POLICY employeeMasterDataAdminRegional {
    GRANT * ON Employees 
        WHERE countryCode = $user.userRegion;
}