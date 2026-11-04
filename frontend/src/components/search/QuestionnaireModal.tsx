import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { Sparkles, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';

interface QuestionnaireData {
  industry: string;
  country: string;
  cities: string;
  quantity: number;
  businessType: string;
  needEmails: boolean;
  needPhones: boolean;
  needWebsites: boolean;
  needAddresses: boolean;
  needLinkedin: boolean;
  additionalRequirements: string;
}

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionnaireData) => void;
  isLoading?: boolean;
}

export const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [formData, setFormData] = useState<QuestionnaireData>({
    industry: 'Freight Forwarding',
    country: 'United Kingdom',
    cities: 'London, Manchester',
    quantity: 50,
    businessType: 'Commercial B2B / Logistics',
    needEmails: true,
    needPhones: true,
    needWebsites: true,
    needAddresses: true,
    needLinkedin: true,
    additionalRequirements: 'Prefer registered businesses with direct operations contact and corporate domains.',
  });

  const handleChange = (field: keyof QuestionnaireData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Interactive AI Lead Search Questionnaire"
      subtitle={`Step ${step} of ${totalSteps} — Define target industry, geography, and required fields`}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                1. Target Industry
              </label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                placeholder="e.g. Freight Forwarding, SaaS, Solar Energy, Accounting"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  2. Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleChange('country', e.target.value)}
                  placeholder="e.g. United Kingdom, United States"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  3. City or Region
                </label>
                <input
                  type="text"
                  value={formData.cities}
                  onChange={(e) => handleChange('cities', e.target.value)}
                  placeholder="e.g. London, Manchester (comma separated)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  4. Number of Leads
                </label>
                <input
                  type="number"
                  min="5"
                  max="1000"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', parseInt(e.target.value, 10) || 50)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  5. Business Type
                </label>
                <input
                  type="text"
                  value={formData.businessType}
                  onChange={(e) => handleChange('businessType', e.target.value)}
                  placeholder="e.g. B2B, Distributor, Agency"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Required Contact Information Fields
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'needEmails', label: '6. Business Emails', desc: 'Direct corporate email addresses' },
                { key: 'needPhones', label: '7. Phone Numbers', desc: 'Headquarters or dispatch telephone numbers' },
                { key: 'needWebsites', label: '8. Company Websites', desc: 'Official company domain URL' },
                { key: 'needAddresses', label: '9. Physical Addresses', desc: 'Registered office or warehouse location' },
                { key: 'needLinkedin', label: '10. LinkedIn Company URL', desc: 'Official company page profile' },
              ].map((item) => (
                <label
                  key={item.key}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    (formData as any)[item.key]
                      ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={(formData as any)[item.key]}
                    onChange={(e) => handleChange(item.key as any, e.target.checked)}
                    className="mt-1 rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-200">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                11. Additional Requirements & Targeting Criteria
              </label>
              <textarea
                rows={4}
                value={formData.additionalRequirements}
                onChange={(e) => handleChange('additionalRequirements', e.target.value)}
                placeholder="Specific certifications, company size, special handling, keywords to include or avoid..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-xs text-indigo-300 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-white">AI Strategy Generation:</span> Upon proceeding, the assistant
                will formulate an optimized multi-source discovery plan, generate targeted search queries, map them across
                active search providers, and present the strategy for your approval.
              </div>
            </div>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Generating Strategy...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Search Strategy</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
};
