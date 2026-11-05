export interface Lister {
  display: string;
  username: string;
  avatarUrl: string;
}

export interface Product {
  id: number;
  title: string;
  price: number;
  forSale: boolean;
  forRent: boolean;
  sold?: boolean;
  type: string[];
  audience: string[];
  colors: string[];
  sizes: string[];
  condition: string;
  description?: string;
  images: string[];
  lister: Lister;
}

export interface MarketplacePost {
  post_id: number;
  title: string;
  price: number | null;
  sflag: number;
  bflag: number;
  categories?: number[];
  size?: string;
  item_condition: string;
  description?: string;
  images?: string[];
  lister?: Partial<Lister>;
}

export const typeOptions = ['Tops', 'Bottoms', 'Outerwear', 'Dresses', 'Shoes', 'Accessories'];
export const genderOptions = ["Men's", "Women's", 'Kids'];
export const categoryOptions = ['For Rent', 'For Sale'];
export const conditionOptions = ['Brand New', 'Used – Like New', 'Used – Good', 'Used – Fair'];
export const sizeOptions = [
  'XX-Small', 'X-Small', 'Small', 'Medium', 'Large', 'X-Large',
  'XX-Large', '3X-Large', '4X-Large',
];
export const colorOptions = ['Black', 'White', 'Red', 'Blue', 'Green', 'Pink'];

export const audienceMap = [
  { label: "Women's", db_val: 1 },
  { label: "Men's", db_val: 2 },
  { label: 'Kids', db_val: 3 },
];

export const typesMap = typeOptions.map((label, index) => ({ label, db_val: index + 4 }));
export const colorsMap = colorOptions.map((label, index) => ({ label, db_val: index + 10 }));
export const dbConditionVals = [
  { label: 'Brand New', db_val: 'new' },
  { label: 'Used – Like New', db_val: 'excellent' },
  { label: 'Used – Good', db_val: 'good' },
  { label: 'Used – Fair', db_val: 'worn' },
];

export function getUIAudience(dbValues: number[] = []) {
  return audienceMap.filter((item) => dbValues.includes(item.db_val)).map((item) => item.label);
}

export function getUIType(dbValues: number[] = []) {
  return typesMap.filter((item) => dbValues.includes(item.db_val)).map((item) => item.label);
}

export function getUIColors(dbValues: number[] = []) {
  return colorsMap.filter((item) => dbValues.includes(item.db_val)).map((item) => item.label);
}

export function getUICondition(condition: string) {
  return dbConditionVals.find((item) => item.db_val === condition)?.label || 'Not listed';
}
