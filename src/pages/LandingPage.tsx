import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  QrCode, 
  Monitor, 
  BarChart3, 
  Gift, 
  Calendar, 
  Percent,
  CheckCircle2,
  ArrowRight,
  Star,
  Users,
  ShoppingBag,
  Clock,
  Zap,
  Shield,
  Globe,
  Smartphone
} from 'lucide-react';

const features = [
  {
    icon: QrCode,
    title: 'QR Code Ordering',
    description: 'Customers scan and order from their table. No app download required.',
    color: 'from-blue-500 to-blue-600'
  },
  {
    icon: Monitor,
    title: 'Kitchen Display',
    description: 'Real-time KDS system that keeps your kitchen organized and efficient.',
    color: 'from-purple-500 to-purple-600'
  },
  {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Track sales, popular items, peak hours, and revenue with detailed reports.',
    color: 'from-green-500 to-green-600'
  },
  {
    icon: Gift,
    title: 'Loyalty Program',
    description: 'Reward repeat customers with points, tiers, and automatic free items.',
    color: 'from-pink-500 to-pink-600'
  },
  {
    icon: Calendar,
    title: 'Pre-Order System',
    description: 'Let customers schedule orders in advance with time slot selection.',
    color: 'from-orange-500 to-orange-600'
  },
  {
    icon: Percent,
    title: 'Zero Commission',
    description: 'Keep 100% of your revenue. No hidden fees or transaction charges.',
    color: 'from-red-500 to-red-600'
  }
];

const steps = [
  {
    number: '01',
    title: 'Sign Up & Upload Menu',
    description: 'Create your account and upload your menu in minutes. Import from CSV or add items manually.',
    icon: CheckCircle2
  },
  {
    number: '02',
    title: 'Print QR Codes',
    description: 'We generate unique QR codes for each table. Download and print them for your cafe.',
    icon: QrCode
  },
  {
    number: '03',
    title: 'Go Live in 30 Minutes',
    description: 'Start accepting orders immediately. Your kitchen display updates in real-time.',
    icon: Zap
  }
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
      '1 staff account'
    ],
    popular: false
  },
  {
    name: 'Growth',
    price: '2,499',
    period: '/month',
    description: 'For growing restaurants',
    features: [
      'Up to 30 tables',
      'Everything in Starter',
      'Advanced analytics',
      'Loyalty program',
      'Pre-order system',
      '5 staff accounts',
      'Priority support'
    ],
    popular: true
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
      'Custom integrations',
      'Dedicated account manager',
      'Unlimited staff accounts',
      '24/7 phone support',
      'API access'
    ],
    popular: false
  }
];

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Owner, The Coffee House',
    content: 'BrewHub transformed our cafe operations. We reduced wait times by 40% and increased revenue by 25%. The QR ordering system is a game-changer!',
    rating: 5
  },
  {
    name: 'Priya Sharma',
    role: 'Manager, Spice Garden',
    content: 'The kitchen display system is incredible. Our chefs love it, and order accuracy improved to 99%. Best investment we made this year.',
    rating: 5
  },
  {
    name: 'Amit Patel',
    role: 'Owner, Cafe Mocha',
    content: 'Zero commission is the best part! We save thousands every month compared to other platforms. The analytics help us make better decisions daily.',
    rating: 5
  }
];

const faqs = [
  {
    question: 'How long does setup take?',
    answer: 'Most cafes are up and running in under 30 minutes. Upload your menu, print the QR codes we provide, and you\'re ready to accept orders.'
  },
  {
    question: 'Do I need special hardware?',
    answer: 'No! BrewHub works on any device with a web browser. Use your existing tablets, phones, or computers for the kitchen display and admin dashboard.'
  },
  {
    question: 'What if I already have a POS system?',
    answer: 'BrewHub integrates with most popular POS systems. We also offer a standalone solution if you want to replace your current system.'
  },
  {
    question: 'Is there a contract or commitment?',
    answer: 'No long-term contracts. You can cancel anytime. We offer monthly billing with no hidden fees or setup costs.'
  },
  {
    question: 'How does the loyalty program work?',
    answer: 'Customers earn points on every order. After 7 orders, they get a free item. You can customize the rewards and thresholds to fit your business.'
  },
  {
    question: 'Can customers order before arriving?',
    answer: 'Yes! Our pre-order system lets customers schedule orders up to 3 days in advance. They select a time slot and pay online.'
  }
];

export default function LandingPage() {
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
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  <span className="text-3xl font-bold text-gray-900">500+</span>
                </div>
                <p className="text-sm text-gray-600">Active Cafes</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <ShoppingBag className="w-5 h-5 text-primary-600" />
                  <span className="text-3xl font-bold text-gray-900">1M+</span>
                </div>
                <p className="text-sm text-gray-600">Orders Processed</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary-600" />
                  <span className="text-3xl font-bold text-gray-900">99.9%</span>
                </div>
                <p className="text-sm text-gray-600">Uptime</p>
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
              Powerful features designed to streamline operations and delight customers
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
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
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
              From signup to your first order in under 30 minutes
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
                <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 h-full">
                  <div className="text-6xl font-bold text-primary-100 mb-4">
                    {step.number}
                  </div>
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
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
              Choose the plan that fits your cafe. No hidden fees, cancel anytime.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-2xl p-8 border-2 ${
                  plan.popular ? 'border-primary-500 shadow-xl' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-900">
                      ₹{plan.price}
                    </span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/onboarding"
                  className={`w-full py-3 rounded-xl font-semibold text-center transition-all ${
                    plan.popular
                      ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg'
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
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
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
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Everything you need to know about BrewHub
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
                className="bg-gray-50 rounded-xl p-6 border border-gray-100"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
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
                <CheckCircle2 className="w-4 h-4" />
                No credit card required
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-xl font-bold text-white">BrewHub</span>
              </div>
              <p className="text-sm text-gray-400">
                The complete restaurant management platform for modern cafes.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/demo" className="hover:text-white transition-colors">Book Demo</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} BrewHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
