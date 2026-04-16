export interface ObjectionCard {
  id: string;
  label: string;
  objectionLine: string;
  rebuttal: string;
  followUpQuestion: string;
  fallbackCta: string;
}

export interface ScriptData {
  opener: {
    yourName: string;
    businessName: string;
    prospectName: string;
    greetingStyle: string;
  };
  permissionAsk: {
    line: string;
  };
  reasonForCall: {
    why: string;
    targetType: string;
    contextLine: string;
  };
  problem: {
    mainPain: string;
    secondaryPain: string;
    frustration: string;
    summary: string;
  };
  agitate: {
    causes: string;
    slowsDown: string;
    expensive: string;
  };
  valueProp: {
    service: string;
    mainBenefit: string;
    secondaryBenefit: string;
    differentiator: string;
    proof: string;
  };
  qualifyingQuestion: {
    primary: string;
    secondary: string;
  };
  cta: {
    type: string;
    line: string;
    alternative: string;
  };
  objections: ObjectionCard[];
  close: {
    positive: string;
    neutral: string;
  };
}

export const DEFAULT_SCRIPT_DATA: ScriptData = {
  opener: { yourName: '', businessName: '', prospectName: '', greetingStyle: 'professional' },
  permissionAsk: { line: '' },
  reasonForCall: { why: '', targetType: '', contextLine: '' },
  problem: { mainPain: '', secondaryPain: '', frustration: '', summary: '' },
  agitate: { causes: '', slowsDown: '', expensive: '' },
  valueProp: { service: '', mainBenefit: '', secondaryBenefit: '', differentiator: '', proof: '' },
  qualifyingQuestion: { primary: '', secondary: '' },
  cta: { type: 'book_call', line: '', alternative: '' },
  objections: [],
  close: { positive: '', neutral: '' },
};

export const CTA_TYPES = [
  { value: 'book_call', label: 'Book a Call' },
  { value: 'send_info', label: 'Send Info' },
  { value: 'schedule_demo', label: 'Schedule Demo' },
  { value: 'follow_up', label: 'Quick Follow-up Later This Week' },
];

export const OBJECTION_PRESETS = [
  'Not interested',
  'Send me info',
  'We already have someone',
  'No budget',
  'Too busy right now',
];

export const GREETING_STYLES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'warm', label: 'Warm & Friendly' },
  { value: 'direct', label: 'Direct' },
];
