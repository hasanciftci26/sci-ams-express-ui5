@label: 'Application Admin Policy'
@description: 'Grants full administrative access to all application resources.'
POLICY applicationAdmin {
    USE employee.employeeAdmin;
    USE department.masterData.departmentMasterDataAdmin;
}