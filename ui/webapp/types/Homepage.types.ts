export type Employee = {
    employeeID: string;
    firstName: string;
    lastName: string;
    countryCode: string;
    dateOfBirth: string;
    departmentID: string;
};

export type Department = {
    departmentID: string;
    name: string;
};

export type EmployeeAddress = {
    employeeID: string;
    addressID: string;
    countryCode: string;
    city: string;
    postalCode: string;
    street: string;
    houseNumber: string;
    additionalAddressLine: string | null;
};

export type EmployeeAddressInitialData = {
    employeeID: string;
    employeeName: string;
    addressID: string | null;
    countryCode: string | null;
    city: string | null;
    postalCode: string | null;
    street: string | null;
    houseNumber: string | null;
    additionalAddressLine: string | null;    
};

export type EmployeeAddressFinalData = {
    employeeID: string;
    employeeName: string;
    addressID: string;
    countryCode: string;
    city: string;
    postalCode: string;
    street: string;
    houseNumber: string;
    additionalAddressLine: string | null;    
};

export type EmployeeAddressCreate = Omit<EmployeeAddress, "employeeID">;