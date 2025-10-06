import { SetMetadata } from '@nestjs/common';
import { Rol } from '../../users/role.enum';

export const Roles = (...roles: Rol[]) => SetMetadata('roles', roles);
