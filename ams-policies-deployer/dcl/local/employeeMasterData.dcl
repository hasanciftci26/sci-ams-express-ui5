@label: 'Test - France Employee Master Data Admin'
@description: 'Test policy granting administrative access to employee master data records restricted to France.'
POLICY testEmployeeMasterDataAdminFR {
    USE employee.masterData.employeeMasterDataAdminRestricted
        RESTRICT countryCode = 'FR';
}