export interface DoctorProps {
  id?: number;
  email: string;
  passwordHash: string;
  name: string;
  crm: string;
  specialty?: string;
  canAccessRecords?: boolean;
  canEditAgenda?: boolean;
  isAdmin?: boolean;
  role?: string;
  createdAt?: Date;
}

export class Doctor {
  private props: DoctorProps;

  constructor(props: DoctorProps) {
    this.props = {
      ...props,
      canAccessRecords: props.canAccessRecords ?? true,
      canEditAgenda: props.canEditAgenda ?? true,
      isAdmin: props.isAdmin ?? false,
      role: props.role ?? 'doctor',
      createdAt: props.createdAt ?? new Date(),
    };
  }

  public get id(): number | undefined { return this.props.id; }
  public get email(): string { return this.props.email; }
  public get passwordHash(): string { return this.props.passwordHash; }
  public get name(): string { return this.props.name; }
  public get crm(): string { return this.props.crm; }
  public get specialty(): string | undefined { return this.props.specialty; }
  public get canAccessRecords(): boolean { return this.props.canAccessRecords!; }
  public get canEditAgenda(): boolean { return this.props.canEditAgenda!; }
  public get isAdmin(): boolean { return this.props.isAdmin!; }
  public get role(): string { return this.props.role!; }
  public get createdAt(): Date { return this.props.createdAt!; }

  public updatePassword(newHash: string): void {
    this.props.passwordHash = newHash;
  }

  public toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      crm: this.crm,
      specialty: this.specialty,
      canAccessRecords: this.canAccessRecords,
      canEditAgenda: this.canEditAgenda,
      isAdmin: this.isAdmin,
      role: this.role,
      createdAt: this.createdAt,
    };
  }
}
