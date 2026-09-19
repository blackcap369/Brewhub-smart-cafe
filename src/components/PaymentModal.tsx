import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Smartphone, Wallet, Banknote, Download, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { initiatePayment, markAsCashPayment } from '../services/paymentService';
import { downloadReceipt } from '../utils/receiptGenerator';
import { useToast } from '../contexts/ToastContext';
import type { ReceiptData } from '../utils/receiptGenerator';

export type PaymentMethod = 'upi' | 'card' | 'wallet' | 'cash';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    order_number: string;
    table_no?: number;
    items: any[];
    subtotal: number;
    tax: number;
    discount?: number;
    total: number;
    created_at: string;
    customer_phone?: string;
    customer_email?: string;
  };
  cafeName: string;
  onSuccess: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  order,
  cafeName,
  onSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failure'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const toast = useToast();

  // Listen for payment events
  useEffect(() => {
    const handleSuccess = () => {
      setIsProcessing(false);
      setPaymentStatus('success');
      toast.success('Payment successful!');
      onSuccess();
    };

    const handleFailure = (event: CustomEvent) => {
      setIsProcessing(false);
      setPaymentStatus('failure');
      setErrorMessage(event.detail.error || 'Payment failed');
      toast.error('Payment failed. Please try again.');
    };

    const handleCancelled = () => {
      setIsProcessing(false);
      toast.info('Payment cancelled');
    };

    window.addEventListener('payment-success', handleSuccess);
    window.addEventListener('payment-failure', handleFailure as EventListener);
    window.addEventListener('payment-cancelled', handleCancelled);

    return () => {
      window.removeEventListener('payment-success', handleSuccess);
      window.removeEventListener('payment-failure', handleFailure as EventListener);
      window.removeEventListener('payment-cancelled', handleCancelled);
    };
  }, [toast, onSuccess]);

  const handlePayment = async () => {
    if (selectedMethod === 'cash') {
      // Mark as cash payment
      setIsProcessing(true);
      const result = await markAsCashPayment(order.id);
      
      if (result.success) {
        setPaymentStatus('success');
        toast.success('Order placed! Please pay at the counter.');
        onSuccess();
      } else {
        setPaymentStatus('failure');
        setErrorMessage(result.error || 'Failed to place order');
        toast.error(result.error || 'Failed to place order');
      }
      setIsProcessing(false);
      return;
    }

    // Online payment
    setIsProcessing(true);
    setPaymentStatus('idle');
    setErrorMessage('');

    const result = await initiatePayment({
      orderId: order.id,
      amount: order.total,
      cafeName,
      customerPhone: order.customer_phone || '',
      customerEmail: order.customer_email,
    });

    if (!result.success) {
      setIsProcessing(false);
      setPaymentStatus('failure');
      setErrorMessage(result.error || 'Failed to initiate payment');
      toast.error(result.error || 'Failed to initiate payment');
    }
  };

  const handleDownloadReceipt = () => {
    const receiptData: ReceiptData = {
      cafeName,
      orderId: order.id,
      orderNumber: order.order_number,
      orderDate: new Date(order.created_at).toLocaleDateString(),
      orderTime: new Date(order.created_at).toLocaleTimeString(),
      tableNo: order.table_no,
      items: order.items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes,
      })),
      subtotal: order.subtotal,
      tax: order.tax,
      discount: order.discount,
      total: order.total,
      paymentMethod: selectedMethod === 'cash' ? 'Cash' : 'Online Payment',
      paymentStatus: paymentStatus === 'success' ? 'Paid' : 'Pending',
      customerPhone: order.customer_phone,
    };

    downloadReceipt(receiptData, 'pdf');
    toast.success('Receipt downloaded!');
  };

  const handleClose = () => {
    if (isProcessing) return;
    setPaymentStatus('idle');
    setErrorMessage('');
    onClose();
  };

  const paymentMethods = [
    { id: 'upi' as PaymentMethod, label: 'UPI', icon: Smartphone, description: 'Pay using UPI apps' },
    { id: 'card' as PaymentMethod, label: 'Card', icon: CreditCard, description: 'Credit/Debit Card' },
    { id: 'wallet' as PaymentMethod, label: 'Wallet', icon: Wallet, description: 'Digital Wallets' },
    { id: 'cash' as PaymentMethod, label: 'Cash', icon: Banknote, description: 'Pay at counter' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {paymentStatus === 'success' ? 'Payment Successful' : 'Complete Payment'}
              </h2>
              <button
                onClick={handleClose}
                disabled={isProcessing}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Success State */}
              {paymentStatus === 'success' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Thank You!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {selectedMethod === 'cash'
                      ? 'Please pay at the counter'
                      : 'Your payment was successful'}
                  </p>
                  <button
                    onClick={handleDownloadReceipt}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors mx-auto"
                  >
                    <Download className="w-5 h-5" />
                    Download Receipt
                  </button>
                </motion.div>
              )}

              {/* Failure State */}
              {paymentStatus === 'failure' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Payment Failed
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {errorMessage || 'Something went wrong. Please try again.'}
                  </p>
                  <button
                    onClick={() => {
                      setPaymentStatus('idle');
                      setErrorMessage('');
                    }}
                    className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </motion.div>
              )}

              {/* Payment Form */}
              {paymentStatus === 'idle' && (
                <>
                  {/* Order Summary */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Order Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Order #{order.order_number}</span>
                        <span>{order.items.length} items</span>
                      </div>
                      {order.table_no && (
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Table</span>
                          <span>{order.table_no}</span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Subtotal</span>
                          <span>₹{order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>Tax (5% GST)</span>
                          <span>₹{order.tax.toFixed(2)}</span>
                        </div>
                        {order.discount && order.discount > 0 && (
                          <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                            <span>Discount</span>
                            <span>-₹{order.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-lg text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                          <span>Total</span>
                          <span>₹{order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Select Payment Method
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          disabled={isProcessing}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedMethod === method.id
                              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                          } disabled:opacity-50`}
                        >
                          <method.icon
                            className={`w-8 h-8 mx-auto mb-2 ${
                              selectedMethod === method.id
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-400'
                            }`}
                          />
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {method.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {method.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pay Button */}
                  <button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : selectedMethod === 'cash' ? (
                      'Place Order (Pay at Counter)'
                    ) : (
                      `Pay ₹${order.total.toFixed(2)}`
                    )}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
