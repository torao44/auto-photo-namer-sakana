export interface PetProfile {
  id: string;
  name: string;
  species: string;
  breedOrDescription: string;
  registeredAt: string;
}

export interface NamingConfig {
  dateFormat: "YYYYMMDD" | "YYYY-MM-DD" | "none";
  separator: "_" | "-" | "space";
  includeCategory: boolean;
  includeAmount: boolean;
}

export interface AnalysisResult {
  category: "food" | "receipt" | "pet" | "product" | "document" | "other";
  categoryLabel: string;
  detectedTitle: string;
  suggestedFilename: string;
  confidence: number;
  details: {
    receiptStore?: string;
    receiptDate?: string;
    receiptAmount?: string;
    receiptTax?: string;
    receiptItems?: string[];
    petName?: string;
    petBreed?: string;
    isKnownPet?: boolean;
    matchedPetId?: string;
    productCategory?: string;
    productBrand?: string;
    documentType?: string;
    documentSummary?: string;
    restaurantName?: string;
    foodDishName?: string;
    locationAddress?: string;
    summary?: string;
  };
  alternativeNames: string[];
  explanation: string;
}

export interface FocusPoint {
  x: number;
  y: number;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  address?: string;
  placeName?: string;
}

export type Theme = "ocean" | "forest" | "sunset" | "monochrome";
