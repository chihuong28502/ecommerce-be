import { ROLE } from '@/common/enums/role.enum';
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'role';
export const Roles = (role: ROLE) => SetMetadata(ROLES_KEY, role);

