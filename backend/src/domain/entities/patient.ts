export interface PatientProps {
  id: string;
  name: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  gender?: string;
  occupation?: string;
  mainComplaint?: string;
  notes?: string;
  cpfEncrypted?: string;
  mgmtStatus?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Patient {
  private props: PatientProps;

  constructor(props: PatientProps) {
    this.props = {
      ...props,
      mgmtStatus: props.mgmtStatus ?? 'ativo',
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    };
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get mgmtStatus(): string { return this.props.mgmtStatus!; }

  public updateName(newName: string): void {
    if (!newName) throw new Error('Name is required');
    this.props.name = newName;
    this.props.updatedAt = new Date();
  }

  public toJSON() {
    return { ...this.props };
  }
}
