import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Clock, 
  Upload, 
  Image, 
  LayoutGrid, 
  QrCode, 
  Users, 
  ShoppingBag, 
  PartyPopper,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    cafeName: '',
    address: '',
    phone: '',
    cuisineType: '',
    openTime: '09:00',
    closeTime: '22:00',
    operatingDays: [] as string[],
    tableCount: 0,
    staffEmails: [] as string[],
  });

  const totalSteps = 9;

  const steps = [
    { number: 1, title: 'Cafe Details', icon: Building2 },
    { number: 2, title: 'Operating Hours', icon: Clock },
    { number: 3, title: 'Upload Menu', icon: Upload },
    { number: 4, title: 'Add Photos', icon: Image },
    { number: 5, title: 'Configure Tables', icon: LayoutGrid },
    { number: 6, title: 'Generate QR Codes', icon: QrCode },
    { number: 7, title: 'Staff Setup', icon: Users },
    { number: 8, title: 'Test Order', icon: ShoppingBag },
    { number: 9, title: 'Go Live!', icon: PartyPopper },
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete onboarding
      navigate('/admin');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CafeDetailsStep formData={formData} setFormData={setFormData} />;
      case 2:
        return <OperatingHoursStep formData={formData} setFormData={setFormData} />;
      case 3:
        return <UploadMenuStep />;
      case 4:
        return <AddPhotosStep />;
      case 5:
        return <ConfigureTablesStep formData={formData} setFormData={setFormData} />;
      case 6:
        return <GenerateQRCodesStep tableCount={formData.tableCount} />;
      case 7:
        return <StaffSetupStep formData={formData} setFormData={setFormData} />;
      case 8:
        return <TestOrderStep />;
      case 9:
        return <GoLiveStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-amber-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to BrewHub! 🎉
          </h1>
          <p className="text-gray-600">
            Let's get your cafe set up in just a few minutes
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            />
          </div>
        </div>

        {/* Step Indicators */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center justify-between min-w-max gap-2">
            {steps.map((step) => (
              <div
                key={step.number}
                className={`flex flex-col items-center ${
                  step.number === currentStep
                    ? 'text-primary-600'
                    : step.number < currentStep
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${
                    step.number === currentStep
                      ? 'bg-primary-600 text-white'
                      : step.number < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {step.number < currentStep ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-medium text-center max-w-[80px]">
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          {renderStep()}
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors shadow-lg"
          >
            {currentStep === totalSteps ? 'Complete Setup' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Step Components
function CafeDetailsStep({ formData, setFormData }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Tell us about your cafe</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cafe Name *
          </label>
          <input
            type="text"
            value={formData.cafeName}
            onChange={(e) => setFormData({ ...formData, cafeName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="The Coffee House"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address *
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="123 Main Street, City, State - PIN Code"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="+91 98765 43210"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cuisine Type *
          </label>
          <select
            value={formData.cuisineType}
            onChange={(e) => setFormData({ ...formData, cuisineType: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select cuisine type</option>
            <option value="cafe">Cafe</option>
            <option value="restaurant">Restaurant</option>
            <option value="fast-food">Fast Food</option>
            <option value="fine-dining">Fine Dining</option>
            <option value="bakery">Bakery</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function OperatingHoursStep({ formData, setFormData }: any) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day: string) => {
    const currentDays = formData.operatingDays || [];
    if (currentDays.includes(day)) {
      setFormData({
        ...formData,
        operatingDays: currentDays.filter((d: string) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        operatingDays: [...currentDays, day],
      });
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Set your operating hours</h2>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opening Time
            </label>
            <input
              type="time"
              value={formData.openTime}
              onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Closing Time
            </label>
            <input
              type="time"
              value={formData.closeTime}
              onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Operating Days
          </label>
          <div className="grid grid-cols-2 gap-2">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => toggleDay(day)}
                className={`px-4 py-3 rounded-lg border-2 transition-all ${
                  formData.operatingDays?.includes(day)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadMenuStep() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload your menu</h2>
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drag and drop your CSV file here
          </p>
          <p className="text-sm text-gray-600 mb-4">
            or click to browse files
          </p>
          <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
            Choose File
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Download our CSV template to see the required format.
            You can also add menu items manually in the next step.
          </p>
        </div>

        <button className="w-full py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">
          Download CSV Template
        </button>
      </div>
    </div>
  );
}

function AddPhotosStep() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Add item photos</h2>
      <div className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drag and drop images here
          </p>
          <p className="text-sm text-gray-600 mb-4">
            or click to browse files (JPG, PNG, max 5MB each)
          </p>
          <button className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors">
            Choose Images
          </button>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm text-amber-900">
            <strong>Note:</strong> High-quality photos can increase orders by up to 30%!
            You can add photos later from the menu management page.
          </p>
        </div>

        <button className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors">
          Skip this step for now
        </button>
      </div>
    </div>
  );
}

function ConfigureTablesStep({ formData, setFormData }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Configure your tables</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Tables *
          </label>
          <input
            type="number"
            value={formData.tableCount}
            onChange={(e) => setFormData({ ...formData, tableCount: parseInt(e.target.value) })}
            min="1"
            max="100"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter number of tables"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Info:</strong> We'll generate unique QR codes for each table.
            You can download and print them in the next step.
          </p>
        </div>

        {formData.tableCount > 0 && (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: Math.min(formData.tableCount, 20) }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-primary-100 border-2 border-primary-300 rounded-lg flex items-center justify-center"
              >
                <span className="text-sm font-semibold text-primary-700">
                  T{i + 1}
                </span>
              </div>
            ))}
            {formData.tableCount > 20 && (
              <div className="aspect-square bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  +{formData.tableCount - 20} more
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GenerateQRCodesStep({ tableCount }: { tableCount: number }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Generate QR codes</h2>
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <QrCode className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-green-900 mb-2">
            QR codes are ready!
          </p>
          <p className="text-sm text-green-700 mb-4">
            We've generated {tableCount} unique QR codes for your tables.
          </p>
          <button className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
            Download QR Codes (PDF)
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Printing Tips:</strong>
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
            <li>Use high-quality paper for better scanning</li>
            <li>Laminate the QR codes for durability</li>
            <li>Place them at eye level on tables</li>
            <li>Test scan with your phone before final placement</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StaffSetupStep({ formData, setFormData }: any) {
  const [email, setEmail] = useState('');

  const addStaff = () => {
    if (email && !formData.staffEmails.includes(email)) {
      setFormData({
        ...formData,
        staffEmails: [...formData.staffEmails, email],
      });
      setEmail('');
    }
  };

  const removeStaff = (emailToRemove: string) => {
    setFormData({
      ...formData,
      staffEmails: formData.staffEmails.filter((e: string) => e !== emailToRemove),
    });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Invite your staff</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Staff Email Addresses
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="staff@example.com"
            />
            <button
              onClick={addStaff}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {formData.staffEmails.length > 0 && (
          <div className="space-y-2">
            {formData.staffEmails.map((staffEmail: string) => (
              <div
                key={staffEmail}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="text-gray-900">{staffEmail}</span>
                <button
                  onClick={() => removeStaff(staffEmail)}
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> Staff members will receive an email invitation to join your cafe.
            They can set their password and access the kitchen display system.
          </p>
        </div>

        <button className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors">
          Skip this step for now
        </button>
      </div>
    </div>
  );
}

function TestOrderStep() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Place a test order</h2>
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-primary-50 to-amber-50 border border-primary-200 rounded-lg p-6 text-center">
          <ShoppingBag className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-900 mb-2">
            Let's test your setup!
          </p>
          <p className="text-sm text-gray-600 mb-6">
            Scan the QR code below with your phone to place a test order.
            This will help you verify everything is working correctly.
          </p>
          <div className="inline-block p-4 bg-white rounded-lg shadow-md">
            <QrCode className="w-32 h-32 text-gray-900" />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-900">
            <strong>Checklist:</strong>
          </p>
          <ul className="text-sm text-green-800 mt-2 space-y-1 list-disc list-inside">
            <li>QR code scans successfully</li>
            <li>Menu displays correctly</li>
            <li>Can add items to cart</li>
            <li>Order appears in kitchen display</li>
            <li>Can update order status</li>
          </ul>
        </div>

        <button className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors">
          Skip test order
        </button>
      </div>
    </div>
  );
}

function GoLiveStep() {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
      >
        <PartyPopper className="w-24 h-24 text-primary-600 mx-auto mb-6" />
      </motion.div>

      <h2 className="text-3xl font-bold text-gray-900 mb-4">
        You're all set! 🎉
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        Your cafe is now live on BrewHub. Start accepting orders and delight your customers!
      </p>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-green-900 mb-3">
          What's next?
        </h3>
        <ul className="text-sm text-green-800 space-y-2 text-left">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Place QR codes on your tables</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Invite your staff to join</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Start accepting orders!</span>
          </li>
        </ul>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Need help?</strong> Our support team is available 24/7.
          Contact us at support@brewhub.app or call +91-XXXXXXXXXX
        </p>
      </div>
    </div>
  );
}
