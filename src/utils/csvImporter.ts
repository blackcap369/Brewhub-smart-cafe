import Papa from 'papaparse';

export interface CSVRow {
  [key: string]: string;
}

export interface ParsedCSV {
  data: CSVRow[];
  headers: string[];
  errors: string[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

/**
 * Parse CSV file and return structured data
 */
export function parseCSV(file: File): Promise<ParsedCSV> {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        const headers = results.meta.fields || [];
        const errors = results.errors.map(e => e.message);

        resolve({
          data,
          headers,
          errors,
        });
      },
      error: (error) => {
        resolve({
          data: [],
          headers: [],
          errors: [error.message],
        });
      },
    });
  });
}

/**
 * Validate CSV data against expected schema
 */
export function validateCSV(
  data: CSVRow[],
  requiredFields: string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('CSV file is empty');
    return { valid: false, errors };
  }

  // Check required fields
  const headers = Object.keys(data[0]);
  const missingFields = requiredFields.filter(field => !headers.includes(field));
  
  if (missingFields.length > 0) {
    errors.push(`Missing required columns: ${missingFields.join(', ')}`);
  }

  // Validate each row
  data.forEach((row, index) => {
    const rowNumber = index + 2; // +2 because row 1 is header
    
    requiredFields.forEach(field => {
      if (!row[field] || row[field].trim() === '') {
        errors.push(`Row ${rowNumber}: Missing required field "${field}"`);
      }
    });

    // Validate price if present
    if (row.price) {
      const price = parseFloat(row.price);
      if (isNaN(price) || price < 0) {
        errors.push(`Row ${rowNumber}: Invalid price "${row.price}"`);
      }
    }

    // Validate boolean fields
    if (row.is_veg !== undefined) {
      const validBooleans = ['true', 'false', '1', '0', 'yes', 'no'];
      if (!validBooleans.includes(row.is_veg.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Invalid value for is_veg "${row.is_veg}"`);
      }
    }

    if (row.is_popular !== undefined) {
      const validBooleans = ['true', 'false', '1', '0', 'yes', 'no'];
      if (!validBooleans.includes(row.is_popular.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Invalid value for is_popular "${row.is_popular}"`);
      }
    }

    if (row.is_spicy !== undefined) {
      const validBooleans = ['true', 'false', '1', '0', 'yes', 'no'];
      if (!validBooleans.includes(row.is_spicy.toLowerCase())) {
        errors.push(`Row ${rowNumber}: Invalid value for is_spicy "${row.is_spicy}"`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Convert CSV row to menu item format
 */
export function csvRowToMenuItem(row: CSVRow) {
  return {
    name: row.name || row.item_name || '',
    description: row.description || '',
    price: parseFloat(row.price || '0'),
    category: row.category || 'Uncategorized',
    is_veg: parseBoolean(row.is_veg || row.veg || 'false'),
    is_popular: parseBoolean(row.is_popular || row.popular || 'false'),
    is_spicy: parseBoolean(row.is_spicy || row.spicy || 'false'),
    image_url: row.image_url || row.image || '',
  };
}

/**
 * Parse boolean value from string
 */
function parseBoolean(value: string): boolean {
  const trueValues = ['true', '1', 'yes', 'y'];
  return trueValues.includes(value.toLowerCase().trim());
}

/**
 * Generate CSV template for menu items
 */
export function generateCSVTemplate(): string {
  const headers = [
    'name',
    'description',
    'price',
    'category',
    'is_veg',
    'is_popular',
    'is_spicy',
    'image_url',
  ];

  const sampleData = [
    {
      name: 'Cappuccino',
      description: 'Rich espresso with steamed milk foam',
      price: '150',
      category: 'Coffee',
      is_veg: 'true',
      is_popular: 'true',
      is_spicy: 'false',
      image_url: '',
    },
    {
      name: 'Paneer Tikka',
      description: 'Grilled cottage cheese with spices',
      price: '250',
      category: 'Starters',
      is_veg: 'true',
      is_popular: 'false',
      is_spicy: 'true',
      image_url: '',
    },
  ];

  const csv = Papa.unparse(sampleData, { columns: headers });
  return csv;
}

/**
 * Download CSV template
 */
export function downloadCSVTemplate(filename: string = 'menu-template.csv'): void {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Import menu items from CSV data
 */
export async function importMenuItems(
  data: CSVRow[],
  cafeId: string,
  supabase: any
): Promise<ImportResult> {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2;

    try {
      const menuItem = csvRowToMenuItem(row);

      // Validate required fields
      if (!menuItem.name) {
        errors.push(`Row ${rowNumber}: Name is required`);
        failed++;
        continue;
      }

      if (!menuItem.price || menuItem.price <= 0) {
        errors.push(`Row ${rowNumber}: Valid price is required`);
        failed++;
        continue;
      }

      // Insert into database
      const { error } = await supabase
        .from('menu_items')
        .insert([
          {
            cafe_id: cafeId,
            ...menuItem,
          },
        ]);

      if (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
        failed++;
      } else {
        imported++;
      }
    } catch (error: any) {
      errors.push(`Row ${rowNumber}: ${error.message}`);
      failed++;
    }
  }

  return {
    success: failed === 0,
    imported,
    failed,
    errors,
  };
}

/**
 * Preview CSV data before import
 */
export function previewCSV(data: CSVRow[], limit: number = 5): CSVRow[] {
  return data.slice(0, limit);
}

/**
 * Map CSV columns to expected format
 */
export function mapCSVColumns(
  data: CSVRow[],
  columnMapping: Record<string, string>
): CSVRow[] {
  return data.map(row => {
    const mapped: CSVRow = {};
    
    Object.entries(columnMapping).forEach(([target, source]) => {
      mapped[target] = row[source] || '';
    });

    return mapped;
  });
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
      let bestDelimiter = ',';
      let maxCount = 0;

      delimiters.forEach(delimiter => {
        const count = (firstLine.match(new RegExp(delimiter, 'g')) || []).length;
        if (count > maxCount) {
          maxCount = count;
          bestDelimiter = delimiter;
        }
      });

      resolve(bestDelimiter);
    };

    reader.readAsText(file.slice(0, 1000)); // Read first 1KB
  });
}

/**
 * Validate file type and size
 */
export function validateCSVFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const validTypes = ['text/csv', 'application/vnd.ms-excel', ''];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 5MB limit' };
  }

  if (!validTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    return { valid: false, error: 'Invalid file type. Please upload a CSV file.' };
  }

  return { valid: true };
}
