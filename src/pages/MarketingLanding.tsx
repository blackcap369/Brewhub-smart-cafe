import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  QrCode, 
  Monitor, 
  BarChart3, 
  Gift, 
  Calendar, 
  DollarSign,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  Clock,
  Shield,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

export default function MarketingLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: QrCode,
      title: 'QR Code Ordering',
      description: 'Customers scan and order from their table. No app download required.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Monitor,
      title: 'Kitchen Display',
      description: 'Real-time KDS system that keeps your kitchen organized and efficient.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Track sales, popular items, peak hours, and revenue with detailed reports.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: Gift,
      title: 'Loyalty Program',
      description: 'Build customer loyalty with points, rewards, and birthday surprises.',
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Calendar,
      title: 'Pre-Order System',
      description: 'Let customers schedule orders in advance. Perfect for busy cafes.',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: DollarSign,
      title: 'Zero Commission',
      description: 'Keep 100% of your revenue. No hidden fees or commissions ever.',
      color: 'from-red-500 to-pink-500',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Sign Up & Upload Menu',
      description: 'Create your account and upload your menu in minutes. We support CSV import for quick setup.',
      icon: Upload,
    },
    {
      number: '02',
      title: 'Print QR Codes',
      description: 'We generate unique QR codes for each table. Download and print them - we provide the templates.',
      icon: QrCode,
    },
    {
      number: '03',
      title: 'Go Live in 30 Minutes',
      description: 'Place QR codes on tables and start accepting orders immediately. It\'s that simple!',
      icon: Zap,
    },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '999',
      period: '/month',
      description: 'Perfect for small cafes',
      features: [
        'Up to 10 tables',
        'QR code ordering',
        'Kitchen display',
        'Basic analytics',
        'Email support',
        '1 staff account',
      ],
      popular: false,
    },
    {
      name: 'Growth',
      price: '2,499',
      period: '/month',
      description: 'For growing businesses',
      features: [
        'Up to 30 tables',
        'Everything in Starter',
        'Advanced analytics',
        'Loyalty program',
        'Pre-order system',
        '5 staff accounts',
        'Priority support',
        'Custom branding',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: '4,999',
      period: '/month',
      description: 'For large operations',
      features: [
        'Unlimited tables',
        'Everything in Growth',
        'Multi-location support',
        'API access',
        'Dedicated account manager',
        'Unlimited staff accounts',
        '24/7 phone support',
        'Custom integrations',
      ],
      popular: false,
    },
  ];

  const testimonials = [
    {
      name: 'Rajesh Kumar',
      role: 'Owner, The Coffee House',
      content: 'BrewHub transformed our cafe operations. We\'ve seen a 40% increase in orders and our customers love the QR ordering system!',
      rating: 5,
      avatar: '👨‍💼',
    },
    {
      name: 'Priya Sharma',
      role: 'Manager, Cafe Mocha',
      content: 'The kitchen display system is a game-changer. No more miscommunication, no more lost orders. Our efficiency has improved dramatically.',
      rating: 5,
      avatar: '👩‍💼',
    },
    {
      name: 'Amit Patel',
      role: 'Owner, Brew & Bite',
      content: 'Zero commission is the best part! We\'ve saved thousands compared to other platforms. The analytics help us make better decisions daily.',
      rating: 5,
      avatar: '👨‍💼',
    },
  ];

  const faqs = [
    {
      question: 'How long does setup take?',
      answer: 'Most cafes are up and running in under 30 minutes. Upload your menu, print the QR codes we provide, and you\'re ready to go!',
    },
    {
      question: 'Do I need any special equipment?',
      answer: 'No special equipment needed! Just a smartphone or tablet for the kitchen display. Customers use their own phones to scan QR codes.',
    },
    {
      question: 'What if I already have a menu?',
      answer: 'You can import your existing menu via CSV file. We provide a template to make it easy. Our team can also help you set it up.',
    },
    {
      question: 'Is there a contract or commitment?',
      answer: 'No contracts! You can cancel anytime. We believe in earning your business every month with great service.',
    },
    {
      question: 'How does payment processing work?',
      answer: 'We integrate with Razorpay for secure payments. You can accept UPI, cards, and wallets. Funds are settled directly to your bank account.',
    },
    {
      question: 'Can I customize the menu for each table?',
      answer: 'Yes! You can create different menus for different sections (indoor, outdoor, bar) and assign them to specific tables.',
    },
    {
      question: 'What kind of support do you offer?',
      answer: 'We offer email support for all plans, priority support for Growth, and 24/7 phone support for Enterprise. Our team is always here to help!',
    },
    {
      question: 'Is my data secure?',
      answer: 'Absolutely! We use enterprise-grade security with encryption, regular backups, and comply with all data protection regulations.',
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-amber-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-200/30 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 border border-primary-200 rounded-full text-sm font-medium text-primary-700 mb-6"
            >
              <Star className="w-4 h-4 fill-primary-500 text-primary-500" />
              Trusted by 500+ cafes across India
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Digitize Your Cafe in{' '}
              <span className="bg-gradient-to-r from-primary-500 via-primary-600 to-amber-500 bg-clip-text text-transparent">
                30 Minutes
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              QR ordering, zero commissions, 100% customer data ownership. 
              The complete restaurant management platform built for Indian cafes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/onboarding"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/demo"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm transition-all"
              >
                Book Demo
              </Link>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-3 gap-8 max-w-2xl mx-auto"
            >
              <div>
                <p className="text-3xl font-bold text-gray-900">500+</p>
                <p className="text-sm text-gray-600 mt-1">Cafes</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">1M+</p>
                <p className="text-sm text-gray-600 mt-1">Orders</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">99.9%</p>
                <p className="text-sm text-gray-600 mt-1">Uptime</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Cafe
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to streamline your operations and delight your customers.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white hover:shadow-lg transition-all"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-lg text-gray-600">
              No technical expertise required. We make it easy!
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-6xl font-bold text-primary-100 mb-4">{step.number}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-primary-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-lg text-gray-600">
              No hidden fees. No commissions. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl p-8 ${
                  plan.popular
                    ? 'border-2 border-primary-500 shadow-xl'
                    : 'border border-gray-200 shadow-sm'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-gray-900">₹{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/onboarding"
                  className={`block w-full py-3 rounded-lg font-semibold text-center transition-colors ${
                    plan.popular
                      ? 'bg-primary-600 hover:bg-primary-700 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by Cafe Owners
            </h2>
            <p className="text-lg text-gray-600">
              See what our customers have to say about BrewHub
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-sm"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Got questions? We've got answers.
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {openFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-4"
                  >
                    <p className="text-gray-600">{faq.answer}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Cafe?
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Join 500+ cafes already using BrewHub. Start your free trial today — no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/onboarding"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2 text-primary-200 text-sm">
                <CheckCircle className="w-4 h-4" />
                No credit card required
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-white transition-colors">Book Demo</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link to="/status" className="hover:text-white transition-colors">Status</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} BrewHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper component for Upload icon
function Upload(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}
