import { formatDate } from '@angular/common';

export class HostelRoomList {
  roomId: string;
  roomNumber: string;
  roomType: string;
  floor: number;
  capacity: number;
  occupiedStatus: string;
  currentOccupants: number;
  priceFees: number;
  roomCondition: string;
  dateAssigned: string;
  roomSupervisorStaff: string;
  hostelBlock: string;
  checkInDate: string;
  checkOutDate: string;
  roomTypeCode: string;
  roomDescription: string;

  constructor(roomData: Partial<HostelRoomList> = {}) {
    this.roomId = roomData.roomId || this.generateRoomId();
    this.roomNumber = roomData.roomNumber || '';
    this.roomType = roomData.roomType || '';
    this.floor = roomData.floor || 0;
    this.capacity = roomData.capacity || 1;
    this.occupiedStatus = roomData.occupiedStatus || 'Vacant';
    this.currentOccupants = roomData.currentOccupants || 0;
    this.priceFees = roomData.priceFees || 0;
    this.roomCondition = roomData.roomCondition || 'Good';
    this.dateAssigned =
      roomData.dateAssigned || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.roomSupervisorStaff = roomData.roomSupervisorStaff || '';
    this.hostelBlock = roomData.hostelBlock || '';
    this.checkInDate =
      roomData.checkInDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.checkOutDate =
      roomData.checkOutDate || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.roomTypeCode = roomData.roomTypeCode || '';
    this.roomDescription =
      roomData.roomDescription || 'No description provided.';
  }

  private generateRoomId(): string {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };
    return `R${S4()}${S4()}`;
  }
}
