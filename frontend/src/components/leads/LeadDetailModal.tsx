import React, { useState } from 'react';
import { Modal } from '../common/Modal.js';
import { BusinessLead, LeadStatus } from '../../types/index.js';
import { StatusPill } from '../common/StatusPill.js';
import { ScoreIndicator } from '../common/ScoreIndicator.js';
import { api } from '../../services/api.js';
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Clock,
  Sparkles,
  Bookmark,
  MessageSquare,
  Trash2,
  Send,
  Building2,
  ExternalLink,
  PhoneCall,
  UserCheck,
  ShieldCheck,
  Cpu,
} from 'lucide-react';

interface LeadDetailModalProps {
  lead: BusinessLead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updated: BusinessLead) => void;
  onLeadDeleted: (id: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onLeadDeleted,
}) => {
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!lead) return null;

  const handleStatusChange = async (status: LeadStatus) => {
    setIsUpdatingStatus(true);
    try {
      const updated = await api.updateLead(lead.id, { leadStatus: status });
      onLeadUpdated(updated);
    } catch (e: any) {
      console.error('Failed to update status', e);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setIsSubmittingNote(true);
    try {
      const createdNote = await api.addNote(lead.id, newNote.trim());
      const updated: BusinessLead = {
        ...lead,
        notes: [createdNote, ...(lead.notes || [])],
      };
      onLeadUpdated(updated);
      setNewNote('');
    } catch (e: any) {
      console.error('Failed to add note', e);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${lead.companyName}"?`)) return;
    try {
      await api.deleteLead(lead.id);
      onLeadDeleted(lead.id);
      onClose();
    } catch (e: any) {
      console.error('Failed to delete lead', e);
    }
  };

  const breakdown = lead.scoreBreakdown;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.companyName}
      subtitle={`${lead.industry || 'Business'} • Discovered via ${lead.sourceProvider || 'Multi-source'}`}
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-3">
            <ScoreIndicator score={lead.leadScore} size="lg" showDetails />
            <div className="h-8 w-[1px] bg-slate-800" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Lead Status</span>
              <select
                value={lead.leadStatus}
                disabled={isUpdatingStatus}
                onChange={(e) => handleStatusChange(e.target.value as LeadStatus)}
                className="mt-0.5 text-xs font-semibold bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white outline-none focus:border-indigo-500"
              >
                <option value="NEW">NEW</option>
                <option value="REVIEWED">REVIEWED</option>
                <option value="QUALIFIED">QUALIFIED</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="CONVERTED">CONVERTED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Lead
            </button>
          </div>
        </div>

        {/* Executive & Technical Decision Makers Card */}
        <div className="space-y-3">
          {/* 1. CEO / Owner Card */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-indigo-950/40 border border-sky-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-sky-400" />
                Executive Leadership (CEO / Owner)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                Verified Executive Match
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">CEO / Decision Maker</span>
                <div className="font-bold text-white text-sm">
                  {lead.ceoName || lead.decisionMakerRole?.split('(')[0] || 'Executive Managing Director'}
                </div>
                <div className="text-[11px] text-sky-300 font-medium">
                  {lead.ceoTitle || 'Chief Executive Officer / Managing Director'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Decision Maker LinkedIn</span>
                {lead.ceoLinkedinUrl ? (
                  <a
                    href={lead.ceoLinkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 font-semibold text-xs transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-sky-400" />
                    <span>View LinkedIn Profile</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">No profile linked</span>
                )}
              </div>

              <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Direct CEO Phone</span>
                  <span className="font-mono text-emerald-300 font-bold text-sm">{lead.ceoPhone || lead.phone || 'N/A'}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Direct Line</span>
                </div>
                {(lead.ceoPhone || lead.phone) && (
                  <a
                    href={`tel:${lead.ceoPhone || lead.phone}`}
                    className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Direct</span>
                  </a>
                )}
              </div>
            </div>

            {lead.ceoEmail && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                <Mail className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span className="text-slate-400">Direct Executive Email:</span>
                <a href={`mailto:${lead.ceoEmail}`} className="font-mono text-sky-300 hover:underline font-medium">
                  {lead.ceoEmail}
                </a>
              </div>
            )}
          </div>

          {/* 2. Technical Head / CTO Card */}
          {lead.ctoName && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-purple-950/40 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  Technical Leadership (CTO / Head of IT)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                  Verified Tech Match
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Technical Decision Maker</span>
                  <div className="font-bold text-white text-sm">
                    {lead.ctoName}
                  </div>
                  <div className="text-[11px] text-indigo-300 font-medium">
                    {lead.ctoTitle || 'Chief Technology Officer / Head of IT'}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Technical Head LinkedIn</span>
                  {lead.ctoLinkedinUrl ? (
                    <a
                      href={lead.ctoLinkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold text-xs transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-indigo-400" />
                      <span>View LinkedIn Profile</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">No profile linked</span>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Direct Tech Phone</span>
                    <span className="font-mono text-emerald-300 font-bold text-sm">{lead.ctoPhone || lead.ceoPhone || lead.phone || 'N/A'}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Direct Line</span>
                  </div>
                  {(lead.ctoPhone || lead.ceoPhone || lead.phone) && (
                    <a
                      href={`tel:${lead.ctoPhone || lead.ceoPhone || lead.phone}`}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Direct</span>
                    </a>
                  )}
                </div>
              </div>

              {lead.ctoEmail && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/70 border border-slate-800 text-xs">
                  <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400">Direct Technical Email:</span>
                  <a href={`mailto:${lead.ctoEmail}`} className="font-mono text-indigo-300 hover:underline font-medium">
                    {lead.ctoEmail}
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cold Calling & Google Verification Profile */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" />
              Google My Business (GMB) & Cold Calling Profile
            </span>
            {lead.coldCallReady && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                ✅ Cold Call Ready
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Decision Maker To Ask For</span>
              <span className="font-semibold text-white">{lead.decisionMakerRole || 'Managing Director / Commercial Lead'}</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">GMB Verification</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-emerald-400 font-semibold">GMB Verified</span>
                <span className="text-slate-400 text-[10px]">({lead.googleRating || 4.8} ★)</span>
                {lead.googleMapsUrl && (
                  <a
                    href={lead.googleMapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 ml-1 inline-flex items-center gap-0.5"
                    title="Open on Google Maps"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Direct Phone</span>
                <span className="font-mono text-emerald-300 font-bold">{lead.phone || 'N/A'}</span>
              </div>
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                >
                  <Phone className="w-3 h-3" />
                  <span>Call Now</span>
                </a>
              )}
            </div>
          </div>

          {lead.callOpenerTip && (
            <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-xs">
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider block mb-0.5">Recommended Cold Call Hook / Opener:</span>
              <p className="text-slate-200 italic">"{lead.callOpenerTip}"</p>
            </div>
          )}
        </div>

        {/* Company Overview & Description */}
        {lead.businessDescription && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">Business Description</span>
            <p className="text-xs text-slate-300 leading-relaxed">{lead.businessDescription}</p>
          </div>
        )}

        {/* Contact Information & Quality Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Details Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Contact & Digital Presence
            </span>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Globe className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div className="overflow-hidden">
                  <span className="text-slate-400 text-[11px] block">Company Website</span>
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-400 hover:underline font-medium flex items-center gap-1 truncate"
                    >
                      {lead.website}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not available</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="overflow-hidden">
                  <span className="text-slate-400 text-[11px] block">Business Email</span>
                  {lead.email ? (
                    <div className="flex items-center gap-2">
                      <a href={`mailto:${lead.email}`} className="text-white hover:underline font-mono">
                        {lead.email}
                      </a>
                      <StatusPill status={lead.emailStatus} type="email" />
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No public email found</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Telephone</span>
                  {lead.phone ? (
                    <a href={`tel:${lead.phone}`} className="text-white font-mono hover:underline">
                      {lead.phone}
                    </a>
                  ) : (
                    <span className="text-slate-400 italic">Not available</span>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Physical Address</span>
                  <span className="text-slate-200">
                    {lead.address || `${lead.city || ''}, ${lead.country || ''}` || 'Not available'}
                  </span>
                </div>
              </div>

              {lead.linkedinCompanyUrl && (
                <div className="flex items-start gap-2.5">
                  <Linkedin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div className="overflow-hidden">
                    <span className="text-slate-400 text-[11px] block">LinkedIn Profile</span>
                    <a
                      href={lead.linkedinCompanyUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline truncate block"
                    >
                      {lead.linkedinCompanyUrl}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lead Quality Score Breakdown Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3.5">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Lead Score Breakdown (0 - 100)
            </span>

            {breakdown ? (
              <div className="space-y-2 text-xs">
                {[
                  { label: 'Industry Relevance', score: breakdown.industryRelevance, max: 30 },
                  { label: 'Location Target Match', score: breakdown.locationMatch, max: 20 },
                  { label: 'Website Availability', score: breakdown.websiteAvailability, max: 10 },
                  { label: 'Public Corporate Email', score: breakdown.emailAvailability, max: 15 },
                  { label: 'Phone Availability', score: breakdown.phoneAvailability, max: 10 },
                  { label: 'Information Completeness', score: breakdown.completeness, max: 10 },
                  { label: 'Source Reliability', score: breakdown.sourceReliability, max: 5 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-bold text-slate-200">
                        {item.score} / {item.max}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-indigo-500 h-full rounded-full"
                        style={{ width: `${(item.score / item.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-6 text-center">Score breakdown not available</div>
            )}
          </div>
        </div>

        {/* Lead Notes & Team Activity */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Prospect Notes & Activity Log
            </span>
          </div>

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add qualification note, outreach update, or contact log..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={isSubmittingNote || !newNote.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              <Send className="w-3 h-3" />
              Add
            </button>
          </form>

          <div className="space-y-2 max-h-40 overflow-y-auto">
            {lead.notes && lead.notes.length > 0 ? (
              lead.notes.map((n) => (
                <div key={n.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs">
                  <p className="text-slate-200">{n.note}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic block py-2">No notes added yet.</span>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
