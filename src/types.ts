export interface SavedScript {
  data_id: string;
  type: 'script';
  name: string;
  createdAt: string;
  updatedAt: string;
  script: ScriptData;
}

export interface ObjectionCard {
  id: string;
  label: string;
  objectionLine: string;
  rebuttal: string;
  followUpQuestion: string;
  fallbackCta: string;
}

export type ScriptStyle = 'permission' | 'direct' | 'question-led' | 'referral' | 'value-first';

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
    referrerName: string;
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
  scriptStyle: 'permission',
  opener: { yourName: '', businessName: '', greetingStyle: 'professional', referrerName: '' },
  permissionAsk: { line: '' },
  reasonForCall: { why: '' },
  problem: { mainPain: '' },
  agitate: { consequence: '' },
  valueProp: { pitch: '' },
  qualifyingQuestion: { primary: '' },
  cta: { line: '' },
  objections: [],
  close: { positive: '', neutral: '' },
  afterCall: { ifYes: '', ifNo: '', notes: '' },
};

export const SCRIPT_STYLES: { value: ScriptStyle; label: string; hint: string }[] = [
  { value: 'permission', label: 'Permission-Based', hint: 'Ask for a moment of their time before pitching.' },
  { value: 'direct', label: 'Direct', hint: 'Get to the point fast — reason for the call up front.' },
  { value: 'question-led', label: 'Question-Led', hint: 'Open with a discovery question to get them talking.' },
  { value: 'referral', label: 'Referral', hint: 'Name-drop the person who referred you.' },
  { value: 'value-first', label: 'Value-First', hint: 'Lead with an insight, stat, or observation.' },
];

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
  "Just email me",
  "Call me back later",
];

export const PERMISSION_PRESETS = [
  "Did I catch you at a bad time?",
  "Got 30 seconds for why I'm calling?",
  "Mind if I take 20 seconds to explain why I'm calling?",
];

export const REASON_PRESETS = [
  "I'm calling because we help [type of business] with [specific outcome].",
  "Reaching out because we just helped a business like yours [result]. Figured it was worth a quick call.",
  "I'm calling because we work with [type of business] on [what you do]. Wanted to see if it's worth a conversation.",
];

export const PROBLEM_PRESETS = [
  "Most [businesses] I work with are stuck doing [problem] by hand.",
  "[Role]s keep telling me [pain point] is still broken and they haven't found a fix.",
  "[Target] keep telling me [problem] is costing them every month.",
];

export const AGITATE_PRESETS = [
  "If that keeps going, it's thousands in missed work every month.",
  "The longer it sits, the more customers go to whoever fixes it first.",
  "Your team ends up working around it instead of on real work.",
];

export const VALUE_PROP_PRESETS = [
  "We help [target] [solve problem] so they can [positive outcome], usually inside [timeframe].",
  "We handle [what you do] end to end. Clients usually see [result].",
  "We do [differentiator] instead of [alternative], so you get [benefit] without [common drawback].",
];

export const QUESTION_PRESETS = [
  "How are you handling [thing] right now?",
  "What's your biggest frustration with [area] right now?",
  "When was the last time you looked at [solution/process]?",
  "If [problem] just went away, what would that be worth?",
];

export const CTA_PRESETS = [
  "Got 15 minutes this week to see if we can help?",
  "Can I send a short summary you can read when you have a sec?",
  "Want a 10-minute walkthrough?",
];

export const CLOSE_YES_PRESETS = [
  "Great. Sending a calendar link now so you can pick a time.",
  "Perfect. I'll email you the details and a time.",
];

export const CLOSE_NO_PRESETS = [
  "No worries. Mind if I check back in a few months?",
  "Totally understand. Have a good one.",
];

// ---------- Industry Templates ----------

export interface IndustryTemplate {
  id: string;
  label: string;
  emoji: string;
  // Optional prompt for an extra parameter to ask the user before applying
  // (e.g. consulting asks "what kind of consulting?"). Token in fill strings
  // is {{param}} and gets replaced at apply-time.
  paramPrompt?: {
    label: string;
    placeholder: string;
    defaultValue: string;
  };
  // Fills everything except opener.yourName / businessName / referrerName
  fill: Partial<Omit<ScriptData, 'scriptStyle' | 'opener' | 'objections' | 'afterCall'>> & {
    objections?: Omit<ObjectionCard, 'id'>[];
    afterCall?: Partial<AfterCallData>;
  };
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: 'home-services',
    label: 'Home Services',
    emoji: '🏠',
    paramPrompt: {
      label: 'What service do you offer?',
      placeholder: 'e.g. HVAC tune-ups, fall cleanup, drain cleaning',
      defaultValue: 'HVAC service',
    },
    fill: {
      reasonForCall: { why: "I'm reaching out because we do {{param}} in the area and I wanted to see if that's something you'd want on your radar." },
      problem: { mainPain: "A lot of people don't think about {{param}} until something's already gone wrong and they need someone same-day." },
      agitate: { consequence: "By then the options are whoever can show up, not whoever does the best work." },
      valueProp: { pitch: "We keep a short list of homes and properties we check in with before the season hits, so you're not making the call when it's already too late." },
      qualifyingQuestion: { primary: "When was the last time anyone looked at {{param}} for you?" },
      cta: { line: "Got a few minutes to set up a time for us to come out?" },
      objections: [
        { label: 'Not interested', objectionLine: "Not interested.", rebuttal: "Fair enough. Mind if I ask, is it that you've got someone already, or just not on your mind right now?", followUpQuestion: "", fallbackCta: "" },
        { label: 'We already have someone', objectionLine: "We already have someone.", rebuttal: "Makes sense. I won't try to replace them. If they're ever not available, want me on your phone as a backup?", followUpQuestion: "", fallbackCta: "" },
      ],
      close: { positive: "Great, I'll text you a couple of times that work.", neutral: "No problem. I'll check back before the season changes." },
    },
  },
  {
    id: 'personal-services',
    label: 'Personal Services',
    emoji: '💇',
    paramPrompt: {
      label: 'What do you do?',
      placeholder: 'e.g. dog grooming, mobile detailing, massage',
      defaultValue: 'grooming',
    },
    fill: {
      reasonForCall: { why: "I'm reaching out because I do {{param}} and I had an opening come up I thought you might want." },
      problem: { mainPain: "Most people I work with had a great person once and then lost them, and finding a new one is a hassle." },
      agitate: { consequence: "So they end up putting it off until it's been way too long." },
      valueProp: { pitch: "I keep a small regular book so my clients don't have to think about rebooking. You get a slot, a reminder, and you're on the calendar." },
      qualifyingQuestion: { primary: "When was the last time you had {{param}} done?" },
      cta: { line: "Want me to hold a time for you this week?" },
      objections: [
        { label: 'We already have someone', objectionLine: "I already have someone.", rebuttal: "Got it. If you're ever in a pinch, want me in your phone as backup?", followUpQuestion: "", fallbackCta: "" },
        { label: 'Send me info', objectionLine: "Just email me.", rebuttal: "Sure. What's the best email? And real quick, are you local to [area]?", followUpQuestion: "", fallbackCta: "" },
      ],
      close: { positive: "Great, sending the booking link now.", neutral: "No worries. I'll check back in a bit." },
    },
  },
  {
    id: 'wellness-clinical',
    label: 'Wellness & Clinical',
    emoji: '🩺',
    paramPrompt: {
      label: 'What kind of visit?',
      placeholder: 'e.g. cleaning, follow-up, annual exam',
      defaultValue: 'a follow-up visit',
    },
    fill: {
      reasonForCall: { why: "I'm calling from [your practice] because it's been a while since we've seen you and I wanted to check in." },
      problem: { mainPain: "Life gets busy and {{param}} is usually the first thing that slides." },
      agitate: { consequence: "The longer it's put off, the more likely something small turns into something that wasn't small anymore." },
      valueProp: { pitch: "We've got openings in the next couple of weeks and I can hold a time for you right now over the phone." },
      qualifyingQuestion: { primary: "Do you know roughly when you were last in?" },
      cta: { line: "Want me to pull up the calendar and find you a time?" },
      objections: [
        { label: 'Too busy right now', objectionLine: "I'm too busy right now.", rebuttal: "Understood. Want me to send a link so you can pick a time yourself when you've got a minute?", followUpQuestion: "", fallbackCta: "" },
        { label: 'Call me back later', objectionLine: "I'll call you back.", rebuttal: "Sounds good. If it helps, I can hold a tentative time now and you can move it later.", followUpQuestion: "", fallbackCta: "" },
      ],
      close: { positive: "Great, you're on the calendar. You'll get a reminder the day before.", neutral: "No problem. I'll follow up by text so you've got my number." },
    },
  },
  {
    id: 'creative-event',
    label: 'Creative & Event',
    emoji: '🎉',
    paramPrompt: {
      label: 'What do you do?',
      placeholder: 'e.g. wedding planning, interior design, event photography',
      defaultValue: 'event planning',
    },
    fill: {
      reasonForCall: { why: "I'm reaching out because I do {{param}} and I'm building out a short list of vendors and venues to work with regularly. Wanted to see if that's a conversation worth having." },
      problem: { mainPain: "Most planners I know are always hunting for reliable people to hand off pieces of an event to." },
      agitate: { consequence: "And when a vendor flakes the week of, there's not a lot of time to find a replacement." },
      valueProp: { pitch: "What I'm trying to do is build a short list I can trust, so when I've got an event coming up, I know who to call first." },
      qualifyingQuestion: { primary: "How are you usually finding new vendor partnerships right now?" },
      cta: { line: "Got 15 minutes this week to see if we'd be a fit to work together?" },
      objections: [
        { label: 'Send me info', objectionLine: "Just send me info.", rebuttal: "Happy to. A couple of quick questions first so I send the right thing: what kind of events do you usually work, and what's the best email?", followUpQuestion: "", fallbackCta: "" },
        { label: 'Not interested', objectionLine: "We're not taking on new partners.", rebuttal: "Makes sense. Mind if I check back in a few months in case that changes?", followUpQuestion: "", fallbackCta: "" },
      ],
      close: { positive: "Great, sending a calendar link now.", neutral: "All good. I'll check back in a couple of months." },
    },
  },
  {
    id: 'professional-creative-services',
    label: 'Professional & Creative Services',
    emoji: '💼',
    paramPrompt: {
      label: 'What do you help businesses with?',
      placeholder: 'e.g. getting off spreadsheets, custom web apps, operations cleanup',
      defaultValue: 'getting off spreadsheets and into real systems',
    },
    fill: {
      reasonForCall: { why: "I help small businesses with {{param}}. Wanted to see if that's worth a short conversation." },
      problem: { mainPain: "Most of the businesses that reach out to me are comfortable using spreadsheets, but can't deny it's annoying that nothing's automated. When you need one small piece of information, someone has to stop and go hunting for it." },
      agitate: { consequence: "It breaks the flow of your work. Looking through spreadsheets in bulk or trying to find the right keywords to pull up what you need is slow and a little brain-draining. That's not what you went into business to do." },
      valueProp: { pitch: "The way this works is I look at how your business actually runs day-to-day, what systems you're already using, and see if any of them should be talking to each other. Sometimes it's that you've outgrown what you've got, not in price, just that it's time for something more seamless so you're not stuck in the back office." },
      qualifyingQuestion: { primary: "What's something manual in your business that you wish wasn't manual?" },
      cta: { line: "Worth a quick call to take a look?" },
      objections: [
        { label: 'No budget', objectionLine: "We don't have budget for a consultant right now.", rebuttal: "That's fair. The first call's free and I won't push a proposal. Worst case you get a couple of ideas you can run yourself.", followUpQuestion: "", fallbackCta: "" },
        { label: 'Not interested', objectionLine: "We're not looking for that right now.", rebuttal: "Got it. Can I ask, is it that things are running fine, or just not on your mind right now?", followUpQuestion: "", fallbackCta: "If anything changes, I'll check back in." },
        { label: 'Send me info', objectionLine: "Just send me some info.", rebuttal: "Happy to. Two quick questions first so I send the right thing: what's the biggest headache in the business right now, and what's the best email?", followUpQuestion: "", fallbackCta: "" },
      ],
      close: { positive: "Great. I'll text you a calendar link so you can pick a time.", neutral: "No problem. Thanks for picking up. Have a good one." },
    },
  },
];
