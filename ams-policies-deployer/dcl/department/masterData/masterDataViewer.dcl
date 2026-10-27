@label: 'Department Master Data Viewer Policy'
@description: 'Grants read access to all department master data records.'
POLICY departmentMasterDataViewer {
    GRANT read ON Departments;
}