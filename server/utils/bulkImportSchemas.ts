export interface BulkFieldSpec {
  header: string
  key: string
  required?: boolean
  type?: 'number' | 'date' | 'boolean'
  example: string
}

export interface BulkImportSchema {
  label: string
  table: string
  fields: BulkFieldSpec[]
}

// One source of truth for both the downloadable template's columns and the
// upload parser's column-to-field mapping. `key` matches the column name
// the table actually uses (snake_case, same as the DB).
export const bulkImportSchemas: Record<string, BulkImportSchema> = {
  clients: {
    label: 'Clients',
    table: '/clients',
    fields: [
      { header: 'Company Name', key: 'company_name', required: true, example: 'Acme Cleaning Co' },
      { header: 'Contact First Name', key: 'name', example: 'Jane' },
      { header: 'Contact Surname', key: 'surname', example: 'Doe' },
      { header: 'Address', key: 'address', example: '1 Main Street, Cape Town' },
      { header: 'Email', key: 'email', example: 'jane@acme.co.za' },
      { header: 'Industry', key: 'industry', example: 'Retail' },
      { header: 'Relationship Allocation', key: 'relationship_allocation', example: 'Marius Senekal' },
      { header: 'Annual Revenue', key: 'annual_revenue', type: 'number', example: '500000' },
      { header: 'Special Requirements', key: 'special_requirements', example: '' },
      { header: 'Last Serviced (YYYY-MM-DD)', key: 'last_serviced', type: 'date', example: '2026-10-01' },
      { header: 'Company Registration', key: 'company_registration', example: '2021/123456/07' },
      { header: 'Landline Number', key: 'landline_number', example: '021 555 0100' },
      { header: 'Mobile Number', key: 'mobile_number', example: '082 555 0100' },
      { header: 'Contact 2 First Name', key: 'contact_person_2_name', example: '' },
      { header: 'Contact 2 Surname', key: 'contact_person_2_surname', example: '' },
      { header: 'Contact 2 Email', key: 'contact_person_2_email', example: '' },
      { header: 'Contact 2 Mobile', key: 'contact_person_2_mobile', example: '' },
      { header: 'Contact 2 Landline', key: 'contact_person_2_landline', example: '' },
      { header: 'Status (active/inactive/prospect/suspended)', key: 'status', example: 'active' },
      { header: 'Service Type', key: 'service_type', example: 'Weekly Cleaning' },
      { header: 'Contract Renewal Date (YYYY-MM-DD)', key: 'contract_renewal_date', type: 'date', example: '2027-01-01' },
      { header: 'Red Flags / Notes', key: 'reg_flags_notes', example: '' },
      { header: 'Next Service Due (YYYY-MM-DD)', key: 'next_service_due', type: 'date', example: '2026-11-15' },
      { header: 'Date of Birth (YYYY-MM-DD)', key: 'date_of_birth', type: 'date', example: '' }
    ]
  },
  staff: {
    label: 'HR',
    table: '/staff_members',
    fields: [
      { header: 'First Name', key: 'name', required: true, example: 'John' },
      { header: 'Surname', key: 'surname', required: true, example: 'Smith' },
      { header: 'Address', key: 'address', example: '2 Main Street, Cape Town' },
      { header: 'Landline Number', key: 'landline_number', example: '' },
      { header: 'Email', key: 'email', example: 'john@example.com' },
      { header: 'Mobile Number', key: 'mobile_number', example: '083 555 0200' },
      { header: 'ID Number', key: 'id_number', example: '9001015800089' },
      { header: 'Gender', key: 'gender', example: 'Male' },
      { header: 'Next of Kin', key: 'next_of_kin', example: '' },
      { header: 'Next of Kin Mobile', key: 'next_of_kin_mobile', example: '' },
      { header: 'Date Joined (YYYY-MM-DD)', key: 'date_joined', type: 'date', example: '2024-03-01' },
      { header: 'Contract Renewal Date (YYYY-MM-DD)', key: 'contract_renewal_date', type: 'date', example: '' },
      { header: 'Date of Birth (YYYY-MM-DD)', key: 'date_of_birth', type: 'date', example: '' },
      { header: 'Trax Number', key: 'trax_number', example: '' },
      { header: 'UIF Number', key: 'uif_number', example: '' },
      { header: 'Role', key: 'role', example: 'Cleaner' },
      { header: 'Team Allocation', key: 'team_allocation', example: 'Team A' },
      { header: 'Salary', key: 'salary', type: 'number', example: '9500' },
      { header: 'Frequency Paid', key: 'frequency_paid', example: 'Monthly' },
      { header: 'Additional Information', key: 'additional_information', example: '' },
      { header: 'Is Active (TRUE/FALSE)', key: 'is_active', type: 'boolean', example: 'TRUE' }
    ]
  },
  vehicles: {
    label: 'Vehicles',
    table: '/vehicles',
    fields: [
      { header: 'Make', key: 'make', required: true, example: 'Toyota' },
      { header: 'Model', key: 'model', required: true, example: 'Hilux' },
      { header: 'Year', key: 'year', required: true, type: 'number', example: '2022' },
      { header: 'Colour', key: 'colour', example: 'White' },
      { header: 'Registration Number', key: 'registration_number', required: true, example: 'CA 123-456' },
      { header: 'VIN Number', key: 'vin_number', example: '' },
      { header: 'License Disc Renewal (YYYY-MM-DD)', key: 'license_disc_renewal', type: 'date', example: '2026-06-30' },
      { header: 'Next Service Due (km)', key: 'next_service_due_km', type: 'number', example: '15000' }
    ]
  },
  equipment: {
    label: 'Equipment',
    table: '/equipment',
    fields: [
      { header: 'Make', key: 'make', required: true, example: 'Numatic' },
      { header: 'Model', key: 'model', example: 'NVP180' },
      { header: 'Year', key: 'year', type: 'number', example: '2024' },
      { header: 'Colour', key: 'colour', example: '' },
      { header: 'Serial Number', key: 'serial_number', example: 'SN-0001' },
      { header: 'Unit Allocation', key: 'unit_allocation', example: 'Main Warehouse' },
      { header: 'Next Service Due (YYYY-MM-DD)', key: 'next_service_due', type: 'date', example: '2026-12-01' }
    ]
  }
}
