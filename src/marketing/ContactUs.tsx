import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, AlertTriangle } from 'lucide-react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setSubmitStatus('error');
      setErrorMessage('Please fill in all input requirements.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        throw new Error('Failed to submit message.');
      }
    } catch (err) {
      setSubmitStatus('error');
      setErrorMessage('Failed to send contact inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-left">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl tracking-tight">
          Contact Compliance Team
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-sm text-slate-400">
          Have policy questions, registration inquiries, or need customized enterprise scans? Reach out directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left side: Business Contact Coordinates */}
        <div className="lg:col-span-2 space-y-5 bg-[#121212] border border-white/5 p-6 rounded-2xl">
          <h3 className="text-base font-bold text-white mb-4">Official Coordinates</h3>
          
          <div className="flex gap-3 items-start select-text">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 mt-0.5 border border-indigo-500/10">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="text-slate-400 font-mono block">Registered Address</span>
              <strong className="text-white block mt-0.5">AdCompliance Solutions, LLC</strong>
              <p className="text-slate-300">100 Pine St, Suite 1250</p>
              <p className="text-slate-300">San Francisco, CA 94111</p>
            </div>
          </div>

          <div className="flex gap-3 items-start select-text">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 mt-0.5 border border-emerald-500/10">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="text-slate-400 font-mono block">Support Mailbox</span>
              <a href="mailto:support@adcompliance.os" className="text-indigo-400 hover:underline font-bold block mt-0.5">
                support@adcompliance.os
              </a>
            </div>
          </div>

          <div className="flex gap-3 items-start select-text">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 mt-0.5 border border-amber-500/10">
              <Phone className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="text-slate-400 font-mono block">Support Helpline</span>
              <span className="text-white font-bold block mt-0.5">+1 (800) 555-0199</span>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <div className="p-2 bg-slate-800 rounded-lg text-slate-400 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="text-slate-400 font-mono block">Availability Hours</span>
              <span className="text-white font-medium block mt-0.5">Monday – Friday</span>
              <span className="text-slate-300">9:00 AM – 6:00 PM PST</span>
            </div>
          </div>
        </div>

        {/* Right side: Interactive Contact Form */}
        <div className="lg:col-span-3 bg-[#121212] border border-white/5 p-6 rounded-2xl flex flex-col gap-4">
          <h3 className="text-base font-bold text-white mb-1">Submit an Inquiry</h3>
          <p className="text-xs text-slate-400 leading-normal">
            Your message will be logged in our admin message repository and processed by our compliance team.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-600 placeholder-slate-600 font-sans"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-600 placeholder-slate-600 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Message Content
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Details of your policy or compliance inquiry..."
                rows={4}
                className="w-full bg-black/40 border border-white/10 rounded-lg p-3.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-600 placeholder-slate-600 leading-normal font-sans"
                required
              />
            </div>

            {/* STATUS PANELS */}
            {submitStatus === 'success' && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-start gap-2.5">
                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Message Sent!</strong> We have saved your message to the database system. Our compliance experts will review it shortly.
                </div>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <strong>Submission Error:</strong> {errorMessage}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
            >
              {isSubmitting ? (
                <span>Sending...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Inquiry</span>
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
