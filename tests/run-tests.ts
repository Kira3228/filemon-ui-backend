import "reflect-metadata";
import { runAnalysisReportBuilderTests } from "./analysis-report-builder.test";
import { runAppDatabaseServiceTests } from "./app-database.service.test";
import { runSchemaTests } from "./schema.test";

const main = async () => {
  await runSchemaTests();
  await runAppDatabaseServiceTests();
  await runAnalysisReportBuilderTests();
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
