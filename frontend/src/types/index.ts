export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "PROFESSOR";
  department: string | null;
  photoUrl: string | null;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  category: string;
  icon: string | null;
  year: number;
  semester: number;
}

export interface SubjectSummary extends Subject {
  workshopsCount: number;
  studentsCount: number;
  professor: string | null;
  stockStatus: "NORMAL" | "ALERTA";
}

export interface SubjectDetail extends Subject {
  workshops: Workshop[];
}

export interface Workshop {
  id: string;
  code: string;
  name: string;
  order: number;
  subjectId: string;
  subject?: Subject;
  professorId: string | null;
  professor?: AuthUser | null;
  sections: Section[];
}

export interface Section {
  id: string;
  code: string;
  year: number;
  semester: number;
  dayOfWeek: string | null;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  studentsCount: number;
  workshopId: string;
  workshop?: Workshop & { subject: Subject };
  professorId: string | null;
  professor?: AuthUser | null;
  consumptionRecords: ConsumptionRecord[];
  equipmentUsages: EquipmentUsage[];
}

export interface EquipmentUsage {
  id: string;
  equipmentId: string;
  equipment: Equipment;
  sectionId: string | null;
  equipmentSupplyId: string | null;
  equipmentSupply: EquipmentSupply | null;
  usedQty: string;
  reusedQty: string;
  discardedQty: string;
  usedAt: string;
}

export interface EquipmentLinkedSupply {
  id: string;
  equipmentSupplyId: string;
  equipmentSupply: EquipmentSupply;
  minThreshold: number;
  maxThreshold: number | null;
  autoDiscount: boolean;
}

export interface EquipmentSupply {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  newStock: number;
  reusableStock: number;
  createdAt: string;
}

export interface StationerySupply {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  newStock: number;
  reusableStock: number;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  order: number;
  equipmentCount: number;
  badCount: number;
}

export interface Equipment {
  id: string;
  code: string;
  serial: string | null;
  name: string;
  category: string;
  quantity: number;
  roomId: string;
  room?: Room;
  status: "GOOD" | "BAD";
  utility: "HIGH" | "MEDIUM" | "LOW";
  unitValue: string;
  lastMaintenanceAt: string | null;
  nextCalibrationAt: string | null;
  linkedSupplies: EquipmentLinkedSupply[];
}

export interface ProjectionItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  currentStock: number;
  projectedNeed: number;
  diff: number;
  status: "CRITICO" | "ATENCION" | "SUFICIENTE";
  estimatedCost: number;
  upcomingStudents: number;
  basedOnHistoricalData: boolean;
}

export interface ProjectionResponse {
  items: ProjectionItem[];
  criticalCount: number;
  totalEstimatedCost: number;
  year: number;
  semester: number;
}

export interface FutureSupplyNeed {
  id: string;
  name: string;
  category: string | null;
  estimatedQty: number;
  requiredDate: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "IN_PROGRESS";
}

export interface Supplier {
  id: string;
  name: string;
  rating: string | null;
  contact: string | null;
}

export interface PurchaseOrderItem {
  id: string;
  supplyId: string;
  supply: Supply;
  quantity: number;
  estimatedCost: string;
}

export interface PurchaseOrderQuote {
  id: string;
  supplierId: string;
  supplier: Supplier;
  subtotal: string;
  shipping: string;
  total: string;
  availability: string | null;
}

export interface PurchaseOrder {
  id: string;
  status: "DRAFT" | "SENT" | "RECEIVED" | "CANCELLED";
  isPreliminary: boolean;
  fromProjection: boolean;
  createdAt: string;
  items: PurchaseOrderItem[];
  quotes: PurchaseOrderQuote[];
}

export interface ConsumptionRecord {
  id: string;
  sectionId: string;
  supplyId: string;
  supply: Supply;
  requiredQty: string;
  usedQty: string;
  wasteQty: string;
  reusedQty: string;
  discardedQty: string;
  instructorNotes: string | null;
  reportedAt: string;
}

export interface Supply {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string | null;
  locationType: string | null;
  locationDetail: string | null;
  unit: string;
  initialStock: number;
  currentStock: number;
  minStock: number;
  maxStock: number | null;
  newStock: number;
  reusableStock: number;
  createdAt: string;
}
