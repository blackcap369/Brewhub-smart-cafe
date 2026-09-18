import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Calendar, Clock, Users, MessageSquare, Smile } from 'lucide-react';
import { 
  createBroadcast, 
  getAudienceCount, 
  BROADCAST_TEMPLATES,
  type AudienceSegment,
  type BroadcastTemplate
} from '../../services/broadcastService';
import { useToast } from '../../contexts/ToastContext';

interface BroadcastComposerProps {
  isOpen: boolean;
  onClose: () => void;
  cafeId: string;
  userId: string;
  onSuccess?: () => void;
}

export default function BroadcastComposer({
  isOpen,
  onClose,
  cafeId,
  userId,
  onSuccess,
}: BroadcastComposerProps) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<AudienceSegment>('all');
  const [audienceCount, setAudienceCount] = useState(0);
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<BroadcastTemplate | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const commonEmojis = ['🎉', '🍕', '🎂', '🎁', '💝', '☕', '🍰', '🌟', '🔥', '✨', '🎊', '🍔'];

  // Fetch audience count when audience changes
  useEffect(() => {
    if (isOpen && cafeId) {
      getAudienceCount(cafeId, audience).then(count => {
        setAudienceCount(count);
      });
    }
  }, [isOpen, cafeId, audience]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setMessage('');
      setAudience('all');
      setScheduleType('now');
      setScheduledAt('');
      setSelectedTemplate(null);
    }
  }, [isOpen]);

  const handleTemplateSelect = (template: BroadcastTemplate) => {
    setSelectedTemplate(template);
    setTitle(template.title);
    setMessage(template.message);
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (scheduleType === 'later' && !scheduledAt) {
      toast.error('Please select a schedule date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createBroadcast({
        cafeId,
        title: title.trim(),
        message: message.trim(),
        audience,
        scheduledAt: scheduleType === 'later' ? new Date(scheduledAt).toISOString() : undefined,
        createdBy: userId,
      });

      if (result.success) {
        toast.success(
          scheduleType === 'now' 
            ? 'Broadcast sent successfully!' 
            : 'Broadcast scheduled successfully!'
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error || 'Failed to create broadcast');
      }
    } catch (error: any) {
      console.error('Error creating broadcast:', error);
      toast.error('Failed to create broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  const audienceOptions: { value: AudienceSegment; label: string; description: string }[] = [
    { value: 'all', label: 'All Customers', description: 'Send to all customers' },
    { value: 'today_customers', label: 'Today\'s Customers', description: 'Customers who ordered today' },
    { value: 'week_customers', label: 'This Week', description: 'Customers from last 7 days' },
    { value: 'loyalty_members', label: 'Loyalty Members', description: 'Customers with loyalty points' },
    { value: 'birthday_this_week', label: 'Birthday This Week', description: 'Customers with birthday this week' },
    { value: 'inactive_30_days', label: 'Inactive (30+ days)', description: 'Customers inactive for 30+ days' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Broadcast</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Send messages to your customers
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Templates */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Quick Templates
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BROADCAST_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{template.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          {template.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {template.message}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter broadcast title"
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message *
              </label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter your message"
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white resize-none"
                />
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute bottom-3 right-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="grid grid-cols-6 gap-2">
                      {commonEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiSelect(emoji)}
                          className="text-2xl hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg p-2 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Audience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Audience
              </label>
              <div className="space-y-2">
                {audienceOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAudience(option.value)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      audience === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {option.description}
                        </p>
                      </div>
                      {audience === option.value && (
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary-600" />
                          <span className="text-sm font-semibold text-primary-600">
                            {audienceCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Schedule
              </label>
              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => setScheduleType('now')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    scheduleType === 'now'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    <span className="font-medium">Send Now</span>
                  </div>
                </button>
                <button
                  onClick={() => setScheduleType('later')}
                  className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                    scheduleType === 'later'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Schedule</span>
                  </div>
                </button>
              </div>

              {scheduleType === 'later' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  />
                </motion.div>
              )}
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Preview
              </label>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {title || 'Broadcast Title'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {message || 'Your message will appear here...'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {audienceOptions.find(o => o.value === audience)?.label} • {audienceCount} recipients
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim() || !message.trim()}
              className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : scheduleType === 'now' ? (
                <>
                  <Send className="w-5 h-5" />
                  Send Now
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Schedule
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
