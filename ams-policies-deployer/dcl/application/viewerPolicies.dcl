@label: 'Application Viewer Policy'
@description: 'Grants read access to all application resources.'
POLICY applicationViewer {
    USE employee.employeeViewer;
    USE department.masterData.departmentMasterDataViewer;
}