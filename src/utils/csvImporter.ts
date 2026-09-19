import Papa from 'papaparse';

export interface MenuItemCSV {
  name: string;
  description?: string;
  price: number;
  category: string;
  is_veg?: boolean;
  is_popular?: boolean;
  is_spicy?: boolean;
  image_url?: string;
}

export interface CSVImportResult {
  success: boolean;
   MenuItemCSV[];
  errors: string[];
  warnings: string[];
}

export interface CSVParseOptions {
  delimiter?: string;
  hasHeader?: boolean;
  skipEmptyLines?: boolean;
}

/**
 * Parse CSV file and validate menu items
 */
export function parseCSVFile(
  file: File,
  options: CSVParseOptions = {}
): Promise<CSVImportResult> {
  return new Promise((resolve) => {
    const { delimiter = ',', hasHeader = true, skipEmptyLines = true } = options;

    Papa.parse(file, {
      delimiter,
      header: hasHeader,
      skipEmptyLines,
      complete: (results) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const validItems: MenuItemCSV[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowNum = index + 2; // +2 because row 1 is header

          // Validate required fields
          if (!row.name || row.name.trim() === '') {
            errors.push(`Row ${rowNum}: Name is required`);
            return;
          }

          if (!row.price || isNaN(parseFloat(row.price))) {
            errors.push(`Row ${rowNum}: Valid price is required`);
            return;
          }

          if (!row.category || row.category.trim() === '') {
            warnings.push(`Row ${rowNum}: Category is missing, using "Other"`);
            row.category = 'Other';
          }

          // Parse and validate data
          const item: MenuItemCSV = {
            name: row.name.trim(),
            description: row.description?.trim() || '',
            price: parseFloat(row.price),
            category: row.category.trim(),
            is_veg: parseBoolean(row.is_veg || row.IsVeg || row.Veg),
            is_popular: parseBoolean(row.is_popular || row.IsPopular || row.Popular),
            is_spicy: parseBoolean(row.is_spicy || row.IsSpicy || row.Spicy),
            image_url: row.image_url?.trim() || '',
          };

          // Additional validations
          if (item.price < 0) {
            errors.push(`Row ${rowNum}: Price cannot be negative`);
            return;
          }

          if (item.price > 100000) {
            warnings.push(`Row ${rowNum}: Unusually high price (${item.price})`);
          }

          if (item.name.length > 100) {
            warnings.push(`Row ${rowNum}: Name is very long (${item.name.length} chars)`);
          }

          validItems.push(item);
        });

        resolve({
          success: errors.length === 0,
           validItems,
          errors,
          warnings,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [`Failed to parse CSV: ${error.message}`],
          warnings: [],
        });
      },
    });
  });
}

/**
 * Parse boolean values from CSV
 */
function parseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return ['true', 'yes', '1', 'y'].includes(lower);
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
}

/**
 * Download CSV template for menu import
 */
export function downloadCSVTemplate(): void {
  const template = [
    ['Name', 'Description', 'Price', 'Category', 'IsVeg', 'IsPopular', 'IsSpicy'],
    ['Espresso', 'Rich and bold single shot espresso', '3.50', 'Coffee', 'Yes', 'Yes', 'No'],
    ['Cappuccino', 'Espresso with steamed milk and foam', '4.50', 'Coffee', 'Yes', 'No', 'No'],
    ['Avocado Toast', 'Sourdough toast with smashed avocado', '8.00', 'Food', 'Yes', 'Yes', 'No'],
    ['Chicken Sandwich', 'Grilled chicken with fresh vegetables', '10.00', 'Food', 'No', 'No', 'Yes'],
  ];

  const csv = Papa.unparse(template);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = 'menu_template.csv';
  link.click();

  URL.revokeObjectURL(url);
}

/**
 * Convert menu items to CSV format
 */
export function exportMenuToCSV(items: MenuItemCSV[]): string {
  return Papa.unparse(items);
}

/**
 * Validate CSV data before import
 */
export function validateCSVData(items: MenuItemCSV[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (items.length === 0) {
    errors.push('No valid items found in CSV');
    return { isValid: false, errors, warnings };
  }

  // Check for duplicate names
  const names = items.map(item => item.name.toLowerCase());
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  
  if (duplicates.length > 0) {
    warnings.push(`Duplicate item names found: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Check for missing descriptions
  const noDescription = items.filter(item => !item.description || item.description.trim() === '');
  if (noDescription.length > 0) {
    warnings.push(`${noDescription.length} item(s) missing descriptions`);
  }

  // Check for missing categories
  const noCategory = items.filter(item => !item.category || item.category.trim() === '');
  if (noCategory.length > 0) {
    warnings.push(`${noCategory.length} item(s) missing categories`);
  }

  // Check price range
  const invalidPrices = items.filter(item => item.price <= 0 || item.price > 10000);
  if (invalidPrices.length > 0) {
    errors.push(`${invalidPrices.length} item(s) have invalid prices`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Map CSV columns to expected format
 */
export function mapCSVColumns(
   any[],
  columnMapping: Record<string, string>
): MenuItemCSV[] {
  return data.map(row => {
    const mapped: any = {};
    
    Object.entries(columnMapping).forEach(([target, source]) => {
      mapped[target] = row[source];
    });

    return {
      name: mapped.name || '',
      description: mapped.description || '',
      price: parseFloat(mapped.price) || 0,
      category: mapped.category || 'Other',
      is_veg: parseBoolean(mapped.is_veg),
      is_popular: parseBoolean(mapped.is_popular),
      is_spicy: parseBoolean(mapped.is_spicy),
      image_url: mapped.image_url || '',
    };
  });
}

/**
 * Get CSV preview (first 5 rows)
 */
export function getCSVPreview(file: File, rows: number = 5): Promise<any[]> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      preview: rows,
      complete: (results) => {
        resolve(results.data);
      },
      error: () => {
        resolve([]);
      },
    });
  });
}

/**
 * Detect CSV delimiter
 */
export function detectDelimiter(file: File): Promise<string> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      preview: 5,
      complete: (results) => {
        const delimiters = [',', ';', '\t', '|'];
        let bestDelimiter = ',';
        let maxColumns = 0;

        delimiters.forEach(delimiter => {
          const testParse = Papa.parse(results.meta.cursor || '', { delimiter });
          const columns = testParse.data[0]?.length || 0;
          
          if (columns > maxColumns) {
            maxColumns = columns;
            bestDelimiter = delimiter;
          }
        });

        resolve(bestDelimiter);
      },
      error: () => {
        resolve(',');
      },
    });
  });
}

/**
 * Convert CSV to JSON with custom schema
 */
export function csvToJSON<T>(
  file: File,
  schema: Record<string, string>
): Promise<T[]> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const mapped = results.data.map((row: any) => {
          const item: any = {};
          
          Object.entries(schema).forEach(([target, source]) => {
            item[target] = row[source];
          });

          return item as T;
        });

        resolve(mapped);
      },
      error: () => {
        resolve([]);
      },
    });
  });
}
