import Papa from 'papaparse';

export interface CSVMenuItem {
  name: string;
  description?: string;
  price: number;
  category: string;
  isVeg?: boolean;
  isPopular?: boolean;
  isSpicy?: boolean;
  imageUrl?: string;
  preparationTime?: number;
}

export interface CSVImportResult {
  success: boolean;
  data: CSVMenuItem[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

export interface CSVColumnMapping {
  name: string;
  description?: string;
  price: string;
  category: string;
  isVeg?: string;
  isPopular?: string;
  isSpicy?: string;
  imageUrl?: string;
  preparationTime?: string;
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(): void {
  const template = [
    ['Name', 'Description', 'Price', 'Category', 'IsVeg', 'IsPopular', 'IsSpicy', 'PreparationTime'],
    ['Espresso', 'Rich and bold single shot espresso', '3.50', 'Coffee', 'true', 'true', 'false', '3'],
    ['Cappuccino', 'Espresso with steamed milk and foam', '4.50', 'Coffee', 'true', 'true', 'false', '5'],
    ['Avocado Toast', 'Sourdough toast with smashed avocado', '8.00', 'Food', 'true', 'false', 'false', '8'],
    ['Chicken Burger', 'Grilled chicken burger with fries', '10.00', 'Food', 'false', 'true', 'false', '12'],
    ['Spicy Wings', 'Hot chicken wings with sauce', '9.50', 'Food', 'false', 'false', 'true', '15'],
  ];

  const csv = Papa.unparse(template);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'menu-template.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Parse CSV file
 */
export function parseCSV(file: File): Promise<CSVImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const validItems: CSVMenuItem[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowNum = index + 2; // +2 because row 1 is header

          try {
            // Validate required fields
            if (!row.Name || row.Name.trim() === '') {
              errors.push(`Row ${rowNum}: Name is required`);
              return;
            }

            if (!row.Price || isNaN(parseFloat(row.Price))) {
              errors.push(`Row ${rowNum}: Valid price is required`);
              return;
            }

            if (!row.Category || row.Category.trim() === '') {
              errors.push(`Row ${rowNum}: Category is required`);
              return;
            }

            // Parse and validate data
            const item: CSVMenuItem = {
              name: row.Name.trim(),
              description: row.Description?.trim() || '',
              price: parseFloat(row.Price),
              category: row.Category.trim(),
              isVeg: parseBoolean(row.IsVeg),
              isPopular: parseBoolean(row.IsPopular),
              isSpicy: parseBoolean(row.IsSpicy),
              imageUrl: row.ImageUrl?.trim() || '',
              preparationTime: row.PreparationTime ? parseInt(row.PreparationTime, 10) : undefined,
            };

            // Additional validations
            if (item.price <= 0) {
              errors.push(`Row ${rowNum}: Price must be greater than 0`);
              return;
            }

            if (item.price > 10000) {
              warnings.push(`Row ${rowNum}: Price seems unusually high (${item.price})`);
            }

            if (item.preparationTime !== undefined && item.preparationTime < 0) {
              errors.push(`Row ${rowNum}: Preparation time cannot be negative`);
              return;
            }

            if (item.preparationTime !== undefined && item.preparationTime > 120) {
              warnings.push(`Row ${rowNum}: Preparation time seems long (${item.preparationTime} minutes)`);
            }

            if (item.name.length > 100) {
              warnings.push(`Row ${rowNum}: Name is very long (${item.name.length} characters)`);
            }

            if (item.description && item.description.length > 500) {
              warnings.push(`Row ${rowNum}: Description is very long (${item.description.length} characters)`);
            }

            validItems.push(item);
          } catch (error) {
            errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        resolve({
          success: errors.length === 0,
          data: validItems,
          errors,
          warnings,
          totalRows: results.data.length,
          validRows: validItems.length,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [`Failed to parse CSV: ${error.message}`],
          warnings: [],
          totalRows: 0,
          validRows: 0,
        });
      },
    });
  });
}

/**
 * Parse CSV with custom column mapping
 */
export function parseCSVWithMapping(
  file: File,
  mapping: CSVColumnMapping
): Promise<CSVImportResult> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors: string[] = [];
        const warnings: string[] = [];
        const validItems: CSVMenuItem[] = [];

        results.data.forEach((row: any, index: number) => {
          const rowNum = index + 2;

          try {
            // Map columns
            const name = row[mapping.name]?.trim();
            const description = row[mapping.description || '']?.trim();
            const price = parseFloat(row[mapping.price]);
            const category = row[mapping.category]?.trim();
            const isVeg = mapping.isVeg ? parseBoolean(row[mapping.isVeg]) : undefined;
            const isPopular = mapping.isPopular ? parseBoolean(row[mapping.isPopular]) : undefined;
            const isSpicy = mapping.isSpicy ? parseBoolean(row[mapping.isSpicy]) : undefined;
            const imageUrl = mapping.imageUrl ? row[mapping.imageUrl]?.trim() : undefined;
            const preparationTime = mapping.preparationTime
              ? parseInt(row[mapping.preparationTime], 10)
              : undefined;

            // Validate required fields
            if (!name) {
              errors.push(`Row ${rowNum}: Name is required`);
              return;
            }

            if (isNaN(price)) {
              errors.push(`Row ${rowNum}: Valid price is required`);
              return;
            }

            if (!category) {
              errors.push(`Row ${rowNum}: Category is required`);
              return;
            }

            const item: CSVMenuItem = {
              name,
              description,
              price,
              category,
              isVeg,
              isPopular,
              isSpicy,
              imageUrl,
              preparationTime,
            };

            // Additional validations
            if (price <= 0) {
              errors.push(`Row ${rowNum}: Price must be greater than 0`);
              return;
            }

            if (price > 10000) {
              warnings.push(`Row ${rowNum}: Price seems unusually high (${price})`);
            }

            validItems.push(item);
          } catch (error) {
            errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        });

        resolve({
          success: errors.length === 0,
          data: validItems,
          errors,
          warnings,
          totalRows: results.data.length,
          validRows: validItems.length,
        });
      },
      error: (error) => {
        resolve({
          success: false,
          data: [],
          errors: [`Failed to parse CSV: ${error.message}`],
          warnings: [],
          totalRows: 0,
          validRows: 0,
        });
      },
    });
  });
}

/**
 * Preview CSV data
 */
export function previewCSV(file: File, maxRows: number = 10): Promise<any[]> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: maxRows,
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
 * Get CSV columns
 */
export function getCSVColumns(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      preview: 1,
      complete: (results) => {
        resolve(results.meta.fields || []);
      },
      error: () => {
        resolve([]);
      },
    });
  });
}

/**
 * Validate CSV file
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return { valid: false, error: 'File must be a CSV file' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  // Check if file is empty
  if (file.size === 0) {
    return { valid: false, error: 'File is empty' };
  }

  return { valid: true };
}

/**
 * Convert menu items to CSV
 */
export function menuItemsToCSV(items: CSVMenuItem[]): string {
  const data = items.map((item) => ({
    Name: item.name,
    Description: item.description || '',
    Price: item.price.toFixed(2),
    Category: item.category,
    IsVeg: item.isVeg ? 'true' : 'false',
    IsPopular: item.isPopular ? 'true' : 'false',
    IsSpicy: item.isSpicy ? 'true' : 'false',
    PreparationTime: item.preparationTime || '',
  }));

  return Papa.unparse(data);
}

/**
 * Export menu items to CSV file
 */
export function exportMenuItemsToCSV(items: CSVMenuItem[], filename: string = 'menu-export.csv'): void {
  const csv = menuItemsToCSV(items);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

/**
 * Parse boolean value from string
 */
function parseBoolean(value: any): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const str = String(value).toLowerCase().trim();
  
  if (str === 'true' || str === 'yes' || str === '1' || str === 'y') {
    return true;
  }
  
  if (str === 'false' || str === 'no' || str === '0' || str === 'n') {
    return false;
  }

  return undefined;
}

/**
 * Detect CSV delimiter
 */
export function detectDelimiter(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const firstLine = text.split('\n')[0];
      
      const delimiters = [',', ';', '\t', '|'];
      let maxCount = 0;
      let detectedDelimiter = ',';

      delimiters.forEach((delimiter) => {
        const count = (firstLine.match(new RegExp(delimiter, 'g')) || []).length;
        if (count > maxCount) {
          maxCount = count;
          detectedDelimiter = delimiter;
        }
      });

      resolve(detectedDelimiter);
    };
    reader.readAsText(file);
  });
}

/**
 * Auto-detect column mapping
 */
export function autoDetectMapping(columns: string[]): CSVColumnMapping {
  const mapping: CSVColumnMapping = {
    name: '',
    price: '',
    category: '',
  };

  const lowerColumns = columns.map((col) => col.toLowerCase());

  // Detect name column
  const namePatterns = ['name', 'item', 'product', 'title', 'dish'];
  mapping.name = columns.find((col, idx) =>
    namePatterns.some((pattern) => lowerColumns[idx].includes(pattern))
  ) || columns[0];

  // Detect price column
  const pricePatterns = ['price', 'cost', 'amount', 'rate'];
  mapping.price = columns.find((col, idx) =>
    pricePatterns.some((pattern) => lowerColumns[idx].includes(pattern))
  ) || '';

  // Detect category column
  const categoryPatterns = ['category', 'type', 'group', 'section'];
  mapping.category = columns.find((col, idx) =>
    categoryPatterns.some((pattern) => lowerColumns[idx].includes(pattern))
  ) || '';

  // Detect optional columns
  const descPatterns = ['description', 'desc', 'details'];
  mapping.description = columns.find((col, idx) =>
    descPatterns.some((pattern) => lowerColumns[idx].includes(pattern))
  );

  const vegPatterns = ['veg', 'vegetarian', 'isveg'];
  mapping.isVeg = columns.find((col, idx) =>
    vegPatterns.some((pattern) => lowerColumns[idx].includes(pattern))
  );

  const popularPatterns = ['popular', 'bestseller', 'ispopular'];
  mapping.isPopular = columns.find((col, idx) =>
    popularPatterns.some((pattern) => lowerColumns[idx].includes(pattern))
  );

  const spicyPatterns = ['spicy', 'hot', 'isspicy'];
  mapping.isSpicy = columns.find((col, idx) =>
    spicyPatterns.some((pattern) => lowerColumns[idx].includes(pattern))
  );

  const imagePatterns = ['image', 'photo', 'picture', 'imageurl'];
  mapping.imageUrl = columns.find((col, idx) =>
    imagePatterns.some((pattern) => lowerColumns[idx].includes(pattern))
  );

  const timePatterns = ['time', 'preparation', 'preptime', 'cookingtime'];
  mapping.preparationTime = columns.find((col, idx) =>
    timePatterns.some((pattern) => lowerColumns[idx].includes(pattern))
  );

  return mapping;
}
