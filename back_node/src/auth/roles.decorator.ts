import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type RoleName = 'admin' | 'punto_pos' | string;
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles.map(r => String(r).toLowerCase()));
