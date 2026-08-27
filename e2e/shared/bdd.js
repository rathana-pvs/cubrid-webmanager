const { test } = require('@playwright/test');

/**
 * BDD step wrappers around Playwright's test.step()
 */
const Given = (title, body) => test.step(`Given ${title}`, body);
const When = (title, body) => test.step(`When ${title}`, body);
const Then = (title, body) => test.step(`Then ${title}`, body);
const And = (title, body) => test.step(`And ${title}`, body);

/**
 * Assign BDD Epic, Feature, and Story metadata to native Playwright test annotations.
 */
const bddMeta = async ({ epic, feature, story, severity }) => {
  const info = test.info();
  if (epic) info.annotations.push({ type: 'epic', description: epic });
  if (feature) info.annotations.push({ type: 'feature', description: feature });
  if (story) info.annotations.push({ type: 'story', description: story });
  if (severity) info.annotations.push({ type: 'severity', description: severity });
};

const { action } = require('./action');

module.exports = {
  Given,
  When,
  Then,
  And,
  bddMeta,
  action,
};
