const allRoles = {
  member: ['viewTasks', 'createComments'],
  user: ['viewTasks', 'createComments', 'manageOwnTasks', 'viewOwnReports'],
  admin: ['getUsers', 'manageUsers', 'manageTasks', 'manageClients', 'viewReports'],
  superadmin: ['getUsers', 'manageUsers', 'manageTasks', 'manageClients', 'viewReports', 'manageSystem', 'manageRoles', 'viewAuditLogs'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
