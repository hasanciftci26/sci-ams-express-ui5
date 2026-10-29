CREATE TABLE Departments (
  departmentID TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,

  CHECK (length(departmentID) = 36),
  CHECK (length(name) BETWEEN 1 AND 100)
);

CREATE TABLE Employees (
  employeeID TEXT PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  countryCode TEXT NOT NULL,
  dateOfBirth TEXT NOT NULL,
  departmentID TEXT NOT NULL,

  FOREIGN KEY (departmentID)
    REFERENCES Departments(departmentID),

  CHECK (length(employeeID) BETWEEN 1 AND 12),
  CHECK (length(firstName) BETWEEN 1 AND 40),
  CHECK (length(lastName) BETWEEN 1 AND 40),

  CHECK (
    length(countryCode) = 2
    AND countryCode = upper(countryCode)
  ),

  CHECK (
    length(dateOfBirth) = 10
    AND dateOfBirth GLOB
      '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
  )
);

CREATE TABLE EmployeeAddresses (
  addressID TEXT PRIMARY KEY,
  employeeID TEXT NOT NULL,
  countryCode TEXT NOT NULL,
  city TEXT NOT NULL,
  postalCode TEXT NOT NULL,
  street TEXT NOT NULL,
  houseNumber TEXT NOT NULL,
  additionalAddressLine TEXT,

  FOREIGN KEY (employeeID)
    REFERENCES Employees(employeeID)
    ON DELETE CASCADE,

  CHECK (length(addressID) = 36),

  CHECK (
    length(countryCode) = 2
    AND countryCode = upper(countryCode)
  ),

  CHECK (length(city) BETWEEN 1 AND 100),
  CHECK (length(postalCode) BETWEEN 1 AND 20),
  CHECK (length(street) BETWEEN 1 AND 100),
  CHECK (length(houseNumber) BETWEEN 1 AND 20),

  CHECK (
    additionalAddressLine IS NULL
    OR length(additionalAddressLine) <= 255
  )
);

CREATE INDEX idx_employees_departmentID
  ON Employees(departmentID);

CREATE INDEX idx_employee_addresses_employeeID
  ON EmployeeAddresses(employeeID);