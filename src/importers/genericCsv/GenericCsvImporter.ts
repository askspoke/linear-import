import { Importer, ImportResult } from '../../types';
const csv = require('csvtojson');

const GOOGLE_SHEETS_URL =
  'https://docs.google.com/spreadsheets/d/1aYP2UhAG00NHt_w_3wBy2BmjpsZciFp_h-jb-ErHAc8/edit#gid=0';

type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

type RowStatus =
  | 'Not started'
  | 'Done'
  | 'Eng in progress'
  | 'Design QA in progress'
  | 'Needs QA';

interface GenericIssueType {
  Page: string;
  Component: string;
  Feature: string;
  'Action/Part': string;
  Size: TShirtSize;
  Status: RowStatus;
  'Behavior/Notes': string;
  'Eng Owner': string;
  'Design Owner': string;
  'User permissions': string;
  Plans: string;
  'Billing Feature': string;
  'Feature switches': string;
}

/**
 * Import issues from a generic CSV export.
 *
 * @param filePath  path to csv file
 * @param orgSlug   base Asana project url
 */
export class GenericCsvImporter implements Importer {
  public constructor(filePath: string) {
    this.filePath = filePath;
  }

  public get name() {
    return 'Generic CSV';
  }

  public get defaultTeamName() {
    return 'CSV';
  }

  public import = async (): Promise<ImportResult> => {
    const data = (await csv().fromFile(this.filePath)) as GenericIssueType[];

    const importData: ImportResult = {
      issues: [],
      labels: {},
      users: {},
      statuses: {},
    };

    for (const row of data) {
      const parts = [row.Page, row.Component, row.Feature, row['Action/Part']];
      const title = `|${parts.filter(_ => !!_).join(' -> ')}`;
      if (!title) continue;

      let description = '';
      description += `Page: ${row['Page']}\n`;
      description += `Component: ${row['Component']}\n`;
      description += `Feature: ${row['Feature']}\n`;
      description += `Action: ${row['Action/Part']}\n`;
      description += `Behavior: ${row['Behavior/Notes']}\n`;
      description += `User permissions: ${row['User permissions']}\n`;
      description += `Supported Plans: \`${row['Plans']}\`\n`;
      description += `Billing: \`${row['Billing Feature']}\`\n`;
      description += `Feature: \`${row['Feature switches']}\`\n`;
      description += `When done, please update the [Google Audit Sheet](${GOOGLE_SHEETS_URL})`;

      const priority = 3; // hardcoded

      const assigneeId = row['Eng Owner'];

      importData.issues.push({
        title,
        description,
        status: mapStatus(row.Status),
        priority,
        estimate: mapEstimate(row.Size),
        assigneeId,
      });
    }

    return importData;
  };

  // -- Private interface

  private filePath: string;
}

const mapEstimate = (input: TShirtSize): number | undefined => {
  const sizeMap = {
    XS: 1,
    S: 3,
    M: 5,
    L: 8,
    XL: undefined,
  };
  return sizeMap[input];
};

const mapStatus = (input: RowStatus): string => {
  const statusMap = {
    'Not started': 'unstarted',
    Done: 'completed',
    'Eng in progress': 'started',
    'Design QA in progress': 'started',
    'Needs QA': 'completed',
  };
  return statusMap[input] || 'backlog';
};
