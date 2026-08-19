const { test } = require('@playwright/test');
const { allure } = require('allure-playwright');

/**
 * BDD step wrappers around Playwright's test.step()
 * Automatically renders Given / When / Then / And hierarchy in Allure reports.
 */
const Given = (title, body) => test.step(`Given ${title}`, body);
const When = (title, body) => test.step(`When ${title}`, body);
const Then = (title, body) => test.step(`Then ${title}`, body);
const And = (title, body) => test.step(`And ${title}`, body);

/**
 * Assign BDD Epic, Feature, and Story metadata to the test report.
 */
const bddMeta = async ({ epic, feature, story, severity }) => {
  if (epic) await allure.epic(epic);
  if (feature) await allure.feature(feature);
  if (story) await allure.story(story);
  if (severity) await allure.severity(severity);
};

module.exports = {
  Given,
  When,
  Then,
  And,
  bddMeta,
  allure,
};
