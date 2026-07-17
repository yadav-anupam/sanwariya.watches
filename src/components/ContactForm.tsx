import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle2, MessageSquare, Mail, Phone, Calendar, Loader2 } from 'lucide-react';
import { ContactFormInput } from '../types';
import { BRAND_STATS } from '../data';
import { saveInquiryBooking } from '../lib/supabase';

export const ContactForm: React.FC = () => {
  const [form, setForm] = useState<ContactFormInput>({
    name: '',
    email: '',
    phone: '',
    inquiryType: 'custom_watch',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.message) {
      alert('Please complete the mandatory fields to send your inquiry.');
      return;
    }

    setIsSubmitting(true);
    try {
      await saveInquiryBooking({
        name: form.name,
        email: form.email,
        phone: form.phone,
        inquiryType: form.inquiryType,
        message: form.message
      });
    } catch (error) {
      console.error('Error saving inquiry:', error);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };


  const handleSendWhatsAppFallback = () => {
    const typeLabel = {
      custom_watch: '👑 Custom Watch Design Inquiry',
      service_request: '🛠️ Watch Maintenance / Service Request',
      feedback: '💬 Customer Experience Feedback',
      general: '✉️ General Watch Inquiry'
    }[form.inquiryType];

    const text = `✨ *NEW INQUIRY - SANWARIYA WATCHES* ✨\n\n` +
      `👤 *Sender Details:* \n` +
      `Name: ${form.name}\n` +
      `Phone: ${form.phone}\n` +
      `Email: ${form.email || 'N/A'}\n\n` +
      `📌 *Type:* ${typeLabel}\n\n` +
      `✉️ *Message:* \n"${form.message}"\n\n` +
      `⚡ _Inquiry sent via Sanwariya Watches Web Portal._`;

    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/91${BRAND_STATS.phone}?text=${encodedText}`, '_blank');
  };

  const handleReset = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      inquiryType: 'custom_watch',
      message: ''
    });
    setSubmitted(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!submitted ? (
        <form onSubmit={handleSubmit} className="space-y-5 bg-neutral-900/40 p-6 sm:p-10 rounded-3xl border border-neutral-900 shadow-xl backdrop-blur-sm">
          <div className="text-center sm:text-left mb-6">
            <h3 className="font-serif text-xl sm:text-2xl text-white tracking-wide font-semibold mb-2">
              Inquire & Partner with Us
            </h3>
            <p className="text-neutral-400 text-xs sm:text-sm font-sans">
              Need a bespoke customized dial, technical maintenance service, or want to provide feedback? Our horology experts respond within 1 hour.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full name */}
            <div>
              <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Your Name <span className="text-gold-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleInputChange}
                placeholder="Rahul Verma"
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-900 text-white text-xs focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 font-sans"
              />
            </div>

            {/* Mobile number */}
            <div>
              <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Mobile / WhatsApp <span className="text-gold-400">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                value={form.phone}
                onChange={handleInputChange}
                placeholder="+91 XXXXX XXXXX"
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-900 text-white text-xs focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 font-sans"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                placeholder="rahul@example.com"
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-900 text-white text-xs focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 font-sans"
              />
            </div>

            {/* Inquiry Type */}
            <div>
              <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Inquiry Type <span className="text-gold-400">*</span>
              </label>
              <select
                name="inquiryType"
                value={form.inquiryType}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-900 text-white text-xs focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 font-sans appearance-none"
              >
                <option value="custom_watch">👑 Custom Watch Inquiry</option>
                <option value="service_request">🛠️ Maintenance & Repair Service</option>
                <option value="feedback">💬 Customer Feedback</option>
                <option value="general">✉️ General Questions</option>
              </select>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-[10px] font-sans font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Detailed Message / Description <span className="text-gold-400">*</span>
            </label>
            <textarea
              name="message"
              required
              rows={4}
              value={form.message}
              onChange={handleInputChange}
              placeholder="Tell us about the watch model, customization, dial type, or technical issue you need solved..."
              className="w-full px-4 py-3 rounded-xl bg-neutral-950 border border-neutral-900 text-white text-xs focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 font-sans resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 size="14" className="animate-spin" />
            ) : (
              <Send size="14" />
            )}
            <span>{isSubmitting ? 'Sending Securing Inquiry...' : 'Submit Secure Inquiry'}</span>
          </button>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-neutral-900/60 p-8 sm:p-12 rounded-3xl border border-neutral-900 shadow-xl"
        >
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="text-emerald-400 h-16 w-16" />
          </div>
          <h3 className="font-serif text-2xl text-white tracking-wide font-bold mb-3">
            Inquiry Received Successfully!
          </h3>
          <p className="text-neutral-400 text-sm max-w-md mx-auto mb-8 font-sans">
            Thank you, <strong>{form.name}</strong>. Your inquiry has been registered in our database. One of our Senior Watch Architects will follow up within 1 hour.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* WhatsApp follow-up button */}
            <button
              onClick={handleSendWhatsAppFallback}
              className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-sans font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <MessageSquare size="14" fill="white" />
              <span>Forward via WhatsApp</span>
            </button>

            {/* Submit another button */}
            <button
              onClick={handleReset}
              className="w-full sm:w-auto py-3 px-6 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900 font-sans font-bold text-xs uppercase tracking-widest cursor-pointer transition-colors"
            >
              Send Another Request
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
