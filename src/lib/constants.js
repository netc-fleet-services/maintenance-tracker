export const STATUS = {
  READY: 'ready',
  ISSUES: 'issues',
  OOS: 'oos',
}

export const STATUS_LABELS = {
  [STATUS.READY]:  'Ready for Use',
  [STATUS.ISSUES]: 'Known Issues',
  [STATUS.OOS]:    'Out of Service',
}

export const NOTE_TYPE = {
  DRIVER:   'driver',
  MECHANIC: 'mechanic',
  WORK:     'work_done',
}

export const NOTE_TYPE_LABELS = {
  [NOTE_TYPE.DRIVER]:   'Driver Note',
  [NOTE_TYPE.MECHANIC]: 'Mechanic Note',
  [NOTE_TYPE.WORK]:     'Work Done',
}

export const ROLE = {
  ADMIN:      'admin',
  DISPATCHER: 'dispatcher',
  MECHANIC:   'mechanic',
  DRIVER:     'driver',
}

// Which roles can perform which actions
export const CAN_CHANGE_STATUS = [ROLE.ADMIN, ROLE.DISPATCHER, ROLE.MECHANIC]
export const CAN_ADD_MECHANIC_NOTE = [ROLE.ADMIN, ROLE.DISPATCHER, ROLE.MECHANIC]
export const CAN_MANAGE_TRUCKS = [ROLE.ADMIN]
export const CAN_MANAGE_NOTIFICATIONS = [ROLE.ADMIN]

// PM status thresholds (days before next_pm_date)
export const PM_SOON_DAYS = 30  // yellow if PM due within 30 days
