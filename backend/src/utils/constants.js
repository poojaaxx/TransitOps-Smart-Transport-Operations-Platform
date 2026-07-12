const ROLES = {
  FLEET_MANAGER: 'FleetManager',
  DRIVER: 'Driver',
  SAFETY_OFFICER: 'SafetyOfficer',
  FINANCIAL_ANALYST: 'FinancialAnalyst',
};

const ROLE_LIST = Object.values(ROLES);

const VEHICLE_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
};

const DRIVER_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
};

const TRIP_STATUS = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const MAINTENANCE_STATUS = {
  ACTIVE: 'Active',
  COMPLETED: 'Completed',
};

module.exports = {
  ROLES,
  ROLE_LIST,
  VEHICLE_STATUS,
  DRIVER_STATUS,
  TRIP_STATUS,
  MAINTENANCE_STATUS,
};
