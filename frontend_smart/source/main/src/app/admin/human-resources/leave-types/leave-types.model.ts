export class LeaveTypes {
  id: number;
  leave_name: string;
  type: string;
  leave_unit: string;
  status: string;
  note: string;
  duration: number;
  created_by: string;
  carry_over: string;
  notification_period: string;
  max_leaves: number;
  annual_limit: number;

  constructor(leaveTypes: Partial<LeaveTypes>) {
    this.id = leaveTypes.id || this.getRandomID();
    this.leave_name = leaveTypes.leave_name || '';
    this.type = leaveTypes.type || '';
    this.leave_unit = leaveTypes.leave_unit || '';
    this.status = leaveTypes.status || '';
    this.note = leaveTypes.note || '';
    this.duration = leaveTypes.duration || 0; // Default to 0 if not provided
    this.created_by = leaveTypes.created_by || 'HR Department'; // Default value
    this.carry_over = leaveTypes.carry_over || 'Not allowed'; // Default value
    this.notification_period =
      leaveTypes.notification_period || '24 hours prior'; // Default value
    this.max_leaves = leaveTypes.max_leaves || 0; // Default to 0 if not provided
    this.annual_limit = leaveTypes.annual_limit || 0; // Default to 0 if not provided
  }

  public getRandomID(): number {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000) | 0;
    };
    return S4() + S4();
  }
}
