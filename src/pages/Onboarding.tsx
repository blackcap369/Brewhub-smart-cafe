import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Clock, 
  Upload, 
  Image, 
  LayoutGrid, 
  QrCode, 
  Users, 
  CheckCircle, 
  PartyPopper,
  ArrowLeft,
  ArrowRight,
  Download,
  FileText
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { useAuth } from '../hooks/useAuth';
import { downloadCSVTemplate, parseCSV, type CSVMenuItem } from '../utils/csvImporter';
import { generateAllQRCodes, downloadQRCodesPDF } from '../utils/qrGenerator';
import { useToast } from '../contexts/ToastContext';

const steps = [
  { id: 1, title: 'Cafe Details', icon: Store },
  { id: 2, title: 'Operating Hours', icon: Clock },
  { id: 3, title: 'Upload Menu', icon: Upload },
  { id: 4, title: 'Add Photos', icon: Image },
  { id: 5, title: 'Configure Tables', icon: LayoutGrid },
  { id: 6, title: 'Generate QR Codes', icon: QrCode },
  { id: 7, title: 'Staff Setup', icon: Users },
  { id: 8, title: 'Test Order', icon: CheckCircle },
  { id: 9, title: 'Go Live!', icon: PartyPopper }
];

interface CafeData {
  name: string;
  address: string;
  phone: string;
  cuisineType: string;
}

interface OperatingHours {
  openTime: string;
  closeTime: string;
  days: string[];
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [cafeData, setCafeData] = useState<CafeData>({
    name: '',
    address: '',
    phone: '',
    cuisineType: ''
  });

  const [operatingHours, setOperatingHours] = useState<OperatingHours>({
    openTime: '09:00',
    closeTime: '22:00',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  });

  const [menuItems, setMenuItems] = useState<CSVMenuItem[]>([]);
  const [totalTables, setTotalTables] = useState(10);
  const [staffEmails, setStaffEmails] = useState<string[]>([]);
  const [cafeId, setCafeId] = useState<string>('');

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleNext = async () => {
    if (currentStep === 1) {
      if (!cafeData.name || !cafeData.address || !cafeData.phone) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    if (currentStep === 9) {
      // Final step - go live
      setLoading(true);
      try {
        // Update cafe status to active
        const { error } = await supabase
          .from('cafes')
          .update({ is_active: true })
          .eq('id', cafeId);

        if (error) throw error;

        toast.success('Your cafe is now live! 🎉');
        navigate('/admin');
      } catch (error) {
        toast.error('Failed to activate cafe');
      } finally {
        setLoading(false);
      }
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateCafe = async () => {
    if (!user) {
      toast.error('Please login first');
      return;
    }

    setLoading(true);
    try {
      // Create cafe
      const { data: cafe, error } = await supabase
        .from('cafes')
        .insert([{
          name: cafeData.name,
          address: cafeData.address,
          phone: cafeData.phone,
          owner_id: user.id,
          subscription_plan: 'starter',
          settings: {
            cuisine_type: cafeData.cuisineType,
            operating_hours: operatingHours
          }
        }])
        .select()
        .single();

      if (error) throw error;

      setCafeId(cafe.id);
      toast.success('Cafe created successfully!');
      setCurrentStep(2);
    } catch (error) {
      toast.error('Failed to create cafe');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const result = await parseCSV(file);
      
      if (result.success) {
        setMenuItems(result.data);
        toast.success(`Imported ${result.validRows} menu items`);
      } else {
        toast.error(`Import failed: ${result.errors[0]}`);
      }
    } catch (error) {
      toast.error('Failed to parse CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMenuItems = async () => {
    if (!cafeId || menuItems.length === 0) {
      toast.error('No menu items to save');
      return;
    }

    setLoading(true);
    try {
      const itemsToInsert = menuItems.map(item => ({
        cafe_id: cafeId,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        is_veg: item.isVeg || false,
        is_popular: item.isPopular || false,
        is_spicy: item.isSpicy || false,
        is_available: true
      }));

      const { error } = await supabase
        .from('menu_items')
        .insert(itemsToInsert);

      if (error) throw error;

      toast.success('Menu items saved successfully!');
      setCurrentStep(4);
    } catch (error) {
      toast.error('Failed to save menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTables = async () => {
    if (!cafeId) {
      toast.error('Cafe not created yet');
      return;
    }

    setLoading(true);
    try {
      const tables = Array.from({ length: totalTables }, (_, i) => ({
        cafe_id: cafeId,
        table_no: i + 1,
        seats: 4,
        status: 'available'
      }));

      const { error } = await supabase
        .from('tables')
        .insert(tables);

      if (error) throw error;

      toast.success('Tables created successfully!');
      setCurrentStep(6);
    } catch (error) {
      toast.error('Failed to create tables');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQRCodes = async () => {
    if (!cafeId) {
      toast.error('Cafe not created yet');
      return;
    }

    setLoading(true);
    try {
      await downloadQRCodesPDF(cafeId, cafeData.name, totalTables);
      toast.success('QR codes downloaded!');
      setCurrentStep(7);
    } catch (error) {
      toast.error('Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteStaff = async () => {
    if (staffEmails.length === 0) {
      setCurrentStep(8);
      return;
    }

    setLoading(true);
    try {
      // Send invitations (simplified - in production would send actual emails)
      toast.success(`Invited ${staffEmails.length} staff members`);
      setCurrentStep(8);
    } catch (error) {
      toast.error('Failed to invite staff');
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    setOperatingHours(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell us about your cafe</h2>
              <p className="text-gray-600">Basic information to set up your cafe profile</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cafe Name *
                </label>
                <input
                  type="text"
                  value={cafeData.name}
                  onChange={(e) => setCafeData({ ...cafeData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="The Coffee House"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <textarea
                  value={cafeData.address}
                  onChange={(e) => setCafeData({ ...cafeData, address: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="123 Main Street, City, State - PIN Code"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={cafeData.phone}
                  onChange={(e) => setCafeData({ ...cafeData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+91 98765 43210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type
                </label>
                <select
                  value={cafeData.cuisineType}
                  onChange={(e) => setCafeData({ ...cafeData, cuisineType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select cuisine type</option>
                  <option value="coffee">Coffee & Cafe</option>
                  <option value="indian">Indian</option>
                  <option value="chinese">Chinese</option>
                  <option value="italian">Italian</option>
                  <option value="continental">Continental</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCreateCafe}
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Cafe & Continue'}
            </button>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Set your operating hours</h2>
              <p className="text-gray-600">When is your cafe open for customers?</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Opening Time
                  </label>
                  <input
                    type="time"
                    value={operatingHours.openTime}
                    onChange={(e) => setOperatingHours({ ...operatingHours, openTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closing Time
                  </label>
                  <input
                    type="time"
                    value={operatingHours.closeTime}
                    onChange={(e) => setOperatingHours({ ...operatingHours, closeTime: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Days
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {allDays.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        operatingHours.days.includes(day)
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload your menu</h2>
              <p className="text-gray-600">Import your menu items from a CSV file or add manually</p>
            </div>

            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Drag and drop your CSV file here, or click to browse</p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleMenuUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Choose File
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Need a template?</p>
                    <p className="text-sm text-blue-700">Download our CSV template to get started</p>
                  </div>
                </div>
                <button
                  onClick={downloadCSVTemplate}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Template
                </button>
              </div>

              {menuItems.length > 0 && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="font-medium text-green-900 mb-2">
                    ✓ {menuItems.length} items ready to import
                  </p>
                  <button
                    onClick={handleSaveMenuItems}
                    disabled={loading}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Menu Items'}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setCurrentStep(4)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Skip for now
            </button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Add item photos</h2>
              <p className="text-gray-600">Upload photos for your menu items (optional)</p>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Drag and drop images here, or click to browse</p>
              <p className="text-sm text-gray-500 mb-6">Supports JPG, PNG up to 5MB each</p>
              <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
                Upload Images
              </button>
            </div>

            <button
              onClick={() => setCurrentStep(5)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Skip for now
            </button>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Configure your tables</h2>
              <p className="text-gray-600">How many tables does your cafe have?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Tables
                </label>
                <input
                  type="number"
                  value={totalTables}
                  onChange={(e) => setTotalTables(parseInt(e.target.value) || 0)}
                  min="1"
                  max="100"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Tip:</strong> Each table will get a unique QR code that customers can scan to order.
                </p>
              </div>

              <button
                onClick={handleCreateTables}
                disabled={loading || totalTables < 1}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Tables & Continue'}
              </button>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Generate QR codes</h2>
              <p className="text-gray-600">Download QR codes for all your tables</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-primary-50 to-amber-50 rounded-xl border border-primary-200">
              <QrCode className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                {totalTables} QR Codes Ready
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Download a PDF with all QR codes. Print and place them on your tables.
              </p>
              <button
                onClick={handleGenerateQRCodes}
                disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {loading ? 'Generating...' : 'Download QR Codes PDF'}
              </button>
            </div>

            <button
              onClick={() => setCurrentStep(7)}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite your staff</h2>
              <p className="text-gray-600">Add kitchen and manager accounts (optional)</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff Email Addresses
                </label>
                <textarea
                  value={staffEmails.join('\n')}
                  onChange={(e) => setStaffEmails(e.target.value.split('\n').filter(email => email.trim()))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={5}
                  placeholder="kitchen@cafe.com&#10;manager@cafe.com"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter one email per line. We'll send them invitation emails.
                </p>
              </div>

              <button
                onClick={handleInviteStaff}
                disabled={loading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Invitations & Continue'}
              </button>

              <button
                onClick={() => setCurrentStep(8)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Place a test order</h2>
              <p className="text-gray-600">Verify everything is working correctly</p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Ready to test?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Scan a QR code from your phone and place a test order to make sure everything works.
              </p>
              <div className="space-y-3">
                <a
                  href={`/customer?cafe=${cafeId}&table=1`}
                  target="_blank"
                  className="block w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-center"
                >
                  Open Test Order Page
                </a>
                <button
                  onClick={() => setCurrentStep(9)}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  I've tested, continue
                </button>
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <PartyPopper className="w-20 h-20 text-primary-600 mx-auto mb-4" />
            </motion.div>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-lg text-gray-600">
                Your cafe is ready to start accepting orders
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-primary-50 to-amber-50 rounded-xl border border-primary-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's next?</h3>
              <ul className="text-left space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Print and place QR codes on tables</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Set up kitchen display on a tablet</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Train your staff on the system</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Start accepting orders!</span>
                </li>
              </ul>
            </div>

            <button
              onClick={handleNext}
              disabled={loading}
              className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 text-lg"
            >
              {loading ? 'Activating...' : 'Go Live! 🚀'}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">BrewHub Setup</h1>
                <p className="text-sm text-gray-600">Step {currentStep} of {steps.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep > step.id
                    ? 'bg-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-8 lg:w-16 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-8"
          >
            {renderStep()}

            {/* Navigation */}
            {currentStep > 1 && currentStep < 9 && (
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
