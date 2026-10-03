export declare class BillItemDto {
    name: string;
    amount: number;
}
export declare class CreateBillDto {
    title: string;
    period?: string;
    dueDate?: string;
    unitId?: string;
    memberId?: string;
    applyToAll?: boolean;
    items: BillItemDto[];
}
