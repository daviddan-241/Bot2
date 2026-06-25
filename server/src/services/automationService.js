import { searchBusinesses } from './searchService.js';
import { createLead, listLeads } from './leadService.js';
import { generateText } from './aiService.js';
import { createCampaign, addLeadsToCampaign } from './campaignService.js';
import { bulkEmail } from './emailService.js';
import { db } from '../db/database.js';
import { sleep, nowIso } from '../utils/time.js';

function parseCommand(command) {
  const lower = command.toLowerCase();

  const numberMatch = lower.match(/\b(\d+)\b/);
  const limit = numberMatch ? Math.min(Number(numberMatch[1]), 25) : 10;

  const locationPatterns = [
    /\bin\s+([\w\s,]+?)(?:\s+(?:that|who|with|for|needing|ready|urgently|now|and|,|$))/i,
    /\bfrom\s+([\w\s,]+?)(?:\s+(?:that|who|with|for|,|$))/i,
    /\b([\w\s]+(?:city|town|district|state|country|california|texas|florida|new york|london|dubai|lagos|nairobi|accra|toronto|sydney|singapore|mumbai|delhi|cairo|johannesburg|cape town)[\w\s,]*)/i,
  ];
  let location = 'worldwide';
  for (const pat of locationPatterns) {
    const m = command.match(pat);
    if (m) { location = m[1].trim(); break; }
  }

  const nichePatterns = [
    /\b(restaurants?|cafes?|dental clinics?|dentists?|hospitals?|schools?|gyms?|salons?|barbershops?|hotels?|law firms?|accountants?|real estate|agents?|plumbers?|electricians?|contractors?|startups?|agencies?|stores?|shops?|clinics?|pharmacies?|vets?|tutors?|coaches?|consultants?|photographers?|designers?|developers?|marketing agencies?|tech companies?|software companies?)\b/i,
    /\bfind\s+(?:\d+\s+)?(.+?)\s+(?:in\s|from\s|that\s|who\s|needing\s|,)/i,
  ];
  let niche = 'businesses';
  for (const pat of nichePatterns) {
    const m = command.match(pat);
    if (m) { niche = m[1].trim(); break; }
  }

  const urgentSignals = ['urgent', 'urgently', 'need', 'needs', 'ready', 'hot', 'now', 'immediately', 'asap'];
  const urgencyMode = urgentSignals.some(s => lower.includes(s));

  const campaignSignals = ['campaign', 'outreach', 'email', 'send', 'contact', 'reach', 'message', 'email them'];
  const shouldCreateCampaign = campaignSignals.some(s => lower.includes(s));

  const proposalSignals = ['proposal', 'proposals', 'generate proposal', 'proposal for all', 'proposal for each', 'write proposal'];
  const shouldGenerateProposals = proposalSignals.some(s => lower.includes(s));

  const sendSignals = ['send', 'email them', 'send now', 'send email', 'email all', 'email them all'];
  const shouldSendEmails = sendSignals.some(s => lower.includes(s));

  const fundingSignals = ['investor', 'investors', 'vc', 'venture capital', 'angel investor', 'seed', 'funding', 'fundraise', 'fundraising', 'pitch', 'raise money', 'raise capital', 'backed startup', 'recently funded', 'funded startup'];
  const isFundingSearch = fundingSignals.some(s => lower.includes(s));
  if (isFundingSearch) {
    const investorNicheMap = { vc: 'venture capital firms', angel: 'angel investors', seed: 'seed stage investors', default: 'investors and venture capitalists' };
    const resolvedNiche = lower.includes('angel') ? investorNicheMap.angel : lower.includes('seed') ? investorNicheMap.seed : lower.includes('vc') ? investorNicheMap.vc : investorNicheMap.default;
    return { niche: resolvedNiche, location, limit, urgencyMode, shouldCreateCampaign: true, shouldGenerateProposals: true, shouldSendEmails, isFundingSearch: true };
  }

  return { niche, location, limit, urgencyMode, shouldCreateCampaign, shouldGenerateProposals, shouldSendEmails, isFundingSearch: false };
}

async function generateProposalForLead(userId, lead, userContext = '') {
  const ctx = userContext ? `The salesperson works in: ${userContext}.` : '';
  const prompt = `${ctx}
Write a short, personalized business proposal (3-4 paragraphs) for this potential client:

Business: ${lead.company || lead.name}
Location: ${lead.location || 'Unknown'}
Website: ${lead.website || 'None'}
Industry: ${lead.industry || 'Unknown'}
AI Score: ${lead.score_label || 'Unscored'}

The proposal should:
1. Address a specific pain point their business likely has
2. Briefly describe the solution/service being offered
3. Give 2-3 concrete benefits
4. End with a clear call to action

Keep it concise and professional. Do NOT use placeholder text.`;

  try {
    const { text } = await generateText(prompt, 'You are a professional business proposal writer.', userId);
    return text;
  } catch {
    return `Dear ${lead.company || lead.name},\n\nWe noticed your business and believe we can help you grow. Our services are designed to address the challenges facing businesses like yours.\n\nWe'd love to schedule a quick 15-minute call to discuss how we can help. Please reply to this email or book a time at your convenience.\n\nBest regards`;
  }
}

export async function runAutoPipeline(userId, command, userContext = '') {
  const { niche, location, limit, urgencyMode, shouldCreateCampaign, shouldGenerateProposals, shouldSendEmails } = parseCommand(command);

  const results = {
    leadsFound: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0,
    campaignName: null, campaignId: null,
    emailsQueued: 0, emailsSent: 0,
    proposalsGenerated: 0,
    errors: []
  };

  let found = [];
  try {
    found = await searchBusinesses({ userId, niche, location, industry: niche, limit });
  } catch (err) {
    results.errors.push(`Search: ${err.message}`);
  }

  if (!found.length) {
    return {
      ...results,
      message: `I searched for "${niche}" in "${location}" but found no results. This usually means no search API keys are configured. Go to Settings → Lead Discovery to add a free Serper or Brave API key.`
    };
  }

  const savedLeads = [];
  for (const item of found) {
    try {
      const lead = await createLead(userId, {
        name: item.name || item.title,
        company: item.name || item.title,
        website: item.website || item.url,
        email: item.email,
        phone: item.phone,
        location: item.address || location,
        industry: item.industryHint || niche,
        source: `auto-pipeline:${item.provider || 'search'}`,
        rawText: item.snippet || '',
      }, { score: true, analyze: false });
      savedLeads.push(lead);
      if (lead.score_label === 'Hot') results.hotLeads++;
      else if (lead.score_label === 'Warm') results.warmLeads++;
      else results.coldLeads++;
      await sleep(150);
    } catch (err) {
      results.errors.push(`Lead save: ${err.message}`);
    }
  }
  results.leadsFound = savedLeads.length;

  if (shouldGenerateProposals && savedLeads.length > 0) {
    for (const lead of savedLeads.slice(0, 10)) {
      try {
        const proposal = await generateProposalForLead(userId, lead, userContext);
        db.prepare(`UPDATE leads SET notes = ? WHERE id = ? AND user_id = ?`)
          .run(`[AUTO PROPOSAL]\n\n${proposal}`, lead.id, userId);
        results.proposalsGenerated++;
        await sleep(300);
      } catch (err) {
        results.errors.push(`Proposal: ${err.message}`);
      }
    }
  }

  if ((shouldCreateCampaign || shouldSendEmails) && savedLeads.length > 0) {
    try {
      const campaignName = `${niche} in ${location} — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      const hotAndWarm = savedLeads.filter(l => l.score_label === 'Hot' || l.score_label === 'Warm');
      const campaignLeads = hotAndWarm.length > 0 ? hotAndWarm : savedLeads.slice(0, 5);

      const subjectLine = userContext
        ? `Quick question about your ${niche} business`
        : `A quick opportunity for ${niche} in ${location}`;

      const template = userContext
        ? `Hi {{name}},\n\nI came across {{company}} while looking for ${niche} in ${location}.\n\nWe specialize in ${userContext} and I believe we could genuinely help your business.\n\nWould you be open to a quick 10-minute call this week?\n\nBest regards`
        : `Hi {{name}},\n\nI found {{company}} while searching for ${niche} in ${location} and thought you might be a great fit for our services.\n\nWould you be open to a quick conversation this week?\n\nBest regards`;

      const campaign = createCampaign(userId, {
        name: campaignName,
        channel: 'email',
        tone: urgencyMode ? 'urgent' : 'friendly',
        subject: subjectLine,
        template,
      });
      results.campaignName = campaignName;
      results.campaignId = campaign.id;

      await addLeadsToCampaign(userId, campaign.id, campaignLeads.map(l => l.id));
      results.emailsQueued = campaignLeads.length;

      if (shouldSendEmails) {
        const leadsWithEmail = campaignLeads.filter(l => l.email);
        if (leadsWithEmail.length > 0) {
          const emailResults = await bulkEmail({
            userId,
            leads: leadsWithEmail,
            subject: subjectLine,
            campaignId: campaign.id,
            messageFactory: async (lead) => {
              const body = template
                .replace(/\{\{name\}\}/g, lead.name || lead.company || 'there')
                .replace(/\{\{company\}\}/g, lead.company || lead.name || 'your business');
              return { text: body, subject: subjectLine };
            },
            delayMs: 2000,
          });
          results.emailsSent = emailResults.filter(r => r.status === 'sent').length;
        }
      }
    } catch (err) {
      results.errors.push(`Campaign: ${err.message}`);
    }
  }

  return results;
}

export async function checkFollowUps(userId, userContext = '') {
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

  const staleEmails = db.prepare(`
    SELECT el.id, el.to_email, el.subject, el.lead_id, l.name, l.company
    FROM email_logs el
    LEFT JOIN leads l ON l.id = el.lead_id AND l.user_id = el.user_id
    WHERE el.user_id = ? AND el.status = 'sent' AND el.sent_at < ?
    AND el.lead_id NOT IN (
      SELECT DISTINCT lead_id FROM email_logs
      WHERE user_id = ? AND subject LIKE 'Follow-up:%' AND status = 'sent'
    )
    LIMIT 20
  `).all(userId, threeDaysAgo, userId);

  if (!staleEmails.length) {
    return { followUps: 0, message: 'No follow-ups needed — all recent emails are within 3 days or already followed up.' };
  }

  const leads = staleEmails.filter(e => e.to_email).slice(0, 10);
  let sent = 0;

  for (const entry of leads) {
    try {
      const ctx = userContext ? `The sender works in: ${userContext}.` : '';
      const prompt = `${ctx}\nWrite a short, friendly follow-up email (2-3 sentences) to someone who didn't reply to an initial outreach. Original subject: "${entry.subject}". Recipient: ${entry.company || entry.name || entry.to_email}. Keep it brief and warm. Just the email body, no subject line.`;
      const { text } = await generateText(prompt, 'You are a professional email writer.', userId);

      const result = await bulkEmail({
        userId,
        leads: [{ id: entry.lead_id, email: entry.to_email, name: entry.name, company: entry.company }],
        subject: `Follow-up: ${entry.subject}`,
        messageFactory: async () => ({ text, subject: `Follow-up: ${entry.subject}` }),
        delayMs: 1500,
      });
      if (result[0]?.status === 'sent') sent++;
      await sleep(500);
    } catch {}
  }

  return {
    followUps: sent,
    message: sent > 0
      ? `✅ Sent ${sent} follow-up emails to leads who hadn't replied in 3+ days.`
      : `Found ${leads.length} leads needing follow-up but email is not connected. Set up email in Settings → Email to send automatically.`
  };
}

export function buildPipelineMessage(command, results, userContext = '') {
  const { leadsFound, hotLeads, warmLeads, coldLeads, campaignName, emailsQueued, emailsSent, proposalsGenerated, errors } = results;

  if (!leadsFound) {
    return results.message || `No leads found. Make sure a search API key is configured in Settings → Lead Discovery.`;
  }

  const lines = [];
  lines.push(`✅ Found ${leadsFound} real businesses.`);
  lines.push('');
  lines.push(`🔥 ${hotLeads} Hot  ·  🌡️ ${warmLeads} Warm  ·  ❄️ ${coldLeads} Cold`);

  if (proposalsGenerated > 0) {
    lines.push('');
    lines.push(`📝 Generated ${proposalsGenerated} custom proposals — saved to each lead's notes.`);
  }

  if (campaignName) {
    lines.push('');
    lines.push(`📧 Campaign "${campaignName}" created.`);
    if (emailsSent > 0) {
      lines.push(`✉️  ${emailsSent} emails sent right now.`);
    } else if (emailsQueued > 0) {
      lines.push(`${emailsQueued} emails queued. Connect Gmail in Settings → Email to send them.`);
    }
  } else {
    lines.push('');
    lines.push(`💡 Say "create a campaign and send emails" to auto-contact all hot leads.`);
  }

  if (hotLeads > 0) {
    lines.push('');
    lines.push(`🎯 Focus on your ${hotLeads} hot lead${hotLeads > 1 ? 's' : ''} — they're most likely to convert!`);
  }

  if (errors.length > 0 && errors.length < 3) {
    lines.push('');
    lines.push(`⚠️ ${errors[0]}`);
  }

  return lines.join('\n');
}
