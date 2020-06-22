import * as inquirer from 'inquirer';
import { Importer } from '../../types';
import { GenericCsvImporter } from './GenericCsvImporter';

const BASE_PATH = process.cwd();

export const genericCsvImport = async (): Promise<Importer> => {
  const answers = await inquirer.prompt<GenericImportAnswers>(questions);
  const genericCsvImport = new GenericCsvImporter(answers.csvFilePath);
  return genericCsvImport;
};

interface GenericImportAnswers {
  csvFilePath: string;
}

const questions = [
  {
    basePath: BASE_PATH,
    type: 'filePath',
    name: 'csvFilePath',
    message: 'Select your exported CSV file of Asana issues',
  },
];
