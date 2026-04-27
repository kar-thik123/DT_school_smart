import { formatDate } from '@angular/common';

export class HostelRoomType {
  roomTypeId: string;
  roomTypeName: string;
  capacity: number;
  roomCategory: string;
  roomDescription: string;
  roomPrice: number;
  roomFacilities: string;
  roomArea: number;
  roomCondition: string;
  roomTypeCode: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  maxOccupants: number;

  constructor(roomTypeData: Partial<HostelRoomType> = {}) {
    this.roomTypeId = roomTypeData.roomTypeId || this.getRandomID();
    this.roomTypeName = roomTypeData.roomTypeName || '';
    this.capacity = roomTypeData.capacity || 0;
    this.roomCategory = roomTypeData.roomCategory || '';
    this.roomDescription = roomTypeData.roomDescription || '';
    this.roomPrice = roomTypeData.roomPrice || 0;
    this.roomFacilities = roomTypeData.roomFacilities || '';
    this.roomArea = roomTypeData.roomArea || 0;
    this.roomCondition = roomTypeData.roomCondition || '';
    this.roomTypeCode = roomTypeData.roomTypeCode || '';
    this.createdAt =
      roomTypeData.createdAt || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.updatedAt =
      roomTypeData.updatedAt || formatDate(new Date(), 'yyyy-MM-dd', 'en');
    this.status = roomTypeData.status || '';
    this.maxOccupants = roomTypeData.maxOccupants || 0;
  }

  public getRandomID(): string {
    const S4 = () => {
      return ((1 + Math.random()) * 0x10000).toString(16);
    };
    return S4() + S4();
  }
}
