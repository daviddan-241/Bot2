import { searchBusinesses } from './searchService.js';
import { createLead, listLeads } from './leadService.js';
import { scoreLead, generateText } from './aiService.js';
import { createCampaign, addLeadsToCampaign } from './campaignService.js';
import { db } from '../db/database.js';
import { sleep } from '../utils/time.js';

function parseCommand(command) {
  const lower = command.toLowerCase();

  const numberMatch = lower.match(/\b(\d+)\b/);
  const limit = numberMatch ? Math.min(Number(numberMatch[1]), 25) : 10;

  const locationPatterns = [
    /\bin\s+([\w\s,]+?)(?:\s+(?:that|who|with|for|needing|ready|urgently|now|and|$))/i,
    /\bfrom\s+([\w\s,]+?)(?:\s+(?:that|who|with|for|$))/i,
    /\b([\w\s]+(?:city|town|district|state|country|lagos|london|dubai|nairobi|accra|new york|los angeles|chicago|houston|phoenix|san francisco|toronto|sydney|singapore|mumbai|delhi|cairo|johannesburg|cape town)[\w\s,]*)/i,
  ];
  let location = 'worldwide';
  for (const pat of locationPatterns) {
    const m = command.match(pat);
    if (m) { location = m[1].trim(); break; }
  }

  const nichePatterns = [
    /\b(restaurants?|cafes?|dental clinics?|dentists?|hospitals?|schools?|gyms?|salons?|barbershops?|hotels?|law firms?|accountants?|real estate|agents?|plumbers?|electricians?|contractors?|startups?|agencies?|stores?|shops?|clinics?|pharmacies?|veterinarians?|tutors?|coaches?|consultants?|freelancers?|photographers?|designers?|developers?|marketing agencies?|tech companies?|software companies?)\b/i,
    /\bfind\s+(?:\d+\s+)?(.+?)\s+(?:in\s|from\s|that\s|who\s)/i,
  ];
  let niche = 'businesses';
  for (const pat of nichePatterns) {
    const m = command.match(pat);
    if (m) { niche = m[1].trim(); break; }
  }

  const urgentSignals = ['urgent', 'urgently', 'need', 'needs', 'ready', 'hot', 'now', 'immediately', 'asap'];
  const urgencyMode = urgentSignals.some(s => lower.includes(s));

  const createCampaignSignal = ['campaign', 'outreach', 'email', 'send', 'contact', 'reach', 'message'];
  const shouldCreateCampaign = createCampaignSignal.some(s => lower.includes(s));

  return { niche, location, limit, urgencyMode, shouldCreateCampaign };
}

export async function runAutoPipeline(userId, command) {
  const { niche, location, limit, urgencyMode, shouldCreateCampaign } = parseCommand(command);

  const results = { leadsFound: 0, hotLeads: 0, warmLeads: 0, coldLeads: 0, campaignName: null, campaignId: null, emailsQueued: 0, errors: [] };

  let found = [];
  try {
    found = await searchBusinesses({ userId, niche, location, industry: niche, limit });
  } catch (err) {
    results.errors.push(`Search: ${err.message}`);
    found = [];
  }

  if (!found.length) {
    return {
      ...results,
      message: `I searched for "${niche}" in "${location}" but found no results. This usually means no search API keys are configured. Go to Settings → Lead Discovery to add a free Serper or Brave API key.`
    };
  }

  const savedLeadIds = [];
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
      savedLeadIds.push(lead.id);
      if (lead.score_label === 'Hot') results.hotLeads++;
      else if (lead.score_label === 'Warm') results.warmLeads++;
      else results.coldLeads++;
      await sleep(200);
    } catch (err) {
      results.errors.push(`Lead save: ${err.message}`);
    }
  }

  results.leadsFound = savedLeadIds.length;

  if (shouldCreateCampaign && savedLeadIds.length > 0) {
    try {
      const campaignName = `${niche} in ${location} — Auto ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      const hotAndWarmIds = [];
      for (const id of savedLeadIds) {
        const lead = db.prepare('SELECT id, score_label FROM leads WHERE user_id = ? AND id = ?').get(userId, id);
        if (lead && (lead.score_label === 'Hot' || lead.score_label === 'Warm')) hotAndWarmIds.push(id);
      }
      const campaign = createCampaign(userId, {
        name: campaignName,
        channel: 'email',
        tone: urgencyMode ? 'urgent' : 'friendly',
        subject: `Quick question about ${niche} — ${location}`,
        template: `Hi {{name}},\n\nI came across {{company}} and noticed you might benefit from our services.\n\nWould you be open to a quick 10-minute call this week?\n\nBest,`,
      });
      results.campaignName = campaignName;
      results.campaignId = campaign.id;
      if (hotAndWarmIds.length > 0) {
        await addLeadsToCampaign(userId, campaign.id, hotAndWarmIds);
        results.emailsQueued = hotAndWarmIds.length;
      } else {
        await addLeadsToCampaign(userId, campaign.id, savedLeadIds.slice(0, 5));
        results.emailsQueued = Math.min(5, savedLeadIds.length);
      }
    } catch (err) {
      results.errors.push(`Campaign: ${err.message}`);
    }
  }

  return results;
}

export function buildPipelineMessage(command, results) {
  const { leadsFound, hotLeads, warmLeads, coldLeads, campaignName, emailsQueued, errors } = results;

  if (!leadsFound) {
    return results.message || `No leads found. Make sure a search API key is configured in Settings.`;
  }

  const lines = [];
  lines.push(`✅ Found ${leadsFound} real businesses.`);
  lines.push('');
  lines.push(`🔥 ${hotLeads} Hot  ·  🌡️ ${warmLeads} Warm  ·  ❄️ ${coldLeads} Cold`);
  lines.push('');

  if (campaignName) {
    lines.push(`📧 Campaign "${campaignName}" created.`);
    if (emailsQueued > 0) lines.push(`${emailsQueued} emails queued (hot + warm leads). Connect Gmail in Settings → Email to send them.`);
  } else {
    lines.push(`💡 Say "create a campaign" to auto-email all hot leads.`);
  }

  if (hotLeads > 0) {
    lines.push('');
    lines.push(`Contact your hot leads now — they're most likely to respond!`);
  }

  if (errors.length > 0 && errors.length < 3) {
    lines.push('');
    lines.push(`⚠️ ${errors[0]}`);
  }

  return lines.join('\n');
}
