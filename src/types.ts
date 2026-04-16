export interface ObjectionCard {
  id: string;
  label: string;
  objectionLine: string;
  rebuttal: string;
  followUpQuestion: string;
  fallbackCta: string;
}

export type ScriptStyle = 'permission' | 'direct' | 'question-led';

export interface AfterCallData {
  ifYes: string;
  ifNo: string;
  notes: string;
}

export interface ScriptData {
  scriptStyle: ScriptStyle;
  opener: {
    yourName: string;
    businessName: string;
    greetingStyle: string;
  };
  permissionAsk: {
    line: string;
  };
  reasonForCall: {
    why: string;
  };
  problem: {
    mainPain: string;
  };
  agitate: {
    consequence: string;
  };
  valueProp: {
    pitch: string;
  };
  qualifyingQuestion: {
    primary: string;
  };
  cta: {
    line: string;
  };
  objections: ObjectionCard[];
  close: {
    positive: string;
    neutral: string;
  };
  afterCall: AfterCallData;
}

export const DEFAULT_SCRIPT_DATA: ScriptData = {
  opener: { yourName: '', businessName: '', greetingStyle: 'professional' },
  permissionAsk: { line: '' },
  reasonForCall: { why: '' },
  problem: { mainPain: '' },
  agitate: { consequence: '' },
  valueProp: { pitch: '' },
  qualifyingQuestion: { primary: '' },
  cta: { line: '' },
  objections: [],
  close: { positive: '', neutral: '' },
};

export const GREETING_STYLES = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'warm', label: 'Warm & Friendly' },
  { value: 'direct', label: 'Direct' },
];

export const OBJECTION_PRESETS = [
  'Not interested',
  'Send me info',
  'We already have someone',
  'No budget',
  'Too busy right now',
];

export const PERMISSION_PRESETS = [
  "Did I catch you at a bad time?",
  "Do you have 30 seconds so I can tell you why I called?",
  "I know you're busy — mind if I take 20 seconds to explain why I'm calling?",
];

export const PROBLEM_PRESETS = [
  "Most [businesses] I talk to are struggling with [problem] and spending too much time on it manually.",
  "A lot of [role]s tell me they're frustrated with [pain point] and don't have a reliable solution yet.",
  "I keep hearing from [target] that [problem] is costing them time and money every month.",
];

export const CTA_PRESETS = [
  "Would you be open to a quick 15-minute call this week to see if we can help?",
  "Can I send you a short summary so you can take a look when it's convenient?",
  "What if I showed you how it works in a quick 10-minute demo?",
];
