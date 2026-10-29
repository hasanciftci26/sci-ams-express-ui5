export type Department = {
    departmentID: string;
    name: string;
};

export type Employee = {
    employeeID: string;
    firstName: string;
    lastName: string;
    countryCode: string;
    dateOfBirth: string;
    departmentID: string;
};

export type EmployeeAddress = {
    employeeID: string;
    addressID: string;
    countryCode: string;
    city: string;
    postalCode: string;
    street: string;
    houseNumber: string;
    additionalAddressLine: string;
};