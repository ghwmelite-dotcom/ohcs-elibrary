// ============================================================================
// Research Export Service
// Generates structured markdown/HTML exports from research project data
// ============================================================================

export interface ExportOptions {
  exportType: 'markdown' | 'html' | 'pdf' | 'docx' | 'latex' | 'bibtex';
  formatStyle: 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'custom';
  contentSections: string[];
  includeCitations: boolean;
  includeAppendices: boolean;
}

export interface ProjectData {
  project: any;
  notes: any[];
  citations: any[];
  insights: any[];
  briefs: any[];
  literature: any[];
  milestones: any[];
}

/**
 * Format a single citation according to the specified style
 */
export function formatCitation(citation: any, style: string): string {
  const authors = citation.authors || citation.external_authors || 'Unknown';
  const year = citation.year || citation.publication_year || 'n.d.';
  const title = citation.title || citation.external_title || 'Untitled';
  const journal = citation.journal || citation.source || '';
  const volume = citation.volume || '';
  const issue = citation.issue || '';
  const pages = citation.pages || '';
  const doi = citation.doi || '';
  const publisher = citation.publisher || '';
  const url = citation.url || '';

  switch (style) {
    case 'apa':
      return formatAPA(authors, year, title, journal, volume, issue, pages, doi);
    case 'mla':
      return formatMLA(authors, title, journal, volume, issue, year, pages, url);
    case 'chicago':
      return formatChicago(authors, title, journal, volume, issue, year, pages, doi);
    case 'harvard':
      return formatHarvard(authors, year, title, journal, volume, issue, pages, doi);
    case 'ieee':
      return formatIEEE(authors, title, journal, volume, issue, pages, year, doi);
    default:
      return `${authors} (${year}). ${title}. ${journal}${volume ? `, ${volume}` : ''}${issue ? `(${issue})` : ''}${pages ? `, ${pages}` : ''}.`;
  }
}

function formatAPA(authors: string, year: string, title: string, journal: string, volume: string, issue: string, pages: string, doi: string): string {
  let ref = `${authors} (${year}). ${title}.`;
  if (journal) {
    ref += ` *${journal}*`;
    if (volume) ref += `, *${volume}*`;
    if (issue) ref += `(${issue})`;
    if (pages) ref += `, ${pages}`;
    ref += '.';
  }
  if (doi) ref += ` https://doi.org/${doi}`;
  return ref;
}

function formatMLA(authors: string, title: string, journal: string, volume: string, issue: string, year: string, pages: string, url: string): string {
  let ref = `${authors}. "${title}."`;
  if (journal) {
    ref += ` *${journal}*`;
    if (volume) ref += `, vol. ${volume}`;
    if (issue) ref += `, no. ${issue}`;
    ref += `, ${year}`;
    if (pages) ref += `, pp. ${pages}`;
    ref += '.';
  }
  if (url) ref += ` ${url}`;
  return ref;
}

function formatChicago(authors: string, title: string, journal: string, volume: string, issue: string, year: string, pages: string, doi: string): string {
  let ref = `${authors}. "${title}."`;
  if (journal) {
    ref += ` *${journal}* ${volume}`;
    if (issue) ref += `, no. ${issue}`;
    ref += ` (${year})`;
    if (pages) ref += `: ${pages}`;
    ref += '.';
  }
  if (doi) ref += ` https://doi.org/${doi}`;
  return ref;
}

function formatHarvard(authors: string, year: string, title: string, journal: string, volume: string, issue: string, pages: string, doi: string): string {
  let ref = `${authors} (${year}) '${title}',`;
  if (journal) {
    ref += ` *${journal}*`;
    if (volume) ref += `, ${volume}`;
    if (issue) ref += `(${issue})`;
    if (pages) ref += `, pp. ${pages}`;
    ref += '.';
  }
  if (doi) ref += ` doi: ${doi}`;
  return ref;
}

function formatIEEE(authors: string, title: string, journal: string, volume: string, issue: string, pages: string, year: string, doi: string): string {
  let ref = `${authors}, "${title},"`;
  if (journal) {
    ref += ` *${journal}*`;
    if (volume) ref += `, vol. ${volume}`;
    if (issue) ref += `, no. ${issue}`;
    if (pages) ref += `, pp. ${pages}`;
    ref += `, ${year}`;
    ref += '.';
  }
  if (doi) ref += ` doi: ${doi}`;
  return ref;
}

/**
 * Generate export content as structured markdown from project data
 */
export function generateExportContent(data: ProjectData, options: ExportOptions): string {
  const { project, notes, citations, insights, briefs, literature, milestones } = data;
  const { formatStyle, contentSections, includeCitations, includeAppendices } = options;
  const sections = contentSections.length > 0 ? contentSections : ['overview', 'methodology', 'findings', 'conclusions'];

  let content = '';

  // Title page
  content += `# ${project.title}\n\n`;

  if (project.research_question) {
    content += `**Research Question:** ${project.research_question}\n\n`;
  }

  if (project.teamLeadName) {
    content += `**Team Lead:** ${project.teamLeadName}\n`;
  }
  content += `**Status:** ${project.status || 'draft'}\n`;
  if (project.phase) {
    content += `**Phase:** ${project.phase}\n`;
  }
  content += `**Date:** ${new Date().toISOString().split('T')[0]}\n\n`;
  content += '---\n\n';

  // Table of contents
  content += '## Table of Contents\n\n';
  let tocIndex = 1;
  if (sections.includes('overview')) content += `${tocIndex++}. [Overview](#overview)\n`;
  if (sections.includes('methodology')) content += `${tocIndex++}. [Methodology](#methodology)\n`;
  if (sections.includes('findings')) content += `${tocIndex++}. [Findings](#findings)\n`;
  if (sections.includes('discussion')) content += `${tocIndex++}. [Discussion](#discussion)\n`;
  if (sections.includes('conclusions')) content += `${tocIndex++}. [Conclusions](#conclusions)\n`;
  if (sections.includes('insights')) content += `${tocIndex++}. [Key Insights](#key-insights)\n`;
  if (sections.includes('milestones')) content += `${tocIndex++}. [Milestones](#milestones)\n`;
  if (sections.includes('literature')) content += `${tocIndex++}. [Literature Review](#literature-review)\n`;
  if (includeCitations && citations.length > 0) content += `${tocIndex++}. [References](#references)\n`;
  if (includeAppendices) content += `${tocIndex++}. [Appendices](#appendices)\n`;
  content += '\n---\n\n';

  // Overview / Abstract
  if (sections.includes('overview')) {
    content += '## Overview\n\n';
    if (project.description) {
      content += `${project.description}\n\n`;
    }
    if (project.hypothesis) {
      content += `**Hypothesis:** ${project.hypothesis}\n\n`;
    }
    if (project.objectives) {
      try {
        const objectives = JSON.parse(project.objectives);
        if (Array.isArray(objectives) && objectives.length > 0) {
          content += '### Objectives\n\n';
          objectives.forEach((obj: string, i: number) => {
            content += `${i + 1}. ${obj}\n`;
          });
          content += '\n';
        }
      } catch {
        // objectives might not be valid JSON
      }
    }
  }

  // Group notes by type
  const notesByType: Record<string, any[]> = {};
  notes.forEach((note: any) => {
    const type = note.note_type || 'general';
    if (!notesByType[type]) notesByType[type] = [];
    notesByType[type].push(note);
  });

  // Methodology
  if (sections.includes('methodology')) {
    content += '## Methodology\n\n';
    if (project.methodology) {
      content += `${project.methodology}\n\n`;
    }
    if (notesByType['methodology']) {
      notesByType['methodology'].forEach((note: any) => {
        content += `### ${note.title}\n\n${note.content}\n\n`;
      });
    }
  }

  // Findings
  if (sections.includes('findings')) {
    content += '## Findings\n\n';
    if (notesByType['findings'] || notesByType['finding']) {
      const findingNotes = [...(notesByType['findings'] || []), ...(notesByType['finding'] || [])];
      findingNotes.forEach((note: any) => {
        content += `### ${note.title}\n\n${note.content}\n\n`;
      });
    }
  }

  // Discussion
  if (sections.includes('discussion')) {
    content += '## Discussion\n\n';
    if (notesByType['discussion']) {
      notesByType['discussion'].forEach((note: any) => {
        content += `### ${note.title}\n\n${note.content}\n\n`;
      });
    }
  }

  // Conclusions
  if (sections.includes('conclusions')) {
    content += '## Conclusions\n\n';
    if (notesByType['conclusion'] || notesByType['conclusions']) {
      const conclusionNotes = [...(notesByType['conclusion'] || []), ...(notesByType['conclusions'] || [])];
      conclusionNotes.forEach((note: any) => {
        content += `${note.content}\n\n`;
      });
    }
  }

  // Key Insights
  if (sections.includes('insights') && insights.length > 0) {
    content += '## Key Insights\n\n';
    insights.forEach((insight: any) => {
      const priority = insight.priority ? ` [${insight.priority}]` : '';
      content += `- **${insight.title || insight.type}**${priority}: ${insight.content}\n`;
    });
    content += '\n';
  }

  // Milestones
  if (sections.includes('milestones') && milestones.length > 0) {
    content += '## Milestones\n\n';
    content += '| Milestone | Status | Due Date | Progress |\n';
    content += '|-----------|--------|----------|----------|\n';
    milestones.forEach((m: any) => {
      const status = m.status || 'pending';
      const dueDate = m.due_date || 'TBD';
      const progress = m.progress != null ? `${m.progress}%` : '-';
      content += `| ${m.title} | ${status} | ${dueDate} | ${progress} |\n`;
    });
    content += '\n';
  }

  // Literature Review
  if (sections.includes('literature') && literature.length > 0) {
    content += '## Literature Review\n\n';
    literature.forEach((lit: any) => {
      const title = lit.external_title || lit.title || 'Untitled';
      const authors = lit.external_authors || '';
      content += `### ${title}\n\n`;
      if (authors) content += `**Authors:** ${authors}\n\n`;
      if (lit.notes) content += `${lit.notes}\n\n`;
    });
  }

  // Policy Briefs
  if (sections.includes('briefs') && briefs.length > 0) {
    content += '## Policy Briefs\n\n';
    briefs.forEach((brief: any) => {
      content += `### ${brief.title || brief.brief_type || 'Brief'}\n\n`;
      if (brief.executive_summary) content += `**Executive Summary:** ${brief.executive_summary}\n\n`;
      if (brief.key_findings) {
        try {
          const findings = JSON.parse(brief.key_findings);
          if (Array.isArray(findings)) {
            content += '**Key Findings:**\n';
            findings.forEach((f: string) => { content += `- ${f}\n`; });
            content += '\n';
          }
        } catch {
          content += `${brief.key_findings}\n\n`;
        }
      }
      if (brief.recommendations) {
        try {
          const recs = JSON.parse(brief.recommendations);
          if (Array.isArray(recs)) {
            content += '**Recommendations:**\n';
            recs.forEach((r: string) => { content += `- ${r}\n`; });
            content += '\n';
          }
        } catch {
          content += `${brief.recommendations}\n\n`;
        }
      }
    });
  }

  // References
  if (includeCitations && citations.length > 0) {
    content += '## References\n\n';
    const sortedCitations = [...citations].sort((a, b) => {
      const nameA = (a.authors || a.external_authors || '').toLowerCase();
      const nameB = (b.authors || b.external_authors || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
    sortedCitations.forEach((citation: any) => {
      content += `- ${formatCitation(citation, formatStyle)}\n`;
    });
    content += '\n';
  }

  // Appendices
  if (includeAppendices) {
    content += '## Appendices\n\n';
    // General notes that don't fit into other sections
    const generalNotes = notesByType['general'] || [];
    if (generalNotes.length > 0) {
      content += '### Appendix A: General Notes\n\n';
      generalNotes.forEach((note: any) => {
        content += `#### ${note.title}\n\n${note.content}\n\n`;
      });
    }
  }

  content += '---\n\n';
  content += `*Generated on ${new Date().toISOString().split('T')[0]} from the OHCS Research Hub*\n`;

  return content;
}

/**
 * Convert basic markdown to HTML
 */
export function markdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML entities first (except for our markdown processing)
  html = html.replace(/&/g, '&amp;');
  // Don't escape < and > yet, we'll handle them after markdown processing

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Headers (process from h6 to h1 to avoid conflicts)
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Tables
  html = html.replace(/^(\|.+\|)\n(\|[-| :]+\|)\n((?:\|.+\|\n?)*)/gm, (_match, headerRow, _sepRow, bodyRows) => {
    const headers = headerRow.split('|').filter((c: string) => c.trim()).map((c: string) => `<th>${c.trim()}</th>`).join('');
    const rows = bodyRows.trim().split('\n').map((row: string) => {
      const cells = row.split('|').filter((c: string) => c.trim()).map((c: string) => `<td>${c.trim()}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('\n');
    return `<table>\n<thead><tr>${headers}</tr></thead>\n<tbody>\n${rows}\n</tbody>\n</table>`;
  });

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>\n$&</ul>\n');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Paragraphs: wrap non-tag lines
  html = html.replace(/^(?!<[a-z/]|$)(.+)$/gm, '<p>$1</p>');

  // Clean up double newlines
  html = html.replace(/\n{3,}/g, '\n\n');

  // Wrap in basic HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Research Export</title>
<style>
  body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 2rem; color: #1a1a1a; line-height: 1.6; }
  h1 { font-size: 2rem; border-bottom: 2px solid #006B3F; padding-bottom: 0.5rem; }
  h2 { font-size: 1.5rem; color: #006B3F; margin-top: 2rem; }
  h3 { font-size: 1.25rem; color: #333; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background-color: #f4f4f4; font-weight: bold; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-size: 0.9em; }
  hr { border: none; border-top: 1px solid #ccc; margin: 2rem 0; }
  ul, ol { padding-left: 2rem; }
  li { margin-bottom: 0.25rem; }
  strong { color: #006B3F; }
  a { color: #006B3F; }
  .footer { text-align: center; font-size: 0.85rem; color: #666; margin-top: 3rem; }
</style>
</head>
<body>
${html}
</body>
</html>`;
}
