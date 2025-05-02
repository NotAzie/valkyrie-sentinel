export enum Role {
  GUEST = 0,
  TRUSTED = 1,
  OPERATOR = 2,
  SUPERADMIN = 3
}

export class AccessControl {
  private userRoles = new Map<string, Role>();

  constructor(defaultAdminUuid?: string) {
    if (defaultAdminUuid) {
      this.userRoles.set(defaultAdminUuid, Role.SUPERADMIN);
    }
  }

  public assignRole(uuidOrUsername: string, role: Role): void {
    this.userRoles.set(uuidOrUsername.toLowerCase(), role);
  }

  public hasPermission(uuidOrUsername: string, requiredRole: Role): boolean {
    const role = this.userRoles.get(uuidOrUsername.toLowerCase()) ?? Role.GUEST;
    return role >= requiredRole;
  }
}
