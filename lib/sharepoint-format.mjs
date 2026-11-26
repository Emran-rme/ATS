import { XMLParser, XMLValidator } from 'fast-xml-parser';

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: false,
});

function value(field) {
  if (field && typeof field === 'object') return field['#text'] ?? '';
  return field ?? '';
}

export function parseSharePointResponse(body) {
  if (!body.trimStart().startsWith('<')) {
    const result = JSON.parse(body);
    const items = result.d?.results ?? result.value;
    if (!Array.isArray(items)) throw new Error('Invalid SharePoint response');
    return { items, next: result.d?.__next ?? result['@odata.nextLink'] ?? '' };
  }
  if (XMLValidator.validate(body) !== true) throw new Error('Invalid SharePoint XML');
  const feed = parser.parse(body).feed;
  if (!feed || typeof feed !== 'object') throw new Error('Invalid SharePoint feed');
  const entries = feed.entry ? (Array.isArray(feed.entry) ? feed.entry : [feed.entry]) : [];
  const items = entries.map(entry => {
    const properties = entry.content?.properties;
    if (!properties || typeof properties !== 'object') throw new Error('Invalid SharePoint entry');
    const item = {};
    for (const key of ['Id', 'ID', 'Title', 'Status', 'WorkType', 'Career', 'PayRollRange', 'JobDetail', 'Certificate', 'Field', 'Level', 'Gender']) item[key] = value(properties[key]);
    const elements = properties.Features?.element;
    item.Features = elements === undefined ? [] : (Array.isArray(elements) ? elements : [elements]).map(value);
    return item;
  });
  const links = feed.link ? (Array.isArray(feed.link) ? feed.link : [feed.link]) : [];
  const next = links.find(link => link?.['@_rel'] === 'next')?.['@_href'] || '';
  return { items, next };
}
